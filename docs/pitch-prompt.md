# Prompt — Generate AgentVerse Hackathon Pitch Slides

> Paste everything below the line into a capable agent (Claude / GPT / a slide-gen tool).
> It is self-contained: all project facts are embedded, so the agent does not need repo access.
> Tweak the **KNOBS** block at the top to change length, format, or emphasis.

---

## ROLE
You are a world-class startup pitch designer and deck writer who has coached winning teams at YC Demo Day and top AI hackathons. You write tight, punchy, visually-driven slides — not walls of text. You know a hackathon judge decides in the first 20 seconds.

## KNOBS (edit these before running)
- AUDIENCE: hackathon judges (technical + product + some investors), 3-minute live pitch.
- DECK_LENGTH: 9 slides (hard cap 10).
- OUTPUT_FORMAT: a single self-contained `pitch.html` using reveal.js via CDN — opens offline in any browser, arrow-key navigation, presenter notes (`data-notes`) on every slide. Also emit, ABOVE the HTML, a plain-markdown outline of all slides for quick review.
- HACKATHON_THEME: built with **Grok & the X (xAI) API** — this is a judging requirement, so make the Grok/X usage unmistakable and central, not bolted on.
- VISUAL_STYLE: match the product — a dark "RPG battle" aesthetic. Palette: bg `#0d0b1a`/`#120f26`, accent purple `#7c5cff`, good-green `#57d9a3`, danger-red `#ff6b81`, crit-gold `#ffd166`. Monospace/pixel display font for headers (e.g. "Press Start 2P" or a monospace fallback), clean sans for body. Use tasteful RPG motifs (HP bars, skill icons, "loot", crit numbers) as design elements — but keep it legible and premium, never cheesy. One idea per slide, big type, minimal words.

## PRODUCT FACTS (ground truth — do not contradict; do not invent numbers)
- **Name:** AgentVerse. **Tagline options to pick/refine from:** "Watch your AI agent fight." / "A gamified observability layer for AI agents." / "Turn agent workflows into RPG battles."
- **What it is:** A web (later Mac desktop via Tauri) app that turns an AI agent's problem-solving workflow into a real-time, RPG-style **battle**. The agent is a hero; the user's task/problem is the boss. Each reasoning step and tool call becomes a "skill cast"; successes deal damage; failures/retries make the hero take damage; citations are "loot"; the run ends in a victory/defeat **report card** you can share to X.
- **Why it matters (the real value):** Agent execution today is a black box — dry logs and traces built for engineers (LangSmith, LangGraph Studio, Langfuse, Arize). AgentVerse is the **human-friendly, emotional version of agent observability**: it makes what an agent is doing — and why it succeeds or fails — legible, engaging, and shareable. Position it as a **gamified observability + interaction layer**, NOT a toy game.
- **How Grok + X power it (be specific):**
  - Grok is the agent's brain (Vercel AI SDK v5, `@ai-sdk/xai`, streamed via `fullStream`).
  - Grok's **native server-side tools** are the in-game skills: `web_search` and `x_search` ("Intel Summon ⚡" — the signature skill), plus `code_execution` ("Forge").
  - `x_search` pulls live X posts as the agent's real-time "intel" — a differentiator only the X platform enables.
  - The end **battle report card shares to X**, creating a built-in viral loop.
  - A cheap fast Grok model generates real-time character narration/announcer lines (voiced via TTS).
- **Architecture (one line for the tech slide):** `Grok fullStream events → BattleAction → battle state machine → Framer Motion animation + voice + shareable report card`. Node proxy keeps the API key off the browser.
- **Competitive landscape:** Closest is **AgentCraft** (RTS-style, multi-agent *management*, experimental) — leaves the RPG + persona + entertainment + X-virality niche open. Serious observability tools are dry/engineer-only. AI-generates-games tools (RPGGO) are the opposite direction. **Our moat is tone, narrative, and shareability, plus deep Grok/X integration.**
- **Status (built in a 12-hour hackathon, solo + AI-assisted):** Working end-to-end MVP — event→battle spine verified, native web/x_search/code_execution wired, battle FX, voice narration (with Web Speech fallback), report card + share-to-X, clean typecheck + production build.
- **Business angle (keep credible, no fake metrics):** Wedge = the delightful demo/observability layer for individual devs & agent builders; expansion = team-facing "watch your agents work" dashboards, multi-agent "party" views, and an agent "strength/skill" profile that helps users pick and tune agents. Comparable buyers to observability tools, but reaching a broader, less-technical audience.

## DECK SPEC (9 slides — one idea each)
1. **Title / hook** — name, logo-feel wordmark, tagline, one striking line. Set the RPG tone instantly. (Speaker note: the 10-sec hook.)
2. **The problem** — AI agents are black boxes; watching them is boring, opaque, and built only for engineers. Make the pain visceral.
3. **The idea** — "What if you could *watch your agent fight*?" Introduce the RPG reframing in one image/sentence.
4. **The product / how it works** — the battle: hero=agent, boss=problem, tool calls=skills, successes=damage, citations=loot, ends in a report card. Show the event→battle mapping simply.
5. **Live demo** — a demo-driver slide: what the judges are about to see (one real quest → a fought battle → shareable card). Keep it a springboard for the live demo, with a fallback screenshot description.
6. **Powered by Grok & X** — spell out the integration: Grok brain, native `x_search`/`web_search`/`code_execution` as skills, live X intel as the signature move, share-to-X viral loop. This is the requirement slide — make it shine.
7. **Why we're different** — the competitive matrix: dry observability tools vs AgentCraft (RTS/management) vs AgentVerse (RPG + persona + X-virality). State the moat.
8. **Business & vision** — wedge → expansion (individual delight/observability → team dashboards, multi-agent parties, agent strength profiles). Web now, Mac desktop next. Credible, no invented numbers.
9. **Close / ask** — restate the one-liner, the "built in 12h with Grok + X," and a memorable final line. Confident call to action.

## WRITING & DESIGN RULES
- Max ~20 words of body per slide; headers ≤ 6 words. Big type. One idea per slide.
- Concrete > abstract. Show the metaphor (HP bar draining, a crit number, an "X Intel Summon" skill card) rather than describing it.
- Every slide gets a `data-notes` speaker script (2–4 sentences) sized for a 3-minute total pitch.
- No invented metrics, users, or funding. If a placeholder is unavoidable, mark it `[TBD]`.
- Accessible contrast on the dark palette; don't put dark text on dark.
- The HTML must be a single file, work offline (CDN reveal.js is fine), and advance with arrow keys.

## DELIVERABLES
1. First: a markdown outline of all 9 slides (title + bullets + one-line speaker-note gist).
2. Then: the complete self-contained `pitch.html` (reveal.js, embedded CSS in the RPG theme, presenter notes).
3. Finally: 3 alternative taglines and 2 alternative title-slide hooks to choose from.

Begin with the markdown outline, then produce the HTML.
