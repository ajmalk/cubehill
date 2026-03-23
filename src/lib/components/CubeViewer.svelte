<script lang="ts">
  /**
   * CubeViewer.svelte
   *
   * Wraps the Three.js canvas. Creates CubeScene, CubeMesh, and CubeAnimator
   * on mount (SSR-safe). Registers the animator with cubeStore.
   *
   * Responsibilities:
   *  - Mounts the Three.js scene onto a <canvas> element
   *  - Attaches a ResizeObserver for responsive sizing
   *  - Registers/unregisters the CubeAnimator with cubeStore
   *  - Syncs scene background color with themeStore
   *  - Camera reset (400ms ease-out) on double-click/double-tap
   *  - Disposes all Three.js resources on destroy
   *
   * See docs/technical/rendering.md and designs/phase4-svelte-integration.md.
   */

  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { cubeStore } from '$lib/stores/cubeStore.svelte.js';
  import { themeStore } from '$lib/stores/themeStore.svelte.js';

  // ---------------------------------------------------------------------------
  // Element bindings
  // ---------------------------------------------------------------------------

  let canvas: HTMLCanvasElement;
  let container: HTMLDivElement;

  // ---------------------------------------------------------------------------
  // Three.js instances (null until onMount)
  // ---------------------------------------------------------------------------

  let scene: import('$lib/three/CubeScene.js').CubeScene | null = null;

  // ---------------------------------------------------------------------------
  // Component state
  // ---------------------------------------------------------------------------

  let initialized = $state(false);
  let initError = $state<string | null>(null);
  let isDragging = $state(false);

  // Camera reset tween state
  const DEFAULT_CAMERA_POS = { x: 3.5, y: 3.0, z: 3.5 } as const;
  let cameraResetRaf: number | null = null;

  // ---------------------------------------------------------------------------
  // Mount: initialize Three.js
  // ---------------------------------------------------------------------------

  onMount(() => {
    if (!browser) return;

    let resizeObserver: ResizeObserver | null = null;

    (async () => {
      try {
        const [{ CubeScene, CubeMesh, CubeAnimator }, { solved: solvedFn }] = await Promise.all([
          import('$lib/three/index.js'),
          import('$lib/cube/index.js'),
        ]);

        // Create scene, mesh, and animator
        const cubeScene = new CubeScene(canvas);
        const cubeMesh = new CubeMesh(cubeScene.getScene());
        const cubeAnim = new CubeAnimator(cubeScene, cubeMesh, solvedFn());

        scene = cubeScene;

        // Register with cubeStore — this also loads any existing algorithm
        cubeStore.setAnimator(cubeAnim);

        // Sync background with current theme
        syncThemeToScene(cubeScene);

        // ResizeObserver for responsive canvas sizing
        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0) {
              cubeScene.resize(width, height);
            }
          }
        });
        resizeObserver.observe(container);

        initialized = true;
      } catch (err) {
        console.error('CubeViewer: failed to initialize Three.js', err);
        initError = 'WebGL is not supported in this browser';
      }
    })();

    // Cursor grab tracking
    const handleMouseDown = () => {
      isDragging = true;
    };
    const handleMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      // Cleanup
      resizeObserver?.disconnect();
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);

      if (cameraResetRaf !== null) {
        cancelAnimationFrame(cameraResetRaf);
      }

      // Unregister animator from store
      cubeStore.clearAnimator();

      // Dispose Three.js resources
      if (scene) {
        scene.dispose();
        scene = null;
      }
    };
  });

  // ---------------------------------------------------------------------------
  // Theme sync — runs whenever themeStore.theme changes
  // ---------------------------------------------------------------------------

  $effect(() => {
    // Read theme value to create Svelte 5 dependency
    const _theme = themeStore.theme;
    if (scene && initialized && _theme) {
      scene.syncBackground();
    }
  });

  // ---------------------------------------------------------------------------
  // Camera reset on double-click / double-tap (400ms ease-out tween)
  // ---------------------------------------------------------------------------

  function handleDblClick(): void {
    if (!scene) return;
    resetCamera();
  }

  function resetCamera(): void {
    if (!scene) return;

    const camera = scene.getCamera();
    const controls = scene.getControls();

    const startPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
    const endPos = DEFAULT_CAMERA_POS;
    const duration = 400;
    const startTime = performance.now();

    if (cameraResetRaf !== null) {
      cancelAnimationFrame(cameraResetRaf);
    }

    // Disable OrbitControls during the tween so its internal update() does not
    // overwrite the camera position we set each frame. OrbitControls.update()
    // recomputes camera.position from its own spherical coordinates, which
    // means any direct camera.position.set() call is immediately cancelled when
    // controls.update() runs inside the render loop. Disabling controls prevents
    // that conflict; controls.reset() at the end restores the canonical state.
    controls.enabled = false;

    const tween = (now: number) => {
      const elapsed = now - startTime;
      const rawT = Math.min(elapsed / duration, 1);
      // Ease-out cubic: 1 - (1-t)^3
      const t = 1 - Math.pow(1 - rawT, 3);

      camera.position.set(
        startPos.x + (endPos.x - startPos.x) * t,
        startPos.y + (endPos.y - startPos.y) * t,
        startPos.z + (endPos.z - startPos.z) * t,
      );
      camera.lookAt(0, 0, 0);

      if (rawT < 1) {
        cameraResetRaf = requestAnimationFrame(tween);
      } else {
        cameraResetRaf = null;
        // Snap to exact target, restore OrbitControls internal spherical state,
        // then re-enable so the user can orbit again.
        camera.position.set(endPos.x, endPos.y, endPos.z);
        camera.lookAt(0, 0, 0);
        controls.reset();
        controls.enabled = true;
      }
    };

    cameraResetRaf = requestAnimationFrame(tween);
  }
</script>

<div
  bind:this={container}
  class="cube-viewer-container relative h-full w-full"
  class:is-dragging={isDragging}
  ondblclick={handleDblClick}
  role="img"
  aria-label="3D Rubik's cube visualization"
>
  <canvas
    bind:this={canvas}
    style="touch-action: none; width: 100%; height: 100%; display: block;"
    aria-hidden="true"
  ></canvas>

  {#if !initialized && !initError}
    <!-- Loading spinner overlay -->
    <div class="bg-base-200 absolute inset-0 flex items-center justify-center rounded-lg">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>
  {/if}

  {#if initError}
    <!-- WebGL error state -->
    <div class="bg-base-200 absolute inset-0 flex items-center justify-center rounded-lg">
      <div class="text-base-content/60 px-4 text-center text-sm">
        <p>3D view unavailable</p>
        <p class="mt-1 text-xs">WebGL is not supported in this browser</p>
      </div>
    </div>
  {/if}
</div>

<style>
  .cube-viewer-container {
    cursor: grab;
  }

  .cube-viewer-container.is-dragging {
    cursor: grabbing;
  }
</style>
