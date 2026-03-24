<script lang="ts">
  /**
   * PLL State Transition Graph page.
   *
   * Interactive visualization of PLL state transitions.
   * Click a node to see which algorithms connect that state to others.
   */
  import { resolve } from '$app/paths';
  import { browser } from '$app/environment';
  import { SvelteSet } from 'svelte/reactivity';
  import { pllGraph } from '$lib/graph/pll-graph.js';
  import { PLL_ALGORITHMS } from '$lib/data/pll.js';
  import PllGraph from '$lib/components/PllGraph.svelte';

  // Algorithm filter state — tracks which algorithms are EXCLUDED
  // Empty set = show all (nothing excluded)
  let excludedIds = new SvelteSet<string>();

  // The set passed to PllGraph: which algorithms to INCLUDE
  // If nothing excluded, pass empty set (= show all)
  let filteredIds = $derived.by(() => {
    if (excludedIds.size === 0) return new SvelteSet<string>();
    const included = new SvelteSet<string>();
    for (const alg of PLL_ALGORITHMS) {
      if (!excludedIds.has(alg.id)) included.add(alg.id);
    }
    return included;
  });

  function toggleAlgorithm(id: string) {
    if (excludedIds.has(id)) {
      excludedIds.delete(id);
    } else {
      excludedIds.add(id);
    }
  }

  function clearFilter() {
    excludedIds.clear();
  }

  // Direction toggle
  let showIncoming = $state(false);

  // Group algorithms for the filter UI
  const groups = [
    { label: 'Edges Only', ids: PLL_ALGORITHMS.filter((a) => a.group === 'Edges Only').map((a) => a.id) },
    { label: 'Corners Only', ids: PLL_ALGORITHMS.filter((a) => a.group === 'Corners Only').map((a) => a.id) },
    { label: 'Both Edges and Corners', ids: PLL_ALGORITHMS.filter((a) => a.group === 'Both Edges and Corners').map((a) => a.id) },
  ];
</script>

<svelte:head>
  <title>PLL State Transitions — CubeHill</title>
  <meta
    name="description"
    content="Interactive graph showing how PLL algorithms connect the 21 PLL states."
  />
</svelte:head>

<main class="container mx-auto max-w-6xl px-4 py-8">
  <div class="mb-6 flex items-start justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold">PLL State Transitions</h1>
      <p class="text-base-content/60 mt-1 text-sm">
        Each node is a PLL state. Click a node to see which algorithms (with optional AUF) connect it to other states.
      </p>
    </div>
    <a href={resolve('/pll/')} class="btn btn-ghost btn-sm shrink-0">
      &larr; Back to PLL
    </a>
  </div>

  <!-- Algorithm filter -->
  <details class="collapse collapse-arrow bg-base-200 mb-6 rounded-box">
    <summary class="collapse-title text-sm font-medium">
      Filter by algorithm
      {#if excludedIds.size > 0}
        <span class="badge badge-primary badge-sm ml-2">{PLL_ALGORITHMS.length - excludedIds.size} of {PLL_ALGORITHMS.length}</span>
      {/if}
    </summary>
    <div class="collapse-content">
      <div class="pt-2">
        <button class="btn btn-ghost btn-xs mb-3" onclick={clearFilter}>
          Show all algorithms
        </button>
        <div class="grid gap-4 sm:grid-cols-3">
          {#each groups as group (group.label)}
            <div>
              <div class="mb-1 text-xs font-semibold text-base-content/50 uppercase tracking-wide">
                {group.label}
              </div>
              {#each group.ids as id (id)}
                {@const alg = PLL_ALGORITHMS.find((a) => a.id === id)}
                {#if alg}
                  <label class="flex cursor-pointer items-center gap-2 py-0.5">
                    <input
                      type="checkbox"
                      class="checkbox checkbox-xs"
                      checked={!excludedIds.has(id)}
                      onchange={() => toggleAlgorithm(id)}
                    />
                    <span class="text-sm">{alg.name}</span>
                  </label>
                {/if}
              {/each}
            </div>
          {/each}
        </div>
      </div>
    </div>
  </details>

  <!-- Direction toggle -->
  <div class="mb-4 flex items-center gap-3">
    <span class="text-sm font-medium">Direction:</span>
    <label class="label cursor-pointer gap-2">
      <input
        type="radio"
        name="direction"
        class="radio radio-sm"
        checked={!showIncoming}
        onchange={() => showIncoming = false}
      />
      <span class="text-sm">From selected</span>
    </label>
    <label class="label cursor-pointer gap-2">
      <input
        type="radio"
        name="direction"
        class="radio radio-sm"
        checked={showIncoming}
        onchange={() => showIncoming = true}
      />
      <span class="text-sm">To selected</span>
    </label>
  </div>

  <!-- Graph -->
  {#if browser}
    <PllGraph graph={pllGraph} filteredAlgorithmIds={filteredIds} {showIncoming} />
  {:else}
    <div class="bg-base-200 flex h-64 items-center justify-center rounded-box">
      <span class="text-base-content/40 text-sm">Loading graph...</span>
    </div>
  {/if}

  <!-- Explainer -->
  <div class="mt-8 prose prose-sm max-w-none">
    <h2>How to read this graph</h2>
    <ul>
      <li><strong>Nodes</strong> represent PLL states (22 total: 21 cases + Solved).</li>
      <li><strong>Edges</strong> show transitions: applying a PLL algorithm (with optional AUF pre-rotation) takes you from one state to another.</li>
      <li><strong>Edge thickness</strong> is proportional to the number of algorithm+AUF combinations that produce that transition.</li>
      <li>Hover an edge to see which algorithms create that transition.</li>
    </ul>
  </div>
</main>
