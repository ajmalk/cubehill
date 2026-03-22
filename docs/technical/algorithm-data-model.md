# Algorithm Data Model

This document describes the TypeScript types and interfaces for algorithm data. For the OLL/PLL case inventory, grouping tables, and learning priority, see [Product: Algorithms](../product/algorithms.md).

Algorithm data lives in `src/lib/data/` as static TypeScript arrays.

## Data Model

The data model uses a discriminated union so TypeScript can narrow the `pattern` field based on `category`:

```typescript
interface BaseAlgorithm {
  id: string; // Unique identifier, e.g., "oll-1", "pll-aa"
  name: string; // Display name, e.g., "OLL 1", "Aa Perm"
  notation: string; // Primary algorithm, e.g., "R U2 R2 F R F' U2 R' F R F'"
  altNotations?: string[]; // Alternative algorithms for the same case
  group: string; // Grouping label, e.g., "Dot Cases", "T-Shape"
  probability: string; // Probability of encountering, e.g., "1/54"
}

interface OllAlgorithm extends BaseAlgorithm {
  category: 'oll';
  pattern: boolean[]; // 9-element array: true = sticker oriented (yellow up)
}

interface PllAlgorithm extends BaseAlgorithm {
  category: 'pll';
  pattern: PermutationArrow[]; // Arrow diagram data showing piece permutations
}

type Algorithm = OllAlgorithm | PllAlgorithm;
```

This discriminated union means checking `algorithm.category === 'oll'` automatically narrows `pattern` to `boolean[]`, eliminating runtime type checks.

## Fields Explained

**`id`**: URL-safe identifier used in routing (`/oll/oll-1/`, `/pll/pll-aa/`).

**`name`**: Human-readable name following standard community conventions.

**`notation`**: The primary (most commonly used) algorithm in standard Rubik's cube notation. Space-separated moves.

**`altNotations`**: Optional array of alternative algorithms. Some cubers prefer different algorithms for the same case based on ergonomics or finger-trick efficiency.

**`pattern`** (OLL): A 9-element boolean array representing the top face of the cube:

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

## PLL Pattern Field

For PLL cases, all top stickers are already oriented (all yellow facing up). PLL cases are distinguished by which pieces need to be permuted. The `pattern` field for PLL uses a `PermutationArrow[]` type instead of `boolean[]`:

```typescript
interface PermutationArrow {
  from: PiecePosition; // Source position on the top face
  to: PiecePosition; // Destination position
}

// Positions are the 8 edge/corner slots around the top face (center is fixed)
type PiecePosition = 0 | 1 | 2 | 3 | 5 | 6 | 7 | 8; // indices in the 3x3 grid, excluding center (4)
```

PLL case thumbnails render **arrow diagrams** from this data — each arrow shows where a piece moves to. The `AlgorithmCard` component draws these as SVG arrows overlaid on a 3x3 grid.

Example for Ua Perm (3 edges cycle):

```typescript
pattern: [
  { from: 1, to: 5 }, // top-center edge → right-center edge
  { from: 5, to: 7 }, // right-center edge → bottom-center edge
  { from: 7, to: 1 }, // bottom-center edge → top-center edge
];
```
