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

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const send = (obj: unknown) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  try {
    const result = streamText({
      model: xai.responses(MODEL),
      prompt:
        `You are an adventurer solving a quest for the user. Think step by step, ` +
        `use your tools (web/X search, code) as needed. Quest: ${task}`,
      tools: {
        web_search: xai.tools.webSearch(),
        x_search: xai.tools.xSearch(), // signature "Intel Summon ⚡" skill
        code_execution: xai.tools.codeExecution(),
      },
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

// TTS: not implemented for MVP. Returning 501 makes the frontend voice module
// fall back to the browser Web Speech API (zero-latency, always available).
// Post-hackathon: proxy a real TTS provider here and return audio bytes.
app.post('/api/tts', (_req, res) => {
  res.status(501).end();
});

// Share fallback: return a pre-filled X intent URL (no OAuth needed for MVP).
app.post('/api/share', (req, res) => {
  const text: string = req.body?.text ?? 'My AI agent just won a quest in AgentVerse! ⚔️';
  const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
  res.json({ url });
});

const PORT = Number(process.env.PORT) || 8787;
app.listen(PORT, () => console.log(`⚔️  AgentVerse API on http://localhost:${PORT}`));
