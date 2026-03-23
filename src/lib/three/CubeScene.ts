/**
 * CubeScene.ts
 *
 * Main Three.js scene entry point. Manages the scene, camera, renderer, and lights.
 * Must only be instantiated client-side (inside onMount).
 *
 * See docs/technical/rendering.md and designs/phase3-rendering-parameters.md.
 */

import * as THREE from 'three';
import { createOrbitControls } from './controls.js';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class CubeScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private animationFrameId: number | null = null;
  private visibilityHandler: () => void;

  constructor(canvas: HTMLCanvasElement) {
    // Scene
    this.scene = new THREE.Scene();

    // Camera: FOV 45, positioned at (3.5, 3.0, 3.5) looking at origin
    this.camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 100);
    this.camera.position.set(3.5, 3.0, 3.5);
    this.camera.lookAt(0, 0, 0);

    // Renderer: antialiasing, bound to provided canvas
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    // Lights
    this.setupLights();

    // OrbitControls
    this.controls = createOrbitControls(this.camera, this.renderer.domElement);

    // Background color from DaisyUI
    this.syncBackgroundFromCSS();

    // Stop rendering when tab is hidden
    this.visibilityHandler = () => {
      if (!document.hidden) {
        this.startLoop();
      } else {
        this.stopLoop();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    // Start the render loop
    this.startLoop();
  }

  private setupLights(): void {
    // Ambient light: warm white, intensity 0.6
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    // Key (directional) light: position (5, 8, 5), intensity 0.8
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = false;
    this.scene.add(keyLight);

    // Fill (directional) light: position (-3, 4, -3), intensity 0.3
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-3, 4, -3);
    fillLight.castShadow = false;
    this.scene.add(fillLight);
  }

  private syncBackgroundFromCSS(): void {
    // Read DaisyUI --b1 CSS variable for the base background color.
    // DaisyUI v5 stores --b1 as a raw oklch string (e.g. "0.2 0.02 260"),
    // not as a full color expression. Three.js cannot parse this directly.
    // Resolve via a throwaway DOM element. The element must be visible to the
    // browser layout engine — display:none elements return rgba(0,0,0,0) for
    // backgroundColor in some browsers, so we use position:fixed off-screen.
    try {
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;pointer-events:none;';
      el.className = 'bg-base-100';
      document.body.appendChild(el);
      const bg = getComputedStyle(el).backgroundColor;
      document.body.removeChild(el);

      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        this.scene.background = new THREE.Color(bg);
        return;
      }
    } catch {
      // ignore — fall through to fallback
    }

    // Final fallback: dark neutral
    this.scene.background = new THREE.Color('#1d232a');
  }

  /** Add an object to the scene. */
  add(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  /** Remove an object from the scene. */
  remove(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  /** Expose the scene for reparenting during animation. */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /** Expose the camera for controls reset. */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /** Expose the controls for external manipulation. */
  getControls(): OrbitControls {
    return this.controls;
  }

  /** Update camera aspect ratio and renderer size. Called by ResizeObserver. */
  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  /** Render one frame. Called by the animation loop. */
  render(): void {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  /** Update the scene background to match the current theme. */
  setBackgroundColor(color: string): void {
    this.scene.background = new THREE.Color(color);
  }

  private startLoop(): void {
    if (this.animationFrameId !== null) return;
    const loop = () => {
      if (document.hidden) {
        this.animationFrameId = null;
        return;
      }
      this.render();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  private stopLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /** Clean up all Three.js resources. Called on onDestroy. */
  dispose(): void {
    this.stopLoop();
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    this.controls.dispose();
    this.renderer.dispose();
  }
}
