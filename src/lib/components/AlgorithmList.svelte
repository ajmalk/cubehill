<script lang="ts">
  /**
   * AlgorithmList.svelte
   *
   * Renders a grouped grid of AlgorithmCard components.
   * Groups algorithms by their `group` field in canonical order.
   *
   * Group order is explicit (not alphabetical) — see docs/product/algorithms.md.
   *
   * See designs/phase5-browse-ui.md section 1.2.
   */
  import { SvelteMap } from 'svelte/reactivity';
  import type { Algorithm } from '$lib/cube/types.js';
  import AlgorithmCard from './AlgorithmCard.svelte';

  interface Props {
    algorithms: Algorithm[];
  }

  let { algorithms }: Props = $props();

  // Canonical group order for OLL (from designs/phase5-browse-ui.md section 1.2)
  const OLL_GROUP_ORDER = [
    'All Edges Oriented (OCLL)',
    'T-Shape',
    'Square',
    'P-Shape',
    'W-Shape',
    'Fish',
    'Knight Move',
    'Awkward',
    'Big Lightning',
    'Small Lightning',
    'C-Shape',
    'I-Shape',
    'L-Shape',
    'Dot',
  ];

  // Canonical group order for PLL (from designs/phase5-browse-ui.md section 1.2)
  const PLL_GROUP_ORDER = ['Edges Only', 'Corners Only', 'Both Edges and Corners'];

  // Build ordered groups from the algorithms array
  const groups = $derived.by(() => {
    // Collect unique group names preserving first-seen order
    const groupMap = new SvelteMap<string, Algorithm[]>();
    for (const alg of algorithms) {
      if (!groupMap.has(alg.group)) {
        groupMap.set(alg.group, []);
      }
      groupMap.get(alg.group)!.push(alg);
    }

    // Determine canonical order based on category
    const category = algorithms[0]?.category;
    const canonicalOrder = category === 'pll' ? PLL_GROUP_ORDER : OLL_GROUP_ORDER;

    // Sort groups by canonical order; unknown groups go at the end
    const ordered: Array<{ name: string; cases: Algorithm[] }> = [];
    for (const groupName of canonicalOrder) {
      const cases = groupMap.get(groupName);
      if (cases && cases.length > 0) {
        ordered.push({ name: groupName, cases });
      }
    }

    // Append any groups not in the canonical order (should not happen in production)
    for (const [name, cases] of groupMap) {
      if (!canonicalOrder.includes(name) && cases.length > 0) {
        ordered.push({ name, cases });
      }
    }

    return ordered;
  });
</script>

<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {#each groups as group (group.name)}
    <!-- Group header spans all columns -->
    <div class="col-span-full mt-8 mb-3 first:mt-0">
      <div class="mb-2 flex items-center gap-3">
        <h2 class="text-base-content/60 text-sm font-semibold tracking-wide uppercase">
          {group.name} ({group.cases.length})
        </h2>
      </div>
      <div class="bg-base-300 h-px w-full"></div>
    </div>
    <!-- Algorithm cards -->
    {#each group.cases as algorithm (algorithm.id)}
      <AlgorithmCard {algorithm} />
    {/each}
  {/each}
</div>
