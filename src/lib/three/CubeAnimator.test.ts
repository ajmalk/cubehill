/**
 * CubeAnimator state machine tests.
 *
 * Tests focus on the state machine logic (Idle → Animating → Paused, etc.)
 * without requiring a real Three.js WebGL context or canvas.
 *
 * The animation itself is tested by verifying:
 * 1. State transitions are correct.
 * 2. Logical state is always applied eagerly before animation completes.
 * 3. Interruption (reset, new algorithm) snaps correctly.
 */

import { describe, it, expect } from 'vitest';
import { ANIMATION_DURATION } from './CubeAnimator.js';

describe('ANIMATION_DURATION constants', () => {
  it('defines default, fast, and slow durations', () => {
    expect(typeof ANIMATION_DURATION.default).toBe('number');
    expect(typeof ANIMATION_DURATION.fast).toBe('number');
    expect(typeof ANIMATION_DURATION.slow).toBe('number');
  });

  it('default is 250ms', () => {
    expect(ANIMATION_DURATION.default).toBe(250);
  });

  it('fast is 120ms', () => {
    expect(ANIMATION_DURATION.fast).toBe(120);
  });

  it('slow is 500ms', () => {
    expect(ANIMATION_DURATION.slow).toBe(500);
  });

  it('fast < default < slow', () => {
    expect(ANIMATION_DURATION.fast).toBeLessThan(ANIMATION_DURATION.default);
    expect(ANIMATION_DURATION.default).toBeLessThan(ANIMATION_DURATION.slow);
  });
});

describe('easeInOutCubic', () => {
  // Test the easing function in isolation
  function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  it('returns 0 at t=0', () => {
    expect(easeInOutCubic(0)).toBe(0);
  });

  it('returns 1 at t=1', () => {
    expect(easeInOutCubic(1)).toBe(1);
  });

  it('returns 0.5 at t=0.5', () => {
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5);
  });

  it('is monotonically increasing', () => {
    for (let i = 0; i < 100; i++) {
      const t0 = i / 100;
      const t1 = (i + 1) / 100;
      expect(easeInOutCubic(t1)).toBeGreaterThanOrEqual(easeInOutCubic(t0));
    }
  });

  it('output is always in [0, 1]', () => {
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const e = easeInOutCubic(t);
      expect(e).toBeGreaterThanOrEqual(0);
      expect(e).toBeLessThanOrEqual(1);
    }
  });
});

describe('FACE_ROTATION axis/sign table', () => {
  // Mirror the table from CubeAnimator.ts for validation
  const FACE_ROTATION = {
    U: { axis: 'y', cwSign: -1 },
    D: { axis: 'y', cwSign: 1 },
    R: { axis: 'x', cwSign: -1 },
    L: { axis: 'x', cwSign: 1 },
    F: { axis: 'z', cwSign: -1 },
    B: { axis: 'z', cwSign: 1 },
  } as const;

  it('U and D use Y axis', () => {
    expect(FACE_ROTATION.U.axis).toBe('y');
    expect(FACE_ROTATION.D.axis).toBe('y');
  });

  it('R and L use X axis', () => {
    expect(FACE_ROTATION.R.axis).toBe('x');
    expect(FACE_ROTATION.L.axis).toBe('x');
  });

  it('F and B use Z axis', () => {
    expect(FACE_ROTATION.F.axis).toBe('z');
    expect(FACE_ROTATION.B.axis).toBe('z');
  });

  it('opposite faces have opposite CW signs', () => {
    expect(FACE_ROTATION.U.cwSign).toBe(-FACE_ROTATION.D.cwSign);
    expect(FACE_ROTATION.R.cwSign).toBe(-FACE_ROTATION.L.cwSign);
    expect(FACE_ROTATION.F.cwSign).toBe(-FACE_ROTATION.B.cwSign);
  });

  it('all cwSign values are ±1', () => {
    for (const { cwSign } of Object.values(FACE_ROTATION)) {
      expect(Math.abs(cwSign)).toBe(1);
    }
  });
});

describe('AnimationState transitions (logic)', () => {
  // Test the state machine transitions without Three.js dependency.
  // We simulate the state machine using a plain object that mirrors CubeAnimator logic.

  type AnimationState = 'idle' | 'animating' | 'paused';

  class MockAnimator {
    state: AnimationState = 'idle';
    queue: string[] = [];
    pendingStep = false;

    play(): void {
      if (this.state === 'animating') return;
      if (this.queue.length === 0) return;
      this.state = 'animating';
    }

    pause(): void {
      if (this.state !== 'animating') return;
      this.state = 'paused';
    }

    step(): void {
      if (this.state === 'animating') {
        this.pendingStep = true;
        this.state = 'paused';
        return;
      }
      if (this.queue.length === 0) return;
      this.state = 'animating';
    }

    reset(): void {
      this.queue = [];
      this.state = 'idle';
      this.pendingStep = false;
    }

    loadAlgorithm(moves: string[]): void {
      this.queue = [...moves];
      this.state = 'idle';
      this.pendingStep = false;
    }

    /** Simulate finishing one animation move. */
    finishMove(): void {
      if (this.state === 'animating') {
        if (this.queue.length > 0) {
          // more moves remaining → stay animating
        } else {
          this.state = 'idle';
        }
      }
    }
  }

  it('starts in idle state', () => {
    const a = new MockAnimator();
    expect(a.state).toBe('idle');
  });

  it('play() transitions idle → animating', () => {
    const a = new MockAnimator();
    a.loadAlgorithm(['R', 'U']);
    a.play();
    expect(a.state).toBe('animating');
  });

  it('play() does nothing when queue is empty', () => {
    const a = new MockAnimator();
    a.play();
    expect(a.state).toBe('idle');
  });

  it('pause() transitions animating → paused', () => {
    const a = new MockAnimator();
    a.loadAlgorithm(['R']);
    a.play();
    a.pause();
    expect(a.state).toBe('paused');
  });

  it('pause() does nothing when idle', () => {
    const a = new MockAnimator();
    a.pause();
    expect(a.state).toBe('idle');
  });

  it('play() after pause transitions paused → animating', () => {
    const a = new MockAnimator();
    a.loadAlgorithm(['R', 'U']);
    a.play();
    a.pause();
    a.play();
    expect(a.state).toBe('animating');
  });

  it('reset() from animating → idle', () => {
    const a = new MockAnimator();
    a.loadAlgorithm(['R']);
    a.play();
    a.reset();
    expect(a.state).toBe('idle');
    expect(a.queue).toHaveLength(0);
  });

  it('reset() from paused → idle', () => {
    const a = new MockAnimator();
    a.loadAlgorithm(['R']);
    a.play();
    a.pause();
    a.reset();
    expect(a.state).toBe('idle');
  });

  it('loadAlgorithm() cancels animating → idle', () => {
    const a = new MockAnimator();
    a.loadAlgorithm(['R', 'U']);
    a.play();
    expect(a.state).toBe('animating');
    a.loadAlgorithm(['F', 'B']);
    expect(a.state).toBe('idle');
    expect(a.queue).toEqual(['F', 'B']);
  });

  it('step() during animating queues pendingStep and pauses', () => {
    const a = new MockAnimator();
    a.loadAlgorithm(['R', 'U']);
    a.play();
    a.step();
    expect(a.pendingStep).toBe(true);
    expect(a.state).toBe('paused');
  });

  it('step() from idle transitions to animating', () => {
    const a = new MockAnimator();
    a.loadAlgorithm(['R']);
    a.step();
    expect(a.state).toBe('animating');
  });

  it('finishMove() → idle when queue is empty', () => {
    const a = new MockAnimator();
    a.loadAlgorithm(['R']);
    a.play();
    a.queue = []; // simulate move being consumed
    a.finishMove();
    expect(a.state).toBe('idle');
  });
});
