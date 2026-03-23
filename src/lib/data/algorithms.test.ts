/**
 * Algorithm data validation tests.
 *
 * Verifies:
 *  - Correct counts (57 OLL, 21 PLL)
 *  - All IDs unique across each set
 *  - All notations parse without error
 *  - All required fields present and well-formed
 *  - isTwoLook only on OLL 21–27 (OCLL cases)
 *  - PLL isTwoLook correct (Ua, Ub, H, Z, Aa, Ab)
 *  - OLL pattern is a 9-element boolean array with center always true
 *  - PLL pattern arrows reference valid PiecePositions (not 4)
 */

import { describe, it, expect } from 'vitest';
import { OLL_ALGORITHMS } from './oll.js';
import { PLL_ALGORITHMS } from './pll.js';
import { parseNotation } from '$lib/cube/notation.js';

// IDs that should have isTwoLook: true for OLL
const OLL_TWO_LOOK_IDS = new Set([
  'oll-21',
  'oll-22',
  'oll-23',
  'oll-24',
  'oll-25',
  'oll-26',
  'oll-27',
]);

// IDs that should have isTwoLook: true for PLL
const PLL_TWO_LOOK_IDS = new Set(['pll-ua', 'pll-ub', 'pll-h', 'pll-z', 'pll-aa', 'pll-ab']);

// Valid PiecePositions (all 3x3 indices except center = 4)
const VALID_PIECE_POSITIONS = new Set([0, 1, 2, 3, 5, 6, 7, 8]);

describe('OLL algorithm data', () => {
  it('has exactly 57 cases', () => {
    expect(OLL_ALGORITHMS).toHaveLength(57);
  });

  it('all IDs are unique', () => {
    const ids = OLL_ALGORITHMS.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all IDs match pattern oll-N', () => {
    for (const alg of OLL_ALGORITHMS) {
      expect(alg.id).toMatch(/^oll-\d+$/);
    }
  });

  it('all required fields are present and non-empty', () => {
    for (const alg of OLL_ALGORITHMS) {
      expect(alg.id, `${alg.id}: id`).toBeTruthy();
      expect(alg.name, `${alg.id}: name`).toBeTruthy();
      expect(alg.category, `${alg.id}: category`).toBe('oll');
      expect(alg.group, `${alg.id}: group`).toBeTruthy();
      expect(alg.notation, `${alg.id}: notation`).toBeTruthy();
      expect(alg.probability, `${alg.id}: probability`).toBeTruthy();
      expect(typeof alg.isTwoLook, `${alg.id}: isTwoLook type`).toBe('boolean');
    }
  });

  it('all notations parse without error', () => {
    for (const alg of OLL_ALGORITHMS) {
      expect(() => parseNotation(alg.notation), `${alg.id}: notation parse failed`).not.toThrow();
      expect(
        parseNotation(alg.notation).length,
        `${alg.id}: notation has at least 1 move`,
      ).toBeGreaterThan(0);
    }
  });

  it('altNotations parse without error when present', () => {
    for (const alg of OLL_ALGORITHMS) {
      if (alg.altNotations) {
        for (const alt of alg.altNotations) {
          expect(
            () => parseNotation(alt),
            `${alg.id}: altNotation parse failed: "${alt}"`,
          ).not.toThrow();
        }
      }
    }
  });

  it('isTwoLook is true only for OLL 21–27', () => {
    for (const alg of OLL_ALGORITHMS) {
      if (OLL_TWO_LOOK_IDS.has(alg.id)) {
        expect(alg.isTwoLook, `${alg.id} should have isTwoLook: true`).toBe(true);
      } else {
        expect(alg.isTwoLook, `${alg.id} should have isTwoLook: false`).toBe(false);
      }
    }
  });

  it('all patterns are 9-element boolean arrays', () => {
    for (const alg of OLL_ALGORITHMS) {
      expect(alg.pattern, `${alg.id}: pattern length`).toHaveLength(9);
      for (let i = 0; i < 9; i++) {
        expect(typeof alg.pattern[i], `${alg.id}: pattern[${i}] type`).toBe('boolean');
      }
    }
  });

  it('pattern[4] (center) is always true for OLL', () => {
    for (const alg of OLL_ALGORITHMS) {
      expect(alg.pattern[4], `${alg.id}: center should be oriented`).toBe(true);
    }
  });

  it('probability field matches fraction format', () => {
    for (const alg of OLL_ALGORITHMS) {
      expect(alg.probability, `${alg.id}: probability format`).toMatch(/^\d+\/\d+$/);
    }
  });
});

describe('PLL algorithm data', () => {
  it('has exactly 21 cases', () => {
    expect(PLL_ALGORITHMS).toHaveLength(21);
  });

  it('all IDs are unique', () => {
    const ids = PLL_ALGORITHMS.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all IDs match pattern pll-*', () => {
    for (const alg of PLL_ALGORITHMS) {
      expect(alg.id).toMatch(/^pll-[a-z]+$/);
    }
  });

  it('all required fields are present and non-empty', () => {
    for (const alg of PLL_ALGORITHMS) {
      expect(alg.id, `${alg.id}: id`).toBeTruthy();
      expect(alg.name, `${alg.id}: name`).toBeTruthy();
      expect(alg.category, `${alg.id}: category`).toBe('pll');
      expect(alg.group, `${alg.id}: group`).toBeTruthy();
      expect(alg.notation, `${alg.id}: notation`).toBeTruthy();
      expect(alg.probability, `${alg.id}: probability`).toBeTruthy();
      expect(typeof alg.isTwoLook, `${alg.id}: isTwoLook type`).toBe('boolean');
    }
  });

  it('all notations parse without error', () => {
    for (const alg of PLL_ALGORITHMS) {
      expect(() => parseNotation(alg.notation), `${alg.id}: notation parse failed`).not.toThrow();
      expect(
        parseNotation(alg.notation).length,
        `${alg.id}: notation has at least 1 move`,
      ).toBeGreaterThan(0);
    }
  });

  it('altNotations parse without error when present', () => {
    for (const alg of PLL_ALGORITHMS) {
      if (alg.altNotations) {
        for (const alt of alg.altNotations) {
          expect(
            () => parseNotation(alt),
            `${alg.id}: altNotation parse failed: "${alt}"`,
          ).not.toThrow();
        }
      }
    }
  });

  it('isTwoLook is true for Ua, Ub, H, Z, Aa, Ab only', () => {
    for (const alg of PLL_ALGORITHMS) {
      if (PLL_TWO_LOOK_IDS.has(alg.id)) {
        expect(alg.isTwoLook, `${alg.id} should have isTwoLook: true`).toBe(true);
      } else {
        expect(alg.isTwoLook, `${alg.id} should have isTwoLook: false`).toBe(false);
      }
    }
  });

  it('all pattern arrows reference valid PiecePositions', () => {
    for (const alg of PLL_ALGORITHMS) {
      for (const arrow of alg.pattern) {
        expect(
          VALID_PIECE_POSITIONS.has(arrow.from),
          `${alg.id}: arrow.from=${arrow.from} is not a valid PiecePosition`,
        ).toBe(true);
        expect(
          VALID_PIECE_POSITIONS.has(arrow.to),
          `${alg.id}: arrow.to=${arrow.to} is not a valid PiecePosition`,
        ).toBe(true);
      }
    }
  });

  it('probability field matches fraction format', () => {
    for (const alg of PLL_ALGORITHMS) {
      expect(alg.probability, `${alg.id}: probability format`).toMatch(/^\d+\/\d+$/);
    }
  });

  it('pattern has at least one arrow per case', () => {
    for (const alg of PLL_ALGORITHMS) {
      expect(alg.pattern.length, `${alg.id}: pattern should have arrows`).toBeGreaterThan(0);
    }
  });
});
