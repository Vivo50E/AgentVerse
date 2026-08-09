// 6 high-variance demo quests spanning different domains, tools, and
// complexity (code, research, creative, real-time social, analysis,
// multi-step planning). Shown as launchable cards on the Quest Board.
export interface DemoQuest {
  id: number;
  title: string;
  emoji: string;
  desc: string;
  prompt: string;
}

export const DEMO_QUESTS: DemoQuest[] = [
  {
    id: 1,
    title: 'Code Healer',
    emoji: '🔧',
    desc: 'Real bug fix + test verification (code_execution heavy)',
    prompt: `Fix this bug and verify with a test: function sumArray(arr) { let total; for (let i=0; i<=arr.length; i++) { total += arr[i]; } return total; }`,
  },
  {
    id: 2,
    title: 'Market Oracle',
    emoji: '📈',
    desc: 'Deep research on latest AI investment trends (web_search + synthesis)',
    prompt: `Provide a comprehensive analysis of the top 5 AI investment trends in 2026. Include key companies, funding numbers, and why each trend matters. Cite sources.`,
  },
  {
    id: 3,
    title: 'Creative Director',
    emoji: '🎨',
    desc: 'Multi-step creative task (image concept + prompt engineering)',
    prompt: `Design a complete visual identity for a new cyber-fantasy JRPG called "AgentVerse". Propose hero, villain, logo concept, color palette, and write 3 detailed Grok Imagine prompts that would generate perfect key art.`,
  },
  {
    id: 4,
    title: 'X Pulse',
    emoji: '⚡',
    desc: 'Real-time social sentiment + trend analysis (x_search dominant)',
    prompt: `What's the current sentiment on X about Grok 4 versus Claude 4 and GPT-5? Identify the top 3 most discussed strengths/weaknesses and any viral memes or controversies in the last 48 hours.`,
  },
  {
    id: 5,
    title: 'Policy Analyst',
    emoji: '📜',
    desc: 'Complex multi-tool reasoning on real-world regulation (web_search + critical thinking)',
    prompt: `Analyze the potential impact of the EU AI Act on open-source model development in 2026. Compare it with US policy, predict the biggest winners and losers among AI companies, and suggest one strategic pivot for xAI.`,
  },
  {
    id: 6,
    title: 'Epic Quest Master',
    emoji: '🗡️',
    desc: 'Full multi-tool creative + technical combo (research + code + narrative)',
    prompt: `Create a complete 5-room text adventure game set in an AI research lab that has gone rogue. Include: (1) rich narrative, (2) interesting puzzles that require code or search to solve, (3) write the full working Python code using only standard library, and (4) test that it runs without errors.`,
  },
];
