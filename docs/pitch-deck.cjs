/**
 * AgentVerse — Hackathon Pitch Deck (9 slides)
 * Dark RPG battle aesthetic · Grok & X powered
 * Run: node docs/pitch-deck.js
 */
const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.defineLayout({ name: "WIDE_16x9", width: 13.333, height: 7.5 });
pres.layout = "WIDE_16x9";
pres.author = "AgentVerse";
pres.title = "AgentVerse — Hackathon Pitch";
pres.subject = "Gamified observability for AI agents, powered by Grok & X";

// ── Palette (from pitch-prompt) ──────────────────────────────────────────────
const C = {
  bg:       "0D0B1A",
  bgDeep:   "090714",
  panel:    "16122A",
  panelHi:  "1C1733",
  border:   "2A2448",
  borderHi: "3D3566",
  purple:   "7C5CFF",
  purpleDim:"4A3A99",
  green:    "57D9A3",
  red:      "FF6B81",
  gold:     "FFD166",
  cream:    "F0ECFF",
  muted:    "9B94B8",
  dim:      "6B6488",
  white:    "FFFFFF",
};

const FONT  = "Arial";
const FMONO = "Consolas";
const SW = 13.333;
const SH = 7.5;

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeShadow() {
  return { type: "outer", color: "000000", blur: 18, offset: 4, angle: 135, opacity: 0.35 };
}

function bg(s) {
  s.background = { color: C.bg };
  // subtle top glow bar
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: SW, h: 0.06,
    fill: { color: C.purple }, line: { color: C.purple, width: 0 },
  });
}

function chrome(s, section) {
  bg(s);
  // top brand
  s.addText("AGENTVERSE", {
    x: 0.55, y: 0.22, w: 2.4, h: 0.28,
    fontFace: FMONO, fontSize: 11, color: C.purple, charSpacing: 2, margin: 0, bold: true,
  });
  s.addText(section, {
    x: 8.5, y: 0.22, w: 4.3, h: 0.28,
    fontFace: FMONO, fontSize: 11, color: C.dim, charSpacing: 1.5, margin: 0, align: "right",
  });
  // bottom bar
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 7.22, w: SW, h: 0.28,
    fill: { color: C.bgDeep }, line: { color: C.bgDeep, width: 0 },
  });
  s.addText("GROK  ×  X  ·  HACKATHON PITCH", {
    x: 0.55, y: 7.24, w: 6, h: 0.24,
    fontFace: FMONO, fontSize: 9, color: C.dim, charSpacing: 1.5, margin: 0,
  });
  s.addText("BUILT IN 12H", {
    x: 10.3, y: 7.24, w: 2.5, h: 0.24,
    fontFace: FMONO, fontSize: 9, color: C.purple, charSpacing: 1.5, margin: 0, align: "right",
  });
}

function card(s, x, y, w, h, opts = {}) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    fill: { color: opts.fill || C.panel },
    line: { color: opts.border || C.border, width: opts.lineW || 1.25 },
    rectRadius: opts.radius || 0.1,
    shadow: opts.shadow ? makeShadow() : undefined,
  });
}

function accentBar(s, x, y, h, color = C.purple) {
  s.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 0.07, h,
    fill: { color }, line: { color, width: 0 },
  });
}

function hpBar(s, x, y, w, h, fillPct, fillColor, trackColor = C.border) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    fill: { color: trackColor },
    line: { color: C.borderHi, width: 0.75 },
    rectRadius: 0.04,
  });
  const fw = Math.max(0.08, w * fillPct);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w: fw, h,
    fill: { color: fillColor },
    line: { color: fillColor, width: 0 },
    rectRadius: 0.04,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — Title / Hook
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  bg(s);
  // deep vignette panels
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: SW, h: SH,
    fill: { color: C.bgDeep, transparency: 30 }, line: { color: C.bgDeep, width: 0 },
  });

  // decorative corner frames
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.5, w: 0.9, h: 0.04, fill: { color: C.purple }, line: { color: C.purple, width: 0 },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.5, w: 0.04, h: 0.9, fill: { color: C.purple }, line: { color: C.purple, width: 0 },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 11.93, y: 6.96, w: 0.9, h: 0.04, fill: { color: C.purple }, line: { color: C.purple, width: 0 },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 12.79, y: 6.1, w: 0.04, h: 0.9, fill: { color: C.purple }, line: { color: C.purple, width: 0 },
  });

  s.addText("HACKATHON PITCH  ·  POWERED BY GROK & X", {
    x: 0.8, y: 1.55, w: 11.7, h: 0.35,
    fontFace: FMONO, fontSize: 13, color: C.purple, charSpacing: 3, margin: 0, align: "center",
  });

  s.addText("AGENTVERSE", {
    x: 0.8, y: 2.15, w: 11.7, h: 1.1,
    fontFace: FMONO, fontSize: 72, color: C.cream, bold: true, charSpacing: 6, margin: 0, align: "center",
  });

  s.addText("Watch your AI agent fight.", {
    x: 0.8, y: 3.35, w: 11.7, h: 0.55,
    fontFace: FONT, fontSize: 28, color: C.gold, margin: 0, align: "center", italic: true,
  });

  // mini HP bars as motif
  s.addText("HERO  HP", {
    x: 3.4, y: 4.35, w: 1.2, h: 0.25,
    fontFace: FMONO, fontSize: 10, color: C.green, margin: 0,
  });
  hpBar(s, 4.6, 4.38, 2.2, 0.18, 0.82, C.green);
  s.addText("BOSS  HP", {
    x: 7.1, y: 4.35, w: 1.2, h: 0.25,
    fontFace: FMONO, fontSize: 10, color: C.red, margin: 0,
  });
  hpBar(s, 8.3, 4.38, 1.6, 0.18, 0.35, C.red);

  s.addText("A gamified observability layer for AI agents", {
    x: 0.8, y: 5.1, w: 11.7, h: 0.4,
    fontFace: FONT, fontSize: 16, color: C.muted, margin: 0, align: "center",
  });

  s.addNotes(
    "Hook (10 sec): Every AI agent is a hero. Every task is a boss fight. " +
    "AgentVerse turns dry agent runs into real-time RPG battles you can watch, feel, and share. " +
    "Built in 12 hours on Grok and the X API."
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — The Problem
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  chrome(s, "01  /  PROBLEM");

  s.addText("Agents are black boxes.", {
    x: 0.55, y: 0.7, w: 12.2, h: 0.7,
    fontFace: FONT, fontSize: 36, color: C.cream, bold: true, margin: 0,
  });
  s.addText("Watching them work is opaque, boring, and built only for engineers.", {
    x: 0.55, y: 1.4, w: 12.2, h: 0.4,
    fontFace: FONT, fontSize: 16, color: C.muted, margin: 0,
  });

  const pains = [
    { title: "DRY LOGS", body: "Traces & spans for\nengineers only", color: C.red },
    { title: "NO STORY", body: "You can't feel\nwhy it failed", color: C.gold },
    { title: "UNSHAREABLE", body: "No one retweets\na LangSmith trace", color: C.purple },
  ];
  pains.forEach((p, i) => {
    const x = 0.55 + i * 4.15;
    card(s, x, 2.2, 3.9, 3.6, { shadow: true });
    accentBar(s, x, 2.2, 3.6, p.color);
    s.addText(p.title, {
      x: x + 0.35, y: 2.7, w: 3.3, h: 0.45,
      fontFace: FMONO, fontSize: 18, color: p.color, bold: true, charSpacing: 1, margin: 0,
    });
    s.addText(p.body, {
      x: x + 0.35, y: 3.5, w: 3.3, h: 1.4,
      fontFace: FONT, fontSize: 20, color: C.cream, margin: 0,
    });
    // fake "log line" motif
    s.addText(">> span.timeout  err=null", {
      x: x + 0.35, y: 5.1, w: 3.3, h: 0.3,
      fontFace: FMONO, fontSize: 11, color: C.dim, margin: 0,
    });
  });

  s.addNotes(
    "The problem: agent execution today is a black box. Tools like LangSmith and Langfuse give engineers dry traces — not stories. " +
    "Builders can't feel why an agent succeeded or failed, and there's nothing shareable about a span tree. " +
    "Observability needs a human layer."
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — The Idea
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  chrome(s, "02  /  THE IDEA");

  s.addText("What if you could", {
    x: 0.55, y: 1.8, w: 12.2, h: 0.6,
    fontFace: FONT, fontSize: 28, color: C.muted, margin: 0, align: "center",
  });
  s.addText("watch your agent fight?", {
    x: 0.55, y: 2.5, w: 12.2, h: 0.9,
    fontFace: FONT, fontSize: 48, color: C.cream, bold: true, margin: 0, align: "center",
  });

  // three metaphor pills
  const pills = [
    { label: "AGENT  →  HERO", c: C.green },
    { label: "TASK  →  BOSS", c: C.red },
    { label: "TOOLS  →  SKILLS", c: C.purple },
  ];
  pills.forEach((p, i) => {
    const x = 1.6 + i * 3.5;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: 4.0, w: 3.2, h: 0.7,
      fill: { color: C.panel },
      line: { color: p.c, width: 1.5 },
      rectRadius: 0.12,
    });
    s.addText(p.label, {
      x, y: 4.15, w: 3.2, h: 0.45,
      fontFace: FMONO, fontSize: 14, color: p.c, bold: true, margin: 0, align: "center", charSpacing: 1,
    });
  });

  s.addText("Not a toy game — a human-friendly window into agent execution.", {
    x: 0.55, y: 5.2, w: 12.2, h: 0.4,
    fontFace: FONT, fontSize: 15, color: C.dim, margin: 0, align: "center", italic: true,
  });

  s.addNotes(
    "The idea in one line: what if watching an agent felt like watching a boss fight? " +
    "The agent is the hero. The problem is the boss. Tool calls are skill casts. " +
    "This is gamified observability — not a game for its own sake."
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 4 — Product / How it works
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  chrome(s, "03  /  PRODUCT");

  s.addText("Every run is a battle.", {
    x: 0.55, y: 0.7, w: 12.2, h: 0.55,
    fontFace: FONT, fontSize: 34, color: C.cream, bold: true, margin: 0,
  });

  // mapping rows
  const rows = [
    { from: "tool-call",      to: "SKILL CAST",   note: "web / x_search / code", c: C.purple },
    { from: "tool-result ok", to: "HIT / CRIT",    note: "boss HP drops",        c: C.green },
    { from: "error / retry",  to: "TAKE DAMAGE",   note: "hero HP drops",        c: C.red },
    { from: "citations",      to: "LOOT",          note: "intel drops",          c: C.gold },
    { from: "finish",         to: "REPORT CARD",   note: "share to X",           c: C.cream },
  ];

  rows.forEach((r, i) => {
    const y = 1.5 + i * 0.95;
    card(s, 0.55, y, 12.2, 0.85);
    // left badge
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.75, y: y + 0.18, w: 3.2, h: 0.5,
      fill: { color: C.panelHi },
      line: { color: C.borderHi, width: 1 },
      rectRadius: 0.06,
    });
    s.addText(r.from, {
      x: 0.75, y: y + 0.28, w: 3.2, h: 0.35,
      fontFace: FMONO, fontSize: 13, color: C.muted, margin: 0, align: "center",
    });
    // arrow
    s.addText("→", {
      x: 4.1, y: y + 0.2, w: 0.6, h: 0.5,
      fontFace: FONT, fontSize: 24, color: r.c, margin: 0, align: "center",
    });
    // right result
    s.addText(r.to, {
      x: 4.8, y: y + 0.18, w: 3.5, h: 0.5,
      fontFace: FMONO, fontSize: 18, color: r.c, bold: true, margin: 0,
    });
    s.addText(r.note, {
      x: 8.5, y: y + 0.22, w: 3.9, h: 0.45,
      fontFace: FONT, fontSize: 15, color: C.dim, margin: 0,
    });
  });

  s.addNotes(
    "Product mapping: every fullStream event becomes a battle action. " +
    "Tool calls cast skills. Successes hit the boss. Failures hurt the hero. " +
    "Citations are loot. The run ends in a victory or defeat report card you share to X."
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 5 — Live Demo
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  chrome(s, "04  /  LIVE DEMO");

  s.addText("One quest. One fight. One card.", {
    x: 0.55, y: 0.7, w: 12.2, h: 0.55,
    fontFace: FONT, fontSize: 32, color: C.cream, bold: true, margin: 0,
  });

  const steps = [
    { n: "01", title: "QUEST", body: "Give the agent a real task — research, debug, or ship a plan." },
    { n: "02", title: "BATTLE", body: "Watch HP bars, skill casts, crits, and voice narration live." },
    { n: "03", title: "REPORT", body: "Victory card drops. One tap shares the run to X." },
  ];
  steps.forEach((st, i) => {
    const x = 0.55 + i * 4.15;
    card(s, x, 1.6, 3.95, 4.0, { shadow: true });
    s.addText(st.n, {
      x: x + 0.3, y: 1.9, w: 3.3, h: 0.5,
      fontFace: FMONO, fontSize: 28, color: C.purple, bold: true, margin: 0,
    });
    s.addText(st.title, {
      x: x + 0.3, y: 2.6, w: 3.3, h: 0.5,
      fontFace: FMONO, fontSize: 22, color: C.cream, bold: true, charSpacing: 2, margin: 0,
    });
    s.addText(st.body, {
      x: x + 0.3, y: 3.4, w: 3.3, h: 1.5,
      fontFace: FONT, fontSize: 16, color: C.muted, margin: 0,
    });
  });

  s.addNotes(
    "Demo driver: I'll give the agent a real quest. You'll see the battle play out live — " +
    "Intel Summon from x_search, damage numbers, voice lines — then a shareable report card. " +
    "If the network flakes, we have a recorded backup run."
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 6 — Powered by Grok & X  (requirement slide)
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  chrome(s, "05  /  GROK  &  X");

  s.addText("Powered by Grok & X.", {
    x: 0.55, y: 0.7, w: 12.2, h: 0.55,
    fontFace: FONT, fontSize: 34, color: C.cream, bold: true, margin: 0,
  });
  s.addText("Not bolted on — the entire battle runs on native Grok tools.", {
    x: 0.55, y: 1.3, w: 12.2, h: 0.35,
    fontFace: FONT, fontSize: 15, color: C.muted, margin: 0,
  });

  // 2x2 skill grid
  const skills = [
    {
      tag: "BRAIN",
      title: "Grok fullStream",
      body: "Agent brain via Vercel AI SDK + @ai-sdk/xai. Every event drives the fight.",
      c: C.purple,
    },
    {
      tag: "SIGNATURE",
      title: "X Intel Summon ⚡",
      body: "Native x_search pulls live X posts as real-time intel — only X enables this.",
      c: C.gold,
    },
    {
      tag: "SKILLS",
      title: "web_search · Forge",
      body: "web_search + code_execution cast as in-game skills. Success = damage.",
      c: C.green,
    },
    {
      tag: "VIRAL LOOP",
      title: "Share to X",
      body: "Battle report card posts to X. Demo → share → more demos.",
      c: C.red,
    },
  ];
  skills.forEach((sk, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.55 + col * 6.35;
    const y = 1.9 + row * 2.35;
    card(s, x, y, 6.1, 2.15, { shadow: true });
    accentBar(s, x, y, 2.15, sk.c);
    s.addText(sk.tag, {
      x: x + 0.35, y: y + 0.25, w: 5.4, h: 0.3,
      fontFace: FMONO, fontSize: 11, color: sk.c, charSpacing: 2, margin: 0,
    });
    s.addText(sk.title, {
      x: x + 0.35, y: y + 0.6, w: 5.4, h: 0.4,
      fontFace: FONT, fontSize: 20, color: C.cream, bold: true, margin: 0,
    });
    s.addText(sk.body, {
      x: x + 0.35, y: y + 1.15, w: 5.4, h: 0.7,
      fontFace: FONT, fontSize: 14, color: C.muted, margin: 0,
    });
  });

  s.addNotes(
    "Grok and X are the product, not a checkbox. Grok is the brain on fullStream. " +
    "Native x_search is our signature skill — live X intel as combat advantage. " +
    "web_search and code_execution are Forge skills. The report card closes the viral loop back to X. " +
    "A fast Grok model also writes the announcer lines for TTS."
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 7 — Why we're different
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  chrome(s, "06  /  DIFFERENTIATION");

  s.addText("Tone, narrative, shareability.", {
    x: 0.55, y: 0.7, w: 12.2, h: 0.55,
    fontFace: FONT, fontSize: 32, color: C.cream, bold: true, margin: 0,
  });

  // comparison table header
  const headers = ["", "Observability tools", "AgentCraft", "AgentVerse"];
  const colW = [2.4, 3.2, 3.2, 3.4];
  let cx = 0.55;
  headers.forEach((h, i) => {
    const isUs = i === 3;
    s.addShape(pres.shapes.RECTANGLE, {
      x: cx, y: 1.5, w: colW[i], h: 0.55,
      fill: { color: isUs ? C.purple : C.panelHi },
      line: { color: C.border, width: 0.75 },
    });
    s.addText(h, {
      x: cx, y: 1.6, w: colW[i], h: 0.4,
      fontFace: FMONO, fontSize: 12, color: isUs ? C.cream : C.muted, bold: true, margin: 0, align: "center",
    });
    cx += colW[i];
  });

  const matrix = [
    ["Form",        "Traces / graphs",  "RTS management",  "RPG battle"],
    ["Audience",    "Engineers only",   "Experimenters",   "Builders + fans"],
    ["Feel",        "Dry / clinical",   "Strategy sim",    "Persona + juice"],
    ["Virality",    "None",             "Limited",         "Share-to-X card"],
    ["X / Grok",    "Generic",          "Generic",         "Native deep"],
  ];
  matrix.forEach((row, ri) => {
    const y = 2.05 + ri * 0.85;
    let x = 0.55;
    row.forEach((cell, ci) => {
      const isUs = ci === 3;
      const isLabel = ci === 0;
      s.addShape(pres.shapes.RECTANGLE, {
        x, y, w: colW[ci], h: 0.85,
        fill: { color: isUs ? "1A1440" : C.panel },
        line: { color: C.border, width: 0.75 },
      });
      s.addText(cell, {
        x, y: y + 0.22, w: colW[ci], h: 0.45,
        fontFace: isLabel ? FMONO : FONT,
        fontSize: isLabel ? 12 : 14,
        color: isUs ? C.gold : isLabel ? C.purple : C.muted,
        bold: isUs || isLabel,
        margin: 0,
        align: "center",
      });
      x += colW[ci];
    });
  });

  s.addNotes(
    "Differentiation: LangSmith-class tools are dry and engineer-only. AgentCraft is RTS multi-agent management. " +
    "We own RPG persona, entertainment, and X virality — plus deep native Grok/X integration. " +
    "Our moat is tone and narrative, not another trace UI."
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 8 — Business & Vision
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  chrome(s, "07  /  VISION");

  s.addText("Wedge now. Universe later.", {
    x: 0.55, y: 0.7, w: 12.2, h: 0.55,
    fontFace: FONT, fontSize: 32, color: C.cream, bold: true, margin: 0,
  });

  const stages = [
    {
      phase: "NOW",
      title: "Delight wedge",
      items: ["Solo builders & agent demos", "Web app MVP live", "Shareable battle cards"],
      c: C.green,
    },
    {
      phase: "NEXT",
      title: "Team layer",
      items: ["Watch-your-agents dashboards", "Multi-agent party views", "Mac desktop via Tauri"],
      c: C.purple,
    },
    {
      phase: "LATER",
      title: "Agent profiles",
      items: ["Strength / skill radar", "Pick & tune agents", "Broader than eng-only tools"],
      c: C.gold,
    },
  ];
  stages.forEach((st, i) => {
    const x = 0.55 + i * 4.15;
    card(s, x, 1.55, 3.95, 4.5, { shadow: true });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.3, y: 1.85, w: 1.5, h: 0.4,
      fill: { color: st.c },
      line: { color: st.c, width: 0 },
      rectRadius: 0.06,
    });
    s.addText(st.phase, {
      x: x + 0.3, y: 1.9, w: 1.5, h: 0.3,
      fontFace: FMONO, fontSize: 12, color: C.bg, bold: true, margin: 0, align: "center",
    });
    s.addText(st.title, {
      x: x + 0.3, y: 2.5, w: 3.35, h: 0.5,
      fontFace: FONT, fontSize: 22, color: C.cream, bold: true, margin: 0,
    });
    st.items.forEach((item, j) => {
      s.addText("▸  " + item, {
        x: x + 0.3, y: 3.3 + j * 0.55, w: 3.35, h: 0.45,
        fontFace: FONT, fontSize: 15, color: C.muted, margin: 0,
      });
    });
  });

  s.addNotes(
    "Business: start as the delightful demo and observability layer for individual builders. " +
    "Expand to team dashboards, multi-agent party views, and agent strength profiles. " +
    "Web now; Mac desktop next via Tauri. Same buyers as observability — wider, less technical audience. No fake metrics."
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 9 — Close / Ask
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  bg(s);

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.5, w: 0.9, h: 0.04, fill: { color: C.purple }, line: { color: C.purple, width: 0 },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.5, w: 0.04, h: 0.9, fill: { color: C.purple }, line: { color: C.purple, width: 0 },
  });

  s.addText("AGENTVERSE", {
    x: 0.8, y: 1.6, w: 11.7, h: 0.7,
    fontFace: FMONO, fontSize: 42, color: C.cream, bold: true, charSpacing: 4, margin: 0, align: "center",
  });

  s.addText("Watch your AI agent fight.", {
    x: 0.8, y: 2.4, w: 11.7, h: 0.5,
    fontFace: FONT, fontSize: 26, color: C.gold, italic: true, margin: 0, align: "center",
  });

  s.addText("Gamified observability for AI agents — built in 12 hours on Grok & X.", {
    x: 1.5, y: 3.2, w: 10.3, h: 0.45,
    fontFace: FONT, fontSize: 16, color: C.muted, margin: 0, align: "center",
  });

  // CTA card
  card(s, 3.2, 4.1, 6.9, 1.5, { border: C.purple, shadow: true });
  s.addText("LET'S WATCH AGENTS FIGHT", {
    x: 3.2, y: 4.4, w: 6.9, h: 0.45,
    fontFace: FMONO, fontSize: 18, color: C.purple, bold: true, charSpacing: 2, margin: 0, align: "center",
  });
  s.addText("Demo live  ·  Share the card  ·  Ship the layer", {
    x: 3.2, y: 5.0, w: 6.9, h: 0.35,
    fontFace: FONT, fontSize: 14, color: C.muted, margin: 0, align: "center",
  });

  s.addText("Every agent deserves a boss fight.", {
    x: 0.8, y: 6.1, w: 11.7, h: 0.4,
    fontFace: FONT, fontSize: 16, color: C.dim, margin: 0, align: "center", italic: true,
  });

  s.addNotes(
    "Close: AgentVerse — watch your AI agent fight. A gamified observability layer, built in 12 hours on Grok and X. " +
    "We're not asking for funding numbers — we're asking you to watch the fight, share the card, and imagine this as the human layer on every agent run. " +
    "Final line: every agent deserves a boss fight. Thank you."
  );
}

// ── Write ────────────────────────────────────────────────────────────────────
pres
  .writeFile({ fileName: "/Users/yiqi/Documents/Workspace/AgentVerse/docs/AgentVerse-Pitch.pptx" })
  .then(() => console.log("Wrote docs/AgentVerse-Pitch.pptx"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
