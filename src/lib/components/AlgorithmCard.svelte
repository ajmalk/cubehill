<script lang="ts">
  /**
   * AlgorithmCard.svelte
   *
   * A clickable card representing a single OLL or PLL algorithm case.
   * Shows pattern thumbnail, case name, probability, and a 2-look badge.
   * Links to the detail page using base path prefix for GitHub Pages.
   *
   * See designs/phase5-browse-ui.md section 1.1.
   */
  import { resolve } from '$app/paths';
  import type { Algorithm, OllAlgorithm, PllAlgorithm } from '$lib/cube/types.js';

  interface Props {
    algorithm: Algorithm;
  }

  let { algorithm }: Props = $props();

  const href = resolve(`/${algorithm.category}/${algorithm.id}/`);

  // Helpers for OLL thumbnail
  function isOll(alg: Algorithm): alg is OllAlgorithm {
    return alg.category === 'oll';
  }

  function isPll(alg: Algorithm): alg is PllAlgorithm {
    return alg.category === 'pll';
  }
</script>

<a
  {href}
  class="card card-compact bg-base-200 hover:bg-base-300 border-base-300 hover:border-primary focus-visible:outline-primary cursor-pointer border transition-colors duration-150 focus-visible:outline-2"
>
  <figure class="px-3 pt-3">
    {#if isOll(algorithm)}
      <!-- OLL Pattern Thumbnail: 3×3 boolean grid -->
      <svg
        viewBox="0 0 3 3"
        class="aspect-square w-full rounded-md"
        aria-label="OLL pattern for {algorithm.name}"
        role="img"
      >
        {#each algorithm.pattern as oriented, i (i)}
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
    {:else if isPll(algorithm)}
      <!-- PLL Pattern Thumbnail: arrows on neutral grid -->
      <svg
        viewBox="0 0 3 3"
        class="text-primary aspect-square w-full rounded-md"
        aria-label="PLL pattern for {algorithm.name}"
        role="img"
      >
        <defs>
          <marker
            id="arrowhead-{algorithm.id}"
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
        <!-- Arrows -->
        {#each algorithm.pattern as arrow, arrowIdx (arrowIdx)}
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
            marker-end="url(#arrowhead-{algorithm.id})"
          />
        {/each}
      </svg>
    {/if}
  </figure>

  <div class="card-body gap-1 p-3 pt-2">
    <div class="flex items-baseline justify-between gap-1">
      <h3 class="truncate text-sm leading-tight font-semibold">{algorithm.name}</h3>
      <span class="text-base-content/50 shrink-0 font-mono text-xs">{algorithm.probability}</span>
    </div>
    {#if algorithm.isTwoLook}
      <span class="badge badge-warning badge-xs self-start">2-Look</span>
    {/if}
  </div>
</a>
