---
name: sprite-pipeline
description: Use when adding, regenerating, or debugging AgentVerse's Grok-Imagine-generated character/foe sprites, or when a visual/UI change needs to be confirmed against the real running app (screenshots) rather than assumed from code. Covers the sprite generation pipeline (public/sprites/) and the Playwright screenshot script.
---

# AgentVerse sprite pipeline + visual verification

## Sprite generation (shared logic: `scripts/spritePipeline.mjs`)

One character = one Grok Imagine call → one sprite SHEET with 4 poses in a row
(`idle, attack, hurt, cast`) on a **solid magenta (#C8288C) background** → sliced
into 4 frames → chroma-key the background transparent. Generating all 4 poses in
a single image (not 4 separate calls) is what keeps the character visually
consistent across poses — never split this into per-pose generations.

Reusable functions in `scripts/spritePipeline.mjs`:
- `grokImage(prompt)` — calls `grok-imagine-image`, retries once, returns an image URL.
- `spriteSheetPrompt(character)` — wraps a character description in the standard 4-pose/magenta-bg prompt template.
- `sliceAndKey(srcPath, outDir, prefix, names, tol=72)` — crops the sheet into `names.length` frames, chroma-keys each by sampling the **top-left corner pixel** as the key color, writes `${outDir}/${prefix}-${name}.png`.
- `download(url, dest)` — fetch + write to disk.

Two call sites, kept logically identical but literally separate (one is a build script, one runs in the Express process):
- **Build-time defaults**: `scripts/genDefaults.mjs` (hero + boss + background) and `scripts/genFoes.mjs` (journey-stage foes) write PNG files into `public/sprites/` plus a `manifest.json` / `foes.json` index. Run via `npm run gen:assets`.
- **Runtime HITL designer**: `server/design.ts` duplicates the slice+chroma-key logic inline (can't import fs-writing script code into a request handler cleanly) and returns base64 `data:image/png` URLs instead of files, via `POST /api/design` (candidates) → `POST /api/design/finalize` (chosen sheet → sliced PNGs).

If you change the pose set, prompt template, or chroma-key tolerance, update **both** `scripts/spritePipeline.mjs` and `server/design.ts` — they must stay in sync.

**Gotcha:** the key color is sampled from a single corner pixel with tolerance 72. If a new art style/prompt produces a non-uniform or off-magenta corner, cutouts will show a colored fringe or holes — check with a screenshot (below), don't assume it worked.

## Visual verification: `scripts/shoot.mjs`

Dev server must already be running (`npm run dev`, frontend on 5173). Then:
```
node scripts/shoot.mjs            # screenshots main view + loadout panel to /tmp/av-art/
node scripts/shoot.mjs --journey  # also clicks "Start Quest" and screenshots the battle at early/mid/late timestamps
```
It also collects browser console/page errors and prints them at the end — check that output, not just the images.

Use this after any change to battle UI, sprites, or layout instead of reasoning about how it "should" look — this is a visual game, code review alone doesn't catch composited-image or animation bugs.
