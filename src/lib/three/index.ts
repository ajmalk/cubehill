/**
 * Three.js rendering layer public API.
 *
 * All classes here must only be instantiated client-side (inside onMount).
 * See docs/technical/rendering.md for the architecture overview.
 */

export { CubeScene } from './CubeScene.js';
export { CubeMesh } from './CubeMesh.js';
export { CubeAnimator, ANIMATION_DURATION } from './CubeAnimator.js';
export { createOrbitControls, OrbitControls } from './controls.js';
export type { AnimationSpeed, AnimationState } from './CubeAnimator.js';
