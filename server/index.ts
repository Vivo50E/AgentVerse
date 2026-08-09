// Backend proxy. Keeps XAI_API_KEY off the browser and normalizes Grok's
// fullStream into simple SSE frames the frontend maps to battle actions.
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import express from 'express';
import { streamText, stepCountIs } from 'ai';
import { createXai } from '@ai-sdk/xai';
import { designRouter } from './design';

const app = express();
app.use(express.json({ limit: '10mb' })); // finalize returns base64 data URLs
app.use('/api', designRouter); // human-in-the-loop character designer endpoints

const xai = createXai({ apiKey: process.env.XAI_API_KEY });

// Verified against this key's /v1/models. multi-agent variant is tuned for
// agentic tool calling (our whole loop). Alternatives: grok-4.3, grok-4.5.
const MODEL = 'grok-4.20-multi-agent-0309';

function buildTools(requested: string[]): Record<string, any> {
  const allTools: Record<string, any> = {
    web_search: xai.tools.webSearch(),
    x_search: xai.tools.xSearch(), // signature "Intel Summon ⚡" skill
    code_execution: xai.tools.codeExecution(),
  };
  return Object.fromEntries(Object.entries(allTools).filter(([name]) => requested.includes(name)));
}

// Two of the loadout's six ability stats (src/loadout/store.ts) have real,
// non-cosmetic effects on the model call — Reasoning and Prompt gear actually
// change how the agent thinks, not just its displayed stat sheet.
const REASONING_EFFORTS = new Set(['none', 'low', 'medium', 'high']);
function parseReasoningEffort(value: unknown): 'none' | 'low' | 'medium' | 'high' {
  return REASONING_EFFORTS.has(value as string) ? (value as any) : 'none';
}

const PROMPT_TIER_TEXT: Record<string, string> = {
  basic: '',
  stepByStep: ' Think step by step before acting.',
  selfVerify: ' Think step by step, and before giving your final answer, briefly double-check it for correctness and completeness.',
};
function parsePromptTier(value: unknown): keyof typeof PROMPT_TIER_TEXT {
  return value === 'stepByStep' || value === 'selfVerify' ? value : 'basic';
}

type Send = (obj: unknown) => void;

function sseHeaders(res: express.Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
}

app.post('/api/run', async (req, res) => {
  const task: string = req.body?.task ?? 'Research the latest in AI agents.';
  // The equipped loadout decides which tools the agent may use. Default = all.
  const requested: string[] = Array.isArray(req.body?.tools)
    ? req.body.tools
    : ['web_search', 'x_search', 'code_execution'];
  const reasoningEffort = parseReasoningEffort(req.body?.reasoningEffort);
  const promptTier = parsePromptTier(req.body?.promptTier);

  sseHeaders(res);
  const send: Send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  try {
    const tools = buildTools(requested);

    const result = streamText({
      model: xai.responses(MODEL),
      prompt:
        `You are an adventurer solving a quest for the user. ` +
        `Use your tools (${Object.keys(tools).join(', ') || 'none'}) as needed.${PROMPT_TIER_TEXT[promptTier]} Quest: ${task}`,
      tools,
      providerOptions: { xai: { reasoningEffort } },
    });

    for await (const ev of result.fullStream) {
      switch (ev.type) {
        case 'text-delta':
          send({ type: 'text-delta', textDelta: (ev as any).text ?? (ev as any).textDelta });
          break;
        case 'tool-call':
          send({ type: 'tool-call', toolName: (ev as any).toolName, input: (ev as any).input });
          break;
        case 'tool-result':
          send({ type: 'tool-result', toolName: (ev as any).toolName, result: (ev as any).result });
          break;
        case 'error':
          send({ type: 'error', errorMessage: String((ev as any).error) });
          break;
      }
      // step boundaries arrive as 'finish-step' in newer SDKs; normalize to round_end
      if ((ev.type as string) === 'finish-step' || (ev.type as string) === 'step-finish') {
        send({ type: 'step-finish' });
      }
    }

    const rawSources = (await result.sources)?.map((s: any) => s.url).filter(Boolean) ?? [];
    const sources = [...new Set(rawSources)]; // dedupe -> unique "loot"
    send({ type: 'finish', finishReason: 'stop', sources });
  } catch (err) {
    send({ type: 'error', errorMessage: String(err) });
  }
  res.write('data: [DONE]\n\n');
  res.end();
});

// ── In-battle HITL command menu (plan.md §7e) ──────────────────────────────
// The tools above are native/server-side (xAI's Responses API chains web_search/
// x_search/code_execution calls itself within a single model turn, per
// docs/kb/vercel-ai-sdk.md), so the AI SDK's own step machinery can't give us a
// per-tool-call pause point — one whole quest is typically ONE AI-SDK step. To
// get a reliable pause boundary we run our own turn-by-turn loop instead: each
// HTTP call advances the conversation by exactly one turn (`stopWhen:
// stepCountIs(1)`), and a system prompt asks the model to take one action then
// yield. The client decides whether a turn that made a tool call is worth
// pausing on; the server just reports whether one happened.
interface RunSession {
  messages: any[]; // ModelMessage[] — accumulated conversation, incl. tool calls/results
  tools: Record<string, any>;
  reasoningEffort: 'none' | 'low' | 'medium' | 'high';
  promptTier: keyof typeof PROMPT_TIER_TEXT;
  touchedAt: number;
}
const sessions = new Map<string, RunSession>();
const SESSION_TTL_MS = 20 * 60 * 1000; // abandoned tabs eventually get swept
setInterval(() => {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [id, s] of sessions) if (s.touchedAt < cutoff) sessions.delete(id);
}, 5 * 60 * 1000).unref();

const HITL_SYSTEM_PROMPT_BASE =
  'You are an adventurer solving a quest for the user, one step at a time. Make one ' +
  'meaningful move per turn — at most one tool call — then briefly note your plan and ' +
  'stop; you will be shown the result and may continue on the next turn. Once the quest ' +
  'is fully solved, give your complete final answer and call no more tools.';

/** Runs exactly one model turn against a session's conversation, streaming SSE events. */
async function runStep(
  session: RunSession,
  send: Send,
): Promise<{ hadToolCall: boolean; sources: string[]; errored?: string }> {
  let hadToolCall = false;
  try {
    const result = streamText({
      model: xai.responses(MODEL),
      system: HITL_SYSTEM_PROMPT_BASE + PROMPT_TIER_TEXT[session.promptTier],
      messages: session.messages,
      tools: session.tools,
      stopWhen: stepCountIs(1),
      providerOptions: { xai: { reasoningEffort: session.reasoningEffort } },
    });

    for await (const ev of result.fullStream) {
      switch (ev.type) {
        case 'text-delta':
          send({ type: 'text-delta', textDelta: (ev as any).text ?? (ev as any).textDelta });
          break;
        case 'tool-call':
          hadToolCall = true;
          send({ type: 'tool-call', toolName: (ev as any).toolName, input: (ev as any).input });
          break;
        case 'tool-result':
          send({ type: 'tool-result', toolName: (ev as any).toolName, result: (ev as any).result });
          break;
        case 'error':
          send({ type: 'error', errorMessage: String((ev as any).error) });
          break;
      }
      if ((ev.type as string) === 'finish-step' || (ev.type as string) === 'step-finish') {
        send({ type: 'step-finish' });
      }
    }

    session.messages.push(...(await result.responseMessages));
    const rawSources = (await result.sources)?.map((s: any) => s.url).filter(Boolean) ?? [];
    return { hadToolCall, sources: [...new Set(rawSources)] };
  } catch (err) {
    send({ type: 'error', errorMessage: String(err) });
    return { hadToolCall: false, sources: [], errored: String(err) };
  }
}

/** Sends the terminal event for a turn: pause for HITL input, or truly finish. */
function finalizeTurn(
  send: Send,
  sessionId: string,
  outcome: { hadToolCall: boolean; sources: string[]; errored?: string },
) {
  if (outcome.errored) {
    sessions.delete(sessionId);
    send({ type: 'finish', finishReason: 'error' });
  } else if (outcome.hadToolCall) {
    send({ type: 'paused', sessionId });
  } else {
    sessions.delete(sessionId);
    send({ type: 'finish', finishReason: 'stop', sources: outcome.sources });
  }
}

app.post('/api/run/start', async (req, res) => {
  const task: string = req.body?.task ?? 'Research the latest in AI agents.';
  const requested: string[] = Array.isArray(req.body?.tools)
    ? req.body.tools
    : ['web_search', 'x_search', 'code_execution'];

  sseHeaders(res);
  const send: Send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  const sessionId = randomUUID();
  const session: RunSession = {
    messages: [{ role: 'user', content: `Quest: ${task}` }],
    tools: buildTools(requested),
    reasoningEffort: parseReasoningEffort(req.body?.reasoningEffort),
    promptTier: parsePromptTier(req.body?.promptTier),
    touchedAt: Date.now(),
  };
  sessions.set(sessionId, session);

  const outcome = await runStep(session, send);
  finalizeTurn(send, sessionId, outcome);
  res.write('data: [DONE]\n\n');
  res.end();
});

app.post('/api/run/continue', async (req, res) => {
  const sessionId: string = String(req.body?.sessionId ?? '');
  const hint: string | undefined = req.body?.hint ? String(req.body.hint) : undefined;

  sseHeaders(res);
  const send: Send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  const session = sessions.get(sessionId);
  if (!session) {
    send({ type: 'error', errorMessage: 'quest session expired' });
    send({ type: 'finish', finishReason: 'error' });
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }
  session.touchedAt = Date.now();
  if (hint) session.messages.push({ role: 'user', content: hint });

  const outcome = await runStep(session, send);
  finalizeTurn(send, sessionId, outcome);
  res.write('data: [DONE]\n\n');
  res.end();
});

// Share fallback: return a pre-filled X intent URL (no OAuth needed for MVP).
app.post('/api/share', (req, res) => {
  const text: string = req.body?.text ?? 'My AI agent just won a quest in AgentVerse! ⚔️';
  const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
  res.json({ url });
});

const PORT = Number(process.env.PORT) || 8787;
const server = app.listen(PORT, () => console.log(`⚔️  AgentVerse API on http://localhost:${PORT}`));

// Long-lived SSE streams (/api/run) hold sockets open, so server.close() alone
// hangs on restart and tsx's force-kill leaves a zombie holding the port.
// Track sockets and destroy them on shutdown so the process exits cleanly.
const sockets = new Set<import('node:net').Socket>();
server.on('connection', (s) => {
  sockets.add(s);
  s.on('close', () => sockets.delete(s));
});

let shuttingDown = false;
function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${signal} received — shutting down…`);
  for (const s of sockets) s.destroy();
  server.close(() => process.exit(0));
  // Hard fallback if close() still hasn't finished.
  setTimeout(() => process.exit(0), 1000).unref();
}
for (const sig of ['SIGTERM', 'SIGINT', 'SIGUSR2'] as const) {
  process.on(sig, () => shutdown(sig));
}
