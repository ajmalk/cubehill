<script lang="ts">
  /**
   * PllGraph component — interactive D3 force-directed graph of PLL state transitions.
   *
   * Default view: all nodes, no edges. Click a node to explore its transitions.
   * SSR-safe: D3 initialization wrapped in onMount.
   */
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import type { PllGraph, PllGraphNode, PllGraphEdge } from '$lib/graph/pll-graph.js';

  interface Props {
    graph: PllGraph;
    /** Which algorithm IDs to include in displayed edges. Empty = all. */
    filteredAlgorithmIds?: Set<string>;
    /** Show edges going TO the selected node instead of FROM it. */
    showIncoming?: boolean;
  }

  let { graph, filteredAlgorithmIds = new Set(), showIncoming = false }: Props = $props();

  // ── State ──────────────────────────────────────────────────────────────────
  let svgEl = $state<SVGSVGElement | undefined>(undefined);
  let containerEl = $state<HTMLDivElement | undefined>(undefined);
  let width = $state(800);
  let height = $state(600);
  let selectedNodeId = $state<string | null>(null);
  let hoveredEdgeKey = $state<string | null>(null);
  let tooltipX = $state(0);
  let tooltipY = $state(0);
  let tooltipAlgorithms = $state<{ name: string; auf: string }[]>([]);

  // D3 simulation state
  let simulationNodes = $state<(PllGraphNode & { x: number; y: number; vx: number; vy: number })[]>([]);
  let simulationEdges = $state<(PllGraphEdge & { sourceNode?: { x: number; y: number }; targetNode?: { x: number; y: number } })[]>([]);

  // ── Resolved DaisyUI colors (populated in onMount) ───────────────────────────
  let colorSolved = $state('#22c55e');        // bg-success fallback
  let colorEdgesOnly = $state('#3b82f6');     // bg-info fallback
  let colorCornersOnly = $state('#f59e0b');   // bg-warning fallback
  let colorBothEdgesCorners = $state('#ef4444'); // bg-error fallback
  let colorBaseContent = $state('#ffffff');   // bg-base-content fallback
  let colorBase100 = $state('#1d232a');       // bg-base-100 fallback
  let colorPrimary = $state('#570df8');       // bg-primary fallback

  /** Resolve a DaisyUI bg utility class to a hex color string via computed style readback. */
  function resolveDaisyColor(className: string, fallback: string): string {
    try {
      const el = document.createElement('div');
      el.className = className;
      el.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;';
      document.body.appendChild(el);
      const computed = getComputedStyle(el).backgroundColor;
      document.body.removeChild(el);

      if (!computed || computed === 'rgba(0, 0, 0, 0)' || computed === 'transparent') {
        return fallback;
      }

      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) return fallback;
      ctx.fillStyle = computed;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch {
      return fallback;
    }
  }

  function resolveAllColors() {
    colorSolved = resolveDaisyColor('bg-success', '#22c55e');
    colorEdgesOnly = resolveDaisyColor('bg-info', '#3b82f6');
    colorCornersOnly = resolveDaisyColor('bg-warning', '#f59e0b');
    colorBothEdgesCorners = resolveDaisyColor('bg-error', '#ef4444');
    colorBaseContent = resolveDaisyColor('bg-base-content', '#ffffff');
    colorBase100 = resolveDaisyColor('bg-base-100', '#1d232a');
    colorPrimary = resolveDaisyColor('bg-primary', '#570df8');
  }

  let GROUP_COLORS = $derived<Record<string, string>>({
    'Solved': colorSolved,
    'Edges Only': colorEdgesOnly,
    'Corners Only': colorCornersOnly,
    'Both Edges and Corners': colorBothEdgesCorners,
  });

  function nodeColor(node: PllGraphNode): string {
    return GROUP_COLORS[node.group] ?? colorBaseContent;
  }

  // ── Derived edge visibility ─────────────────────────────────────────────────
  function visibleEdges(edges: typeof simulationEdges): typeof simulationEdges {
    if (selectedNodeId === null) return [];

    let result = showIncoming
      ? edges.filter((e) => e.target === selectedNodeId)
      : edges.filter((e) => e.source === selectedNodeId);

    if (filteredAlgorithmIds.size > 0) {
      result = result.map((e) => ({
        ...e,
        algorithms: e.algorithms.filter((a) => filteredAlgorithmIds.has(a.algorithmId)),
        count: e.algorithms.filter((a) => filteredAlgorithmIds.has(a.algorithmId)).length,
      })).filter((e) => e.count > 0);
    }

    return result;
  }

  function isNodeConnected(nodeId: string): boolean {
    if (selectedNodeId === null) return true;
    if (nodeId === selectedNodeId) return true;
    return visibleEdges(simulationEdges).some((e) =>
      showIncoming ? e.source === nodeId : e.target === nodeId
    );
  }

  // ── D3 simulation ───────────────────────────────────────────────────────────
  let simulation: import('d3').Simulation<PllGraphNode & { x: number; y: number; vx: number; vy: number }, undefined> | null = null;
  onMount(async () => {
    // Resolve theme colors before rendering
    resolveAllColors();

    const d3force = await import('d3');

    // Initialize node positions
    simulationNodes = graph.nodes.map((n) => ({
      ...n,
      x: width / 2 + (Math.random() - 0.5) * 200,
      y: height / 2 + (Math.random() - 0.5) * 200,
      vx: 0,
      vy: 0,
    }));

    // Copy edges with references
    simulationEdges = graph.edges.map((e) => ({ ...e }));

    const nodeById = new Map(simulationNodes.map((n) => [n.id, n]));

    simulation = d3force.forceSimulation(simulationNodes)
      .force(
        'link',
        d3force.forceLink<typeof simulationNodes[0], typeof simulationEdges[0]>(
          simulationEdges.map((e) => ({ ...e, source: e.source, target: e.target }))
        )
          .id((d) => d.id)
          .distance(150)
          .strength(0.05)
      )
      .force('charge', d3force.forceManyBody().strength(-600))
      .force('center', d3force.forceCenter(width / 2, height / 2))
      .force('collision', d3force.forceCollide(55))
      .on('tick', () => {
        // Trigger reactivity by reassigning
        simulationNodes = [...simulationNodes];
        // Update edge node references
        simulationEdges = simulationEdges.map((e) => ({
          ...e,
          sourceNode: nodeById.get(typeof e.source === 'string' ? e.source : (e.source as unknown as { id: string }).id),
          targetNode: nodeById.get(typeof e.target === 'string' ? e.target : (e.target as unknown as { id: string }).id),
        }));
      })
      .on('end', () => {
        // simulation settled
      });

    // Run simulation for a while then let it stabilize
    simulation.alphaDecay(0.02);

    // Handle resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        width = entry.contentRect.width || 800;
        height = Math.max(500, width * 0.65);
        if (simulation) {
          simulation.force('center', d3force.forceCenter(width / 2, height / 2));
          simulation.alpha(0.3).restart();
        }
      }
    });

    if (containerEl) {
      resizeObserver.observe(containerEl);
      width = containerEl.clientWidth || 800;
      height = Math.max(500, width * 0.65);
    }

    return () => {
      resizeObserver.disconnect();
    };
  });

  onDestroy(() => {
    if (simulation) simulation.stop();
  });

  // ── Interaction ─────────────────────────────────────────────────────────────
  function handleNodeClick(nodeId: string) {
    if (selectedNodeId === nodeId) {
      selectedNodeId = null;
    } else {
      selectedNodeId = nodeId;
    }
  }

  function handleEdgeMouseEnter(edge: PllGraphEdge, event: MouseEvent) {
    hoveredEdgeKey = `${edge.source}::${edge.target}`;
    tooltipAlgorithms = edge.algorithms.map((a) => ({
      name: a.algorithmName,
      auf: a.auf === 'none' ? '' : a.auf,
    }));
    tooltipX = event.clientX;
    tooltipY = event.clientY;
  }

  function handleEdgeMouseLeave() {
    hoveredEdgeKey = null;
    tooltipAlgorithms = [];
  }

  function handleEdgeMouseMove(event: MouseEvent) {
    tooltipX = event.clientX;
    tooltipY = event.clientY;
  }

  // ── SVG path helpers ─────────────────────────────────────────────────────────
  function edgePath(
    sx: number, sy: number, tx: number, ty: number,
    isBidirectional: boolean, targetRadius: number
  ): string {
    const dx = tx - sx;
    const dy = ty - sy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    // Shorten the line so the arrow ends at the node edge
    const offset = targetRadius + 12; // radius + arrow size
    const ex = tx - (dx / dist) * offset;
    const ey = ty - (dy / dist) * offset;

    if (isBidirectional) {
      const mx = (sx + ex) / 2 - dy * 0.15;
      const my = (sy + ey) / 2 + dx * 0.15;
      return `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`;
    }
    return `M ${sx} ${sy} L ${ex} ${ey}`;
  }

  // Check if a reverse edge exists (for bidirectional detection)
  function hasBidirectional(edge: PllGraphEdge): boolean {
    return simulationEdges.some(
      (e) => e.source === edge.target && e.target === edge.source
    );
  }


</script>

{#if browser}
  <div bind:this={containerEl} class="relative w-full">
    {#if simulationNodes.length === 0}
      <div class="flex h-64 items-center justify-center">
        <span class="loading loading-spinner loading-md"></span>
      </div>
    {:else}
      <!-- Legend -->
      <div class="mb-3 flex flex-wrap gap-3 text-xs">
        {#each Object.entries(GROUP_COLORS) as [group] (group)}
          <div class="flex items-center gap-1.5">
            <span
              class="inline-block size-3 rounded-full"
              style="background: {GROUP_COLORS[group]}"
            ></span>
            <span>{group}</span>
          </div>
        {/each}
      </div>

      <!-- Instruction text -->
      {#if selectedNodeId === null}
        <p class="text-base-content/50 mb-2 text-center text-sm">
          Click a node to explore its transitions
        </p>
      {:else}
        <p class="text-base-content/60 mb-2 text-center text-sm">
          Showing transitions for <strong>{simulationNodes.find((n) => n.id === selectedNodeId)?.name ?? selectedNodeId}</strong>
          — click again to deselect
        </p>
      {/if}

      <svg
        bind:this={svgEl}
        {width}
        {height}
        class="w-full overflow-visible rounded-box bg-base-200"
        style="height: {height}px"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="8"
            refX="10"
            refY="4"
            orient="auto"
          >
            <polygon points="0 0, 10 4, 0 8" fill={colorBaseContent} opacity="0.5" />
          </marker>
          <marker
            id="arrowhead-hover"
            markerWidth="10"
            markerHeight="8"
            refX="10"
            refY="4"
            orient="auto"
          >
            <polygon points="0 0, 10 4, 0 8" fill={colorPrimary} />
          </marker>
        </defs>

        <!-- Edges (only visible ones) -->
        <g class="edges">
          {#each visibleEdges(simulationEdges) as edge (edge.source + '::' + edge.target)}
            {@const sNode = simulationNodes.find((n) => n.id === edge.source)}
            {@const tNode = simulationNodes.find((n) => n.id === edge.target)}
            {#if sNode && tNode}
              {@const isBi = hasBidirectional(edge)}
              {@const tRadius = tNode.id === 'solved' ? 38 : 28}
              {@const path = edgePath(sNode.x, sNode.y, tNode.x, tNode.y, isBi, tRadius)}
              {@const edgeKey = edge.source + '::' + edge.target}
              {@const isHovered = hoveredEdgeKey === edgeKey}
              <path
                d={path}
                fill="none"
                stroke={isHovered ? colorPrimary : colorBaseContent}
                stroke-opacity={isHovered ? 1 : 0.3}
                stroke-width={Math.max(1, Math.min(edge.count * 0.5, 4))}
                marker-end={isHovered ? 'url(#arrowhead-hover)' : 'url(#arrowhead)'}
                class="cursor-pointer transition-colors"
                role="img"
                aria-label="Transition edge"
                onmouseenter={(e) => handleEdgeMouseEnter(edge, e)}
                onmouseleave={handleEdgeMouseLeave}
                onmousemove={handleEdgeMouseMove}
              />
            {/if}
          {/each}
        </g>

        <!-- Nodes -->
        <g class="nodes">
          {#each simulationNodes as node (node.id)}
            {@const radius = node.isSolved ? 38 : 28}
            {@const isSelected = node.id === selectedNodeId}
            {@const isConnected = isNodeConnected(node.id)}
            {@const opacity = selectedNodeId === null ? 1 : isConnected ? 1 : 0.25}
            <g
              transform="translate({node.x}, {node.y})"
              class="cursor-pointer"
              style="opacity: {opacity}; transition: opacity 0.2s"
              onclick={() => handleNodeClick(node.id)}
              role="button"
              tabindex="0"
              onkeydown={(e) => e.key === 'Enter' && handleNodeClick(node.id)}
            >
              <circle
                r={radius}
                fill={nodeColor(node)}
                stroke={isSelected ? colorPrimary : colorBase100}
                stroke-width={isSelected ? 3 : 1.5}
                class="transition-all"
              />
              <text
                text-anchor="middle"
                dominant-baseline="middle"
                font-size={node.isSolved ? '14' : '12'}
                font-weight={node.isSolved ? 'bold' : 'normal'}
                fill={colorBase100}
                class="pointer-events-none select-none"
              >
                {node.isSolved ? 'Solved' : node.name.replace(' Perm', '')}
              </text>
            </g>
          {/each}
        </g>
      </svg>
    {/if}

    <!-- Tooltip -->
    {#if hoveredEdgeKey && tooltipAlgorithms.length > 0}
      <div
        class="bg-base-100 border-base-300 pointer-events-none fixed z-50 max-w-xs rounded-box border p-2 text-xs shadow-lg"
        style="left: {tooltipX + 12}px; top: {tooltipY - 8}px"
      >
        <div class="font-semibold mb-1">Algorithms ({tooltipAlgorithms.length})</div>
        {#each tooltipAlgorithms as a, idx (idx)}
          <div>{a.name}{a.auf ? ` + AUF ${a.auf}` : ''}</div>
        {/each}
      </div>
    {/if}
  </div>
{/if}
