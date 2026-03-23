/**
 * controls.ts
 *
 * OrbitControls wrapper with project-specific settings.
 * Must only be instantiated client-side (inside onMount).
 *
 * See designs/phase3-rendering-parameters.md §3 Camera / Orbit Controls.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export { OrbitControls };

/**
 * Create and configure OrbitControls for the cube viewer.
 *
 * Settings:
 * - Damping enabled, factor 0.08 (smooth deceleration)
 * - Auto-rotate off
 * - Zoom enabled, min distance 4, max distance 12
 * - Pan disabled (cube stays centered)
 */
export function createOrbitControls(camera: THREE.Camera, domElement: HTMLElement): OrbitControls {
  const controls = new OrbitControls(camera, domElement);

  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  controls.autoRotate = false;

  controls.minDistance = 4.0;
  controls.maxDistance = 12.0;

  controls.enablePan = false;

  controls.enableZoom = true;

  return controls;
}
