// FxPreview — a small self-contained loop of a character's combat VFX for a
// given archetype, used in the Design Studio so players can preview how their
// hero attacks (melee slash vs arcane bolt vs arrow…) before committing.
import { useEffect, useState } from 'react';
import { SpellFx } from './SpellFx';
import type { FxArchetype } from '../../battle/sprites';

export const ARCHETYPE_LABEL: Record<FxArchetype, string> = {
  arcane: 'Arcane — bolt',
  slash: 'Melee — dashing slash',
  arrow: 'Ranged — arrow',
  fire: 'Fire — fireball',
  lightning: 'Lightning — bolt',
  nature: 'Nature — surge',
  ice: 'Ice — frost shards',
  poison: 'Poison — toxic cloud',
  explosion: 'Explosion — shockwave',
  holy: 'Holy — radiant beam',
  shadow: 'Shadow — dark tendrils',
  beam: 'Beam — plasma laser',
};

export const ARCHETYPE_IS_MELEE: Record<FxArchetype, boolean> = {
  arcane: false, slash: true, arrow: false, fire: false, lightning: false, nature: false,
  ice: false, poison: false, explosion: false, holy: false, shadow: false, beam: false,
};

/** Loops a cast→hit sequence for `archetype` inside a compact stage. */
export function FxPreview({ archetype, width = 260, height = 130 }: {
  archetype: FxArchetype;
  width?: number;
  height?: number;
}) {
  const [castT, setCastT] = useState(0);
  const [hitT, setHitT] = useState(0);

  const ox = width * 0.26;
  const oy = height * 0.5;
  const tx = width * 0.78;
  const ty = height * 0.5;

  // Loop: cast, then hit ~0.5s later, repeat every ~1.8s. Restarts on archetype
  // change so the preview always reflects the current selection.
  useEffect(() => {
    let alive = true;
    const fire = () => {
      if (!alive) return;
      setCastT((n) => n + 1);
      window.setTimeout(() => alive && setHitT((n) => n + 1), 520);
    };
    fire();
    const iv = window.setInterval(fire, 1800);
    return () => { alive = false; window.clearInterval(iv); };
  }, [archetype]);

  const dotBase: React.CSSProperties = {
    position: 'absolute', bottom: height * 0.28, width: 22, height: 30, borderRadius: 5,
    transform: 'translateX(-50%)',
  };

  return (
    <div style={{ position: 'relative', width, height, borderRadius: 10, overflow: 'hidden', background: 'radial-gradient(circle at 50% 40%, #1a1536, #0c0a1c)', border: '1px solid #2f2758' }}>
      {/* stand-in hero (left) + foe (right) so the FX has anchors */}
      <div style={{ ...dotBase, left: ox, background: 'linear-gradient(180deg,#8f7bff,#5a45c0)', boxShadow: '0 0 10px #7c5cff88' }} />
      <div style={{ ...dotBase, left: tx, width: 26, height: 26, borderRadius: '50%', bottom: height * 0.3, background: 'linear-gradient(180deg,#ff8a9c,#c0455a)', boxShadow: '0 0 10px #ff6b8188' }} />
      <SpellFx trigger={castT} kind="cast" archetype={archetype} originX={ox} originY={oy} targetX={tx} targetY={ty} />
      <SpellFx trigger={hitT} kind="hit" archetype={archetype} originX={ox} originY={oy} targetX={tx} targetY={ty} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 4, textAlign: 'center', fontSize: 10, color: '#a79be0', fontFamily: 'ui-monospace, monospace', textShadow: '0 1px 3px #000' }}>
        {ARCHETYPE_LABEL[archetype]}
      </div>
    </div>
  );
}
