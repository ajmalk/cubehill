<script lang="ts">
  /**
   * OLL listing page.
   *
   * Shows all 57 OLL cases grouped by shape in the canonical order.
   * See designs/phase5-browse-ui.md section 1.2.
   */
  import AlgorithmList from '$lib/components/AlgorithmList.svelte';
  import { OLL_ALGORITHMS } from '$lib/data/oll.js';
</script>

<svelte:head>
  <title>OLL — CubeHill</title>
  <meta
    name="description"
    content="Browse all 57 OLL (Orientation of the Last Layer) cases with 3D algorithm visualizations."
  />
</svelte:head>

<main class="container mx-auto max-w-5xl px-4 py-8">
  <div class="mb-6">
    <h1 class="text-2xl font-bold">OLL</h1>
    <p class="text-base-content/60 mt-1 text-sm">Orientation of Last Layer · 57 cases</p>
  </div>

  <AlgorithmList algorithms={OLL_ALGORITHMS} />
</main>
