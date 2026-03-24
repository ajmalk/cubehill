/**
 * PLL State Transition Graph computation module.
 *
 * Computes the directed graph of PLL state transitions:
 * "If I'm in PLL state A and apply PLL algorithm B (with AUF pre-rotation), what state do I end up in?"
 *
 * The graph has 22 nodes — 21 PLL cases plus the solved state.
 * See docs/technical/pll-graph.md for the full specification.
 */

import type { PermutationArrow, PiecePosition } from '$lib/cube/types.js';
import { PLL_ALGORITHMS } from '$lib/data/pll.js';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Maps position → source position (where does slot i get filled from).
 * Length 8. Positions: [0,1,2,3,5,6,7,8] (center 4 excluded).
 * Array index mapping: idx 0→pos 0, idx 1→pos 1, idx 2→pos 2,
 * idx 3→pos 3, idx 4→pos 5, idx 5→pos 6, idx 6→pos 7, idx 7→pos 8.
 */
type Permutation = number[];

export interface PllGraphNode {
  id: string;
  name: string;
  group: string;
  isSolved: boolean;
}

export interface PllGraphEdgeAlgorithm {
  algorithmId: string;
  algorithmName: string;
  auf: 'none' | 'U' | 'U2' | "U'";
}

export interface PllGraphEdge {
  source: string;
  target: string;
  algorithms: PllGraphEdgeAlgorithm[];
  count: number;
}

export interface PllGraph {
  nodes: PllGraphNode[];
  edges: PllGraphEdge[];
}

// ── Position helpers ──────────────────────────────────────────────────────────

const POSITIONS: PiecePosition[] = [0, 1, 2, 3, 5, 6, 7, 8];

function posToIdx(pos: PiecePosition): number {
  // Skip center position 4
  return pos < 4 ? pos : pos - 1;
}

// Identity permutation: each slot filled from itself
const IDENTITY: Permutation = POSITIONS.map((p) => p);

// U rotation permutation (clockwise):
// corners: 0→2→8→6→0 (slot 0 filled from 6, slot 2 from 0, slot 8 from 2, slot 6 from 8)
// edges: 1→5→7→3→1 (slot 1 from 3, slot 5 from 1, slot 7 from 5, slot 3 from 7)
const U_PERM: Permutation = (() => {
  const p = [...IDENTITY];
  // corners cycle: 0←6, 2←0, 8←2, 6←8
  p[posToIdx(0)] = 6;
  p[posToIdx(2)] = 0;
  p[posToIdx(8)] = 2;
  p[posToIdx(6)] = 8;
  // edges cycle: 1←3, 5←1, 7←5, 3←7
  p[posToIdx(1)] = 3;
  p[posToIdx(5)] = 1;
  p[posToIdx(7)] = 5;
  p[posToIdx(3)] = 7;
  return p;
})();

// ── Core functions ────────────────────────────────────────────────────────────

/**
 * Convert a PermutationArrow[] pattern to internal Permutation type.
 * Inverts "from→to" arrows into the "slot←source" convention.
 * Unaffected positions map to themselves (identity).
 */
export function patternToPermutation(pattern: PermutationArrow[]): Permutation {
  const perm = [...IDENTITY];
  for (const arrow of pattern) {
    // arrow.from moves to arrow.to means slot `to` is filled from `from`
    perm[posToIdx(arrow.to as PiecePosition)] = arrow.from;
  }
  return perm;
}

/**
 * Compose two permutations: apply `a` first, then `b`.
 * compose(a, b)[i] = a[b[i]]
 * Does not mutate inputs.
 */
export function composePerm(a: Permutation, b: Permutation): Permutation {
  return b.map((src) => {
    // b[i] gives us the position (as value), we need its index in `a`
    const srcIdx = posToIdx(src as PiecePosition);
    return a[srcIdx];
  });
}

function permEqual(a: Permutation, b: Permutation): boolean {
  return a.every((v, i) => v === b[i]);
}

// Pre-compute AUF permutations
const U2_PERM = composePerm(U_PERM, U_PERM);
const U_PRIME_PERM = composePerm(U_PERM, U2_PERM);

const AUF_PERMS: Array<{ label: 'none' | 'U' | 'U2' | "U'"; perm: Permutation }> = [
  { label: 'none', perm: IDENTITY },
  { label: 'U', perm: U_PERM },
  { label: 'U2', perm: U2_PERM },
  { label: "U'", perm: U_PRIME_PERM },
];

// Pre-compute algorithm permutations from pattern data
const ALG_PERMS = PLL_ALGORITHMS.map((alg) => ({
  alg,
  perm: patternToPermutation(alg.pattern),
}));

/**
 * Identify a permutation as a PLL case id, "solved", or null.
 * Tries all 4 AUF rotations of each known case.
 */
export function identifyPllCase(perm: Permutation): string | null {
  if (permEqual(perm, IDENTITY)) return 'solved';

  for (const { alg, perm: algPerm } of ALG_PERMS) {
    for (const { perm: aufPerm } of AUF_PERMS) {
      // Apply auf rotation on top of the alg perm and see if it matches
      const rotated = composePerm(algPerm, aufPerm);
      if (permEqual(perm, rotated)) return alg.id;
    }
  }
  return null;
}

/**
 * Compute the full PLL transition graph.
 * For each (source state, AUF, algorithm) triple, computes the resulting state.
 */
export function computePllGraph(): PllGraph {
  // Build nodes
  const nodes: PllGraphNode[] = [
    { id: 'solved', name: 'Solved', group: 'Solved', isSolved: true },
    ...PLL_ALGORITHMS.map((alg) => ({
      id: alg.id,
      name: alg.name,
      group: alg.group,
      isSolved: false,
    })),
  ];

  // Build source permutations: solved = identity, each PLL case = its own perm
  const sourcePerms: Map<string, Permutation> = new Map();
  sourcePerms.set('solved', IDENTITY);
  for (const { alg, perm } of ALG_PERMS) {
    sourcePerms.set(alg.id, perm);
  }

  // Collect raw edges: key = "source::target", value = list of (algId, algName, auf)
  const rawEdges: Map<string, PllGraphEdgeAlgorithm[]> = new Map();

  for (const [sourceId, sourcePerm] of sourcePerms) {
    for (const { label: aufLabel, perm: aufPerm } of AUF_PERMS) {
      for (const { alg, perm: algPerm } of ALG_PERMS) {
        // Combined: start in sourceState, apply AUF, then apply algorithm
        // compose(sourcePerm, compose(aufPerm, algPerm))
        const combined = composePerm(sourcePerm, composePerm(aufPerm, algPerm));
        const targetId = identifyPllCase(combined);
        if (targetId === null) continue; // shouldn't happen for valid perms

        const edgeKey = `${sourceId}::${targetId}`;
        if (!rawEdges.has(edgeKey)) {
          rawEdges.set(edgeKey, []);
        }
        rawEdges.get(edgeKey)!.push({
          algorithmId: alg.id,
          algorithmName: alg.name,
          auf: aufLabel,
        });
      }
    }
  }

  // Build collapsed edges
  const edges: PllGraphEdge[] = [];
  for (const [key, algorithms] of rawEdges) {
    const [source, target] = key.split('::');
    edges.push({ source, target, algorithms, count: algorithms.length });
  }

  return { nodes, edges };
}

/** Pre-computed graph — import this instead of calling computePllGraph() at render time. */
export const pllGraph: PllGraph = computePllGraph();
