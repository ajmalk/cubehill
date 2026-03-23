/**
 * Move definitions and application logic.
 *
 * Each move is defined as a set of 4-cycles (permutation cycles of length 4).
 * Clockwise: a -> b -> c -> d -> a
 * Counter-clockwise (prime): a -> d -> c -> b -> a
 * Double: apply clockwise twice
 *
 * See docs/technical/cube-engine.md for the sticker index layout and cycle definitions.
 */

import type { Move, FaceMove, SliceMove, Rotation, CubeState } from './types.js';
import { FACE_MOVES, SLICE_MOVES, ROTATIONS as ROTATIONS_SET } from './constants.js';

type Cycle = [number, number, number, number];

// --- Cycle Application ---

/** Apply 4-cycles forward (clockwise): a -> b -> c -> d -> a */
function applyCyclesForward(state: number[], cycles: Cycle[]): number[] {
  const next = [...state];
  for (const [a, b, c, d] of cycles) {
    next[b] = state[a];
    next[c] = state[b];
    next[d] = state[c];
    next[a] = state[d];
  }
  return next;
}

/** Apply 4-cycles in reverse (counter-clockwise): a -> d -> c -> b -> a */
function applyCyclesReverse(state: number[], cycles: Cycle[]): number[] {
  const next = [...state];
  for (const [a, b, c, d] of cycles) {
    next[d] = state[a];
    next[c] = state[d];
    next[b] = state[c];
    next[a] = state[b];
  }
  return next;
}

/** Apply cycles twice (double move). */
function applyCyclesDouble(state: number[], cycles: Cycle[]): number[] {
  return applyCyclesForward(applyCyclesForward(state, cycles), cycles);
}

/** Apply cycles with the given modifier. */
function applyCyclesWithModifier(
  state: number[],
  cycles: Cycle[],
  modifier: '' | "'" | '2',
): number[] {
  switch (modifier) {
    case '':
      return applyCyclesReverse(state, cycles);
    case "'":
      return applyCyclesForward(state, cycles);
    case '2':
      return applyCyclesDouble(state, cycles);
  }
}

// --- Face Move Cycles ---
// Each array of 4-cycles defines a clockwise face turn.
// The first 3 cycles move stickers around the layer (between adjacent faces).
// The last 2 cycles rotate the face itself (corners and edges).

const R_CYCLES: Cycle[] = [
  [2, 20, 29, 47],
  [5, 23, 32, 50],
  [8, 26, 35, 53],
  [9, 11, 17, 15],
  [10, 14, 16, 12],
];

const U_CYCLES: Cycle[] = [
  [18, 9, 53, 44],
  [19, 10, 52, 43],
  [20, 11, 51, 42],
  [0, 2, 8, 6],
  [1, 5, 7, 3],
];

const F_CYCLES: Cycle[] = [
  [6, 38, 29, 17],
  [7, 41, 28, 14],
  [8, 44, 27, 11],
  [18, 20, 26, 24],
  [19, 23, 25, 21],
];

const L_CYCLES: Cycle[] = [
  [0, 45, 27, 18],
  [3, 48, 30, 21],
  [6, 51, 33, 24],
  [36, 38, 44, 42],
  [37, 41, 43, 39],
];

const D_CYCLES: Cycle[] = [
  [24, 15, 47, 42],
  [25, 16, 46, 43],
  [26, 17, 45, 44],
  [27, 29, 35, 33],
  [28, 32, 34, 30],
];

const B_CYCLES: Cycle[] = [
  [2, 9, 33, 44],
  [1, 12, 34, 41],
  [0, 15, 35, 38],
  [45, 47, 53, 51],
  [46, 50, 52, 48],
];

const FACE_CYCLES: Record<FaceMove, Cycle[]> = {
  R: R_CYCLES,
  U: U_CYCLES,
  F: F_CYCLES,
  L: L_CYCLES,
  D: D_CYCLES,
  B: B_CYCLES,
};

// --- Slice Move Cycles ---
// M: Middle layer between L and R, follows L direction
// E: Equatorial layer between U and D, follows D direction
// S: Standing layer between F and B, follows F direction

const M_CYCLES: Cycle[] = [
  [1, 46, 28, 19],
  [4, 49, 31, 22],
  [7, 52, 34, 25],
];

const E_CYCLES: Cycle[] = [
  [21, 12, 50, 39],
  [22, 13, 49, 40],
  [23, 14, 48, 41],
];

const S_CYCLES: Cycle[] = [
  [3, 37, 32, 16],
  [4, 40, 31, 13],
  [5, 43, 30, 10],
];

const SLICE_CYCLES: Record<SliceMove, Cycle[]> = {
  M: M_CYCLES,
  E: E_CYCLES,
  S: S_CYCLES,
};

// --- Whole-Cube Rotations ---
// Rotation cycles are computed from face + slice move compositions.
// We compute them at module load time by applying the composed moves to an
// identity permutation and extracting the resulting 4-cycles.

/**
 * Extract 4-cycles from a permutation array.
 * The permutation maps index i to perm[i].
 */
function extractCycles(perm: number[]): Cycle[] {
  const visited = new Set<number>();
  const cycles: Cycle[] = [];
  for (let i = 0; i < perm.length; i++) {
    if (visited.has(i) || perm[i] === i) continue;
    const cycle: number[] = [];
    let j = i;
    while (!visited.has(j)) {
      visited.add(j);
      cycle.push(j);
      j = perm[j];
    }
    if (cycle.length === 4) {
      cycles.push(cycle as Cycle);
    }
    // 2-cycles don't appear in quarter-turn rotations; skip any other cycle lengths.
  }
  return cycles;
}

/**
 * Compute the permutation that results from applying the given face and slice
 * moves in sequence. Returns an array where result[i] = the index that moves
 * to position i.
 */
function computeRotationPerm(moves: Array<{ cycles: Cycle[]; reverse: boolean }>): number[] {
  // Start with identity
  let state = Array.from({ length: 54 }, (_, i) => i);
  for (const { cycles, reverse } of moves) {
    state = reverse ? applyCyclesReverse(state, cycles) : applyCyclesForward(state, cycles);
  }
  // Applying cycles to an identity array gives the inverse permutation:
  // state[b] = a means the value from position a moved to position b.
  // Invert to get perm[a] = b (where each value ends up).
  const perm = new Array(54);
  for (let b = 0; b < 54; b++) {
    perm[state[b]] = b;
  }
  return perm;
}

// x = R + M' + L' (rotate whole cube in R direction)
const X_PERM = computeRotationPerm([
  { cycles: R_CYCLES, reverse: false },
  { cycles: M_CYCLES, reverse: true },
  { cycles: L_CYCLES, reverse: true },
]);

// y = U + E' + D' (rotate whole cube in U direction)
const Y_PERM = computeRotationPerm([
  { cycles: U_CYCLES, reverse: false },
  { cycles: E_CYCLES, reverse: true },
  { cycles: D_CYCLES, reverse: true },
]);

// z = F + S + B' (rotate whole cube in F direction)
const Z_PERM = computeRotationPerm([
  { cycles: F_CYCLES, reverse: false },
  { cycles: S_CYCLES, reverse: false },
  { cycles: B_CYCLES, reverse: true },
]);

const X_CYCLES_COMPUTED = extractCycles(X_PERM);
const Y_CYCLES_COMPUTED = extractCycles(Y_PERM);
const Z_CYCLES_COMPUTED = extractCycles(Z_PERM);

const ROTATION_CYCLES: Record<Rotation, Cycle[]> = {
  x: X_CYCLES_COMPUTED,
  y: Y_CYCLES_COMPUTED,
  z: Z_CYCLES_COMPUTED,
};

// --- Wide Move Logic ---
// Wide moves = face move + adjacent slice move
// Rw = R + M', Lw = L + M, Uw = U + E', Dw = D + E, Fw = F + S, Bw = B + S'

interface SliceComplement {
  slice: SliceMove;
  invertSlice: boolean; // true means the slice goes in the opposite direction of the face
}

const WIDE_SLICE_MAP: Record<FaceMove, SliceComplement> = {
  R: { slice: 'M', invertSlice: true }, // Rw = R + M'
  L: { slice: 'M', invertSlice: false }, // Lw = L + M
  U: { slice: 'E', invertSlice: true }, // Uw = U + E'
  D: { slice: 'E', invertSlice: false }, // Dw = D + E
  F: { slice: 'S', invertSlice: false }, // Fw = F + S
  B: { slice: 'S', invertSlice: true }, // Bw = B + S'
};

// --- Public API ---

/**
 * Apply a single move to a cube state. Returns a new state array.
 */
export function applyMove(state: CubeState, move: Move): CubeState {
  const { base, modifier, wide } = move;

  // Handle wide moves: face move + slice move
  if (wide && FACE_MOVES.has(base)) {
    const faceBase = base as FaceMove;
    const faceCycles = FACE_CYCLES[faceBase];
    let result = applyCyclesWithModifier(state, faceCycles, modifier);

    const { slice, invertSlice } = WIDE_SLICE_MAP[faceBase];
    const sliceCycles = SLICE_CYCLES[slice];

    // Determine slice modifier: if invertSlice, flip the direction
    let sliceModifier = modifier;
    if (invertSlice) {
      if (modifier === '') sliceModifier = "'";
      else if (modifier === "'") sliceModifier = '';
      // '2' stays '2' (double is its own inverse)
    }

    result = applyCyclesWithModifier(result, sliceCycles, sliceModifier);
    return result;
  }

  // Face moves
  if (FACE_MOVES.has(base)) {
    return applyCyclesWithModifier(state, FACE_CYCLES[base as FaceMove], modifier);
  }

  // Slice moves
  if (SLICE_MOVES.has(base)) {
    return applyCyclesWithModifier(state, SLICE_CYCLES[base as SliceMove], modifier);
  }

  // Rotations
  if (ROTATIONS_SET.has(base)) {
    return applyCyclesWithModifier(state, ROTATION_CYCLES[base as Rotation], modifier);
  }

  throw new Error(`Unknown move base: '${base}'`);
}

/**
 * Apply a sequence of moves to a cube state. Returns a new state array.
 */
export function applyAlgorithm(state: CubeState, moves: Move[]): CubeState {
  let current = state;
  for (const move of moves) {
    current = applyMove(current, move);
  }
  return current;
}

/**
 * Get the inverse of a move sequence.
 *
 * Reverses the order and inverts each move:
 * - Clockwise ('') becomes counter-clockwise ("'")
 * - Counter-clockwise ("'") becomes clockwise ('')
 * - Double ('2') stays double ('2')
 */
export function invertAlgorithm(moves: Move[]): Move[] {
  return moves
    .slice()
    .reverse()
    .map((move) => ({
      ...move,
      modifier: invertModifier(move.modifier),
    }));
}

function invertModifier(modifier: '' | "'" | '2'): '' | "'" | '2' {
  switch (modifier) {
    case '':
      return "'";
    case "'":
      return '';
    case '2':
      return '2';
  }
}
