# AgentVerse — Hackathon Plan

> **Pitch:** A gamified visualization layer for AI agents. It turns an AI agent's
> problem-solving workflow into a real-time, RPG-style battle — personifying the
> agent, visualizing its strengths, and making agent execution transparent, fun,
> and shareable. Powered by Grok + X.
>
> **One-liner for judges:** *"A gamified observability + interaction layer for AI agents"* — not a toy game, but a human-friendly window into what an agent is doing and why.

- **Constraints:** solo dev, AI-assisted coding, **~12 hours**, hackathon.
- **Required:** use Grok & X AI API.
- **Today:** 2026-08-08.

---

## 1. Market position (why this wins)
- Closest competitor **AgentCraft** = RTS-style, multi-agent *management*, experimental. Leaves the **RPG + persona + entertainment + X-virality** slot open.
- Serious observability tools (LangSmith, LangGraph Studio, Langfuse, Arize) = dry graphs/traces for engineers. **We are the human-friendly, emotional version of the same thing.**
- Our moat is **tone & narrative**, not tech — perfect for a live demo.

## 2. Tech stack (locked)
```
React + Vite + TypeScript            UI
Framer Motion                        battle animation & juice (main renderer)
Pixi.js (optional)                   ONE crit particle effect only
Streaming TTS                        real-time voice narration (short lines + cached)
Image gen (non-real-time)            start-of-session portraits + end report card
Vercel AI SDK (`ai` + `@ai-sdk/xai`) agent orchestration
  · fullStream events                DRIVE the battle (tool-call/step-finish/…)
Grok 4.x                             main brain + native x_search / web_search
Grok fast/cheap model                high-freq narration & character lines
Node backend proxy                   hide API keys; sign X OAuth
```
- **Web-first.** Later: same code → Tauri (Mac desktop). No Three.js / Godot / custom engine.
- **No `x_search` API needed for reading** — Grok does it server-side natively.
- Detailed API notes in `docs/kb/`.

## 3. Core architecture — the event→battle spine
This is the heart of the project. Everything hangs off it.
```
User task
   │
   ▼
Backend /api/run  ── streamText(grok, { tools:{ web_search, x_search, code_execution } })
   │  fullStream (SSE to frontend)
   ▼
Event mapper (frontend)  event → BattleAction
   │
   ▼
Battle state machine (Zustand)  ── HP/MP, turn log, actor states
   │
   ├─► Framer Motion   → animations (cast / hit / crit / damage numbers / shake)
   ├─► TTS             → voice narration (cheap Grok generates the line)
   └─► Report card     → on `finish`, render shareable image → X
```

### Event → Battle mapping
| Vercel AI SDK event | Battle action |
|---|---|
| `tool-call` web/x_search | cast "Intel Summon" skill |
| `tool-call` code_execution | cast "Forge" skill |
| `tool-result` ok | HIT/CRIT → boss (the problem) loses HP |
| `tool-result` error / retry | agent takes damage |
| `text-delta` | narration typing + speech bubble |
| `step-finish` | end of round |
| `finish` | boss defeated → victory + report card |

## 4. Scope — MVP vs stretch
**MVP (must demo):**
- [ ] One scenario (e.g. "research a topic" or "debug X"), agent runs on Grok.
- [ ] Live battle view: 1 hero (agent) vs 1 boss (the problem), HP bars, damage numbers, skill casts, battle log.
- [ ] Grok native web/x_search shown as a signature "Intel Summon" skill.
- [ ] Real-time voice narration (short + cached stock lines).
- [ ] End "battle report card" + share to X (intent-URL fallback OK).

**Stretch (only if ahead):**
- [ ] Character sheet / strength radar built from the agent's tool usage.
- [ ] Multi-agent "party" (2+ agents co-op on the boss).
- [ ] Pixi crit particle effect.
- [ ] Real X OAuth post with media (vs intent URL).

**Explicitly OUT for 12h:** Tauri packaging, responsive polish, 3D, custom engine, auth/accounts, persistence/DB.

## 5. Hour-by-hour (12h)
| Time | Goal | Done when |
|---|---|---|
| 0–1h | Scaffold + connect Grok; log `fullStream` to console | events print in terminal |
| 1–3h | Event mapper + battle state machine (Zustand) | task run mutates HP/log in React |
| 3–7h | Battle UI + Framer Motion juice (bars, dmg numbers, casts, shake) | a full run looks like a fight |
| 7–9h | TTS narration (cheap Grok line → speech, cached stock lines) + x_search "Intel Summon" highlight | you can hear + see the signature skill |
| 9–11h | Report card + share to X (intent fallback) | card renders & shares |
| 11–12h | Assets/color pass + **record a backup demo video** | you have a safe demo |

> ⚠️ Always record a demo video by hour 12 — never rely on a live run on stage.

## 6. Risks & mitigations
- **Scope creep** → MVP list is law; stretch only if ahead.
- **Grok/tool latency** → cache stock voice lines; show a "charging" animation to mask latency.
- **Model IDs drift** → confirm exact IDs in xAI console (see `docs/kb/grok-api.md`).
- **Asset time sink** → free packs / AI-once / geometric+emoji; consistency over polish.
- **Live demo failure** → recorded backup video + deployed link.

## 7. Repo layout (target)
```
/docs/kb/            API + stack knowledge base (done)
/server/             Node proxy: /api/run (Grok stream), /api/share (X)
/src/
  /agent/            Grok orchestration client, tool defs
  /battle/           event mapper, state machine (Zustand), types
  /components/       BattleScene, HeroCard, BossCard, HpBar, DamageNumber, BattleLog, ReportCard
  /voice/            TTS client + cached lines
  /assets/           sprites, portraits, sfx
  App.tsx
```

## 8. Status
- [x] Direction validated, competitors scanned, stack chosen
- [x] Knowledge base written (`docs/kb/`)
- [x] Plan written (this file)
- [x] Project scaffolded (React+Vite+TS, Node proxy, `npm run dev` boots both)
- [x] Grok wired via Vercel AI SDK v5 (`ai@7`, `@ai-sdk/xai@4`); native `web_search` + `x_search` + `code_execution` enabled
- [x] Event→battle spine working (verified: synthetic run → victory, boss slain, loot, agent damage)
- [x] Battle FX (damage numbers, skill-cast banner, portraits w/ hurt+cast animations)
- [x] Voice narration (stock lines + Web Speech fallback; `/api/tts` stub 501s → fallback)
- [x] Report card + share-to-X (intent-URL fallback via `/api/share`)
- [x] Typecheck clean, production build passes (93 KB gz)

### Remaining before demo
- [x] Add real `XAI_API_KEY` to `.env`, run one live quest end-to-end — VERIFIED against real Grok (tool-call/result, text-delta, step-finish, finish+sources all flow; mapper field/tool names match)
- [x] Confirm exact Grok model id — key exposes `grok-4.20-{0309-non-reasoning,0309-reasoning,multi-agent-0309},4.3,4.5,build-0.1` + `grok-imagine-image/video`. Server now uses `grok-4.20-multi-agent-0309` (agentic).
- [ ] Asset/color polish pass; optional Pixi crit particle
- [ ] Record backup demo video
- [ ] (nice-to-have) Use `grok-imagine-image` for report-card art / portraits (non-real-time)
- [ ] (minor) only one `step-finish` per run → rounds barely increment; consider deriving rounds from tool-call count
