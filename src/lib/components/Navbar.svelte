<script lang="ts">
  /**
   * Navbar.svelte
   *
   * Top navigation bar. Included in +layout.svelte to appear on all pages.
   * Uses DaisyUI navbar component with logo, nav links, theme toggle, and
   * a Cmd+K command palette trigger.
   *
   * Desktop: shows a [⌘K] kbd-style button on the right.
   * Mobile (<640px): shows a magnifying-glass icon button instead.
   *
   * All hrefs use resolve() from $app/paths for GitHub Pages subpath compatibility.
   *
   * See docs/technical/components.md "Navbar" section.
   * See designs/phase6-command-palette.md §10 for the Cmd+K hint design.
   */
  import { resolve } from '$app/paths';
  import ThemeToggle from './ThemeToggle.svelte';
  import { commandPaletteStore } from '$lib/stores/commandPaletteStore.svelte.js';

  function openPalette(): void {
    commandPaletteStore.openPalette();
  }
</script>

<div class="navbar bg-base-100 border-base-300 border-b px-4">
  <div class="flex-1">
    <a href={resolve('/')} class="text-primary text-xl font-bold">CubeHill</a>
  </div>
  <nav class="flex flex-none items-center gap-1">
    <a href={resolve('/oll/')} class="btn btn-ghost btn-sm">OLL</a>
    <a href={resolve('/pll/')} class="btn btn-ghost btn-sm">PLL</a>
    <ThemeToggle />

    <!-- Cmd+K palette trigger: kbd on desktop, search icon on mobile -->
    <button
      type="button"
      class="btn btn-ghost btn-sm ml-1"
      onclick={openPalette}
      aria-label="Open command palette"
      title="Open command palette (Cmd+K)"
    >
      <!-- Desktop: keyboard shortcut hint -->
      <span class="hidden sm:inline-flex items-center gap-1 text-xs opacity-60">
        <kbd class="kbd kbd-sm">⌘K</kbd>
      </span>
      <!-- Mobile: magnifying glass icon -->
      <span class="sm:hidden">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </span>
    </button>
  </nav>
</div>
