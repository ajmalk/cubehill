<script lang="ts">
  /**
   * PLL detail page.
   *
   * Shows the 3D cube loaded with the PLL case algorithm, playback controls,
   * case metadata, alternative notations, and prev/next navigation.
   *
   * See designs/phase5-browse-ui.md section 2.
   */
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { resolve } from '$app/paths';
  import CubeViewer from '$lib/components/CubeViewer.svelte';
  import PlaybackControls from '$lib/components/PlaybackControls.svelte';
  import { cubeStore } from '$lib/stores/cubeStore.svelte.js';
  import { commandPaletteStore } from '$lib/stores/commandPaletteStore.svelte.js';

  let { data } = $props();

  const algorithm = $derived(data.algorithm);
  const prevCase = $derived(data.prevCase);
  const nextCase = $derived(data.nextCase);

  /** Extract denominator from probability fraction string, e.g. "1/18" → 18 */
  function parseProbabilityDenominator(probability: string): string {
    return probability.split('/')[1] ?? probability;
  }

  // Load algorithm into cube whenever the algorithm changes (handles client-side navigation)
  $effect(() => {
    cubeStore.loadAlgorithm(algorithm.notation);
  });

  // Keyboard controls

  function handleKeydown(event: KeyboardEvent): void {
    if (commandPaletteStore.open) return;

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

<svelte:head>
  <title>{algorithm.name} — PLL — CubeHill</title>
  <meta
    name="description"
    content="{algorithm.name}: {algorithm.group}. Algorithm: {algorithm.notation}"
  />
</svelte:head>

<main class="container mx-auto max-w-5xl px-4 py-8">
  <!-- Two-column layout on desktop, stacked on mobile -->
  <div class="flex flex-col items-start gap-8 lg:flex-row">
    <!-- Left column: 3D cube viewer -->
    <div
      class="mx-auto aspect-square w-full max-w-[480px] flex-shrink-0 lg:mx-0 lg:w-1/2 lg:max-w-[500px]"
    >
      <CubeViewer />
    </div>

    <!-- Right column: case info + playback controls -->
    <div class="w-full min-w-0 flex-1">
      <!-- Case header -->
      <div class="mb-4 space-y-1">
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-xl font-bold">{algorithm.name}</h1>
          {#if algorithm.isTwoLook}
            <span class="badge badge-warning badge-sm">2-Look</span>
          {/if}
        </div>
        <p class="text-base-content/60 text-sm">{algorithm.group}</p>
        <p class="text-base-content/60 font-mono text-sm">
          {algorithm.probability} probability
          <span class="text-base-content/30 font-sans"> · </span>
          1 in {parseProbabilityDenominator(algorithm.probability)} solves
        </p>
      </div>

      <!-- Playback controls -->
      <PlaybackControls />

      <!-- Alternative notations (text-only, Phase 5) -->
      {#if algorithm.altNotations?.length}
        <div class="border-base-300 mt-4 border-t pt-4">
          <p class="mb-2 text-sm font-semibold">Alternative algorithms</p>
          <ol class="space-y-1">
            {#each algorithm.altNotations as alt, i (i)}
              <li class="text-base-content/70 font-mono text-sm">
                <span class="text-base-content/40 mr-2 not-italic">{i + 1}.</span>{alt}
              </li>
            {/each}
          </ol>
        </div>
      {/if}

      <!-- Prev / Next navigation -->
      <div class="border-base-300 mt-6 flex justify-between border-t pt-4">
        {#if prevCase}
          <a
            href={resolve(`/pll/${prevCase.id}/`)}
            class="btn btn-ghost btn-sm gap-1"
            title="Previous: {prevCase.name} (keyboard: [)"
          >
            ← {prevCase.name}
          </a>
        {:else}
          <div></div>
        {/if}

        {#if nextCase}
          <a
            href={resolve(`/pll/${nextCase.id}/`)}
            class="btn btn-ghost btn-sm gap-1"
            title="Next: {nextCase.name} (keyboard: ])"
          >
            {nextCase.name} →
          </a>
        {/if}
      </div>
    </div>
  </div>
</main>
