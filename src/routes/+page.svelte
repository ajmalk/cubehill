<script lang="ts">
  /**
   * Home page — demo of CubeViewer + PlaybackControls with a hardcoded T-perm.
   *
   * This page demonstrates Phase 4 integration: the 3D cube, theme toggle,
   * and playback controls all wired together.
   */

  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { resolve } from '$app/paths';
  import CubeViewer from '$lib/components/CubeViewer.svelte';
  import PlaybackControls from '$lib/components/PlaybackControls.svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import { cubeStore } from '$lib/stores/cubeStore.svelte.js';

  // T-perm: a classic PLL algorithm
  const T_PERM = "R U R' U' R' F R2 U' R' U' R U R' F'";

  // Load algorithm on mount
  onMount(() => {
    cubeStore.loadAlgorithm(T_PERM);
  });

  // Keyboard controls
  let commandPaletteOpen = false;

  function handleKeydown(event: KeyboardEvent): void {
    if (commandPaletteOpen) return;

    const tag = (document.activeElement as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if ((document.activeElement as HTMLElement)?.isContentEditable) return;

    switch (event.key) {
      case ' ':
        event.preventDefault();
        if (cubeStore.isPlaying) {
          cubeStore.pause();
        } else {
          cubeStore.play();
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        cubeStore.stepForward();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        cubeStore.stepBack();
        break;
      case 'r':
      case 'R':
        cubeStore.reset();
        break;
    }
  }

  onMount(() => {
    if (browser) {
      window.addEventListener('keydown', handleKeydown);
    }
  });

  onDestroy(() => {
    if (browser) {
      window.removeEventListener('keydown', handleKeydown);
    }
  });
</script>

<!-- Navbar -->
<div class="navbar bg-base-100 border-base-300 border-b px-4">
  <div class="flex-1">
    <a href={resolve('/')} class="text-primary text-xl font-bold">CubeHill</a>
  </div>
  <div class="flex-none gap-2">
    <ThemeToggle />
  </div>
</div>

<!-- Main content -->
<main class="container mx-auto max-w-5xl px-4 py-8">
  <!-- Page title -->
  <div class="mb-6">
    <h1 class="text-base-content text-2xl font-bold">T Perm</h1>
    <p class="text-base-content/60 mt-1 text-sm">
      PLL — Corner + Edge Swap &nbsp;·&nbsp; {T_PERM}
    </p>
  </div>

  <!-- Two-column layout on desktop, stacked on mobile -->
  <div class="flex flex-col items-start gap-8 lg:flex-row">
    <!-- Left column: 3D cube viewer -->
    <div
      class="mx-auto aspect-square w-full max-w-[480px] flex-shrink-0 lg:mx-0 lg:w-1/2 lg:max-w-[500px]"
    >
      <CubeViewer />
    </div>

    <!-- Right column: playback controls -->
    <div class="w-full min-w-0 flex-1">
      <PlaybackControls />
    </div>
  </div>

  <!-- Usage hint -->
  <p class="text-base-content/40 mt-8 text-center text-xs lg:text-left">
    Double-click the cube to reset camera view
  </p>
</main>
