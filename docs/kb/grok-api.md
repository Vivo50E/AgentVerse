# Knowledge Base — Grok / xAI API

> Source: docs.x.ai (fetched 2026-08-08). **Model IDs vary across docs pages — verify exact IDs in the live xAI console before shipping.**

## Connection
- **Base URL:** `https://api.x.ai/v1`
- **Auth:** `Authorization: Bearer $XAI_API_KEY`
- **OpenAI-compatible:** yes — point the OpenAI SDK (or Vercel AI SDK) at the base URL.

## Models (as of fetch — confirm in console)
| Model | Context | ~In/Out $/1M | Use for us |
|-------|---------|--------------|------------|
| `grok-4.5` | 500k | $2–4 / $6–12 | general / main brain |
| `grok-4.3` | 1M | $1.25–2.5 / $2.5–5 | long context |
| `grok-4.20-*-reasoning` | 1M | $1.25–2.5 / $2.5–5 | complex reasoning |
| `grok-4.20-multi-agent-*` | 1M | same | **agentic tool calling** |
| `grok-build-0.1` / `grok-4.1-fast` | 256k–2M | cheapest | **high-freq narration / battle lines** |

**Our split:** main reasoning + native X search → a 4.x model; real-time narration & character lines → the cheapest fast model.

## Function calling / tools
- Tool = `{name (<=200), description, parameters(JSON Schema)}`.
- Parameters root MUST be `type:"object"` (or oneOf/anyOf of objects). Scalar/array root → 400.
- Parallel tool calls ON by default (`parallel_tool_calls:false` to disable).
- `tool_choice`: `auto` (default) | `required` | `none` | force specific.
- **Custom tools** pause and return to you to execute. **Native tools run on xAI servers.**

## Native server-side tools (our killer feature)
- `web_search()` — browse the web
- `x_search()` — search X posts  ← this is the "情报召唤" skill; no separate X read API needed.

## Streaming
- Text streams chunk by chunk.
- **Function calls are returned whole in a single chunk, NOT streamed** — plan the battle "cast" animation around one atomic tool-call event.
