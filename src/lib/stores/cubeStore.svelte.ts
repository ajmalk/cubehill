/**
 * cubeStore.svelte.ts
 *
 * Manages cube state and algorithm playback using Svelte 5 runes.
 *
 * Architecture:
 *  - The store owns the logical state: cubeState, stepIndex, history, isPlaying.
 *  - The CubeAnimator (created in CubeViewer.onMount) owns the visual animation.
 *  - CubeViewer calls cubeStore.setAnimator(animator) on mount.
 *  - The store delegates all animation to the animator.
 *
 * Play loop:
 *  - play() starts an async loop that calls animator.animate(move) for each step.
 *  - Each animation awaits completion before advancing. This ensures animations
 *    never overlap regardless of animation speed.
 *
 * stepBack:
 *  - Restores previous state from history. Calls animator.loadAlgorithm() with
 *    the remaining moves and the restored state so the animator is in sync.
 *
 * See docs/technical/components.md "cubeStore" section.
 */

import {
  solved,
  parseNotation,
  applyAlgorithm,
  invertAlgorithm,
  applyMove,
} from '$lib/cube/index.js';
import type { Move } from '$lib/cube/index.js';
import type { CubeAnimator, AnimationSpeed } from '$lib/three/CubeAnimator.js';

// ---------------------------------------------------------------------------
// Speed mapping
// ---------------------------------------------------------------------------

export type SpeedSetting = 'slow' | 'normal' | 'fast';

export const SPEED_MS: Record<SpeedSetting, number> = {
  slow: 500,
  normal: 250,
  fast: 120,
};

/** Map cubeStore SpeedSetting to CubeAnimator AnimationSpeed key. */
const SPEED_TO_ANIMATOR: Record<SpeedSetting, AnimationSpeed> = {
  slow: 'slow',
  normal: 'default',
  fast: 'fast',
};

// ---------------------------------------------------------------------------
// Module-level reactive state (Svelte 5 runes)
// ---------------------------------------------------------------------------

/** Reference to the CubeAnimator — set by CubeViewer after onMount. */
let animator: CubeAnimator | null = null;

/** Current cube state (number[54]). Starts solved. */
let cubeState = $state<number[]>(solved());

/** Parsed moves of the loaded algorithm. */
let moves = $state<Move[]>([]);

/** Notation tokens as strings (parallel to moves[]) for the UI display. */
let moveTokens = $state<string[]>([]);

/** The initial (pre-algorithm) state set when loadAlgorithm() is called. */
let initialState = $state<number[]>(solved());

/** Current step index: 0 means no moves have been applied yet. */
let stepIndex = $state(0);

/** Whether auto-playback is running. */
let isPlaying = $state(false);

/** Playback status. */
let playbackStatus = $state<'idle' | 'playing' | 'paused'>('idle');

/** Animation speed setting. */
let speed = $state<SpeedSetting>('normal');

/** History stack: history[i] = cube state before move[i] was applied. */
let history = $state<number[][]>([]);

/** Flag to cancel the play loop. */
let cancelPlay = false;

// ---------------------------------------------------------------------------
// Animator registration
// ---------------------------------------------------------------------------

/**
 * Register the CubeAnimator instance. Called by CubeViewer after onMount.
 * Also loads the current algorithm into the animator if one is set.
 */
function setAnimator(anim: CubeAnimator): void {
  animator = anim;
  anim.setSpeed(SPEED_TO_ANIMATOR[speed]);
  if (moves.length > 0) {
    anim.loadAlgorithm(moves, cubeState);
  }
}

/**
 * Unregister the animator. Called by CubeViewer on onDestroy.
 */
function clearAnimator(): void {
  cancelPlay = true;
  animator = null;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Parse a notation string and set up the cube in the pre-algorithm state.
 *
 * The "starting state" is a solved cube with the algorithm inverted applied,
 * so stepping through all moves returns to solved — the standard learning view.
 */
function loadAlgorithm(notation: string): void {
  _stopPlay();

  const parsed = parseNotation(notation);
  const tokens = notation.trim() === '' ? [] : notation.trim().split(/\s+/);

  // Invert and apply to solved cube to get the starting state
  const inverted = invertAlgorithm(parsed);
  const start = applyAlgorithm(solved(), inverted);

  moves = parsed;
  moveTokens = tokens;
  initialState = [...start];
  cubeState = [...start];
  stepIndex = 0;
  history = [];
  isPlaying = false;
  playbackStatus = 'idle';

  // Sync animator
  animator?.loadAlgorithm(parsed, [...start]);
}

/**
 * Step the cube forward one move.
 */
function stepForward(): void {
  if (stepIndex >= moves.length) return;

  // Save current state for undo
  history = [...history, [...cubeState]];

  const move = moves[stepIndex];
  cubeState = applyMove(cubeState, move);
  stepIndex = stepIndex + 1;

  // Animate visually
  animator?.animate(move);
}

/**
 * Step the cube back one move by restoring from history.
 */
function stepBack(): void {
  if (stepIndex === 0 || history.length === 0) return;

  const prevState = history[history.length - 1];
  history = history.slice(0, -1);
  cubeState = [...prevState];
  stepIndex = stepIndex - 1;

  // Reload the animator with remaining moves from the restored position.
  // This keeps the animator queue in sync.
  if (animator) {
    const remainingMoves = moves.slice(stepIndex);
    animator.loadAlgorithm(remainingMoves, [...prevState]);
  }
}

/**
 * Start auto-playback. Runs an async loop, awaiting each animation.
 */
async function play(): Promise<void> {
  if (moves.length === 0) return;
  if (stepIndex >= moves.length) reset();

  isPlaying = true;
  playbackStatus = 'playing';
  cancelPlay = false;

  while (stepIndex < moves.length && !cancelPlay && isPlaying) {
    // Save state to history before applying move
    history = [...history, [...cubeState]];

    const move = moves[stepIndex];
    cubeState = applyMove(cubeState, move);
    stepIndex = stepIndex + 1;

    // Animate and wait for completion
    if (animator) {
      await animator.animate(move);
    } else {
      // No animator: just advance at the configured speed
      await _sleep(SPEED_MS[speed]);
    }
  }

  if (!cancelPlay) {
    isPlaying = false;
    playbackStatus = stepIndex >= moves.length ? 'idle' : 'paused';
  }
}

/**
 * Pause auto-playback.
 */
function pause(): void {
  cancelPlay = true;
  isPlaying = false;
  if (playbackStatus === 'playing') {
    playbackStatus = 'paused';
  }
}

/**
 * Reset the cube to the initial (pre-algorithm) state.
 */
function reset(): void {
  _stopPlay();
  cubeState = [...initialState];
  stepIndex = 0;
  history = [];
  isPlaying = false;
  playbackStatus = 'idle';

  // Sync animator
  animator?.loadAlgorithm(moves, [...initialState]);
}

/**
 * Set the animation speed.
 */
function setSpeed(newSpeed: SpeedSetting): void {
  speed = newSpeed;
  animator?.setSpeed(SPEED_TO_ANIMATOR[newSpeed]);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function _stopPlay(): void {
  cancelPlay = true;
  isPlaying = false;
}

function _sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const cubeStore = {
  // Reactive state getters
  get cubeState() {
    return cubeState;
  },
  get moves() {
    return moves;
  },
  get moveTokens() {
    return moveTokens;
  },
  get stepIndex() {
    return stepIndex;
  },
  get isPlaying() {
    return isPlaying;
  },
  get playbackStatus() {
    return playbackStatus;
  },
  get speed() {
    return speed;
  },
  get history() {
    return history;
  },

  // Animator integration
  setAnimator,
  clearAnimator,

  // Actions
  loadAlgorithm,
  stepForward,
  stepBack,
  play,
  pause,
  reset,
  setSpeed,
};
