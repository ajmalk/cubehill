<script lang="ts">
  /**
   * Home page — hero section with solved 3D cube, tagline, and OLL/PLL nav cards.
   *
   * The cube shows the solved state (no algorithm loaded) and responds to orbit/zoom.
   * Two nav cards direct users to OLL and PLL listing pages.
   *
   * See designs/phase5-browse-ui.md section 3.
   */
  import { resolve } from '$app/paths';
  import CubeViewer from '$lib/components/CubeViewer.svelte';

  // OLL 27 (Sune) pattern — used on OLL nav card
  // OCLL case: all edges oriented, pattern shows oriented corners
  const oll27Pattern: boolean[] = [true, false, true, false, true, false, true, false, true];

  // T Perm pattern — used on PLL nav card
  // Swaps UL↔UR corners and top↔right edges
  const tPermPattern = [
    { from: 0 as const, to: 2 as const },
    { from: 2 as const, to: 0 as const },
    { from: 1 as const, to: 5 as const },
    { from: 5 as const, to: 1 as const },
  ];
</script>

<svelte:head>
  <title>CubeHill — Speedcubing Algorithm Visualizer</title>
  <meta
    name="description"
    content="Learn speedcubing algorithms with an interactive 3D cube. Browse all 57 OLL and 21 PLL cases."
  />
</svelte:head>

<!-- Hero section: cube + tagline -->
<section class="flex flex-col items-center gap-6 py-6 text-center sm:py-10">
  <div class="mx-auto aspect-square w-[min(60vw,60vh,500px)] min-w-[280px]">
    <CubeViewer />
  </div>

  <p class="text-base-content/70 max-w-md px-4 text-base leading-relaxed">
    Learn speedcubing algorithms with an interactive 3D cube.
  </p>
</section>

<!-- Navigation cards -->
<section class="mx-auto grid w-full max-w-2xl grid-cols-1 gap-4 px-4 pb-8 sm:grid-cols-2">
  <!-- OLL card -->
  <a
    href={resolve('/oll/')}
    class="card bg-base-200 hover:bg-base-300 border-base-300 hover:border-primary focus-visible:outline-primary border transition-colors duration-150 focus-visible:outline-2"
  >
    <figure class="px-6 pt-6">
      <!-- OLL 27 pattern thumbnail -->
      <svg
        viewBox="0 0 3 3"
        class="mx-auto h-24 w-24 rounded-md"
        aria-label="OLL 27 pattern sample"
        role="img"
      >
        {#each oll27Pattern as oriented, i (i)}
          {@const col = i % 3}
          {@const row = Math.floor(i / 3)}
          <rect
            x={col + 0.025}
            y={row + 0.025}
            width="0.95"
            height="0.95"
            fill={oriented ? 'oklch(85% 0.2 95)' : 'oklch(40% 0 0)'}
          />
        {/each}
      </svg>
    </figure>
    <div class="card-body pt-3">
      <h2 class="card-title text-lg">OLL</h2>
      <p class="text-base-content/60 text-sm">57 cases — Orient the Last Layer</p>
      <div class="card-actions mt-2 justify-end">
        <span class="text-primary text-sm font-medium">Browse →</span>
      </div>
    </div>
  </a>

  <!-- PLL card -->
  <a
    href={resolve('/pll/')}
    class="card bg-base-200 hover:bg-base-300 border-base-300 hover:border-primary focus-visible:outline-primary border transition-colors duration-150 focus-visible:outline-2"
  >
    <figure class="px-6 pt-6">
      <!-- T Perm pattern thumbnail -->
      <svg
        viewBox="0 0 3 3"
        class="text-primary mx-auto h-24 w-24 rounded-md"
        aria-label="T Perm pattern sample"
        role="img"
      >
        <defs>
          <marker
            id="arrowhead-home-pll"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="3"
            markerHeight="3"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
          </marker>
        </defs>
        <!-- Grey background cells -->
        {#each Array.from({ length: 9 }, (_, idx) => idx) as i (i)}
          {@const col = i % 3}
          {@const row = Math.floor(i / 3)}
          <rect x={col + 0.025} y={row + 0.025} width="0.95" height="0.95" fill="oklch(40% 0 0)" />
        {/each}
        <!-- T Perm arrows -->
        {#each tPermPattern as arrow, arrowIdx (arrowIdx)}
          {@const fromCol = arrow.from % 3}
          {@const fromRow = Math.floor(arrow.from / 3)}
          {@const toCol = arrow.to % 3}
          {@const toRow = Math.floor(arrow.to / 3)}
          <line
            x1={fromCol + 0.5}
            y1={fromRow + 0.5}
            x2={toCol + 0.5}
            y2={toRow + 0.5}
            stroke="currentColor"
            stroke-width="0.15"
            marker-end="url(#arrowhead-home-pll)"
          />
        {/each}
      </svg>
    </figure>
    <div class="card-body pt-3">
      <h2 class="card-title text-lg">PLL</h2>
      <p class="text-base-content/60 text-sm">21 cases — Permute the Last Layer</p>
      <div class="card-actions mt-2 justify-end">
        <span class="text-primary text-sm font-medium">Browse →</span>
      </div>
    </div>
  </a>
</section>

<!-- Cmd+K hint — desktop only -->
<p class="text-base-content/40 mt-2 mb-8 hidden text-center text-xs sm:block">
  Press <kbd class="kbd kbd-xs">⌘K</kbd> to jump to any algorithm.
</p>
