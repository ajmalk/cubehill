<script lang="ts">
  /**
   * Navbar.svelte
   *
   * Top navigation bar. Included in +layout.svelte to appear on all pages.
   * Uses DaisyUI navbar component with logo, nav links, and theme toggle.
   *
   * All hrefs use resolve() from $app/paths for GitHub Pages subpath compatibility.
   *
   * See docs/technical/components.md "Navbar" section.
   */
  import { resolve } from '$app/paths';
  import ThemeToggle from './ThemeToggle.svelte';
</script>

<div class="navbar bg-base-100 border-base-300 border-b px-4">
  <div class="flex-1">
    <a href={resolve('/')} class="text-primary text-xl font-bold">CubeHill</a>
  </div>
  <nav class="flex flex-none items-center gap-1">
    <a href={resolve('/oll/')} class="btn btn-ghost btn-sm">OLL</a>
    <a href={resolve('/pll/')} class="btn btn-ghost btn-sm">PLL</a>
    <ThemeToggle />
  </nav>
</div>
