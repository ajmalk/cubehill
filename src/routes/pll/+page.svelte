<script lang="ts">
  /**
   * PLL listing page.
   *
   * Shows all 21 PLL cases grouped by type (Edges Only, Corners Only, Both).
   * See designs/phase5-browse-ui.md section 1.2.
   */
  import { resolve } from '$app/paths';
  import AlgorithmList from '$lib/components/AlgorithmList.svelte';
  import { PLL_ALGORITHMS } from '$lib/data/pll.js';
</script>

<svelte:head>
  <title>PLL — CubeHill</title>
  <meta
    name="description"
    content="Browse all 21 PLL (Permutation of the Last Layer) cases with 3D algorithm visualizations."
  />
</svelte:head>

<main class="container mx-auto max-w-5xl px-4 py-8">
  <div class="mb-6 flex items-start justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold">PLL</h1>
      <p class="text-base-content/60 mt-1 text-sm">Permutation of Last Layer · 21 cases</p>
    </div>
    <a href={resolve('/pll/graph/')} class="btn btn-ghost btn-sm shrink-0">
      State Transitions &rarr;
    </a>
  </div>

  <AlgorithmList algorithms={PLL_ALGORITHMS} />
</main>
