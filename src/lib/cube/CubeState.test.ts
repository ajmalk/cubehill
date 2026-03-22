import { describe, it, expect } from 'vitest';
import { solved } from './CubeState.js';
import { Color } from './colors.js';

describe('solved()', () => {
  it('returns an array of length 54', () => {
    const state = solved();
    expect(state).toHaveLength(54);
  });

  it('has 9 stickers of each color', () => {
    const state = solved();
    const counts = new Array(6).fill(0);
    for (const value of state) {
      counts[value]++;
    }
    for (let c = 0; c <= 5; c++) {
      expect(counts[c]).toBe(9);
    }
  });

  it('has correct colors per face', () => {
    const state = solved();
    // U face (0-8): White
    for (let i = 0; i <= 8; i++) expect(state[i]).toBe(Color.White);
    // R face (9-17): Red
    for (let i = 9; i <= 17; i++) expect(state[i]).toBe(Color.Red);
    // F face (18-26): Green
    for (let i = 18; i <= 26; i++) expect(state[i]).toBe(Color.Green);
    // D face (27-35): Yellow
    for (let i = 27; i <= 35; i++) expect(state[i]).toBe(Color.Yellow);
    // L face (36-44): Orange
    for (let i = 36; i <= 44; i++) expect(state[i]).toBe(Color.Orange);
    // B face (45-53): Blue
    for (let i = 45; i <= 53; i++) expect(state[i]).toBe(Color.Blue);
  });

  it('returns a new array each time (immutability)', () => {
    const a = solved();
    const b = solved();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});
