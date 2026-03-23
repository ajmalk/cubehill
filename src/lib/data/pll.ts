/**
 * PLL algorithm data — all 21 PLL cases.
 *
 * Pattern is a PermutationArrow[] showing which pieces move where on the top face.
 * PiecePosition uses the 3x3 grid indices (0-8), excluding center (4).
 *
 * Grid layout:
 *   0 | 1 | 2     (UL corner | U edge | UR corner)
 *   3 | 4 | 5     (L edge    | center | R edge)
 *   6 | 7 | 8     (DL corner | D edge | DR corner)
 *
 * isTwoLook: true for Ua, Ub, H, Z (edge perms) and Aa, Ab (corner perms).
 *
 * Algorithms from jperm.net standard PLL set.
 * V Perm: confirmed ending with F' (not F) per bug cubehill-b9t.
 */

import type { PllAlgorithm } from '$lib/cube/types.js';

export const PLL_ALGORITHMS: PllAlgorithm[] = [
  // ── Edges Only (4 cases) ─────────────────────────────────────────────────
  {
    id: 'pll-ua',
    name: 'Ua Perm',
    category: 'pll',
    group: 'Edges Only',
    notation: "M2 U M U2 M' U M2",
    altNotations: ["R U' R U R U R U' R' U' R2"],
    probability: '1/18',
    isTwoLook: true,
    // 3-cycle: top edge → right edge → bottom edge
    // 1 (top) → 5 (right) → 7 (bottom) → 1
    pattern: [
      { from: 1, to: 7 },
      { from: 7, to: 5 },
      { from: 5, to: 1 },
    ],
  },
  {
    id: 'pll-ub',
    name: 'Ub Perm',
    category: 'pll',
    group: 'Edges Only',
    notation: "M2 U' M U2 M' U' M2",
    altNotations: ["R2 U R U R' U' R' U' R' U R'"],
    probability: '1/18',
    isTwoLook: true,
    // 3-cycle: top edge → left edge → bottom edge
    // 1 (top) → 3 (left) → 7 (bottom) → 1... actually reverse of Ua
    pattern: [
      { from: 1, to: 5 },
      { from: 5, to: 7 },
      { from: 7, to: 1 },
    ],
  },
  {
    id: 'pll-h',
    name: 'H Perm',
    category: 'pll',
    group: 'Edges Only',
    notation: 'M2 U M2 U2 M2 U M2',
    probability: '1/72',
    isTwoLook: true,
    // swap opposite edges: top↔bottom, left↔right
    pattern: [
      { from: 1, to: 7 },
      { from: 7, to: 1 },
      { from: 3, to: 5 },
      { from: 5, to: 3 },
    ],
  },
  {
    id: 'pll-z',
    name: 'Z Perm',
    category: 'pll',
    group: 'Edges Only',
    notation: "M' U M2 U M2 U M' U2 M2",
    probability: '1/36',
    isTwoLook: true,
    // swap adjacent edges: top↔right, bottom↔left
    pattern: [
      { from: 1, to: 5 },
      { from: 5, to: 1 },
      { from: 3, to: 7 },
      { from: 7, to: 3 },
    ],
  },

  // ── Corners Only (2 cases) ────────────────────────────────────────────────
  {
    id: 'pll-aa',
    name: 'Aa Perm',
    category: 'pll',
    group: 'Corners Only',
    notation: "x R' U R' D2 R U' R' D2 R2 x'",
    altNotations: ["l' U R' D2 R U' R' D2 R2"],
    probability: '1/18',
    isTwoLook: true,
    // 3-cycle of corners: UL → UR → DR
    // 0 (UL) → 2 (UR) → 8 (DR)
    pattern: [
      { from: 0, to: 8 },
      { from: 8, to: 2 },
      { from: 2, to: 0 },
    ],
  },
  {
    id: 'pll-ab',
    name: 'Ab Perm',
    category: 'pll',
    group: 'Corners Only',
    notation: "x R2 D2 R U R' D2 R U' R x'",
    altNotations: ["l U' R D2 R' U R D2 R2"],
    probability: '1/18',
    isTwoLook: true,
    // 3-cycle of corners reversed: UL → DR → UR
    // 0 (UL) → 2 (UR) → 8 (DR) reversed
    pattern: [
      { from: 0, to: 2 },
      { from: 2, to: 8 },
      { from: 8, to: 0 },
    ],
  },

  // ── Both Edges and Corners (15 cases) ────────────────────────────────────
  {
    id: 'pll-t',
    name: 'T Perm',
    category: 'pll',
    group: 'Both Edges and Corners',
    notation: "R U R' U' R' F R2 U' R' U' R U R' F'",
    probability: '1/18',
    isTwoLook: false,
    // swap UR corner↔UL corner, swap top edge↔right edge
    pattern: [
      { from: 0, to: 2 },
      { from: 2, to: 0 },
      { from: 1, to: 5 },
      { from: 5, to: 1 },
    ],
  },
  {
    id: 'pll-f',
    name: 'F Perm',
    category: 'pll',
    group: 'Both Edges and Corners',
    notation: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
    probability: '1/18',
    isTwoLook: false,
    // swap UL corner↔DL corner, swap top edge↔left edge
    pattern: [
      { from: 0, to: 6 },
      { from: 6, to: 0 },
      { from: 1, to: 3 },
      { from: 3, to: 1 },
    ],
  },
  {
    id: 'pll-ja',
    name: 'Ja Perm',
    category: 'pll',
    group: 'Both Edges and Corners',
    notation: "x R2 F R F' R U2 r' U r U2 x'",
    altNotations: ["R' U L' U2 R U' R' U2 R L U'"],
    probability: '1/18',
    isTwoLook: false,
    // 3-cycle: UR corner, UL corner, top edge cycle
    pattern: [
      { from: 0, to: 2 },
      { from: 2, to: 8 },
      { from: 8, to: 0 },
      { from: 1, to: 5 },
      { from: 5, to: 7 },
      { from: 7, to: 1 },
    ],
  },
  {
    id: 'pll-jb',
    name: 'Jb Perm',
    category: 'pll',
    group: 'Both Edges and Corners',
    notation: "R U R' F' R U R' U' R' F R2 U' R'",
    altNotations: ["R U R' F' R U R' U' R' F R2 U' R' U'"],
    probability: '1/18',
    isTwoLook: false,
    // swap UR corner↔DR corner, swap right edge↔bottom edge
    pattern: [
      { from: 2, to: 8 },
      { from: 8, to: 2 },
      { from: 5, to: 7 },
      { from: 7, to: 5 },
    ],
  },
  {
    id: 'pll-ra',
    name: 'Ra Perm',
    category: 'pll',
    group: 'Both Edges and Corners',
    notation: "R U' R' U' R U R D R' U' R D' R' U2 R'",
    altNotations: ["R U R' F' R U2 R' U2 R' F R U R U2 R'"],
    probability: '1/18',
    isTwoLook: false,
    // 3-cycle
    pattern: [
      { from: 0, to: 2 },
      { from: 2, to: 6 },
      { from: 6, to: 0 },
      { from: 1, to: 5 },
      { from: 5, to: 3 },
      { from: 3, to: 1 },
    ],
  },
  {
    id: 'pll-rb',
    name: 'Rb Perm',
    category: 'pll',
    group: 'Both Edges and Corners',
    notation: "R' U2 R U2 R' F R U R' U' R' F' R2",
    altNotations: ["R' U R U' R2 F' U' F R U R' U' R2 U"],
    probability: '1/18',
    isTwoLook: false,
    // 3-cycle (reverse of Ra)
    pattern: [
      { from: 0, to: 6 },
      { from: 6, to: 2 },
      { from: 2, to: 0 },
      { from: 1, to: 3 },
      { from: 3, to: 5 },
      { from: 5, to: 1 },
    ],
  },
  {
    id: 'pll-y',
    name: 'Y Perm',
    category: 'pll',
    group: 'Both Edges and Corners',
    notation: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
    probability: '1/18',
    isTwoLook: false,
    // swap diagonal corners + swap adjacent edges
    pattern: [
      { from: 0, to: 8 },
      { from: 8, to: 0 },
      { from: 3, to: 5 },
      { from: 5, to: 3 },
    ],
  },
  {
    id: 'pll-v',
    name: 'V Perm',
    category: 'pll',
    group: 'Both Edges and Corners',
    notation: "R' U R' U' y R' F' R2 U' R' U R' F R F'",
    probability: '1/18',
    isTwoLook: false,
    // swap diagonal corners + swap adjacent edges
    pattern: [
      { from: 0, to: 8 },
      { from: 8, to: 0 },
      { from: 1, to: 7 },
      { from: 7, to: 1 },
    ],
  },
  {
    id: 'pll-na',
    name: 'Na Perm',
    category: 'pll',
    group: 'Both Edges and Corners',
    notation: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'",
    altNotations: ["z U R' D R2 U' R D' U R' D R2 U' R D' z'"],
    probability: '1/72',
    isTwoLook: false,
    // swap diagonal corners + swap opposite edges
    pattern: [
      { from: 0, to: 8 },
      { from: 8, to: 0 },
      { from: 2, to: 6 },
      { from: 6, to: 2 },
    ],
  },
  {
    id: 'pll-nb',
    name: 'Nb Perm',
    category: 'pll',
    group: 'Both Edges and Corners',
    notation: "R' U R' F R F' R U' R' F' U F R U R' U' R",
    altNotations: ["z D' R U' R2 D R' U D' R U' R2 D R' U z'"],
    probability: '1/72',
    isTwoLook: false,
    pattern: [
      { from: 0, to: 8 },
      { from: 8, to: 0 },
      { from: 2, to: 6 },
      { from: 6, to: 2 },
    ],
  },
  {
    id: 'pll-ga',
    name: 'Ga Perm',
    category: 'pll',
    group: 'Both Edges and Corners',
    notation: "R2 U R' U R' U' R U' R2 U' D R' U R D'",
    probability: '1/18',
    isTwoLook: false,
    // 4-cycle corners + 3-cycle edges
    pattern: [
      { from: 0, to: 2 },
      { from: 2, to: 8 },
      { from: 8, to: 6 },
      { from: 6, to: 0 },
      { from: 1, to: 5 },
      { from: 5, to: 7 },
      { from: 7, to: 1 },
    ],
  },
  {
    id: 'pll-gb',
    name: 'Gb Perm',
    category: 'pll',
    group: 'Both Edges and Corners',
    notation: "R' U' R U D' R2 U R' U R U' R U' R2 D",
    probability: '1/18',
    isTwoLook: false,
    pattern: [
      { from: 0, to: 6 },
      { from: 6, to: 8 },
      { from: 8, to: 2 },
      { from: 2, to: 0 },
      { from: 1, to: 7 },
      { from: 7, to: 5 },
      { from: 5, to: 1 },
    ],
  },
  {
    id: 'pll-gc',
    name: 'Gc Perm',
    category: 'pll',
    group: 'Both Edges and Corners',
    notation: "R2 U' R U' R U R' U R2 D' U R U' R' D",
    probability: '1/18',
    isTwoLook: false,
    pattern: [
      { from: 0, to: 6 },
      { from: 6, to: 8 },
      { from: 8, to: 2 },
      { from: 2, to: 0 },
      { from: 1, to: 3 },
      { from: 3, to: 7 },
      { from: 7, to: 1 },
    ],
  },
  {
    id: 'pll-gd',
    name: 'Gd Perm',
    category: 'pll',
    group: 'Both Edges and Corners',
    notation: "R U R' U' D R2 U' R U' R' U R' U R2 D'",
    probability: '1/18',
    isTwoLook: false,
    pattern: [
      { from: 0, to: 2 },
      { from: 2, to: 8 },
      { from: 8, to: 6 },
      { from: 6, to: 0 },
      { from: 1, to: 7 },
      { from: 7, to: 3 },
      { from: 3, to: 1 },
    ],
  },
  {
    id: 'pll-e',
    name: 'E Perm',
    category: 'pll',
    group: 'Both Edges and Corners',
    notation: "x' L' U L D' L' U' L D L' U' L D' L' U L D x",
    altNotations: ["R2 U R' U' y R U R' U' R U R' U' R U R' U' R2 y'"],
    probability: '1/36',
    isTwoLook: false,
    // swap all 4 diagonal corner pairs + swap edges on opposite sides
    pattern: [
      { from: 0, to: 8 },
      { from: 8, to: 0 },
      { from: 2, to: 6 },
      { from: 6, to: 2 },
    ],
  },
];
