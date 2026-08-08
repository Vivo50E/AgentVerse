# Knowledge Base — Frontend / Rendering / Voice

## Rendering decision
- **DOM + Framer Motion is the main renderer.** RPG battle UI (portraits, HP/MP bars, floating damage numbers, skill labels, battle log, turn transitions) is 90% UI → DOM's strength, and AI-coding-friendly.
- **Pixi.js / Canvas 2D:** optional, for ONE hero particle effect (crit explosion). Do not build the whole game in it.
- **NO Three.js / NO Godot / NO custom engine** for the 12h build — time sinks with no payoff for our differentiator (observability + persona, not game mechanics).

## Framer Motion patterns we'll use
- `motion.div` + spring transitions for skill casts.
- `AnimatePresence` for floating damage numbers (mount → float up → fade).
- Layout animations for HP bar drain.
- `useAnimate` / imperative sequences for combo/crit choreography.
- Screen shake = animate a wrapper's `x`/`y` with a short spring on crit.

## Voice (real-time narration) — DO
- Stream a TTS API; keep lines SHORT (1–2 s).
- **Pre-generate & cache** stock lines (crit / miss / victory / defeat) → zero latency in demo.
- Generate dynamic lines with the cheap fast Grok model, then TTS.

## Image generation — DON'T do it real-time
- Per-frame image gen = inconsistent pixels + seconds of latency. NOT for animation.
- ✅ Use it ONLY: (a) one-time character portraits/skill icons at session start (pre-generated sprites), (b) the end-of-session **report card** image (one-off, becomes the X share).

## Assets (the hidden time sink)
- Use free packs: itch.io, Kenney.nl (pixel RPG chars + UI). Or AI-generate portraits once. Or minimalist geometric characters + emoji.
- Consistency (one palette, one font, smooth motion) beats per-asset polish.

## Deployment
- Web-first. Deploy to Vercel (one command) → give judges a live link.
- Same React codebase later wraps in **Tauri** for the Mac desktop version (post-hackathon). Keep browser-only APIs abstracted; never hardcode API keys in the frontend (they go through the backend proxy).
