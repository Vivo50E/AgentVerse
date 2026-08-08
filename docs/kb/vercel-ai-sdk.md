# Knowledge Base — Vercel AI SDK + xAI (orchestration layer)

> This is our agent orchestration layer. `fullStream` events = the fuel for battle animations.

## Install
```bash
pnpm add ai @ai-sdk/xai   # or npm i
```

## Provider
```ts
import { xai, createXai } from '@ai-sdk/xai';
const model = xai('grok-4.20-non-reasoning');            // uses XAI_API_KEY env
const custom = createXai({ apiKey: process.env.XAI_API_KEY });
```

## The important part — fullStream drives the RPG
`streamText(...).fullStream` emits typed events. Map each to a battle action:

```ts
import { streamText } from 'ai';

const result = streamText({
  model: xai.responses('grok-4.20-non-reasoning'),
  prompt: userTask,
  tools: {
    web_search: xai.tools.webSearch(),      // native, server-side
    // x_search when available -> "情报召唤" skill
    code_execution: xai.tools.codeExecution(),
  },
});

for await (const event of result.fullStream) {
  switch (event.type) {
    case 'text-delta':   /* narration typing */          break;
    case 'tool-call':    /* CAST SKILL: event.toolName, event.toolInput */ break;
    case 'tool-result':  /* HIT / MISS based on result */ break;
    case 'step-finish':  /* end of a turn -> next round */ break;
    case 'finish':       /* victory screen */             break;
  }
}
```

## Event → Battle mapping (core design)
| SDK event | Battle meaning |
|-----------|----------------|
| `tool-call` (web/x_search) | cast an intel/attack skill |
| `tool-call` (code_exec) | cast a "forge" skill |
| `tool-result` ok | hit / crit → enemy (problem) loses HP |
| `tool-result` error / retry | agent takes damage |
| `text-delta` | narration / character speech |
| `step-finish` | end of round |
| `finish` | boss defeated → session report card |

## Also useful
- `generateText({ ..., onStepFinish })` for non-streaming step hooks.
- `providerOptions: { xai: { reasoningEffort: 'high' } }` to control reasoning.
- `sources` returned alongside text = citations from web/x_search → show as "loot"/evidence.
