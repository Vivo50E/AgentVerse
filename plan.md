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

**Stretch (only if ahead) — see 4a for priority order:**
- [ ] Character sheet / strength radar built from the agent's tool usage.
- [ ] ~~Multi-agent "party" (2+ agents co-op on the boss)~~ — superseded by parallel-dungeons decision, see 7c.
- [ ] Pixi crit particle effect.
- [ ] Real X OAuth post with media (vs intent URL).
- [ ] Leaderboard: multiple users' agent runs ranked (score from HP remaining / time / tool-call efficiency). No auth — nickname + in-memory or lightweight JSON/sqlite store.
- [ ] Multi-agent visualization: **parallel dungeons** (N independent battle instances side-by-side, same task) rather than one shared dungeon with multiple characters — reuses the existing single-agent battle component per instance, low engineering risk, and doubles as the leaderboard's "race" visual.
- [ ] **Task-themed boss generation**: on task submit, Grok (text) turns the task into a villain concept (e.g. "memory leak" → "Leak Hydra"), then Grok Imagine generates that boss's sprite live through the existing chroma-key pipeline — every run gets a unique, on-theme boss instead of a fixed default. Needs a "boss awakening" loading animation to mask gen latency, and a fallback to the default boss if generation fails/times out.
- [ ] **In-battle human-in-the-loop**: between rounds, pause and let the user pick a tactic (or type a hint) that gets injected into the next `streamText` call — see 7e.
- [ ] **Mobile-responsive layout** so the battle can be experienced on phone, not just desktop — see 7f.
- [ ] **Task hub / quest board + task history**: a home screen listing all not-yet-run/in-progress tasks as pinned quest cards, customizable, plus a history view of completed quests linking back to their report cards — see 7g.

**Explicitly OUT for 12h:** Tauri packaging, 3D, custom engine, auth/accounts, persistence/DB.

## 4a. Priority order for remaining time
Ordered by demo impact vs. effort/risk, respecting dependencies (parallel dungeons must exist before leaderboard; leaderboard/parallel dungeons before the task hub has anything interesting to show). Work top to bottom; stop and record the backup video whenever the remaining time runs low — a stable demo one tier down beats a broken demo one tier up.

**P0 — protect the core demo (cheap, do first):**
1. ~~(minor) Derive round count from tool-call count instead of `step-finish`~~ — DONE, `src/battle/store.ts` now increments `round` on each `cast` action instead of `round_end`.
2. Asset/color polish pass — including swapping hand-rolled panel/button CSS and emoji icons for free UI-kit assets (Kenney.nl panels/buttons, game-icons.net SVGs); see 7h.
3. Record backup demo video — do this after whichever P1 items you land, but never skip it to squeeze in one more feature.

**P1 — best wow-per-effort stretch, in build order:**
4. ~~Task-themed boss generation (7d)~~ — DONE. `server/design.ts` (`POST /api/design/boss-for-task`) generates a villain name+concept via `bossConceptForTask` then a sprite via the shared `sliceAndKeySheetUrl` helper; `src/design/designApi.ts` (`requestTaskBoss`) calls it client-side with a 20s timeout; `src/App.tsx` blocks quest start on it behind a new `BossAwakening` overlay, falling back to `useCharacters().resetBoss()` on failure/timeout. Boss name also now flows into the battle actor via `useBattle.start(bossName)`. Background theme-matching (`src/battle/backgroundMatch.ts`) shipped alongside this as a cheap keyword heuristic, with 5 pre-generated alt backgrounds in `public/sprites/bg-*.jpg`. Opt-in via a Settings toggle (`agentverse:themedBoss` in localStorage, default off) since it adds a ~5-10s wait before battle starts.

**Follow-up (independent of the boss toggle):** the QuestTrack/JourneyStage milestone labels ("Scouting"/"Engaging"/"Breakthrough"/"Final Strike") were also hardcoded regardless of task. Added `POST /api/design/stages-for-task` (text-only Grok call, `server/design.ts`) generating 4 task-themed quest-stage names; `src/battle/questStages.ts` (zustand store, defaults to the old generic labels) holds them; `src/agent/run.ts` fires the request in parallel at quest start (same fire-and-forget pattern as `matchBackground`, not gated by the boss toggle since it's text-only and fast). `QuestTrack.tsx` and `JourneyStage.tsx` both read from this store now instead of hardcoded arrays; "Quest Start"/"Victory" stay generic (universal states), only the 4 middle stages are themed. `JourneyStage.tsx`'s boss waypoint label also now shows the actual boss actor name instead of a hardcoded "The Problem" string.
5. Multi-agent visualization: parallel dungeons (7c) — reuses the existing single-battle component almost as-is; unlocks #6 and #8.
6. Leaderboard (7c) — cheap once parallel dungeons exist; scoring signals already exist in battle state.

**P2 — good if still ahead, higher effort/risk:**
7. In-battle HITL command menu (7e) — new interaction model, needs a pause state + extra Grok call + menu UI.
8. Task hub / quest board + task history (7g) — most valuable once #5/#6 exist to populate it; needs its own screen and art. History is a cheap add-on once the hub's `quests` store exists.
9. `grok-imagine-image` for report-card art/portraits — isolated, low risk, but low urgency.

**P3 — only if way ahead of schedule:**
10. Mobile-responsive layout (7f) — explicitly lowest priority; a broken desktop demo is worse than no mobile support.
11. Character sheet / strength radar.
12. Pixi crit particle effect.
13. Real X OAuth post with media.

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

## 7b. Visual pivot — side-view pixel JRPG + HITL designer (v2)
To make it more vivid, the battle is now a **side-view turn-based JRPG** (hero left, boss right, full-bleed pixel background) with **pronounced sprite action** (idle/attack/hurt/cast poses), plus a **human-in-the-loop character designer** so users co-create their hero with AI.

**Proven asset pipeline (all validated against real Grok):**
```
grok-imagine-image → ONE sprite sheet (4 poses, same char, magenta bg)  [consistency solved by single-gen]
   → jimp slice into 4 frames → chroma-key corner color → transparent PNGs
   → composite over pixel background → swap pose + Framer Motion transform (lunge/shake/flash/cast)
```
- Grok images are JPEG (opaque) → generate on solid magenta, key it out. Verified clean cutouts.
- Default assets pre-generated to `public/sprites/` (`npm run gen:assets`); battle works without the designer.
- **HITL designer** = the one place we generate at runtime: parallel "design agents" propose varied prompts → candidate sheets → user picks/refines → finalize slices+keys → becomes the battle hero.
- Shared contracts: `src/battle/sprites.ts` (poses + `poseForAction`), `src/battle/characters.ts` (active hero/boss store).
- Built by parallel subagents: BattleStage rendering / DesignStudio UI / backend design endpoints.

## 7c. Next: leaderboard + multi-agent visualization (post-MVP)
- **Leaderboard.** Natural fit because the battle already produces scoring signals (HP remaining, round count, tool-call count). No account system — nickname + a simple shared store (in-memory or JSON/sqlite) is enough for a hackathon demo. Worth doing only after the single-agent demo is stable; it's a hook for judges, not a requirement.
- **Multi-agent visualization: parallel dungeons over one shared dungeon.** Considered two shapes:
  - *Single instance, multiple characters* — one shared battle scene with several agents fighting together/cooperatively. More narratively cohesive (shows agent-to-agent interaction) but requires new turn-order/event-interleaving logic across multiple SSE streams — too risky for remaining hackathon time.
  - *Multiple simultaneous instances (chosen)* — N independent battle stores rendered side-by-side, each running the same task. Reuses the existing single-agent battle component almost as-is (low engineering risk) and naturally reads as a "race" (who wins first / keeps more HP), which pairs directly with the leaderboard idea.
- **Order of operations:** ship parallel-dungeon multi-agent view first (reuses existing component), then wire results into the leaderboard.

## 7d. Visual innovation: task-themed boss generation
Goal: make the visuals feel more "fancy"/AI-magical using Grok Imagine, beyond the pre-baked hero pipeline.
- Flow: task text → Grok (text) generates a villain concept/name themed to the task → Grok Imagine generates that boss's sprite sheet → run through the existing slice/chroma-key pipeline (same as hero assets) → becomes the boss for that run.
- Payoff: every demo run gets a unique, task-relevant boss instead of a static default — strong "wow, that's generated live" moment for judges, and it showcases Grok Imagine directly.
- Risk/mitigation: runtime gen latency → cover with a "boss awakening" animation; gen failure/inconsistent style → fallback to default boss so it never blocks the demo.

## 7e. Human-in-the-loop: in-battle command menu
Goal: let the human meaningfully steer the agent mid-run, in a way that fits the turn-based battle metaphor and is cheap to build.
- **Design (chosen): turn-based command menu, not mid-stream interrupt.** After each round (`step-finish`), pause before the next tool-call round starts. Grok quickly generates 2–3 tactical options themed to the current situation (e.g. "dig deeper search" / "just write the code" / "try a different angle"); user picks one from a JRPG-style command menu, or types a free-text hint instead.
- The chosen option/hint is injected as an extra system/user message into the next `streamText` call, steering the following round without needing to interrupt an in-flight stream.
- Rejected alternative: true anytime interrupt-and-resume of the streaming call — technically much harder (must suspend mid-stream and reconcile conversation state on resume) for a marginal gain in flexibility; not worth the risk in the remaining hackathon time.
- Fits existing architecture: reuses the round/step structure already driving the battle state machine, just adds a "waiting for player command" state between rounds.

## 7f. Mobile-responsive web app
Goal: the battle experience works on phone, not just desktop — widens who can try it live at the demo (scan a QR code, watch/play on your own phone).
- Layout: stack the side-view JRPG scene vertically on narrow screens (hero/boss/HP bars shrink and reflow instead of the fixed-width desktop layout); battle log and command menu (7e) collapse into a bottom sheet/drawer.
- Touch targets: command-menu choices (7e) and any tap-to-continue interactions sized for touch, not just click.
- Keep it CSS/layout work (flex/grid breakpoints), not a separate mobile build — same React code, same event→battle spine.
- Sequencing: lowest priority of the visual/fancy items — do after the core desktop demo and any in-progress stretch features are solid, since a broken desktop demo is worse than no mobile support.

## 7g. Task hub — quest board (+ task history)
Goal: a home/lobby screen that tracks every task that hasn't been completed yet (queued, in-progress across parallel dungeons, or failed/retryable), styled as an adventurer's guild quest board instead of a plain task list — plus a history view of what's already been done.
- **Look:** corkboard/parchment aesthetic — each pending task is a pinned quest card (title, short blurb, difficulty tag), matching the JRPG framing instead of a generic todo UI.
- **Customizable:** user can name a quest, tag it (e.g. difficulty/category), and reorder/pin cards — light personalization, not a full editor.
- **Task history:** a second tab/section on the same board — completed quests move here instead of disappearing, shown as resolved/stamped cards (e.g. "quest complete" seal) you can click to reopen that run's report card (from the existing report-card feature). Same `quests` collection, just filtered by status `done`, ordered most-recent-first.
- **Data:** reuse the same lightweight store as the leaderboard (in-memory or JSON/sqlite) — one `quests` collection with status `pending / in-progress / done`, no auth.
- **Ties the other features together:** launching a quest from the hub is what starts a parallel-dungeon run (7c); completed quests move to history and feed the leaderboard (7c) with their score.
- **Sequencing:** build after parallel dungeons + leaderboard exist (P2, see 4a) — the hub has nothing meaningful to show until there's more than one task/run to track. History is a cheap add-on once the `quests` store exists (just a status filter + read-only card), so build it alongside the hub rather than as a separate pass.

## 7h. UI polish: free asset libraries
Goal: the battle scene's character sprites are AI-generated and look good, but the surrounding UI (panels, buttons, icons in `App.tsx`) is hand-rolled inline CSS gradients + emoji, and reads as improvised rather than "designed."
- **Panels/buttons**: swap `panel` and `GameButton` in `App.tsx` for a free pixel-art RPG UI kit — **Kenney.nl** (CC0, no attribution required) has ready-made 9-slice panel/button/HP-bar assets that fit the existing SNES-JRPG sprite style. Apply via `border-image`/9-slice so panels resize without stretching.
- **Icons**: replace emoji glyphs (used for skills/stats/loadout) with **game-icons.net** SVGs (free, optional attribution) — better fits the RPG stat/skill theme (Skills/MCP/Knowledge/Prompt/Memory/Reasoning in `src/loadout/types.ts`) than generic emoji.
- **Scope**: pure CSS/asset swap, no logic changes — low risk, but manual/time-consuming (picking + trimming assets from the libraries), not a coding task per se.
- **Sequencing**: folded into the P0 "asset/color polish pass" (see 4a #2) — do this before spending time on further stretch features, since it improves every screen at once for relatively low effort.

## 8. Status
- [x] Direction validated, competitors scanned, stack chosen
- [x] Knowledge base written (`docs/kb/`)
- [x] Plan written (this file)
- [x] Project scaffolded (React+Vite+TS, Node proxy, `npm run dev` boots both)
- [x] Grok wired via Vercel AI SDK v5 (`ai@7`, `@ai-sdk/xai@4`); native `web_search` + `x_search` + `code_execution` enabled
- [x] Event→battle spine working (verified: synthetic run → victory, boss slain, loot, agent damage)
- [x] Battle FX (damage numbers, skill-cast banner, portraits w/ hurt+cast animations)
- [x] ~~Voice narration~~ — REMOVED. TTS lines queued and lagged well behind the action they described; `src/voice/` and the `/api/tts` stub are deleted. Replaced by `src/sfx/` — instant synthesized (Web Audio) chiptune blips per skill cast / hit / crit / victory / defeat, toggled in Settings ("Sound effects", default on).
- [x] Report card + share-to-X (intent-URL fallback via `/api/share`)
- [x] Typecheck clean, production build passes (93 KB gz)

### Remaining before demo
- [x] Add real `XAI_API_KEY` to `.env`, run one live quest end-to-end — VERIFIED against real Grok (tool-call/result, text-delta, step-finish, finish+sources all flow; mapper field/tool names match)
- [x] Confirm exact Grok model id — key exposes `grok-4.20-{0309-non-reasoning,0309-reasoning,multi-agent-0309},4.3,4.5,build-0.1` + `grok-imagine-image/video`. Server now uses `grok-4.20-multi-agent-0309` (agentic).
- [ ] See **4a. Priority order for remaining time** for the ranked list of everything left (polish fixes + all stretch features, task hub included).
