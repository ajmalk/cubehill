/**
 * commandPaletteStore.svelte.ts
 *
 * Shared reactive state for the command palette.
 *
 * - commandPaletteOpen: true while ninja-keys is visible (used by keyboard
 *   control handlers to suppress cube shortcuts).
 * - openPalette(): call to programmatically open the palette (used by Navbar).
 *
 * The CommandPalette component populates setOpenFn() on mount so Navbar can
 * trigger it without needing a direct DOM reference.
 */

let open = $state(false);

// Registered by CommandPalette.svelte after onMount
let openFn: (() => void) | null = null;

function setOpen(value: boolean): void {
  open = value;
}

function setOpenFn(fn: () => void): void {
  openFn = fn;
}

function openPalette(): void {
  if (openFn) openFn();
}

export const commandPaletteStore = {
  get open() {
    return open;
  },
  setOpen,
  setOpenFn,
  openPalette,
};
