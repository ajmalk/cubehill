<script lang="ts">
  /**
   * PlaybackControls.svelte
   *
   * Transport controls for stepping through an algorithm.
   * Reads and writes state via cubeStore.
   *
   * Layout (vertical order, all screen sizes):
   *  1. Transport buttons (mobile: above notation so play is always visible)
   *  2. Algorithm notation strip
   *  3. Speed selector
   *  4. Keyboard hints (desktop only)
   *
   * See designs/phase4-svelte-integration.md §2 PlaybackControls Layout.
   */

  import { tick } from 'svelte';
  import { cubeStore, type SpeedSetting } from '$lib/stores/cubeStore.svelte.js';

  // ---------------------------------------------------------------------------
  // Notation token scroll-into-view
  // ---------------------------------------------------------------------------

  let tokenRefs: (HTMLSpanElement | null)[] = [];

  // Scroll current move token into view when stepIndex changes
  $effect(() => {
    const idx = cubeStore.stepIndex;
    tick().then(() => {
      const el = tokenRefs[idx];
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    });
  });

  // ---------------------------------------------------------------------------
  // Derived state helpers
  // ---------------------------------------------------------------------------

  const canStepBack = $derived(cubeStore.stepIndex > 0);
  const canStepForward = $derived(cubeStore.stepIndex < cubeStore.moves.length);
  const canPlay = $derived(cubeStore.moves.length > 0);

  /** Current move token string (for aria-live announcements). */
  const currentMoveToken = $derived(
    cubeStore.stepIndex > 0 && cubeStore.stepIndex <= cubeStore.moveTokens.length
      ? cubeStore.moveTokens[cubeStore.stepIndex - 1]
      : '',
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handlePlayPause(): void {
    if (cubeStore.isPlaying) {
      cubeStore.pause();
    } else {
      cubeStore.play();
    }
  }

  function handleSetSpeed(s: SpeedSetting): void {
    cubeStore.setSpeed(s);
  }
</script>

<!-- aria-live region for screen reader move announcements -->
<div aria-live="polite" aria-atomic="true" class="sr-only">
  {currentMoveToken ? `Move: ${currentMoveToken}` : ''}
</div>

<div class="space-y-3">
  <!-- Transport buttons (above notation on mobile — play is always immediately visible) -->
  <div class="flex justify-center lg:justify-start">
    <div class="join" role="group" aria-label="Playback controls">
      <!-- Reset -->
      <button
        class="btn btn-ghost btn-square join-item"
        title="Reset to start of algorithm (R)"
        aria-label="Reset to start of algorithm"
        onclick={cubeStore.reset}
      >
        <!-- Heroicons: arrow-path -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          class="h-5 w-5"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H5.498a.75.75 0 0 0-.75.75v3.236a.75.75 0 0 0 1.5 0v-1.73l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V3.935a.75.75 0 0 0-1.5 0v1.73l-.31-.31A7 7 0 0 0 3.239 8.294a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.216l.311.31h-2.432a.75.75 0 0 0 0 1.5h3.434a.75.75 0 0 0 .53-.219Z"
            clip-rule="evenodd"
          />
        </svg>
      </button>

      <!-- Step Back -->
      <button
        class="btn btn-square join-item"
        class:btn-disabled={!canStepBack}
        aria-label="Step back one move"
        aria-disabled={!canStepBack}
        title="Step back (←)"
        onclick={cubeStore.stepBack}
      >
        <!-- Heroicons: backward -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          class="h-5 w-5"
          aria-hidden="true"
        >
          <path
            d="M7.712 4.818A1.5 1.5 0 0 1 10 6.095v2.973c.104-.131.234-.248.384-.344l6.258-3.953A1.5 1.5 0 0 1 19 6.095v7.81a1.5 1.5 0 0 1-2.358 1.224l-6.258-3.953a1.505 1.505 0 0 1-.384-.344v2.973a1.5 1.5 0 0 1-2.288 1.277l-5.5-3.905a1.5 1.5 0 0 1 0-2.554l5.5-3.905Z"
          />
        </svg>
      </button>

      <!-- Play / Pause (primary) -->
      <button
        class="btn btn-primary btn-square join-item"
        class:btn-disabled={!canPlay}
        aria-label={cubeStore.isPlaying ? 'Pause' : 'Play'}
        aria-disabled={!canPlay}
        title="Play / Pause (Space)"
        onclick={handlePlayPause}
      >
        {#if cubeStore.isPlaying}
          <!-- Heroicons: pause -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            class="h-5 w-5"
            aria-hidden="true"
          >
            <path
              d="M5.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75A.75.75 0 0 0 7.25 3h-1.5ZM12.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75a.75.75 0 0 0-.75-.75h-1.5Z"
            />
          </svg>
        {:else}
          <!-- Heroicons: play -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            class="h-5 w-5"
            aria-hidden="true"
          >
            <path
              d="M6.3 2.84A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.27l9.344-5.891a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z"
            />
          </svg>
        {/if}
      </button>

      <!-- Step Forward -->
      <button
        class="btn btn-square join-item"
        class:btn-disabled={!canStepForward}
        aria-label="Step forward one move"
        aria-disabled={!canStepForward}
        title="Step forward (→)"
        onclick={cubeStore.stepForward}
      >
        <!-- Heroicons: forward -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          class="h-5 w-5"
          aria-hidden="true"
        >
          <path
            d="M12.288 4.818A1.5 1.5 0 0 0 10 6.095v2.973a1.505 1.505 0 0 0-.384-.344L3.358 4.77A1.5 1.5 0 0 0 1 5.995v7.81a1.5 1.5 0 0 0 2.358 1.224l6.258-3.953c.15-.096.28-.213.384-.344v2.973a1.5 1.5 0 0 0 2.288 1.277l5.5-3.905a1.5 1.5 0 0 0 0-2.554l-5.5-3.905Z"
          />
        </svg>
      </button>
    </div>
  </div>

  <!-- Mobile label hints under buttons (only on small screens) -->
  <div class="text-base-content/50 flex justify-center gap-4 text-xs lg:hidden" aria-hidden="true">
    <span>Reset</span>
    <span>Back</span>
    <span>{cubeStore.isPlaying ? 'Pause' : 'Play'}</span>
    <span>Forward</span>
  </div>

  <!-- Algorithm notation strip -->
  {#if cubeStore.moveTokens.length > 0}
    <div
      class="flex flex-wrap gap-1.5 py-2"
      style="scroll-behavior: smooth; overflow-x: auto;"
      aria-label="Algorithm notation"
      role="list"
    >
      {#each cubeStore.moveTokens as token, i (i)}
        <span
          bind:this={tokenRefs[i]}
          role="listitem"
          aria-current={i === cubeStore.stepIndex ? 'true' : undefined}
          class="badge badge-lg font-mono"
          class:badge-ghost={i < cubeStore.stepIndex}
          class:opacity-50={i < cubeStore.stepIndex}
          class:badge-primary={i === cubeStore.stepIndex}
          class:font-bold={i === cubeStore.stepIndex}
          class:badge-outline={i > cubeStore.stepIndex}
        >
          {token}
        </span>
      {/each}
    </div>
  {:else}
    <p class="text-base-content/50 py-2 text-sm italic">No algorithm loaded</p>
  {/if}

  <!-- Speed selector -->
  <div class="flex items-center gap-3">
    <span class="text-base-content/60 text-sm font-medium">Speed</span>
    <div class="join" role="group" aria-label="Animation speed">
      {#each ['slow', 'normal', 'fast'] as SpeedSetting[] as s (s)}
        <button
          class="btn btn-sm join-item"
          class:btn-active={cubeStore.speed === s}
          aria-pressed={cubeStore.speed === s}
          title={s === 'slow'
            ? '500ms per move'
            : s === 'normal'
              ? '250ms per move'
              : '120ms per move'}
          onclick={() => handleSetSpeed(s)}
        >
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </button>
      {/each}
    </div>
  </div>

  <!-- Keyboard hints — desktop only -->
  <div
    class="text-base-content/40 mt-1 hidden justify-start gap-4 text-xs lg:flex"
    aria-hidden="true"
  >
    <span><kbd class="kbd kbd-xs">R</kbd> Reset</span>
    <span><kbd class="kbd kbd-xs">←</kbd> Back</span>
    <span><kbd class="kbd kbd-xs">Space</kbd> Play</span>
    <span><kbd class="kbd kbd-xs">→</kbd> Fwd</span>
  </div>
</div>
