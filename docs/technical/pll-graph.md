# PLL State Transition Graph

This document describes the `pll-graph.ts` module: the data model, mathematical approach, and API for computing the PLL state transition graph used at `/pll/graph/`.

For the PLL case inventory and grouping, see [Product: Algorithms](../product/algorithms.md). For the base algorithm data types, see [Algorithm Data Model](./algorithm-data-model.md).

## Overview

The PLL transition graph answers the question: "If I'm in PLL state A and apply PLL algorithm B (with a given AUF pre-rotation), what state do I end up in?"

The graph has 22 nodes — 21 PLL cases plus the solved state — and a directed edge for every (source, AUF, algorithm) triple that produces a valid transition. Edges with the same source/target pair are collapsed into a single edge carrying the list of algorithms that create that transition.

The graph is computed once at module initialization from the static PLL algorithm data. It is pure data — no Three.js, no Svelte, no DOM.

## Permutation Model

### Position Space

PLL algorithms permute the 8 corner and edge pieces on the top face. The 8 positions are identified by their index in the 3×3 top-face grid (row-major, 0–8), excluding the fixed center (index 4):

```
0 | 1 | 2     (UL corner | U edge  | UR corner)
3 | 4 | 5     (L edge    | center  | R edge)
6 | 7 | 8     (DL corner | D edge  | DR corner)
```

Valid positions: `{0, 1, 2, 3, 5, 6, 7, 8}` (this matches the existing `PiecePosition` type in `src/lib/cube/types.ts`).

### Permutation Representation

A `Permutation` maps each position to where its piece came from — i.e., `perm[i] = j` means "the piece now at position `i` came from position `j`". This is the standard "where does each slot get filled from" convention.

The identity permutation (solved state) is `[0, 1, 2, 3, 5, 6, 7, 8]` — each position maps to itself. Center position 4 is excluded throughout.

```typescript
/** Maps position → source position. Index is destination, value is source. */
type Permutation = number[];  // length 8, indices: [0,1,2,3,5,6,7,8]
```

The array has length 8. Index mapping: array index 0 = position 0, index 1 = position 1, ..., index 3 = position 3, index 4 = position 5, index 5 = position 6, index 6 = position 7, index 7 = position 8.

A helper maps between the two spaces: `posToIdx(pos: PiecePosition): number` returns the array index for a given grid position (skipping 4).

### Composition

Composing permutations `a` then `b` (apply `a` first, then `b`):

```
compose(a, b)[i] = a[b[i]]
```

In words: to find what's at position `i` after applying `b` on top of `a`, look at where `b` says position `i` comes from, then look at where `a` says that position comes from.

### U Rotation

A U (clockwise) rotation cycles the top-face pieces: corners cycle `0→2→8→6→0` and edges cycle `1→5→7→3→1`. As a permutation (where does slot `i` come from after a U move):

```
U[0] = 6   (position 0 is filled by what was at 6)
U[1] = 3   (position 1 is filled by what was at 3)
U[2] = 0
U[3] = 7
U[5] = 1
U[6] = 8
U[7] = 5
U[8] = 2
```

`U2` = compose(U, U), `U'` = compose(U, compose(U, U)). These three plus the identity are the four AUF pre-rotations.

## Building the Graph

### Deriving Permutations from Pattern Data

Each `PllAlgorithm` carries a `pattern: PermutationArrow[]` field where `{ from, to }` means "the piece at `from` moves to `to`". This is the forward permutation — it describes what the algorithm does to the pieces.

`patternToPermutation` converts this to the "where does slot `i` come from" convention by inverting: for each arrow `{ from, to }`, set `perm[to] = from`.

### Graph Computation

For each PLL algorithm `alg` and each AUF pre-rotation `auf ∈ {identity, U, U2, U'}`:

1. Compose `auf` with `alg.permutation` to get the combined permutation.
2. Identify the resulting state by comparing against all known PLL permutations (plus identity). The result is either a PLL case id or `"solved"`.
3. Identify the source state by recognizing what the starting configuration is. The source is always the "natural" starting state for the algorithm — for each PLL case this is found by applying the algorithm's inverse to the solved state. However, for the transition graph we also try applying each PLL case as the starting state.

The full enumeration: for each source state `s` (all 22 nodes) and each AUF `auf` and each PLL algorithm `alg`, compute `compose(s.permutation, compose(auf, alg.permutation))` and identify the result. Record an edge `s → result` with `(alg.id, alg.name, auf)`.

After collecting all raw transitions, collapse edges: group by `(source, target)` and merge the algorithm lists.

## Graph Structure

### Node

```typescript
interface PllGraphNode {
  id: string;           // PLL case id (e.g. "pll-t") or "solved"
  name: string;         // Display name (e.g. "T Perm") or "Solved"
  group: string;        // PLL group label (e.g. "T-Shape") or "Solved"
  isSolved: boolean;    // true only for the "solved" node
}
```

### Edge

```typescript
interface PllGraphEdgeAlgorithm {
  algorithmId: string;    // e.g. "pll-t"
  algorithmName: string;  // e.g. "T Perm"
  auf: 'none' | 'U' | 'U2' | "U'";
}

interface PllGraphEdge {
  source: string;                       // node id
  target: string;                       // node id
  algorithms: PllGraphEdgeAlgorithm[];  // all (algorithm, AUF) pairs that create this transition
  count: number;                        // algorithms.length — convenience field for D3 edge weight
}
```

### Graph

```typescript
interface PllGraph {
  nodes: PllGraphNode[];
  edges: PllGraphEdge[];
}
```

## Module API (`src/lib/graph/pll-graph.ts`)

```typescript
/**
 * Convert a PermutationArrow[] pattern to the internal Permutation type.
 * Inverts the "from→to" arrows into the "slot←source" convention.
 */
export function patternToPermutation(pattern: PermutationArrow[]): Permutation;

/**
 * Compose two permutations: apply `a` first, then `b`.
 * Returns a new Permutation; does not mutate inputs.
 */
export function composePerm(a: Permutation, b: Permutation): Permutation;

/**
 * Identify a permutation as a PLL case id, "solved", or null.
 * Returns null only if the permutation does not match any known state —
 * this should not happen for any composition of valid PLL permutations.
 */
export function identifyPllCase(perm: Permutation): string | null;

/**
 * Compute the full PLL transition graph.
 * Result is deterministic — call once and cache (see pllGraph below).
 */
export function computePllGraph(): PllGraph;

/** Pre-computed graph — import this instead of calling computePllGraph() at render time. */
export const pllGraph: PllGraph;
```

### Usage Pattern

Import `pllGraph` directly; do not call `computePllGraph()` in component code:

```typescript
import { pllGraph } from '$lib/graph/pll-graph.js';

// Pass to D3 force simulation
const simulation = d3.forceSimulation(pllGraph.nodes)
  .force('link', d3.forceLink(pllGraph.edges).id(d => d.id));
```

## File Location

The module lives at `src/lib/graph/pll-graph.ts`. Types are co-located in the same file (they are graph-specific and do not belong in `src/lib/cube/types.ts`). The `Permutation` type and helper functions are not exported — they are implementation details of the computation.

## Relationship to Existing Types

`pll-graph.ts` consumes `PermutationArrow` and `PiecePosition` from `src/lib/cube/types.ts` and `PLL_ALGORITHMS` from `src/lib/data/pll.ts`. It does not depend on the 54-sticker `CubeState` model — the graph operates entirely on the 8-position top-face permutation space, which is a strict subset of the full cube state.
