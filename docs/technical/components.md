# Components & Interaction

This document describes the Svelte component APIs, reactive stores, keyboard controls, and command palette integration. For page descriptions and user flows, see [Product: Pages & Layout](../product/pages-and-layout.md).

## Components

### CubeViewer (`src/lib/components/CubeViewer.svelte`)

The 3D cube canvas mount point. See `rendering.md` for full details on the Three.js integration.

Key responsibilities:
- Creates a `<canvas>` element sized to fit its container
- Instantiates `CubeScene` in `onMount` (Three.js must not run server-side)
- Attaches a `ResizeObserver` for responsive canvas sizing
- Exposes methods for the parent to trigger animations and state updates
- Calls `scene.dispose()` in `onDestroy` to clean up WebGL resources

### AlgorithmList (`src/lib/components/AlgorithmList.svelte`)

Renders a grid of `AlgorithmCard` components:
- Accepts an array of `Algorithm` objects
- Groups them by their `group` field and renders section headers
- Responsive grid: adjusts column count based on viewport width

### AlgorithmCard (`src/lib/components/AlgorithmCard.svelte`)

A clickable card representing a single algorithm case:
- Displays the case name (e.g., "OLL 1", "T Perm")
- Renders a 2D thumbnail of the case pattern (a 3x3 grid showing oriented vs. unoriented stickers)
- Shows the probability of encountering the case
- Links to the detail page using `base` from `$app/paths`

### PlaybackControls (`src/lib/components/PlaybackControls.svelte`)

Transport controls for stepping through an algorithm:

| Button | Action |
|--------|--------|
| Play / Pause | Start or pause auto-playback of the algorithm |
| Step Forward | Advance one move and animate it |
| Step Back | Revert one move (apply the inverse) |
| Reset | Return the cube to the initial unsolved state |

Playback state is managed by `cubeStore.svelte.ts`, which tracks the current algorithm, the step index, and the play/pause flag.

### Navbar (`src/lib/components/Navbar.svelte`)

Top navigation bar using DaisyUI's `navbar` component:
- Logo/title linking to home
- Navigation links to OLL and PLL pages
- `ThemeToggle` component for dark/light mode switching
- All links use `base` from `$app/paths` as prefix (required for GitHub Pages subpath deployment)

### ThemeToggle (`src/lib/components/ThemeToggle.svelte`)

A toggle switch for dark/light mode:
- Reads and writes the theme preference via `themeStore.svelte.ts`
- Sets the `data-theme` attribute on the `<html>` element
- Persists the user's choice to `localStorage`
- See `theme-integration.md` for full details on the theming system

### CommandPalette (`src/lib/components/CommandPalette.svelte`)

Wraps the `ninja-keys` web component. See the Command Palette section below for full details.

## Command Palette

The command palette is powered by `ninja-keys`, a framework-agnostic web component that provides a Cmd+K / Ctrl+K search interface with nested menus.

### Mounting

`CommandPalette.svelte` is mounted once in `+layout.svelte` so it's available on every page. The `ninja-keys` element is imported dynamically inside `onMount` to avoid SSR issues (it requires browser APIs):

```svelte
<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  let ninjaKeys: HTMLElement;

  onMount(async () => {
    await import('ninja-keys');
    // Configure commands after the element is defined
    ninjaKeys.data = buildCommands();
  });
</script>

{#if browser}
  <ninja-keys bind:this={ninjaKeys}></ninja-keys>
{/if}
```

### Command Structure

Commands are organized as a nested menu:

```
Root
├── OLL → (opens nested menu)
│   ├── OLL 1
│   ├── OLL 2
│   ├── ...
│   └── OLL 57
├── PLL → (opens nested menu)
│   ├── Aa Perm
│   ├── Ab Perm
│   ├── ...
│   └── Z Perm
├── Toggle Theme
└── Home
```

Each command includes:
- `id`: Unique identifier
- `title`: Display text (e.g., "OLL 1 — Dot Cases")
- `parent`: ID of parent menu for nesting (e.g., OLL cases have `parent: 'oll'`)
- `handler`: Navigation function using `goto()` with `base` prefix
- `keywords`: Additional search terms (e.g., the algorithm notation itself, so users can search by moves)

### Search

ninja-keys provides built-in fuzzy search. The `keywords` field on each command enhances discoverability:
- Searching "T Perm" finds the T Perm PLL case
- Searching "R U R'" finds algorithms that contain those moves
- Searching "dot" finds OLL cases in the "Dot Cases" group

### Open/Close Events

The command palette dispatches events when it opens and closes. These events are used to disable cube keyboard shortcuts while the palette is open (see Keyboard Controls below).

## Keyboard Controls

### Cube Controls

When viewing an algorithm detail page, keyboard shortcuts allow quick interaction:

| Key | Action |
|-----|--------|
| Space | Play / Pause |
| → (Right Arrow) | Step forward one move |
| ← (Left Arrow) | Step back one move |
| R | Reset to initial state |
| Escape | Close command palette (if open) |

### Safety Guards

Keyboard shortcuts must be disabled in two situations to prevent conflicts:

1. **Command palette is open**: When ninja-keys is open, all keypresses should go to its search input, not the cube. Listen for the palette's open/close events and set a flag.

2. **Text input is focused**: If a user is typing in any `<input>`, `<textarea>`, or `contenteditable` element, keyboard shortcuts should not fire. Check `document.activeElement` before processing keystrokes.

```typescript
function handleKeydown(event: KeyboardEvent) {
  // Don't intercept when command palette is open
  if (commandPaletteOpen) return;

  // Don't intercept when typing in an input
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if ((document.activeElement as HTMLElement)?.isContentEditable) return;

  switch (event.key) {
    case ' ':
      event.preventDefault();
      togglePlayback();
      break;
    case 'ArrowRight':
      stepForward();
      break;
    case 'ArrowLeft':
      stepBack();
      break;
    case 'r':
      resetCube();
      break;
  }
}
```

### Event Listener Lifecycle

The keydown listener is added in `onMount` and removed in `onDestroy` to prevent memory leaks and stale handlers when navigating between pages.

## Reactive State (Svelte Stores)

### cubeStore (`src/lib/stores/cubeStore.svelte.ts`)

Manages the cube state and playback using Svelte 5 runes:

```typescript
let cubeState = $state(solved());       // Current cube state (number[54])
let algorithm = $state<Move[]>([]);      // Current algorithm being played
let stepIndex = $state(0);               // Current step in the algorithm
let isPlaying = $state(false);           // Whether auto-playback is active
let history = $state<number[][]>([]);    // State history for undo/step-back
```

Key operations:
- **loadAlgorithm(notation: string)**: Parse the notation, compute the inverse to get the unsolved state, reset playback
- **stepForward()**: Apply the next move, push current state to history, advance index
- **stepBack()**: Pop the last state from history, decrement index
- **play()**: Set `isPlaying = true`, step forward on a timer until done or paused
- **pause()**: Set `isPlaying = false`
- **reset()**: Restore the initial unsolved state, clear history, reset index

### themeStore (`src/lib/stores/themeStore.svelte.ts`)

Manages the dark/light mode preference. See `theme-integration.md` for details.
