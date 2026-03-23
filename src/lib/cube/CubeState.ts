/**
 * Cube state model.
 *
 * The cube state is an immutable number[54] array where each element
 * represents one sticker (a Color enum value 0-5).
 *
 * See docs/technical/cube-engine.md for the sticker index layout.
 */

import { Color } from './colors.js';
import type { CubeState } from './types.js';

/**
 * Returns a solved cube state: number[54] with each face set to its color.
 *
 * Face layout:
 * - U (0-8):  White (0)
 * - R (9-17): Red (1)
 * - F (18-26): Green (2)
 * - D (27-35): Yellow (3)
 * - L (36-44): Orange (4)
 * - B (45-53): Blue (5)
 */
export function solved(): CubeState {
  return [
    // U face (0-8): White
    Color.White,
    Color.White,
    Color.White,
    Color.White,
    Color.White,
    Color.White,
    Color.White,
    Color.White,
    Color.White,
    // R face (9-17): Red
    Color.Red,
    Color.Red,
    Color.Red,
    Color.Red,
    Color.Red,
    Color.Red,
    Color.Red,
    Color.Red,
    Color.Red,
    // F face (18-26): Green
    Color.Green,
    Color.Green,
    Color.Green,
    Color.Green,
    Color.Green,
    Color.Green,
    Color.Green,
    Color.Green,
    Color.Green,
    // D face (27-35): Yellow
    Color.Yellow,
    Color.Yellow,
    Color.Yellow,
    Color.Yellow,
    Color.Yellow,
    Color.Yellow,
    Color.Yellow,
    Color.Yellow,
    Color.Yellow,
    // L face (36-44): Orange
    Color.Orange,
    Color.Orange,
    Color.Orange,
    Color.Orange,
    Color.Orange,
    Color.Orange,
    Color.Orange,
    Color.Orange,
    Color.Orange,
    // B face (45-53): Blue
    Color.Blue,
    Color.Blue,
    Color.Blue,
    Color.Blue,
    Color.Blue,
    Color.Blue,
    Color.Blue,
    Color.Blue,
    Color.Blue,
  ];
}
