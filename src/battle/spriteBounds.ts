// Measure a sprite's transparent padding so overlays (HP bar, name, power) can
// hug the actual character. Sprite frames are a fixed 320x720, but content
// height varies a lot (a slime fills the bottom fifth; a golem fills the frame),
// so a fixed offset can't fit both — we measure the real alpha bounds instead.

export interface SpriteBounds {
  top: number; // transparent fraction above the content (0..1)
  bottom: number; // transparent fraction below the content (0..1)
}

const FALLBACK: SpriteBounds = { top: 0.12, bottom: 0.05 };
const cache = new Map<string, SpriteBounds>();

/** Measured bounds if already computed, else a sensible fallback. */
export function boundsOf(src: string | undefined): SpriteBounds {
  if (!src) return FALLBACK;
  return cache.get(src) ?? FALLBACK;
}

/** Measure (once, cached) the alpha bounding box of a sprite image. */
export function measureBounds(src: string): Promise<SpriteBounds> {
  const hit = cache.get(src);
  if (hit) return Promise.resolve(hit);
  if (typeof document === 'undefined') return Promise.resolve(FALLBACK);

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => resolve(FALLBACK);
    img.onload = () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) return resolve(FALLBACK);
        const cnv = document.createElement('canvas');
        cnv.width = w;
        cnv.height = h;
        const ctx = cnv.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(FALLBACK);
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, w, h).data;

        const rowHasAlpha = (y: number): boolean => {
          const base = y * w * 4;
          for (let x = 0; x < w; x++) {
            if (data[base + x * 4 + 3] > 16) return true;
          }
          return false;
        };

        let topRow = 0;
        while (topRow < h && !rowHasAlpha(topRow)) topRow++;
        let botRow = h - 1;
        while (botRow > topRow && !rowHasAlpha(botRow)) botRow--;

        const bounds: SpriteBounds = {
          top: Math.max(0, Math.min(0.6, topRow / h)),
          bottom: Math.max(0, Math.min(0.6, (h - 1 - botRow) / h)),
        };
        cache.set(src, bounds);
        resolve(bounds);
      } catch {
        resolve(FALLBACK);
      }
    };
    img.src = src;
  });
}
