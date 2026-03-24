/**
 * Cube engine type definitions.
 *
 * Defines move types, algorithm data model, and PLL permutation arrows.
 * See docs/technical/cube-engine.md and docs/technical/algorithm-data-model.md.
 */

// --- Cube State ---

/** The cube state: a 54-element array of color values, one per sticker. */
export type CubeState = number[];

// --- Move Types ---

export type FaceMove = 'R' | 'U' | 'F' | 'L' | 'D' | 'B';
export type SliceMove = 'M' | 'E' | 'S';
export type Rotation = 'x' | 'y' | 'z';
export type MoveBase = FaceMove | SliceMove | Rotation;

export type Modifier = '' | "'" | '2';

export interface Move {
  base: MoveBase;
  modifier: Modifier;
  wide: boolean;
}

// --- Algorithm Data Model ---

export interface BaseAlgorithm {
  id: string;
  name: string;
  notation: string;
  altNotations?: string[];
  group: string;
  probability: string;
  /** True if this case is part of the 2-look OLL/PLL learning path. */
  isTwoLook: boolean;
}

export interface OllAlgorithm extends BaseAlgorithm {
  category: 'oll';
  pattern: boolean[];
  /** Common nicknames for this OLL case (e.g. "Sune", "Anti-Sune"). */
  nicknames?: string[];
}

export interface PllAlgorithm extends BaseAlgorithm {
  category: 'pll';
  pattern: PermutationArrow[];
  /** Engine-derived 8-element permutation: what the algorithm does to each slot. */
  permutation: number[];
}

export type Algorithm = OllAlgorithm | PllAlgorithm;

// --- PLL Pattern Types ---

/** Positions are the 8 edge/corner slots around the top face (center is fixed) */
export type PiecePosition = 0 | 1 | 2 | 3 | 5 | 6 | 7 | 8;

export interface PermutationArrow {
  from: PiecePosition;
  to: PiecePosition;
}
