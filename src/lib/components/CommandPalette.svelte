<script lang="ts">
  /**
   * CommandPalette.svelte
   *
   * Wraps the ninja-keys web component for global Cmd+K / Ctrl+K command palette.
   * Mounted once in +layout.svelte so it is available on every page.
   *
   * SSR safety: ninja-keys is dynamically imported inside onMount and the
   * <ninja-keys> element is guarded by {#if browser} to prevent server-side
   * rendering issues.
   *
   * Open/close state is tracked via ninja:open / ninja:close events and reflected
   * into commandPaletteStore so keyboard-control handlers on detail pages can read it.
   *
   * Exposes openPalette() via commandPaletteStore.setOpenFn() so the Navbar
   * button can programmatically open the palette without a direct DOM reference.
   *
   * See designs/phase6-command-palette.md for the full UX spec.
   * See docs/technical/components.md "Command Palette" section.
   */
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { buildCommands } from '$lib/commands/commandData.js';
  import { commandPaletteStore } from '$lib/stores/commandPaletteStore.svelte.js';

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------

  let ninjaEl: HTMLElement | undefined = $state(undefined);

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  onMount(async () => {
    // Dynamically import ninja-keys — registers the <ninja-keys> custom element.
    // This must not run server-side (ninja-keys requires browser APIs).
    await import('ninja-keys');

    // Wait a microtask for Svelte to bind ninjaEl after the import resolves.
    await Promise.resolve();

    if (!ninjaEl) return;

    // Populate command data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ninjaEl as any).data = buildCommands();

    // Register open function so Navbar (and others) can trigger the palette
    commandPaletteStore.setOpenFn(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ninjaEl as any)?.open();
    });

    // Track open/close state in shared store
    ninjaEl.addEventListener('ninja:open', () => {
      commandPaletteStore.setOpen(true);
    });
    ninjaEl.addEventListener('ninja:close', () => {
      commandPaletteStore.setOpen(false);
    });
  });
</script>

<!--
  ninja-keys handles Cmd+K / Ctrl+K natively.
  The <ninja-keys> element is SSR-guarded by {#if browser}.
  CSS custom properties match the CubeHill dark theme per the design spec §9.
  Mobile override adjusts --ninja-top so the modal stays visible above the virtual keyboard.
-->
{#if browser}
  <ninja-keys
    bind:this={ninjaEl}
    placeholder="Search algorithms, navigate, change theme…"
    hideBreadcrumbs
  ></ninja-keys>
{/if}

<style>
  :global(ninja-keys) {
    --ninja-width: 560px;
    --ninja-top: 120px;
    --ninja-key-border-radius: 6px;
    --ninja-modal-background: oklch(15% 0.01 260);
    --ninja-modal-shadow: 0 24px 48px rgba(0, 0, 0, 0.6);
    --ninja-selected-background: oklch(26% 0.08 260);
    --ninja-text-color: oklch(92% 0.005 260);
    --ninja-placeholder-color: oklch(55% 0.01 260);
    --ninja-footer-background: oklch(12% 0.01 260);
    --ninja-footer-color: oklch(55% 0.01 260);
    --ninja-accent-color: oklch(65% 0.18 260);
    --ninja-z-index: 9999;
  }

  @media (max-width: 639px) {
    :global(ninja-keys) {
      --ninja-top: 16px;
      --ninja-width: calc(100vw - 32px);
    }
  }
</style>
