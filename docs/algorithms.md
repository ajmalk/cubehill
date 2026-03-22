# Algorithm Data

This document describes the algorithm data model and the OLL/PLL case inventory. Algorithm data lives in `src/lib/data/` as static TypeScript arrays.

## Data Model

```typescript
interface Algorithm {
  id: string;             // Unique identifier, e.g., "oll-1", "pll-aa"
  name: string;           // Display name, e.g., "OLL 1", "Aa Perm"
  category: 'oll' | 'pll';
  notation: string;       // Primary algorithm, e.g., "R U2 R2 F R F' U2 R' F R F'"
  altNotations?: string[]; // Alternative algorithms for the same case
  pattern: boolean[] | PermutationArrow[];  // OLL: boolean[9], PLL: arrow diagram data
  group: string;          // Grouping label, e.g., "Dot Cases", "T-Shape"
  probability: string;    // Probability of encountering, e.g., "1/54"
}
```

### Fields Explained

**`id`**: URL-safe identifier used in routing (`/oll/oll-1/`, `/pll/pll-aa/`).

**`name`**: Human-readable name following standard community conventions.

**`notation`**: The primary (most commonly used) algorithm in standard Rubik's cube notation. Space-separated moves.

**`altNotations`**: Optional array of alternative algorithms. Some cubers prefer different algorithms for the same case based on ergonomics or finger-trick efficiency.

**`pattern`**: A 9-element boolean array representing the top face of the cube:
- For OLL: `true` = the sticker is oriented correctly (yellow facing up), `false` = not oriented
- This maps to the 3x3 grid in row-major order (top-left to bottom-right)
- Used to render the 2D case thumbnail on algorithm cards

```
pattern[0] | pattern[1] | pattern[2]
-----------|-----------|----------
pattern[3] | pattern[4] | pattern[5]
-----------|-----------|----------
pattern[6] | pattern[7] | pattern[8]
```

Note: `pattern[4]` (center) is always `true` for OLL since the center is always oriented.

**`group`**: Categorization for grouping algorithms in the browse UI. OLL cases are grouped by the shape formed by the unoriented stickers. PLL cases are grouped by which pieces are permuted.

**`probability`**: The statistical probability of encountering this case during a solve. Helps users prioritize which algorithms to learn first.

## PLL-Specific Considerations

For PLL cases, all top stickers are already oriented (all yellow facing up). PLL cases are distinguished by which pieces need to be permuted. The `pattern` field for PLL uses a `PermutationArrow[]` type instead of `boolean[]`:

```typescript
interface PermutationArrow {
  from: PiecePosition;  // Source position on the top face
  to: PiecePosition;    // Destination position
}

// Positions are the 8 edge/corner slots around the top face (center is fixed)
type PiecePosition = 0 | 1 | 2 | 3 | 5 | 6 | 7 | 8;  // indices in the 3x3 grid, excluding center (4)
```

PLL case thumbnails render **arrow diagrams** from this data — each arrow shows where a piece moves to. The `AlgorithmCard` component draws these as SVG arrows overlaid on a 3x3 grid.

Example for Ua Perm (3 edges cycle):
```typescript
pattern: [
  { from: 1, to: 5 },  // top-center edge → right-center edge
  { from: 5, to: 7 },  // right-center edge → bottom-center edge
  { from: 7, to: 1 },  // bottom-center edge → top-center edge
]
```

## OLL Cases (57 total)

### Grouping by Shape

Each OLL case belongs to exactly one group. Groups are based on the shape formed by the oriented (yellow) stickers on the top face. The groupings below follow the standard jperm.net convention and are non-overlapping (total = 57).

| Group | Count | Cases |
|-------|-------|-------|
| All Edges Oriented (OCLL) | 7 | OLL 21 (H), 22 (Pi), 23 (Headlights), 24 (Chameleon), 25 (Bowtie), 26 (Anti-Sune), 27 (Sune) |
| T-Shape | 2 | OLL 33, 45 |
| Square | 2 | OLL 5, 6 |
| P-Shape | 4 | OLL 31, 32, 43, 44 |
| W-Shape | 2 | OLL 36, 38 |
| Fish | 4 | OLL 9, 10, 35, 37 |
| Knight Move | 4 | OLL 13, 14, 15, 16 |
| Awkward | 4 | OLL 29, 30, 41, 42 |
| Big Lightning | 4 | OLL 39, 40, 49, 50 |
| Small Lightning | 4 | OLL 7, 8, 11, 12 |
| C-Shape | 2 | OLL 34, 46 |
| I-Shape | 4 | OLL 51, 52, 55, 56 |
| L-Shape | 6 | OLL 47, 48, 53, 54, 28, 57 |
| Dot | 8 | OLL 1, 2, 3, 4, 17, 18, 19, 20 |
| **Total** | **57** | |

**Important**: OLL grouping varies slightly across community references (jperm.net, algdb.net, cubeskills.com). The canonical numbering (OLL 1–57) is universal, but group names and assignments differ at the edges. During implementation, verify each case's group assignment against jperm.net. The critical constraint is: **every case appears in exactly one group, and all 57 are accounted for**.

## PLL Cases (21 total)

### Grouping by Type

**Edges Only (4 cases)**:
| Name | Algorithm |
|------|-----------|
| Ua Perm | M2 U M U2 M' U M2 |
| Ub Perm | M2 U' M U2 M' U' M2 |
| H Perm | M2 U M2 U2 M2 U M2 |
| Z Perm | M' U M2 U M2 U M' U2 M2 |

**Corners Only (2 cases)**:
| Name | Algorithm |
|------|-----------|
| Aa Perm | x R' U R' D2 R U' R' D2 R2 x' |
| Ab Perm | x R2' D2 R U R' D2 R U' R x' |

**Both Edges and Corners (15 cases)**:
| Name | Algorithm |
|------|-----------|
| T Perm | R U R' U' R' F R2 U' R' U' R U R' F' |
| F Perm | R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R |
| Ja Perm | x R2 F R F' R U2 r' U r U2 x' |
| Jb Perm | R U R' F' R U R' U' R' F R2 U' R' U' |
| Ra Perm | R U' R' U' R U R D R' U' R D' R' U2 R' |
| Rb Perm | R' U2 R U2 R' F R U R' U' R' F' R2 |
| Y Perm | F R U' R' U' R U R' F' R U R' U' R' F R F' |
| V Perm | R' U R' U' y R' F' R2 U' R' U R' F R F |
| Na Perm | R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R' |
| Nb Perm | R' U R' F R F' R U' R' F' U F R U R' U' R |
| Ga Perm | R2 U R' U R' U' R U' R2 U' D R' U R D' |
| Gb Perm | R' U' R U D' R2 U R' U R U' R U' R2 D |
| Gc Perm | R2 U' R U' R U R' U R2 D' U R U' R' D |
| Gd Perm | R U R' U' D R2 U' R U' R' U R' U R2 D' |
| E Perm | x' L' U L D' L' U' L D L' U' L D' L' U L D x |

**Important**: All algorithms above should be verified against jperm.net or algdb.net before implementation. Alternative algorithms exist for most cases and can be included in the `altNotations` field. During implementation, test each algorithm by applying it to the appropriate PLL state and confirming it solves to identity.

## Learning Priority

For users new to the last layer, the standard recommended learning order:

1. **2-look OLL** (~10 algorithms): Handle all OLL cases in 2 steps — first orient the edges to form a cross (3 algorithms), then orient the corners (7 OCLL algorithms). This is the most efficient entry point because OLL comes before PLL in every solve.
2. **2-look PLL** (~6 algorithms): Handle all PLL cases in 2 steps — first permute the corners (2 algorithms), then permute the edges (4 algorithms: Ua, Ub, H, Z).
3. **Full PLL** (21 cases): Learn all 21 single-look PLL algorithms. Each case is relatively common (1/18 to 1/72), so the payoff per algorithm learned is high.
4. **Full OLL** (57 cases): Learn all 57 single-look OLL algorithms. Many cases are rare (1/54 or 1/108), so this is the last optimization step.

The UI should highlight 2-look algorithms as a "Start Here" path for beginners, and indicate which full OLL/PLL cases are most common to help users prioritize.
