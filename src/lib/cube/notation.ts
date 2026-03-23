/**
 * Notation parser for Rubik's cube algorithm strings.
 *
 * Converts standard notation (e.g., "R U R' U'") into a Move[] array.
 * Supports face moves, slice moves, wide moves, and whole-cube rotations.
 *
 * See docs/technical/cube-engine.md "Notation Parser" section for full spec.
 */

import type { Move, MoveBase, Modifier } from './types.js';
import { FACE_MOVES, SLICE_MOVES, ROTATIONS } from './constants.js';

/** Lowercase face letters that denote wide moves (r = Rw, u = Uw, etc.) */
const LOWERCASE_WIDE: Record<string, string> = {
  r: 'R',
  u: 'U',
  f: 'F',
  l: 'L',
  d: 'D',
  b: 'B',
};

/**
 * Parse a single move token into a Move object.
 *
 * Examples: "R", "U'", "R2", "Rw", "r", "Uw'", "x2", "M'"
 */
function parseToken(token: string): Move {
  let pos = 0;
  let base: string;
  let wide = false;

  const first = token[pos];

  // Check for lowercase wide move shorthand (r, u, f, l, d, b)
  if (first in LOWERCASE_WIDE) {
    base = LOWERCASE_WIDE[first];
    wide = true;
    pos += 1;
  }
  // Check for uppercase face move potentially followed by 'w'
  else if (FACE_MOVES.has(first)) {
    base = first;
    pos += 1;
    if (pos < token.length && token[pos] === 'w') {
      wide = true;
      pos += 1;
    }
  }
  // Slice moves (M, E, S)
  else if (SLICE_MOVES.has(first)) {
    base = first;
    pos += 1;
  }
  // Rotations (x, y, z)
  else if (ROTATIONS.has(first)) {
    base = first;
    pos += 1;
  }
  // Unknown
  else {
    throw new Error(`Unknown move token: '${token}'`);
  }

  // Parse modifier from remaining characters
  const rest = token.slice(pos);
  let modifier: Modifier;

  if (rest === '') {
    modifier = '';
  } else if (rest === "'") {
    modifier = "'";
  } else if (rest === '2') {
    modifier = '2';
  } else if (rest === "2'" || rest === '2\u2019') {
    // R2' is equivalent to R2 (180 turn is its own inverse)
    modifier = '2';
  } else {
    throw new Error(`Unknown move token: '${token}'`);
  }

  return { base: base as MoveBase, modifier, wide };
}

/**
 * Parse a notation string into an array of Move objects.
 *
 * @param notation - Space-separated move tokens (e.g., "R U R' U'")
 * @returns Array of Move objects
 * @throws Error if any token is unrecognized
 */
export function parseNotation(notation: string): Move[] {
  const trimmed = notation.trim();
  if (trimmed === '') return [];

  const tokens = trimmed.split(/\s+/);
  return tokens.map(parseToken);
}
