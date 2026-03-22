/**
 * Color definitions for the cube.
 *
 * Standard Western color scheme: White on top, Green facing the solver.
 * Numeric values match sticker values in the number[54] state array.
 */

export enum Color {
  White = 0,
  Red = 1,
  Green = 2,
  Yellow = 3,
  Orange = 4,
  Blue = 5,
}

/** Hex color constants for Three.js sticker rendering. */
export const COLOR_HEX: Record<Color, number> = {
  [Color.White]: 0xffffff,
  [Color.Red]: 0xc41e3a,
  [Color.Green]: 0x009e60,
  [Color.Yellow]: 0xffd500,
  [Color.Orange]: 0xff5800,
  [Color.Blue]: 0x0051ba,
};

/** CSS hex string constants for 2D rendering contexts. */
export const COLOR_CSS: Record<Color, string> = {
  [Color.White]: '#ffffff',
  [Color.Red]: '#c41e3a',
  [Color.Green]: '#009e60',
  [Color.Yellow]: '#ffd500',
  [Color.Orange]: '#ff5800',
  [Color.Blue]: '#0051ba',
};

/** Face index ranges in the number[54] state array. */
export const FACE_INDICES = {
  U: { start: 0, end: 8 },
  R: { start: 9, end: 17 },
  F: { start: 18, end: 26 },
  D: { start: 27, end: 35 },
  L: { start: 36, end: 44 },
  B: { start: 45, end: 53 },
} as const;

/** Maps each face to its solved color. */
export const FACE_COLOR: Record<string, Color> = {
  U: Color.White,
  R: Color.Red,
  F: Color.Green,
  D: Color.Yellow,
  L: Color.Orange,
  B: Color.Blue,
};
