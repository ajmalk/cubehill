/**
 * OLL algorithm data — all 57 OLL cases.
 *
 * Pattern is a 9-element boolean array (row-major, top-left to bottom-right):
 *   [0][1][2]
 *   [3][4][5]
 *   [6][7][8]
 * true = sticker oriented (yellow facing up), false = not oriented.
 * pattern[4] (center) is always true.
 *
 * isTwoLook: true for OCLL cases (OLL 21–27) and cross/edge cases (OLL 44, 45, 51).
 *
 * Algorithms from jperm.net standard OLL set.
 */

import type { OllAlgorithm } from '$lib/cube/types.js';

export const OLL_ALGORITHMS: OllAlgorithm[] = [
  // ── Dot Cases (8 cases: OLL 1–4, 17–20) ────────────────────────────────
  {
    id: 'oll-1',
    name: 'OLL 1',
    category: 'oll',
    group: 'Dot',
    notation: "R U2 R2 F R F' U2 R' F R F'",
    probability: '1/108',
    isTwoLook: false,
    pattern: [false, false, false, false, true, false, false, false, false],
  },
  {
    id: 'oll-2',
    name: 'OLL 2',
    category: 'oll',
    group: 'Dot',
    notation: "F R U R' U' F' f R U R' U' f'",
    probability: '1/54',
    isTwoLook: false,
    pattern: [false, false, false, false, true, false, false, false, false],
  },
  {
    id: 'oll-3',
    name: 'OLL 3',
    category: 'oll',
    group: 'Dot',
    notation: "f R U R' U' f' U' F R U R' U' F'",
    probability: '1/54',
    isTwoLook: false,
    pattern: [false, false, false, false, true, false, false, false, false],
  },
  {
    id: 'oll-4',
    name: 'OLL 4',
    category: 'oll',
    group: 'Dot',
    notation: "f R U R' U' f' U F R U R' U' F'",
    probability: '1/54',
    isTwoLook: false,
    pattern: [false, false, false, false, true, false, false, false, false],
  },
  {
    id: 'oll-17',
    name: 'OLL 17',
    category: 'oll',
    group: 'Dot',
    notation: "R U R' U R' F R F' U2 R' F R F'",
    probability: '1/54',
    isTwoLook: false,
    pattern: [false, false, false, false, true, false, false, false, false],
  },
  {
    id: 'oll-18',
    name: 'OLL 18',
    category: 'oll',
    group: 'Dot',
    notation: "F R U R' U' F' U R U2 R' U' R U R'",
    probability: '1/54',
    isTwoLook: false,
    pattern: [false, false, false, false, true, false, false, false, false],
  },
  {
    id: 'oll-19',
    name: 'OLL 19',
    category: 'oll',
    group: 'Dot',
    notation: "R' U2 F R U R' U' F2 U2 F R",
    probability: '1/54',
    isTwoLook: false,
    pattern: [false, false, false, false, true, false, false, false, false],
  },
  {
    id: 'oll-20',
    name: 'OLL 20',
    category: 'oll',
    group: 'Dot',
    notation: "M' U2 M U2 M' U M U2 M' U2 M",
    altNotations: ["r U R' U' r' U2 R U R U' R2' U2 R"],
    probability: '1/54',
    isTwoLook: false,
    pattern: [false, false, false, false, true, false, false, false, false],
  },

  // ── Square Cases (2 cases: OLL 5, 6) ────────────────────────────────────
  {
    id: 'oll-5',
    name: 'OLL 5',
    category: 'oll',
    group: 'Square',
    notation: "r' U2 R U R' U r",
    probability: '1/54',
    isTwoLook: false,
    //   ##.
    //   ##.
    //   ...
    pattern: [true, true, false, true, true, false, false, false, false],
  },
  {
    id: 'oll-6',
    name: 'OLL 6',
    category: 'oll',
    group: 'Square',
    notation: "r U2 R' U' R U' r'",
    probability: '1/54',
    isTwoLook: false,
    //   .##
    //   .##
    //   ...
    pattern: [false, true, true, false, true, true, false, false, false],
  },

  // ── Small Lightning Cases (4 cases: OLL 7, 8, 11, 12) ───────────────────
  {
    id: 'oll-7',
    name: 'OLL 7',
    category: 'oll',
    group: 'Small Lightning',
    notation: "r U R' U R U2 r'",
    probability: '1/54',
    isTwoLook: false,
    //   ..#
    //   .##
    //   .#.
    pattern: [false, false, true, false, true, true, false, true, false],
  },
  {
    id: 'oll-8',
    name: 'OLL 8',
    category: 'oll',
    group: 'Small Lightning',
    notation: "r' U' R U' R' U2 r",
    probability: '1/54',
    isTwoLook: false,
    //   #..
    //   ##.
    //   .#.
    pattern: [true, false, false, true, true, false, false, true, false],
  },
  {
    id: 'oll-11',
    name: 'OLL 11',
    category: 'oll',
    group: 'Small Lightning',
    notation: "r' R2 U R' U R U2 R' U M'",
    altNotations: ["M R U R' U R U2 R' U M'"],
    probability: '1/54',
    isTwoLook: false,
    //   ..#
    //   ##.
    //   .#.
    pattern: [false, false, true, true, true, false, false, true, false],
  },
  {
    id: 'oll-12',
    name: 'OLL 12',
    category: 'oll',
    group: 'Small Lightning',
    notation: "M' R' U' R U' R' U2 R U' M",
    altNotations: ["r R2' U' R U' R' U2 R U' r'"],
    probability: '1/54',
    isTwoLook: false,
    //   #..
    //   .##
    //   .#.
    pattern: [true, false, false, false, true, true, false, true, false],
  },

  // ── Knight Move Cases (4 cases: OLL 13, 14, 15, 16) ────────────────────
  {
    id: 'oll-13',
    name: 'OLL 13',
    category: 'oll',
    group: 'Knight Move',
    notation: "F U R U' R2 F' R U R U' R'",
    probability: '1/54',
    isTwoLook: false,
    //   .#.
    //   ##.
    //   #..
    pattern: [false, true, false, true, true, false, true, false, false],
  },
  {
    id: 'oll-14',
    name: 'OLL 14',
    category: 'oll',
    group: 'Knight Move',
    notation: "R' F R U R' F' R F U' F'",
    probability: '1/54',
    isTwoLook: false,
    //   .#.
    //   .##
    //   ..#
    pattern: [false, true, false, false, true, true, false, false, true],
  },
  {
    id: 'oll-15',
    name: 'OLL 15',
    category: 'oll',
    group: 'Knight Move',
    notation: "r' U' r R' U' R U r' U r",
    probability: '1/54',
    isTwoLook: false,
    //   .#.
    //   .#.
    //   #..
    pattern: [false, true, false, false, true, false, true, false, false],
  },
  {
    id: 'oll-16',
    name: 'OLL 16',
    category: 'oll',
    group: 'Knight Move',
    notation: "r U r' R U R' U' r U' r'",
    probability: '1/54',
    isTwoLook: false,
    //   .#.
    //   .#.
    //   ..#
    pattern: [false, true, false, false, true, false, false, false, true],
  },

  // ── Dot Cases continued (OLL 17–20 already above) ───────────────────────

  // ── All Edges Oriented / OCLL (7 cases: OLL 21–27) ──────────────────────
  {
    id: 'oll-21',
    name: 'OLL 21',
    category: 'oll',
    group: 'All Edges Oriented (OCLL)',
    notation: "R U2 R' U' R U R' U' R U' R'",
    altNotations: ["R U R' U R U' R' U R U2 R'"],
    probability: '1/54',
    isTwoLook: true,
    nicknames: ['H', 'Cross'],
    //   #.#
    //   .#.
    //   #.#
    pattern: [true, false, true, false, true, false, true, false, true],
  },
  {
    id: 'oll-22',
    name: 'OLL 22',
    category: 'oll',
    group: 'All Edges Oriented (OCLL)',
    notation: "R U2 R2 U' R2 U' R2 U2 R",
    probability: '1/54',
    isTwoLook: true,
    nicknames: ['Pi'],
    //   #.#
    //   .#.
    //   #.#
    pattern: [true, false, true, false, true, false, true, false, true],
  },
  {
    id: 'oll-23',
    name: 'OLL 23',
    category: 'oll',
    group: 'All Edges Oriented (OCLL)',
    notation: "R2 D' R U2 R' D R U2 R",
    probability: '1/54',
    isTwoLook: true,
    nicknames: ['Headlights', "Sune's evil twin", 'Anti-Chameleon'],
    //   #.#
    //   .#.
    //   #.#
    pattern: [true, false, true, false, true, false, true, false, true],
  },
  {
    id: 'oll-24',
    name: 'OLL 24',
    category: 'oll',
    group: 'All Edges Oriented (OCLL)',
    notation: "r U R' U' r' F R F'",
    probability: '1/54',
    isTwoLook: true,
    nicknames: ['Chameleon'],
    //   #.#
    //   .#.
    //   #.#
    pattern: [true, false, true, false, true, false, true, false, true],
  },
  {
    id: 'oll-25',
    name: 'OLL 25',
    category: 'oll',
    group: 'All Edges Oriented (OCLL)',
    notation: "F' r U R' U' r' F R",
    probability: '1/54',
    isTwoLook: true,
    nicknames: ['Bowtie'],
    //   #.#
    //   .#.
    //   #.#
    pattern: [true, false, true, false, true, false, true, false, true],
  },
  {
    id: 'oll-26',
    name: 'OLL 26',
    category: 'oll',
    group: 'All Edges Oriented (OCLL)',
    notation: "R' U' R U' R' U2 R",
    altNotations: ["L' U' L U' L' U2 L"],
    probability: '1/54',
    isTwoLook: true,
    nicknames: ['Anti-Sune'],
    //   #.#
    //   .#.
    //   #.#
    pattern: [true, false, true, false, true, false, true, false, true],
  },
  {
    id: 'oll-27',
    name: 'OLL 27',
    category: 'oll',
    group: 'All Edges Oriented (OCLL)',
    notation: "R U R' U R U2 R'",
    altNotations: ["L U L' U L U2 L'"],
    probability: '1/54',
    isTwoLook: true,
    nicknames: ['Sune'],
    //   #.#
    //   .#.
    //   #.#
    pattern: [true, false, true, false, true, false, true, false, true],
  },

  // ── L-Shape (6 cases: OLL 28, 47, 48, 53, 54, 57) ──────────────────────
  {
    id: 'oll-28',
    name: 'OLL 28',
    category: 'oll',
    group: 'L-Shape',
    notation: "r U R' U' M U R U' R'",
    probability: '1/54',
    isTwoLook: false,
    //   ...
    //   .##
    //   ##.
    pattern: [false, false, false, false, true, true, true, true, false],
  },

  // ── Awkward Cases (4 cases: OLL 29, 30, 41, 42) ─────────────────────────
  {
    id: 'oll-29',
    name: 'OLL 29',
    category: 'oll',
    group: 'Awkward',
    notation: "R U R' U' R U' R' F' U' F R U R'",
    probability: '1/54',
    isTwoLook: false,
    //   .#.
    //   .#.
    //   ##.
    pattern: [false, true, false, false, true, false, true, true, false],
  },
  {
    id: 'oll-30',
    name: 'OLL 30',
    category: 'oll',
    group: 'Awkward',
    notation: "F R' F R2 U' R' U' R U R' F2",
    probability: '1/54',
    isTwoLook: false,
    //   .#.
    //   .#.
    //   .##
    pattern: [false, true, false, false, true, false, false, true, true],
  },

  // ── P-Shape Cases (4 cases: OLL 31, 32, 43, 44) ─────────────────────────
  {
    id: 'oll-31',
    name: 'OLL 31',
    category: 'oll',
    group: 'P-Shape',
    notation: "R' U' F U R U' R' F' R",
    probability: '1/54',
    isTwoLook: false,
    //   .#.
    //   ##.
    //   .#.
    pattern: [false, true, false, true, true, false, false, true, false],
  },
  {
    id: 'oll-32',
    name: 'OLL 32',
    category: 'oll',
    group: 'P-Shape',
    notation: "R U B' U' R' U R B R'",
    probability: '1/54',
    isTwoLook: false,
    //   .#.
    //   .##
    //   .#.
    pattern: [false, true, false, false, true, true, false, true, false],
  },

  // ── T-Shape Cases (2 cases: OLL 33, 45) ─────────────────────────────────
  {
    id: 'oll-33',
    name: 'OLL 33',
    category: 'oll',
    group: 'T-Shape',
    notation: "R U R' U' R' F R F'",
    probability: '1/54',
    isTwoLook: false,
    //   .#.
    //   ###
    //   ...
    pattern: [false, true, false, true, true, true, false, false, false],
  },

  // ── C-Shape Cases (2 cases: OLL 34, 46) ─────────────────────────────────
  {
    id: 'oll-34',
    name: 'OLL 34',
    category: 'oll',
    group: 'C-Shape',
    notation: "R U R' U' B' R' F R F' B",
    probability: '1/54',
    isTwoLook: false,
    //   .#.
    //   ##.
    //   ...
    pattern: [false, true, false, true, true, false, false, false, false],
  },

  // ── Fish Cases (4 cases: OLL 9, 10, 35, 37) ─────────────────────────────
  {
    id: 'oll-9',
    name: 'OLL 9',
    category: 'oll',
    group: 'Fish',
    notation: "R U R' U' R' F R2 U R' U' F'",
    probability: '1/54',
    isTwoLook: false,
    //   .#.
    //   .##
    //   #..
    pattern: [false, true, false, false, true, true, true, false, false],
  },
  {
    id: 'oll-10',
    name: 'OLL 10',
    category: 'oll',
    group: 'Fish',
    notation: "R U R' U R' F R F' R U2 R'",
    probability: '1/54',
    isTwoLook: false,
    //   .#.
    //   ##.
    //   ..#
    pattern: [false, true, false, true, true, false, false, false, true],
  },
  {
    id: 'oll-35',
    name: 'OLL 35',
    category: 'oll',
    group: 'Fish',
    notation: "R U2 R2 F R F' R U2 R'",
    probability: '1/54',
    isTwoLook: false,
    //   .#.
    //   ##.
    //   #..
    pattern: [false, true, false, true, true, false, true, false, false],
  },
  {
    id: 'oll-37',
    name: 'OLL 37',
    category: 'oll',
    group: 'Fish',
    notation: "F R' F' R U R U' R'",
    probability: '1/54',
    isTwoLook: false,
    //   .#.
    //   .##
    //   ..#
    pattern: [false, true, false, false, true, true, false, false, true],
  },

  // ── W-Shape Cases (2 cases: OLL 36, 38) ─────────────────────────────────
  {
    id: 'oll-36',
    name: 'OLL 36',
    category: 'oll',
    group: 'W-Shape',
    notation: "R U2 R' U' R U' R' U' R' F R F'",
    altNotations: ["R' U' R U' R' U R U l U' R' U"],
    probability: '1/54',
    isTwoLook: false,
    //   #..
    //   ##.
    //   .##
    pattern: [true, false, false, true, true, false, false, true, true],
  },
  {
    id: 'oll-38',
    name: 'OLL 38',
    category: 'oll',
    group: 'W-Shape',
    notation: "R U R' U R U' R' U' R' F R F'",
    probability: '1/54',
    isTwoLook: false,
    //   ..#
    //   .##
    //   ##.
    pattern: [false, false, true, false, true, true, true, true, false],
  },

  // ── Big Lightning Cases (4 cases: OLL 39, 40, 49, 50) ───────────────────
  {
    id: 'oll-39',
    name: 'OLL 39',
    category: 'oll',
    group: 'Big Lightning',
    notation: "R U R' F' U' F U R U2 R'",
    probability: '1/54',
    isTwoLook: false,
    //   .#.
    //   ##.
    //   ..#
    pattern: [false, true, false, true, true, false, false, false, true],
  },
  {
    id: 'oll-40',
    name: 'OLL 40',
    category: 'oll',
    group: 'Big Lightning',
    notation: "R' F R F' U' R' U' R U R' U R",
    probability: '1/54',
    isTwoLook: false,
    //   .#.
    //   .##
    //   #..
    pattern: [false, true, false, false, true, true, true, false, false],
  },

  // ── Awkward Cases continued (OLL 41, 42) ────────────────────────────────
  {
    id: 'oll-41',
    name: 'OLL 41',
    category: 'oll',
    group: 'Awkward',
    notation: "R U R' U R U2 R' F R U R' U' F'",
    probability: '1/54',
    isTwoLook: false,
    //   .#.
    //   .#.
    //   .##
    pattern: [false, true, false, false, true, false, false, true, true],
  },
  {
    id: 'oll-42',
    name: 'OLL 42',
    category: 'oll',
    group: 'Awkward',
    notation: "R' U' R U' R' U2 R F R U R' U' F'",
    probability: '1/54',
    isTwoLook: false,
    //   .#.
    //   .#.
    //   ##.
    pattern: [false, true, false, false, true, false, true, true, false],
  },

  // ── P-Shape continued (OLL 43, 44) ──────────────────────────────────────
  {
    id: 'oll-43',
    name: 'OLL 43',
    category: 'oll',
    group: 'P-Shape',
    notation: "R' U' F' U F R",
    probability: '1/54',
    isTwoLook: false,
    //   .#.
    //   ##.
    //   .##
    pattern: [false, true, false, true, true, false, false, true, true],
  },
  {
    id: 'oll-44',
    name: 'OLL 44',
    category: 'oll',
    group: 'P-Shape',
    notation: "R U F U' F' R'",
    probability: '1/54',
    isTwoLook: true,
    //   .#.
    //   .##
    //   ##.
    pattern: [false, true, false, false, true, true, true, true, false],
  },

  // ── T-Shape continued (OLL 45) ───────────────────────────────────────────
  {
    id: 'oll-45',
    name: 'OLL 45',
    category: 'oll',
    group: 'T-Shape',
    notation: "F R U R' U' F'",
    probability: '1/54',
    isTwoLook: true,
    //   .#.
    //   ###
    //   ...
    pattern: [false, true, false, true, true, true, false, false, false],
  },

  // ── C-Shape continued (OLL 46) ───────────────────────────────────────────
  {
    id: 'oll-46',
    name: 'OLL 46',
    category: 'oll',
    group: 'C-Shape',
    notation: "R' U' R' F R F' U R",
    probability: '1/54',
    isTwoLook: false,
    //   .#.
    //   .##
    //   ...
    pattern: [false, true, false, false, true, true, false, false, false],
  },

  // ── L-Shape (OLL 47, 48, 53, 54, 57) ────────────────────────────────────
  {
    id: 'oll-47',
    name: 'OLL 47',
    category: 'oll',
    group: 'L-Shape',
    notation: "F' L' U' L U L' U' L U F",
    probability: '1/54',
    isTwoLook: false,
    //   ...
    //   .##
    //   .#.
    pattern: [false, false, false, false, true, true, false, true, false],
  },
  {
    id: 'oll-48',
    name: 'OLL 48',
    category: 'oll',
    group: 'L-Shape',
    notation: "F R U R' U' R U R' U' F'",
    probability: '1/54',
    isTwoLook: false,
    //   ...
    //   ##.
    //   .#.
    pattern: [false, false, false, true, true, false, false, true, false],
  },

  // ── Big Lightning continued (OLL 49, 50) ────────────────────────────────
  {
    id: 'oll-49',
    name: 'OLL 49',
    category: 'oll',
    group: 'Big Lightning',
    notation: "r U' r2 U r2 U r2 U' r",
    altNotations: ["R B' R2 F R2 B R2 F' R"],
    probability: '1/54',
    isTwoLook: false,
    //   ...
    //   ##.
    //   ..#
    pattern: [false, false, false, true, true, false, false, false, true],
  },
  {
    id: 'oll-50',
    name: 'OLL 50',
    category: 'oll',
    group: 'Big Lightning',
    notation: "r' U r2 U' r2 U' r2 U r'",
    altNotations: ["R' B R2 F' R2 B' R2 F R'"],
    probability: '1/54',
    isTwoLook: false,
    //   ...
    //   .##
    //   #..
    pattern: [false, false, false, false, true, true, true, false, false],
  },

  // ── I-Shape (4 cases: OLL 51, 52, 55, 56) ────────────────────────────────
  {
    id: 'oll-51',
    name: 'OLL 51',
    category: 'oll',
    group: 'I-Shape',
    notation: "f R U R' U' R U R' U' f'",
    probability: '1/54',
    isTwoLook: true,
    //   ...
    //   ###
    //   ...
    pattern: [false, false, false, true, true, true, false, false, false],
  },
  {
    id: 'oll-52',
    name: 'OLL 52',
    category: 'oll',
    group: 'I-Shape',
    notation: "R U R' U R U' B U' B' R'",
    altNotations: ["R' U' R U' R' U F' U F R"],
    probability: '1/54',
    isTwoLook: false,
    //   ...
    //   ###
    //   ...
    pattern: [false, false, false, true, true, true, false, false, false],
  },

  // ── L-Shape continued (OLL 53, 54) ──────────────────────────────────────
  {
    id: 'oll-53',
    name: 'OLL 53',
    category: 'oll',
    group: 'L-Shape',
    notation: "l' U2 L U L' U l",
    altNotations: ["r' U2 R U R' U r"],
    probability: '1/54',
    isTwoLook: false,
    //   ...
    //   ##.
    //   #..
    pattern: [false, false, false, true, true, false, true, false, false],
  },
  {
    id: 'oll-54',
    name: 'OLL 54',
    category: 'oll',
    group: 'L-Shape',
    notation: "r U2 R' U' R U' r'",
    altNotations: ["l U2 L' U' L U' l'"],
    probability: '1/54',
    isTwoLook: false,
    //   ...
    //   .##
    //   ..#
    pattern: [false, false, false, false, true, true, false, false, true],
  },

  // ── I-Shape continued (OLL 55, 56) ──────────────────────────────────────
  {
    id: 'oll-55',
    name: 'OLL 55',
    category: 'oll',
    group: 'I-Shape',
    notation: "R' F R U R U' R2 F' R2 U' R' U R U R'",
    probability: '1/108',
    isTwoLook: false,
    //   ...
    //   ###
    //   ...
    pattern: [false, false, false, true, true, true, false, false, false],
  },
  {
    id: 'oll-56',
    name: 'OLL 56',
    category: 'oll',
    group: 'I-Shape',
    notation: "r' U' r U' R' U R U' R' U R r' U r",
    probability: '1/108',
    isTwoLook: false,
    //   ...
    //   ###
    //   ...
    pattern: [false, false, false, true, true, true, false, false, false],
  },

  // ── L-Shape continued (OLL 57) ───────────────────────────────────────────
  {
    id: 'oll-57',
    name: 'OLL 57',
    category: 'oll',
    group: 'L-Shape',
    notation: "R U R' U' M' U R U' r'",
    probability: '1/54',
    isTwoLook: false,
    //   ...
    //   .##
    //   .#.
    pattern: [false, false, false, false, true, true, false, true, false],
  },
];
