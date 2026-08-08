// Renders the agent's real answer as a usable result: readable text, clickable
// sources, and a copy button. Shared by the victory card and the persistent
// result panel so the game actually delivers useful information.
import { useState } from 'react';

const C = {
  panel: '#141031',
  border: '#2f2758',
  accent: '#7c5cff',
  good: '#57d9a3',
  text: '#e6e2ff',
  dim: '#9d97c9',
  faint: '#7a72a8',
};

/** Strip markdown citation/link syntax to keep inline text readable; the real
 *  links are shown separately in the Sources list. */
function cleanAnswer(text: string): string {
  return text
    .replace(/\[\[(\d+)\]\]\([^)]*\)/g, '[$1]') // [[1]](url) -> [1]
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '$1') // [label](url) -> label
    .replace(/\*\*(.+?)\*\*/g, '$1') // **bold** -> bold
    .trim();
}

function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function AnswerView({
  answer,
  sources,
  maxHeight = 240,
  streaming,
}: {
  answer: string;
  sources: string[];
  maxHeight?: number;
  streaming?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const clean = cleanAnswer(answer);

  const copy = () => {
    const text = clean + (sources.length ? '\n\nSources:\n' + sources.map((s) => '- ' + s).join('\n') : '');
    void navigator.clipboard?.writeText(text).then(
      () => { setCopied(true); window.setTimeout(() => setCopied(false), 1500); },
      () => {},
    );
  };

  const hasContent = clean.length > 0;

  return (
    <div style={{ fontFamily: 'ui-monospace, monospace' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: C.dim, letterSpacing: 0.5 }}>
          📜 Quest Result{streaming && !hasContent ? ' · gathering…' : ''}
        </span>
        {hasContent && (
          <button onClick={copy}
            style={{ background: copied ? C.good : 'transparent', border: `1px solid ${copied ? C.good : C.border}`, color: copied ? '#04120c' : C.dim, borderRadius: 7, padding: '3px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
            {copied ? '✓ Copied' : '⧉ Copy'}
          </button>
        )}
      </div>

      <div style={{
        maxHeight, overflowY: 'auto', padding: '12px 14px', background: C.panel,
        border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, lineHeight: 1.55,
        color: hasContent ? C.text : C.faint, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {hasContent ? clean : (streaming ? 'The agent is still gathering intel…' : 'No answer produced.')}
        {streaming && hasContent && <span style={{ animation: 'blink 1s step-end infinite' }}>▌</span>}
      </div>

      {sources.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, color: C.dim, marginBottom: 6 }}>🔗 Sources ({sources.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sources.map((src, i) => (
              <a key={`${src}-${i}`} href={src} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: C.accent, textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                title={src}>
                {i + 1}. {host(src)} <span style={{ color: C.faint }}>↗</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
