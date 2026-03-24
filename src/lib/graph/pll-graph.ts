/**
 * PLL State Transition Graph computation module.
 *
 * Computes the directed graph of PLL state transitions:
 * "If I'm in PLL state A and apply PLL algorithm B (with AUF pre-rotation), what state do I end up in?"
 *
 * The graph has 22 nodes — 21 PLL cases plus the solved state.
 * See docs/technical/pll-graph.md for the full specification.
 *
 * Permutation model:
 * - Each permutation is an 8-element array mapping the 8 top-face slots (excluding center 4).
 * - Array indices: [0→pos0, 1→pos1, 2→pos2, 3→pos3, 4→pos5, 5→pos6, 6→pos7, 7→pos8]
 * - Values are position numbers (0,1,2,3,5,6,7,8): perm[idx] = "slot is filled from this position"
 * - Identity: [0, 1, 2, 3, 5, 6, 7, 8]
 * - The `permutation` field on PllAlgorithm IS the STATE (cube configuration before solving).
 * - The algorithm EFFECT is the INVERSE of the permutation (applying the algorithm solves the state).
 */

import type { PiecePosition } from '$lib/cube/types.js';
import { PLL_ALGORITHMS } from '$lib/data/pll.js';

// ── Types ─────────────────────────────────────────────────────────────────────

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
const IDENTITY = [...POSITIONS];

/** Map a position value (0-8, skipping 4) to an array index (0-7). */
function posToIdx(pos: number): number {
  return pos < 4 ? pos : pos - 1;
}

// ── Core permutation functions ────────────────────────────────────────────────

/**
 * Compose two permutations: apply `a` first, then `b`.
 * result[i] = a[posToIdx(b[i])]
 */
function composePerm(a: number[], b: number[]): number[] {
  return b.map((src) => a[posToIdx(src)]);
}

/**
 * Invert a permutation. If perm says "slot i filled from position P",
 * then inv says "slot at position P filled from position POSITIONS[i]".
 */
function invertPerm(perm: number[]): number[] {
  const inv = [...IDENTITY];
  for (let i = 0; i < perm.length; i++) {
    inv[posToIdx(perm[i])] = POSITIONS[i];
  }
  return inv;
}

// ── U rotation permutations ──────────────────────────────────────────────────

// Clockwise U from above: corners 0→6→8→2→0, edges 1→3→7→5→1
// In "slot filled from": slot 0 from 2, slot 2 from 8, slot 6 from 0, slot 8 from 6,
//                        slot 1 from 5, slot 3 from 1, slot 5 from 7, slot 7 from 3
const U_PERM = [2, 5, 8, 1, 7, 0, 3, 6];
const U2_PERM = composePerm(U_PERM, U_PERM);
const U_PRIME_PERM = composePerm(U2_PERM, U_PERM);

const AUF_PERMS: Array<{ label: 'none' | 'U' | 'U2' | "U'"; perm: number[] }> = [
  { label: 'none', perm: IDENTITY },
  { label: 'U', perm: U_PERM },
  { label: 'U2', perm: U2_PERM },
  { label: "U'", perm: U_PRIME_PERM },
];

// ── Lookup table ─────────────────────────────────────────────────────────────

/**
 * Build a lookup table: permutation string → case ID.
 * Maps every recognizable state (at all 4 AUF rotations) to its case ID.
 */
function buildStateLookup(): Map<string, string> {
  const lookup = new Map<string, string>();

  // Add solved state at all 4 AUF rotations
  for (const { perm: auf } of AUF_PERMS) {
    lookup.set(composePerm(auf, IDENTITY).join(','), 'solved');
  }

  // For each PLL case, the permutation IS the state — add all 4 AUF rotations
  for (const alg of PLL_ALGORITHMS) {
    const statePerm = alg.permutation;
    for (const { perm: auf } of AUF_PERMS) {
      const rotated = composePerm(auf, statePerm);
      const key = rotated.join(',');
      if (!lookup.has(key)) {
        lookup.set(key, alg.id);
      }
    }
  }

  return lookup;
}

const STATE_LOOKUP = buildStateLookup();

// ── Graph computation ────────────────────────────────────────────────────────

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

  // Build source states: solved = identity, each PLL case = its permutation (already a state)
  const sourceStates = new Map<string, number[]>();
  sourceStates.set('solved', IDENTITY);
  for (const alg of PLL_ALGORITHMS) {
    sourceStates.set(alg.id, alg.permutation);
  }

  // Pre-compute algorithm effects (inverse of state permutation)
  const algEffects = PLL_ALGORITHMS.map((alg) => ({
    alg,
    effect: invertPerm(alg.permutation),
  }));

  // Collect raw edges
  const rawEdges = new Map<string, PllGraphEdgeAlgorithm[]>();

  for (const [sourceId, sourceState] of sourceStates) {
    for (const { label: aufLabel, perm: aufPerm } of AUF_PERMS) {
      for (const { alg, effect: algEffect } of algEffects) {
        const result = composePerm(sourceState, composePerm(aufPerm, algEffect));
        const targetId = STATE_LOOKUP.get(result.join(','));

        if (targetId === undefined) {
          // Should not happen with correct permutations
          continue;
        }

        const edgeKey = `${sourceId}::${targetId}`;
        if (!rawEdges.has(edgeKey)) rawEdges.set(edgeKey, []);
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
