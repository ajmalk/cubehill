import { describe, it, expect } from 'vitest';
import { Color, COLOR_HEX, COLOR_CSS, FACE_INDICES, FACE_COLOR } from './colors.js';

describe('Color enum', () => {
  it('has 6 colors with values 0-5', () => {
    expect(Color.White).toBe(0);
    expect(Color.Red).toBe(1);
    expect(Color.Green).toBe(2);
    expect(Color.Yellow).toBe(3);
    expect(Color.Orange).toBe(4);
    expect(Color.Blue).toBe(5);
  });
});

describe('COLOR_HEX', () => {
  it('has a hex value for every color', () => {
    for (let c = 0; c <= 5; c++) {
      expect(COLOR_HEX[c as Color]).toBeDefined();
      expect(typeof COLOR_HEX[c as Color]).toBe('number');
    }
  });
});

describe('COLOR_CSS', () => {
  it('has a CSS hex string for every color', () => {
    for (let c = 0; c <= 5; c++) {
      expect(COLOR_CSS[c as Color]).toBeDefined();
      expect(COLOR_CSS[c as Color]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe('FACE_INDICES', () => {
  it('covers all 54 sticker positions without overlap', () => {
    const faces = ['U', 'R', 'F', 'D', 'L', 'B'] as const;
    const allIndices = new Set<number>();
    for (const face of faces) {
      const { start, end } = FACE_INDICES[face];
      expect(end - start).toBe(8); // 9 stickers per face (inclusive range)
      for (let i = start; i <= end; i++) {
        expect(allIndices.has(i)).toBe(false);
        allIndices.add(i);
      }
    }
    expect(allIndices.size).toBe(54);
  });
});

describe('FACE_COLOR', () => {
  it('maps each face to its solved color', () => {
    expect(FACE_COLOR['U']).toBe(Color.White);
    expect(FACE_COLOR['R']).toBe(Color.Red);
    expect(FACE_COLOR['F']).toBe(Color.Green);
    expect(FACE_COLOR['D']).toBe(Color.Yellow);
    expect(FACE_COLOR['L']).toBe(Color.Orange);
    expect(FACE_COLOR['B']).toBe(Color.Blue);
  });
});
