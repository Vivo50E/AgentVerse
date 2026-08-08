// Backend proxy. Keeps XAI_API_KEY off the browser and normalizes Grok's
// fullStream into simple SSE frames the frontend maps to battle actions.
import 'dotenv/config';
import express from 'express';
import { streamText } from 'ai';
import { createXai } from '@ai-sdk/xai';
import { designRouter } from './design';

const app = express();
app.use(express.json({ limit: '10mb' })); // finalize returns base64 data URLs
app.use('/api', designRouter); // human-in-the-loop character designer endpoints

const xai = createXai({ apiKey: process.env.XAI_API_KEY });

// Verified against this key's /v1/models. multi-agent variant is tuned for
// agentic tool calling (our whole loop). Alternatives: grok-4.3, grok-4.5.
const MODEL = 'grok-4.20-multi-agent-0309';

app.post('/api/run', async (req, res) => {
  const task: string = req.body?.task ?? 'Research the latest in AI agents.';
  // The equipped loadout decides which tools the agent may use. Default = all.
  const requested: string[] = Array.isArray(req.body?.tools)
    ? req.body.tools
    : ['web_search', 'x_search', 'code_execution'];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const send = (obj: unknown) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  try {
    const allTools: Record<string, any> = {
      web_search: xai.tools.webSearch(),
      x_search: xai.tools.xSearch(), // signature "Intel Summon ⚡" skill
      code_execution: xai.tools.codeExecution(),
    };
    const tools = Object.fromEntries(
      Object.entries(allTools).filter(([name]) => requested.includes(name)),
    );

    const result = streamText({
      model: xai.responses(MODEL),
      prompt:
        `You are an adventurer solving a quest for the user. Think step by step, ` +
        `use your tools (${Object.keys(tools).join(', ') || 'none'}) as needed. Quest: ${task}`,
      tools,
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
