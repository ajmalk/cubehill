/**
 * Tests for the notation parser.
 *
 * Covers face moves, prime/double modifiers, slice moves, wide moves,
 * rotations, edge cases, and error handling.
 */

import { describe, it, expect } from 'vitest';
import { parseNotation } from './notation.js';
import type { Move } from './types.js';

/** Helper to create a Move object with defaults */
function m(base: Move['base'], modifier: Move['modifier'] = '', wide = false): Move {
  return { base, modifier, wide };
}

describe('parseNotation', () => {
  describe('basic face moves', () => {
    it('parses a single clockwise face move', () => {
      expect(parseNotation('R')).toEqual([m('R')]);
    });

    it('parses all six face moves', () => {
      expect(parseNotation('R U F L D B')).toEqual([
        m('R'),
        m('U'),
        m('F'),
        m('L'),
        m('D'),
        m('B'),
      ]);
    });
  });

  describe('prime moves', () => {
    it("parses R'", () => {
      expect(parseNotation("R'")).toEqual([m('R', "'")]);
    });

    it("parses U'", () => {
      expect(parseNotation("U'")).toEqual([m('U', "'")]);
    });

    it("parses all face primes: R' U' F' L' D' B'", () => {
      expect(parseNotation("R' U' F' L' D' B'")).toEqual([
        m('R', "'"),
        m('U', "'"),
        m('F', "'"),
        m('L', "'"),
        m('D', "'"),
        m('B', "'"),
      ]);
    });
  });

  describe('double moves', () => {
    it('parses R2', () => {
      expect(parseNotation('R2')).toEqual([m('R', '2')]);
    });

    it('parses U2', () => {
      expect(parseNotation('U2')).toEqual([m('U', '2')]);
    });
  });

  describe('full algorithms', () => {
    it("parses R U R' U'", () => {
      expect(parseNotation("R U R' U'")).toEqual([m('R'), m('U'), m('R', "'"), m('U', "'")]);
    });

    it("parses a T-perm: R U R' U' R' F R2 U' R' U' R U R' F'", () => {
      expect(parseNotation("R U R' U' R' F R2 U' R' U' R U R' F'")).toEqual([
        m('R'),
        m('U'),
        m('R', "'"),
        m('U', "'"),
        m('R', "'"),
        m('F'),
        m('R', '2'),
        m('U', "'"),
        m('R', "'"),
        m('U', "'"),
        m('R'),
        m('U'),
        m('R', "'"),
        m('F', "'"),
      ]);
    });
  });

  describe('slice moves', () => {
    it('parses M', () => {
      expect(parseNotation('M')).toEqual([m('M')]);
    });

    it('parses E and S', () => {
      expect(parseNotation('E S')).toEqual([m('E'), m('S')]);
    });

    it("parses slice moves with modifiers: M' E2 S'", () => {
      expect(parseNotation("M' E2 S'")).toEqual([m('M', "'"), m('E', '2'), m('S', "'")]);
    });
  });

  describe('wide moves', () => {
    it('parses Rw as wide R', () => {
      expect(parseNotation('Rw')).toEqual([m('R', '', true)]);
    });

    it("parses Uw' as wide U prime", () => {
      expect(parseNotation("Uw'")).toEqual([m('U', "'", true)]);
    });

    it('parses Fw2 as wide F double', () => {
      expect(parseNotation('Fw2')).toEqual([m('F', '2', true)]);
    });

    it('parses lowercase r as wide R', () => {
      expect(parseNotation('r')).toEqual([m('R', '', true)]);
    });

    it('parses lowercase u as wide U', () => {
      expect(parseNotation('u')).toEqual([m('U', '', true)]);
    });

    it("parses lowercase r' as wide R prime", () => {
      expect(parseNotation("r'")).toEqual([m('R', "'", true)]);
    });

    it('parses lowercase l2 as wide L double', () => {
      expect(parseNotation('l2')).toEqual([m('L', '2', true)]);
    });

    it('parses all lowercase wide moves', () => {
      expect(parseNotation('r u f l d b')).toEqual([
        m('R', '', true),
        m('U', '', true),
        m('F', '', true),
        m('L', '', true),
        m('D', '', true),
        m('B', '', true),
      ]);
    });
  });

  describe('rotations', () => {
    it('parses x', () => {
      expect(parseNotation('x')).toEqual([m('x')]);
    });

    it('parses y and z', () => {
      expect(parseNotation('y z')).toEqual([m('y'), m('z')]);
    });

    it("parses x' y2 z'", () => {
      expect(parseNotation("x' y2 z'")).toEqual([m('x', "'"), m('y', '2'), m('z', "'")]);
    });
  });

  describe('edge cases', () => {
    it('returns empty array for empty string', () => {
      expect(parseNotation('')).toEqual([]);
    });

    it('returns empty array for whitespace-only string', () => {
      expect(parseNotation('   ')).toEqual([]);
    });

    it('handles multiple spaces between tokens', () => {
      expect(parseNotation("R   U   R'")).toEqual([m('R'), m('U'), m('R', "'")]);
    });

    it('handles leading and trailing whitespace', () => {
      expect(parseNotation("  R U R'  ")).toEqual([m('R'), m('U'), m('R', "'")]);
    });

    it("normalizes R2' to R2 (180 turn is its own inverse)", () => {
      expect(parseNotation("R2'")).toEqual([m('R', '2')]);
    });

    it('throws on unknown token', () => {
      expect(() => parseNotation('Q')).toThrow("Unknown move token: 'Q'");
    });

    it('throws on invalid modifier', () => {
      expect(() => parseNotation('R3')).toThrow("Unknown move token: 'R3'");
    });

    it('throws on completely invalid input', () => {
      expect(() => parseNotation('hello')).toThrow('Unknown move token');
    });
  });
});
