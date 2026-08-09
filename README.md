# AgentVerse ⚔️

**Watch your AI agent fight.** AgentVerse turns an AI agent's real problem‑solving
workflow into a live, side‑scrolling **pixel‑art JRPG battle** — the agent is the
hero, your task is the boss, and every tool call becomes a skill cast. It's a
gamified **observability + interaction layer** for agents: fun to watch, and it
still delivers the real, cited answer at the end.

Powered by **Grok + the X (xAI) API**.

---

## What it does

You give the agent a quest (a task). It runs on Grok with real native tools
(web search, X search, code execution), and the whole run is visualized as a
turn‑based adventure:

- 🧙 **Side‑scrolling JRPG battle** — the hero journeys left→right through a
  scrolling scene, fighting a foe at each workflow step, ending at a boss. Melee
  heroes dash in and slash; ranged/mages fire projectiles.
- ⚡ **Tool calls = skills** — Grok's native `web_search` / `x_search` /
  `code_execution` become the agent's signature moves ("Intel Summon", "Forge").
- 📜 **Real result, not just flavor** — the agent's actual streamed answer +
  clickable **sources** appear in a persistent Quest Result panel and the
  victory card (with a Copy button). The game is the wrapper; the answer is real.
- 🔀 **Gamified ⇄ observability toggles** — flip the Battle Log to **Agent Flow**
  (the real tool-call trace), and the Quest Track to a **Live** dynamic chain of
  the actual steps (unknown length: it starts as a `?` and grows as steps land).
- 🎨 **Human‑in‑the‑loop character designer** — co‑create your hero with parallel
  Grok "design agents": describe a concept → pick from candidate pixel sprite
  sheets → refine → forge. The agent even picks each character's combat VFX
  archetype (a knight slashes, a mage casts), previewable at design time.
- 🎒 **Hero roster** — every designed hero is saved locally so you can re‑equip
  past heroes.
- 🧰 **Equipment + hexagon ability sheet** — equip gear across six axes
  (Skills / MCP / Knowledge / Prompt / Memory / Reasoning); equipped skill gear
  actually controls which real tools the backend agent may use.
- 📈 **Learn‑by‑doing progression** — quests grant XP and grow the stats the
  agent actually used; leveling raises the hero's Battle Power (persisted).
- 👹 **Task‑themed boss** (optional) — Grok summons a boss matched to your quest.
- 🔊 **Chiptune SFX** for casts/hits/crits, and a shareable battle **report card**
  (share to X via intent URL).

---

## The core spine: event → battle

Everything hangs off one pipeline:

```
User task
  → POST /api/run (server/index.ts)  ── streamText(Grok, { web_search, x_search, code_execution })
  → fullStream events re‑emitted as SSE frames
→ src/agent/run.ts (runAgent) reads the SSE stream
→ src/battle/eventMapper.ts (mapEvent) — the ONE place deciding what a step means in the fight
→ src/battle/store.ts (useBattle, zustand) — applies BattleActions → HP / log / flow / answer
→ React components subscribe and animate off `lastAction`
```

`src/battle/types.ts` is the contract for the whole spine (`StreamEvent`,
`BattleAction`, `BattleState`).

---

## Tech stack

- **React + Vite + TypeScript**, **Framer Motion** for all battle animation
- **Zustand** stores (battle, characters, loadout, progression, hero roster)
- **Vercel AI SDK** (`ai` + `@ai-sdk/xai`) driving Grok's streamed tool‑calling
- **Node/Express** proxy that keeps `XAI_API_KEY` off the browser
- **Grok Imagine** for pixel sprite/boss/background generation; **jimp** slices
  sheets + chroma‑keys them to transparent PNGs
- Self‑authored CSS/SVG pixel UI kit — no external art/icon dependencies

Web‑first; the same codebase can later wrap in Tauri for a Mac desktop app.

---

## Getting started

Requires Node and an xAI API key.

```bash
cp .env.example .env        # then set XAI_API_KEY=...
npm install
npm run dev                 # vite (5173) + express API (8787); vite proxies /api → 8787
```

Open http://localhost:5173, type a quest, hit **Start Quest**.

### Scripts

| command | what |
|---|---|
| `npm run dev` | run web + API together |
| `npm run build` | `tsc -b && vite build` — this is the typecheck/correctness gate |
| `npm run gen:assets` | regenerate default hero/boss/background sprites via Grok Imagine |
| `node scripts/shoot.mjs` | Playwright screenshots to `/tmp/av-art/` for visual verification |

---

## Grok / xAI notes

- OpenAI‑compatible API at `https://api.x.ai/v1`; auth via `Authorization: Bearer $XAI_API_KEY`.
- Native server‑side tools used: `web_search`, `x_search`, `code_execution`.
- Models (verify in the xAI console — IDs drift): main agentic loop uses
  `grok-4.20-multi-agent-0309`; the designer uses `grok-4.3` for chat and
  `grok-imagine-image` for sprites. See `docs/kb/` for API notes.

---

## Data & persistence

State lives in the browser (localStorage) — no accounts, no backend DB:

- `agentverse:heroes` — your designed hero roster (capped, quota‑safe)
- `agentverse:progression` — agent level / XP / learned growth
- plus small preference keys (SFX, task‑themed boss)

This is per‑device/per‑browser. `.env` is git‑ignored — never commit your key.

---

## Project layout

```
server/            Node proxy: /api/run (Grok stream) + /api/design/* + /api/share
scripts/           asset generation (spritePipeline / genDefaults / genFoes) + shoot.mjs
public/sprites/    generated sprites, foes, backgrounds, manifest.json
src/
  agent/           Grok orchestration client (runAgent)
  battle/          event mapper, zustand store, types, sprites, journey model
  components/      battle stage, quest track, report card, agent-flow, settings, icons…
  design/          human‑in‑the‑loop Character Design Studio
  loadout/         equipment + hexagon ability system
  progression/     learn‑by‑doing leveling
  heroes/          persisted hero roster + inventory
  sfx/             WebAudio synth sound effects
docs/kb/           Grok / X / AI‑SDK knowledge base
plan.md            living design doc + priority queue
```

Built for a hackathon. See `plan.md` for scope, market position, and what's next.
