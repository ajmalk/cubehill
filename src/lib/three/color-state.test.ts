/**
 * color-state.test.ts
 *
 * Root cause investigation for P0 bug: "cube colors reset/swap back after each
 * move animation completes."
 *
 * FINDINGS:
 *
 * 1. The FACE_ROTATION table in CubeAnimator.ts (cwSign values) is CORRECT.
 *    All six faces use the right rotation direction for CW moves.
 *
 * 2. The between-face cycles in moves.ts (R_CYCLES, U_CYCLES, F_CYCLES, etc.)
 *    use WRONG sticker indices. The cycles produce correct colors on a SOLVED
 *    cube (because all stickers on a face have the same color), but on a
 *    scrambled cube they permute stickers to the wrong positions within each
 *    column/row. This creates a mismatch between:
 *    - The physical rotation shown by the animation (correct)
 *    - The state permutation used for recoloring (wrong sticker positions)
 *
 *    Specifically, the R_CYCLES cycle [2, 20, 29, 47] should be [2, 47, 35, 26]
 *    (grouping stickers by the cubie they rotate through, not mixing stickers
 *    from different cubies). The U_CYCLES have a similar issue AND additionally
 *    reference stickers at gy=-1 (bottom layer) instead of gy=1 (top layer).
 *
 * 3. All existing tests pass because they only use solved state where same-face
 *    stickers are indistinguishable. The R direction test checks colors (Green,
 *    Yellow, Blue, White) which are correct, but doesn't verify which SPECIFIC
 *    sticker within a column goes to which position.
 *
 * WHY THIS CAUSES "SNAP BACK":
 *   After the first move from the loadAlgorithm starting state (which is
 *   non-solved), the animation rotates cubies correctly. But updateColors()
 *   repaints from a state where stickers within each column are in the wrong
 *   order. The colors don't match what the rotation showed, so they appear
 *   to "snap back" or swap.
 *
 * FIX NEEDED:
 *   Rewrite all face cycles in src/lib/cube/moves.ts to use physically correct
 *   sticker indices. The cycles must group stickers that are on the SAME cubie
 *   and follow the cubie through its rotation path. Use the stickerInfoForStateIndex
 *   mapping and the FACE_ROTATION angles to compute correct cycles programmatically.
 */

import { describe, it, expect } from 'vitest';
import { applyMove, applyAlgorithm, invertAlgorithm } from '$lib/cube/moves.js';
import { solved } from '$lib/cube/CubeState.js';
import type { Move, FaceMove } from '$lib/cube/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function move(base: Move['base'], modifier: Move['modifier'] = '', wide = false): Move {
  return { base, modifier, wide };
}

/**
 * The FACE_ROTATION table from CubeAnimator.ts.
 * These signs ARE correct for CW moves (verified by physical analysis).
 */
const FACE_ROTATION: Record<FaceMove, { axis: 'x' | 'y' | 'z'; cwSign: number }> = {
  U: { axis: 'y', cwSign: -1 },
  D: { axis: 'y', cwSign: 1 },
  R: { axis: 'x', cwSign: -1 },
  L: { axis: 'x', cwSign: 1 },
  F: { axis: 'z', cwSign: -1 },
  B: { axis: 'z', cwSign: 1 },
};

/**
 * Sticker-to-cubie mapping from CubeMesh.ts.
 */
interface StickerInfo {
  gx: number;
  gy: number;
  gz: number;
  axis: 'x' | 'y' | 'z';
  sign: number;
}

function stickerInfoForStateIndex(stateIdx: number): StickerInfo {
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

/**
 * Apply a 3D rotation to a position or direction vector.
 * Uses exact integer math (angles are always multiples of 90 degrees).
 */
function rotate(
  pos: { x: number; y: number; z: number },
  rotAxis: 'x' | 'y' | 'z',
  angleDeg: number,
): { x: number; y: number; z: number } {
  const angle = (angleDeg * Math.PI) / 180;
  const c = Math.round(Math.cos(angle));
  const s = Math.round(Math.sin(angle));

  switch (rotAxis) {
    case 'x':
      return { x: pos.x, y: c * pos.y - s * pos.z, z: s * pos.y + c * pos.z };
    case 'y':
      return { x: c * pos.x + s * pos.z, y: pos.y, z: -s * pos.x + c * pos.z };
    case 'z':
      return { x: c * pos.x - s * pos.y, y: s * pos.x + c * pos.y, z: pos.z };
  }
}

/**
 * Check that the 3D animation rotation and state permutation agree for a face CW move.
 *
 * For each sticker on the face:
 * 1. Compute where the 3D rotation moves the cubie + sticker normal.
 * 2. Find the state index at the destination.
 * 3. Verify the state permutation placed the correct value there.
 *
 * Returns a list of mismatches (empty = consistent).
 */
function checkRotationConsistency(face: FaceMove): string[] {
  const errors: string[] = [];
  const { axis, cwSign } = FACE_ROTATION[face];
  const angleDeg = cwSign * 90;

  const labeledState = Array.from({ length: 54 }, (_, i) => i);
  const postMove = applyMove(labeledState, move(face));

  const faceFilter = (info: StickerInfo): boolean => {
    switch (face) {
      case 'U': return info.gy === 1;
      case 'D': return info.gy === -1;
      case 'R': return info.gx === 1;
      case 'L': return info.gx === -1;
      case 'F': return info.gz === 1;
      case 'B': return info.gz === -1;
    }
  };

  // Build reverse lookup: (position + normal) -> state index
  const posNormalToIndex = new Map<string, number>();
  for (let idx = 0; idx < 54; idx++) {
    const info = stickerInfoForStateIndex(idx);
    const key = `${info.gx},${info.gy},${info.gz},${info.axis},${info.sign}`;
    posNormalToIndex.set(key, idx);
  }

  for (let srcIdx = 0; srcIdx < 54; srcIdx++) {
    const srcInfo = stickerInfoForStateIndex(srcIdx);
    if (!faceFilter(srcInfo)) continue;

    const newPos = rotate({ x: srcInfo.gx, y: srcInfo.gy, z: srcInfo.gz }, axis, angleDeg);

    const normalVec = {
      x: srcInfo.axis === 'x' ? srcInfo.sign : 0,
      y: srcInfo.axis === 'y' ? srcInfo.sign : 0,
      z: srcInfo.axis === 'z' ? srcInfo.sign : 0,
    };
    const newNormal = rotate(normalVec, axis, angleDeg);

    let newAxis: 'x' | 'y' | 'z';
    let newSign: number;
    if (newNormal.x !== 0) { newAxis = 'x'; newSign = newNormal.x; }
    else if (newNormal.y !== 0) { newAxis = 'y'; newSign = newNormal.y; }
    else { newAxis = 'z'; newSign = newNormal.z; }

    const destKey = `${newPos.x},${newPos.y},${newPos.z},${newAxis},${newSign}`;
    const destIdx = posNormalToIndex.get(destKey);

    if (destIdx === undefined) {
      errors.push(`Sticker ${srcIdx}: no state index at rotated position`);
      continue;
    }

    if (postMove[destIdx] !== srcIdx) {
      errors.push(
        `idx ${srcIdx} (${srcInfo.axis}${srcInfo.sign > 0 ? '+' : '-'} at ` +
        `${srcInfo.gx},${srcInfo.gy},${srcInfo.gz}) -> ` +
        `idx ${destIdx}: expected val ${srcIdx}, got ${postMove[destIdx]}`,
      );
    }
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Animation vs. State consistency (P0 bug investigation)', () => {
  // -----------------------------------------------------------------------
  // BUG 1: Animation direction vs. state permutation mismatch
  // -----------------------------------------------------------------------

  describe('animation-state mismatch on all faces (THE BUG)', () => {
    const faces: FaceMove[] = ['R', 'U', 'F', 'L', 'D', 'B'];

    for (const face of faces) {
      it(`${face} CW: 3D rotation and state permutation DISAGREE`, () => {
        const errors = checkRotationConsistency(face);
        // This test EXPECTS mismatches — it documents the bug.
        // When cycles are fixed, change to: expect(errors.length).toBe(0)
        expect(errors.length).toBeGreaterThan(0);
      });
    }
  });

  // -----------------------------------------------------------------------
  // BUG 2: Cycles reference wrong sticker indices
  // -----------------------------------------------------------------------

  describe('U move permutes stickers outside top layer (wrong cycle indices)', () => {
    it('U CW should only move stickers at gy=1', () => {
      const labeled = Array.from({ length: 54 }, (_, i) => i);
      const result = applyMove(labeled, move('U'));

      const wrongLayer: string[] = [];
      for (let i = 0; i < 54; i++) {
        if (result[i] === i) continue; // not moved
        const info = stickerInfoForStateIndex(i);
        if (info.gy !== 1) {
          wrongLayer.push(`idx ${i} at (${info.gx},${info.gy},${info.gz}) gy=${info.gy}`);
        }
      }

      // BUG: U touches indices 42,43,44 (L bottom row, gy=-1) and 51,52,53
      // (B bottom row, gy=-1). These should not be affected by a U move.
      expect(wrongLayer.length).toBeGreaterThan(0);
    });
  });

  describe('R CW on labeled state: wrong sticker positions within column', () => {
    it('R CW moves stickers to wrong positions (masked on solved state)', () => {
      const labeled = Array.from({ length: 54 }, (_, i) => i);
      const result = applyMove(labeled, move('R'));

      // Physical R CW (-90 deg X): cubie at UFR (1,1,1) -> UBR (1,1,-1).
      //   U sticker (idx 2, +y normal) -> B at UBR (-z normal) = idx 47
      //   F sticker (idx 20, +z normal) -> U at UBR (+y normal) = idx 8
      //
      // But the code's R_CYCLES cycle [2,20,29,47] with applyCyclesReverse gives:
      //   Value from idx 20 goes to idx 2 (NOT to idx 8)
      //   Value from idx 2 goes to idx 47 (correct)
      //
      // On solved state: idx 2 and idx 8 are both White, idx 20 and idx 26 are
      // both Green, so the error is invisible. On non-solved state, it produces
      // wrong colors.

      // Expected (physical): idx 20's value should go to idx 8
      expect(result[8]).not.toBe(20); // BUG: idx 8 gets value 26 instead of 20

      // Expected (physical): idx 2's value should go to idx 47
      expect(result[47]).toBe(2); // This one happens to be correct
    });
  });

  // -----------------------------------------------------------------------
  // BUG 3: F CW touches stickers outside the F layer
  // -----------------------------------------------------------------------

  describe('F move scope', () => {
    it('F CW should only move stickers at gz=1', () => {
      const labeled = Array.from({ length: 54 }, (_, i) => i);
      const result = applyMove(labeled, move('F'));

      const wrongLayer: string[] = [];
      for (let i = 0; i < 54; i++) {
        if (result[i] === i) continue;
        const info = stickerInfoForStateIndex(i);
        if (info.gz !== 1) {
          wrongLayer.push(`idx ${i} at (${info.gx},${info.gy},${info.gz}) gz=${info.gz}`);
        }
      }

      // If F move touches stickers outside gz=1, its cycles are wrong too.
      // Expect this to pass if F_CYCLES are correct, fail if wrong.
      if (wrongLayer.length > 0) {
        console.warn('F touches stickers outside gz=1:', wrongLayer.join(', '));
      }
      // BUG CONFIRMED: F cycles reference stickers at gz=-1 (back layer).
      // Indices 6,7,8 (U back row), 11,14,17 (R back column), 38,41,44 (L back column)
      // are all at gz=-1 but F should only touch gz=1.
      expect(wrongLayer.length).toBeGreaterThan(0);
    });
  });

  // -----------------------------------------------------------------------
  // Existing tests that PASS (by coincidence on solved state)
  // -----------------------------------------------------------------------

  describe('R direction on solved state (passes despite wrong cycles)', () => {
    it('R CW: U right column gets Green from F right column', () => {
      // This test passes because on solved state, all F stickers are Green.
      // It does NOT verify which specific F sticker goes to which U position.
      const state = solved();
      const result = applyMove(state, move('R'));
      expect(result[2]).toBe(2); // Green
      expect(result[5]).toBe(2);
      expect(result[8]).toBe(2);
    });
  });

  describe('loadAlgorithm inverse-then-forward returns solved', () => {
    it('applying algorithm to inverted starting state returns solved', () => {
      // This passes because inverse + forward = identity regardless of
      // whether the individual permutation is physically correct.
      const parsed = [move('R'), move('U'), move('R', "'"), move('U', "'")];
      const inverted = invertAlgorithm(parsed);
      const start = applyAlgorithm(solved(), inverted);
      const result = applyAlgorithm(start, parsed);
      expect(result).toEqual(solved());
    });
  });

  // -----------------------------------------------------------------------
  // Post-fix validation tests (will pass AFTER cycles are corrected)
  // -----------------------------------------------------------------------

  describe('POST-FIX: animation-state consistency (skip until fix)', () => {
    const faces: FaceMove[] = ['R', 'U', 'F', 'L', 'D', 'B'];

    for (const face of faces) {
      it.skip(`${face} CW: 3D rotation matches state permutation`, () => {
        const errors = checkRotationConsistency(face);
        expect(errors.length).toBe(0);
      });
    }
  });
});
