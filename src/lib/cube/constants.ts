/**
 * Shared move classification sets used by both the move engine and notation parser.
 */

export const FACE_MOVES = new Set<string>(['R', 'U', 'F', 'L', 'D', 'B']);
export const SLICE_MOVES = new Set<string>(['M', 'E', 'S']);
export const ROTATIONS = new Set<string>(['x', 'y', 'z']);
