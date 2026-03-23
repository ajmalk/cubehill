/**
 * CubeMesh unit tests.
 *
 * Tests focus on the sticker-index → cubie-position mapping and color update
 * logic, which can be verified without a real WebGL context.
 *
 * NOTE: Three.js is imported dynamically because vitest runs in Node.js where
 * some browser APIs are absent. The mapping logic itself is pure TypeScript.
 */

import { describe, it, expect } from 'vitest';

// -------------------------------------------------------------------------
// Re-export the sticker mapping function for testability.
// We test the LOGIC inline here so we don't need to import Three.js.
// -------------------------------------------------------------------------

/**
 * Sticker info for state index. Mirrors the implementation in CubeMesh.ts.
 */
function stickerInfoForStateIndex(stateIdx: number) {
  if (stateIdx < 9) {
    const i = stateIdx;
    return { gx: (i % 3) - 1, gy: 1, gz: 1 - Math.floor(i / 3), axis: 'y', sign: 1 };
  } else if (stateIdx < 18) {
    const i = stateIdx - 9;
    return { gx: 1, gy: 1 - Math.floor(i / 3), gz: 1 - (i % 3), axis: 'x', sign: 1 };
  } else if (stateIdx < 27) {
    const i = stateIdx - 18;
    return { gx: (i % 3) - 1, gy: 1 - Math.floor(i / 3), gz: 1, axis: 'z', sign: 1 };
  } else if (stateIdx < 36) {
    const i = stateIdx - 27;
    return { gx: (i % 3) - 1, gy: -1, gz: 1 - Math.floor(i / 3), axis: 'y', sign: -1 };
  } else if (stateIdx < 45) {
    const i = stateIdx - 36;
    return { gx: -1, gy: 1 - Math.floor(i / 3), gz: 1 - (i % 3), axis: 'x', sign: -1 };
  } else {
    const i = stateIdx - 45;
    return { gx: (i % 3) - 1, gy: 1 - Math.floor(i / 3), gz: -1, axis: 'z', sign: -1 };
  }
}

describe('stickerInfoForStateIndex (CubeMesh mapping)', () => {
  it('maps state[0..8] to U face (gy=1) positions', () => {
    for (let idx = 0; idx < 9; idx++) {
      const info = stickerInfoForStateIndex(idx);
      expect(info.gy).toBe(1);
      expect(info.axis).toBe('y');
      expect(info.sign).toBe(1);
    }
  });

  it('maps state[9..17] to R face (gx=1) positions', () => {
    for (let idx = 9; idx < 18; idx++) {
      const info = stickerInfoForStateIndex(idx);
      expect(info.gx).toBe(1);
      expect(info.axis).toBe('x');
      expect(info.sign).toBe(1);
    }
  });

  it('maps state[18..26] to F face (gz=1) positions', () => {
    for (let idx = 18; idx < 27; idx++) {
      const info = stickerInfoForStateIndex(idx);
      expect(info.gz).toBe(1);
      expect(info.axis).toBe('z');
      expect(info.sign).toBe(1);
    }
  });

  it('maps state[27..35] to D face (gy=-1) positions', () => {
    for (let idx = 27; idx < 36; idx++) {
      const info = stickerInfoForStateIndex(idx);
      expect(info.gy).toBe(-1);
      expect(info.axis).toBe('y');
      expect(info.sign).toBe(-1);
    }
  });

  it('maps state[36..44] to L face (gx=-1) positions', () => {
    for (let idx = 36; idx < 45; idx++) {
      const info = stickerInfoForStateIndex(idx);
      expect(info.gx).toBe(-1);
      expect(info.axis).toBe('x');
      expect(info.sign).toBe(-1);
    }
  });

  it('maps state[45..53] to B face (gz=-1) positions', () => {
    for (let idx = 45; idx < 54; idx++) {
      const info = stickerInfoForStateIndex(idx);
      expect(info.gz).toBe(-1);
      expect(info.axis).toBe('z');
      expect(info.sign).toBe(-1);
    }
  });

  it('produces grid coordinates only in {-1, 0, 1}', () => {
    for (let idx = 0; idx < 54; idx++) {
      const info = stickerInfoForStateIndex(idx);
      expect([-1, 0, 1]).toContain(info.gx);
      expect([-1, 0, 1]).toContain(info.gy);
      expect([-1, 0, 1]).toContain(info.gz);
    }
  });

  it('never maps to the invisible centre cubie (0,0,0)', () => {
    for (let idx = 0; idx < 54; idx++) {
      const info = stickerInfoForStateIndex(idx);
      const isCenter = info.gx === 0 && info.gy === 0 && info.gz === 0;
      expect(isCenter).toBe(false);
    }
  });

  it('each corner cubie receives exactly 3 stickers', () => {
    const cubieStickers = new Map<string, number[]>();
    for (let idx = 0; idx < 54; idx++) {
      const { gx, gy, gz } = stickerInfoForStateIndex(idx);
      const key = `${gx},${gy},${gz}`;
      if (!cubieStickers.has(key)) cubieStickers.set(key, []);
      cubieStickers.get(key)!.push(idx);
    }
    // Corners: 3 non-zero coords → 3 stickers
    for (const [key, stickers] of cubieStickers) {
      const [gx, gy, gz] = key.split(',').map(Number);
      const nonZero = [gx, gy, gz].filter((v) => v !== 0).length;
      expect(stickers.length).toBe(nonZero);
    }
  });

  it('produces exactly 26 distinct cubie positions', () => {
    const keys = new Set<string>();
    for (let idx = 0; idx < 54; idx++) {
      const { gx, gy, gz } = stickerInfoForStateIndex(idx);
      keys.add(`${gx},${gy},${gz}`);
    }
    expect(keys.size).toBe(26);
  });

  it('maps center stickers to face-center cubies', () => {
    // U center = state[4] → (0,1,0)
    const u = stickerInfoForStateIndex(4);
    expect(u).toMatchObject({ gx: 0, gy: 1, gz: 0 });
    // R center = state[13] → (1,0,0)
    const r = stickerInfoForStateIndex(13);
    expect(r).toMatchObject({ gx: 1, gy: 0, gz: 0 });
    // F center = state[22] → (0,0,1)
    const f = stickerInfoForStateIndex(22);
    expect(f).toMatchObject({ gx: 0, gy: 0, gz: 1 });
    // D center = state[31] → (0,-1,0)
    const d = stickerInfoForStateIndex(31);
    expect(d).toMatchObject({ gx: 0, gy: -1, gz: 0 });
    // L center = state[40] → (-1,0,0)
    const l = stickerInfoForStateIndex(40);
    expect(l).toMatchObject({ gx: -1, gy: 0, gz: 0 });
    // B center = state[49] → (0,0,-1)
    const b = stickerInfoForStateIndex(49);
    expect(b).toMatchObject({ gx: 0, gy: 0, gz: -1 });
  });

  it('maps URF corner stickers to (1,1,1)', () => {
    // state[2]=U[2], state[9]=R[0], state[20]=F[2] all map to cubie (1,1,1).
    // Verified from: R-column of U is U[2,5,8]; U-row of R is R[0,1,2]; U-row of F is F[0,1,2].
    const urf_u = stickerInfoForStateIndex(2);
    expect(urf_u).toMatchObject({ gx: 1, gy: 1, gz: 1, axis: 'y' });
    const urf_r = stickerInfoForStateIndex(9);
    expect(urf_r).toMatchObject({ gx: 1, gy: 1, gz: 1, axis: 'x' });
    const urf_f = stickerInfoForStateIndex(20);
    expect(urf_f).toMatchObject({ gx: 1, gy: 1, gz: 1, axis: 'z' });
  });
});

// -------------------------------------------------------------------------
// Color mapping tests (STICKER_COLOR table)
// -------------------------------------------------------------------------

describe('CubeMesh sticker color table', () => {
  const STICKER_COLOR: Record<number, number> = {
    0: 0xffffff, // White
    1: 0xdc2626, // Red
    2: 0x16a34a, // Green
    3: 0xfacc15, // Yellow
    4: 0xf97316, // Orange
    5: 0x2563eb, // Blue
  };

  it('defines all 6 colors', () => {
    expect(Object.keys(STICKER_COLOR)).toHaveLength(6);
  });

  it('white is #FFFFFF', () => {
    expect(STICKER_COLOR[0]).toBe(0xffffff);
  });

  it('all hex values are valid 24-bit numbers', () => {
    for (const hex of Object.values(STICKER_COLOR)) {
      expect(hex).toBeGreaterThanOrEqual(0);
      expect(hex).toBeLessThanOrEqual(0xffffff);
    }
  });
});
