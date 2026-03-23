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

/**
 * Generation counter for the play loop.
 *
 * Each call to play() captures the current generation. After every awaited
 * animation, the loop compares its captured generation to the current one.
 * If they differ, pause() or _stopPlay() was called — the loop bails out
 * immediately without touching state. This closes the race window where the
 * while-loop condition was already read before pause() set its flags.
 */
let playGeneration = 0;

/**
 * Whether the play loop is currently awaiting an in-flight animation.
 *
 * Set to true just before `await animator.animate()` and cleared afterward.
 * stepForward() reads this to decide whether it needs to apply a move itself:
 * if an animation is already in-flight, the play loop already advanced
 * cubeState and stepIndex — stepForward() must not do so again.
 */
let animationInFlight = false;

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
  playGeneration++;
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
 *
 * If a play() animation is currently in-flight, the play loop has already
 * advanced cubeState and stepIndex for this move. In that case we only
 * cancel future play iterations (via playGeneration++) and skip the state
 * mutation — applying it again would cause a double-advance (Bug cubehill-exr).
 *
 * If no animation is in-flight, we apply the move ourselves and trigger a
 * new animation.
 */
function stepForward(): void {
  if (stepIndex >= moves.length) return;

  if (animationInFlight) {
    // The play loop already applied this move to cubeState/stepIndex and
    // started the animation. Cancel future play iterations but let the
    // current animation finish cleanly — do NOT apply the move again.
    _stopPlay();
    playbackStatus = 'idle';
    return;
  }

  // No animation in-flight: stop any lingering play state, then advance.
  _stopPlay();
  playbackStatus = 'idle';

  // Save current state for undo
  history = [...history, [...cubeState]];

  const move = moves[stepIndex];
  cubeState = applyMove(cubeState, move);
  stepIndex = stepIndex + 1;

  // Animate visually, passing the store's authoritative post-move state so the
  // animator does not need to independently recompute it (eliminates dual-state bug).
  animator?.animate(move, [...cubeState]);
}

/**
 * Step the cube back one move by restoring from history.
 *
 * Animates the inverse of the move being undone so the face turn plays
 * visually in reverse. The prevState (post-undo) is passed as the
 * authoritative targetState so the animator re-colors correctly after
 * the animation completes.
 */
function stepBack(): void {
  if (stepIndex === 0 || history.length === 0) return;

  // Stop any in-progress playback before manipulating state. Without this,
  // the play() async loop could still be holding a stuck await on a
  // cancelled animation promise, leaving isPlaying=true after the step.
  _stopPlay();
  playbackStatus = 'idle';

  // The move being undone is at stepIndex - 1 (before we decrement).
  const moveBeingUndone = moves[stepIndex - 1];

  const prevState = history[history.length - 1];
  history = history.slice(0, -1);
  cubeState = [...prevState];
  stepIndex = stepIndex - 1;

  // Animate the inverse of the undone move so the face turns visually in reverse.
  // Pass prevState as the authoritative post-undo state for re-coloring.
  if (animator && moveBeingUndone) {
    const [inverseMove] = invertAlgorithm([moveBeingUndone]);
    animator.animate(inverseMove, [...prevState]);
  }
}

/**
 * Start auto-playback. Runs an async loop, awaiting each animation.
 *
 * Race condition fix (cubehill-9me): each call to play() captures a
 * generation token. After every awaited animation the loop checks whether
 * its generation is still current. If pause() or _stopPlay() was called
 * while the animation was in-flight, playGeneration will have been
 * incremented and the stale loop exits immediately without touching state.
 */
async function play(): Promise<void> {
  if (moves.length === 0) return;
  if (stepIndex >= moves.length) reset();

  isPlaying = true;
  playbackStatus = 'playing';
  // Claim this generation. Any concurrent or stale loop from a previous
  // play() call will see a mismatched generation and bail out.
  const myGeneration = ++playGeneration;

  while (stepIndex < moves.length) {
    // Check cancellation at the top of every iteration.
    if (playGeneration !== myGeneration) return;

    // Save state to history before applying move
    history = [...history, [...cubeState]];

    const move = moves[stepIndex];
    cubeState = applyMove(cubeState, move);
    stepIndex = stepIndex + 1;

    // Signal that an animation is in-flight so stepForward() can detect it.
    animationInFlight = true;
    try {
      // Animate and wait for completion, passing the store's authoritative
      // post-move state so the animator uses it for re-coloring (eliminates
      // dual-state bug cubehill-u6u).
      if (animator) {
        await animator.animate(move, [...cubeState]);
      } else {
        // No animator: just advance at the configured speed
        await _sleep(SPEED_MS[speed]);
      }
    } finally {
      animationInFlight = false;
    }

    // After the await, re-check cancellation before the next iteration.
    // This is the critical window: pause() may have fired while we were
    // awaiting. If our generation is stale we exit without setting isPlaying.
    if (playGeneration !== myGeneration) return;
  }

  // Loop completed all moves normally.
  isPlaying = false;
  playbackStatus = stepIndex >= moves.length ? 'idle' : 'paused';
}

/**
 * Pause auto-playback.
 *
 * Incrementing playGeneration immediately invalidates the current play loop.
 * Even if the loop is mid-await it will detect the stale generation on the
 * next check and exit without re-entering the while body.
 */
function pause(): void {
  playGeneration++;
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
  playGeneration++;
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
