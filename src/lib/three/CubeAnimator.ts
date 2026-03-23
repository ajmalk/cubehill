/**
 * CubeAnimator.ts
 *
 * Handles face-turn animations and sequential algorithm playback.
 *
 * Strategy:
 *   1. getFaceCubies() returns the 9 cubies on the turning face.
 *   2. A temporary TurnGroup is created, and the 9 cubies are reparented into it.
 *   3. The group rotates around the correct axis for the specified duration.
 *   4. On complete: cubies are reparented back, transforms reset, colors updated.
 *
 * Drift prevention: after EVERY animation, all cubie transforms are reset to
 * canonical integer positions, and colors are re-read from the logical state.
 *
 * State machine: Idle → Animating → Idle/Paused, Paused → Animating/Idle.
 * See docs/technical/rendering.md §Animation State Machine.
 *
 * See designs/phase3-rendering-parameters.md §5 Animation for timing values.
 */

import * as THREE from 'three';
import type { Move, FaceMove } from '$lib/cube/types.js';
import { applyMove } from '$lib/cube/moves.js';
import { CubeMesh } from './CubeMesh.js';
import { CubeScene } from './CubeScene.js';

// ---------------------------------------------------------------------------
// Animation timing (from designs/phase3-rendering-parameters.md)
// ---------------------------------------------------------------------------

/** Duration in milliseconds by speed level. */
export const ANIMATION_DURATION = {
  default: 250,
  fast: 120,
  slow: 500,
} as const;

export type AnimationSpeed = keyof typeof ANIMATION_DURATION;

// ---------------------------------------------------------------------------
// Axis and direction table (from docs/technical/rendering.md)
//
// Face | Axis | CW rotation sign (modifier '')
// U    | Y    | -1 (negative Y rotation)
// D    | Y    | +1 (positive Y rotation)
// R    | X    | -1 (negative X rotation)
// L    | X    | +1 (positive X rotation)
// F    | Z    | -1 (negative Z rotation)
// B    | Z    | +1 (positive Z rotation)
//
// Counter-clockwise (prime) reverses the sign.
// Double (2) uses ±Math.PI regardless of sign direction.
// ---------------------------------------------------------------------------

const FACE_ROTATION: Record<FaceMove, { axis: 'x' | 'y' | 'z'; cwSign: number }> = {
  U: { axis: 'y', cwSign: -1 },
  D: { axis: 'y', cwSign: 1 },
  R: { axis: 'x', cwSign: -1 },
  L: { axis: 'x', cwSign: 1 },
  F: { axis: 'z', cwSign: -1 },
  B: { axis: 'z', cwSign: 1 },
};

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------

/** Cubic ease-in-out: t ∈ [0, 1] → eased t. */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ---------------------------------------------------------------------------
// AnimationState machine
// ---------------------------------------------------------------------------

export type AnimationState = 'idle' | 'animating' | 'paused';

// ---------------------------------------------------------------------------
// CubeAnimator
// ---------------------------------------------------------------------------

export class CubeAnimator {
  private readonly scene: THREE.Scene;
  private readonly mesh: CubeMesh;

  // Logical cube state — the single source of truth
  private logicalState: number[];

  // Playback
  private moveQueue: Move[] = [];
  private state: AnimationState = 'idle';
  private speed: AnimationSpeed = 'default';

  // Active animation frame handle
  private animFrameId: number | null = null;

  // Pending step (rapid click queuing)
  private pendingStep = false;

  constructor(scene: THREE.Scene | CubeScene, mesh: CubeMesh, initialState: number[]) {
    this.scene = scene instanceof CubeScene ? scene.getScene() : scene;
    this.mesh = mesh;
    this.logicalState = [...initialState];
    this.mesh.updateColors(this.logicalState);
  }

  // -------------------------------------------------------------------------
  // Public control API
  // -------------------------------------------------------------------------

  getState(): AnimationState {
    return this.state;
  }

  setSpeed(speed: AnimationSpeed): void {
    this.speed = speed;
  }

  /** Load a new algorithm. Cancels any in-progress animation. */
  loadAlgorithm(moves: Move[], initialState: number[]): void {
    this.cancelAndSnap();
    this.moveQueue = [...moves];
    this.logicalState = [...initialState];
    this.mesh.resetTransforms();
    this.mesh.updateColors(this.logicalState);
    this.state = 'idle';
  }

  /** Start playing the algorithm from the current queue position. */
  play(): void {
    if (this.state === 'animating') return;
    if (this.moveQueue.length === 0) return;
    this.state = 'animating';
    this.playNext();
  }

  /** Pause playback. In-progress animation completes naturally. */
  pause(): void {
    if (this.state !== 'animating') return;
    this.state = 'paused';
    // The current animation will finish, then playNext() will see paused and stop.
  }

  /**
   * Step forward one move.
   * If animating: queue a pending step (handled after current animation ends).
   * If idle/paused: animate the next move.
   */
  step(): void {
    if (this.state === 'animating') {
      // Rapid step: queue the next move to start after current one finishes.
      this.pendingStep = true;
      // Also pause continuous playback.
      this.state = 'paused';
      return;
    }
    if (this.moveQueue.length === 0) return;
    this.state = 'animating';
    this.playNext();
  }

  /** Reset: cancel animation, restore initial state. */
  reset(initialState: number[]): void {
    this.cancelAndSnap();
    this.moveQueue = [];
    this.logicalState = [...initialState];
    this.mesh.resetTransforms();
    this.mesh.updateColors(this.logicalState);
    this.state = 'idle';
    this.pendingStep = false;
  }

  /** Animate a single move directly (without queue). Returns a promise that resolves when done. */
  animate(move: Move): Promise<void> {
    return this.animateMove(move);
  }

  // -------------------------------------------------------------------------
  // Playback loop
  // -------------------------------------------------------------------------

  private playNext(): void {
    if (this.moveQueue.length === 0) {
      this.state = 'idle';
      return;
    }

    if (this.state === 'paused') {
      // Check if a pending step was queued
      if (this.pendingStep) {
        this.pendingStep = false;
        // Animate one move, then go back to paused
        const move = this.moveQueue.shift()!;
        this.animateMove(move).then(() => {
          // After step, stay paused
          if (this.state !== 'idle') this.state = 'paused';
        });
      }
      return;
    }

    const move = this.moveQueue.shift()!;
    this.animateMove(move).then(() => {
      // Gap between moves: 0ms (from spec)
      if (this.state === 'animating') {
        this.playNext();
      }
    });
  }

  // -------------------------------------------------------------------------
  // Single-move animation
  // -------------------------------------------------------------------------

  private animateMove(move: Move): Promise<void> {
    // Only face moves can be animated in 3D (slice moves + rotations affect all cubies).
    // For now, only animate FaceMoves. Others are snapped instantly.
    const faceMoves = new Set(['R', 'U', 'F', 'L', 'D', 'B']);
    if (!faceMoves.has(move.base) || move.wide) {
      // Snap non-face moves instantly
      this.logicalState = applyMove(this.logicalState, move);
      this.mesh.resetTransforms();
      this.mesh.updateColors(this.logicalState);
      return Promise.resolve();
    }

    const face = move.base as FaceMove;
    const { axis, cwSign } = FACE_ROTATION[face];
    const duration = ANIMATION_DURATION[this.speed];

    // Determine target angle
    let targetAngle: number;
    if (move.modifier === '') {
      // CW
      targetAngle = cwSign * (Math.PI / 2);
    } else if (move.modifier === "'") {
      // CCW
      targetAngle = -cwSign * (Math.PI / 2);
    } else {
      // Double (2): 180°
      targetAngle = Math.PI;
    }

    return new Promise<void>((resolve) => {
      // Collect face cubies and reparent into TurnGroup
      const faceCubies = this.mesh.getFaceCubies(face);
      const turnGroup = new THREE.Group();
      turnGroup.userData['isTurnGroup'] = true;
      this.scene.add(turnGroup);

      for (const cubie of faceCubies) {
        // Reparent: detach from scene, attach to turnGroup
        // Preserve world transform by converting to world space first.
        const worldPos = new THREE.Vector3();
        cubie.getWorldPosition(worldPos);
        this.scene.remove(cubie);
        turnGroup.add(cubie);
        // Restore local position (parent is now turnGroup at origin)
        cubie.position.copy(worldPos);
      }

      const startTime = performance.now();

      const onFrame = (now: number) => {
        const elapsed = now - startTime;
        const rawT = Math.min(elapsed / duration, 1);
        const t = easeInOutCubic(rawT);
        const angle = t * targetAngle;

        if (axis === 'x') turnGroup.rotation.x = angle;
        else if (axis === 'y') turnGroup.rotation.y = angle;
        else turnGroup.rotation.z = angle;

        if (rawT < 1) {
          this.animFrameId = requestAnimationFrame(onFrame);
        } else {
          this.animFrameId = null;
          this.finishAnimation(faceCubies, turnGroup);
          resolve();
        }
      };

      this.animFrameId = requestAnimationFrame(onFrame);

      // Update logical state eagerly so it's always correct
      this.logicalState = applyMove(this.logicalState, move);
    });
  }

  private finishAnimation(faceCubies: THREE.Group[], turnGroup: THREE.Group): void {
    // Reparent cubies back to scene root
    for (const cubie of faceCubies) {
      const worldPos = new THREE.Vector3();
      cubie.getWorldPosition(worldPos);
      const worldQuat = new THREE.Quaternion();
      cubie.getWorldQuaternion(worldQuat);

      turnGroup.remove(cubie);
      this.scene.add(cubie);
      cubie.position.copy(worldPos);
      cubie.quaternion.copy(worldQuat);
    }

    // Remove TurnGroup from scene
    this.scene.remove(turnGroup);

    // Drift prevention: reset all transforms to canonical and re-color
    this.mesh.resetTransforms();
    this.mesh.updateColors(this.logicalState);
  }

  // -------------------------------------------------------------------------
  // Animation cancellation (snap to final state)
  // -------------------------------------------------------------------------

  /**
   * Cancel any in-progress animation, snapping cubies to their post-move positions.
   * Logical state is already up-to-date (updated eagerly at animation start).
   */
  private cancelAndSnap(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    // Find and clean up any TurnGroups that may be in the scene
    const toRemove: THREE.Object3D[] = [];
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Group && obj !== this.scene && obj.userData['isTurnGroup']) {
        toRemove.push(obj);
      }
    });

    for (const tg of toRemove) {
      // Return cubies to scene root
      const children = [...tg.children];
      for (const child of children) {
        if (child instanceof THREE.Group) {
          const worldPos = new THREE.Vector3();
          child.getWorldPosition(worldPos);
          tg.remove(child);
          this.scene.add(child);
          child.position.copy(worldPos);
        }
      }
      this.scene.remove(tg);
    }

    // Reset transforms and re-color from logical state
    this.mesh.resetTransforms();
    this.mesh.updateColors(this.logicalState);
  }

  dispose(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }
}
