# Phase 4: Svelte Integration Design Spec

Design spec for `CubeViewer` and `PlaybackControls` components. All values are implementation-ready. This document builds on Phase 3's visual parameters — the 3D cube itself (cubie geometry, colors, camera, lighting, animation timing) is already specced there. Phase 4 is about how the cube and playback controls sit in the page.

### Phase 4 Scope

**In scope**: CubeViewer layout and sizing, PlaybackControls (notation strip, transport buttons, speed selector), algorithm detail page layout (desktop + mobile), loading/error states, accessibility, keyboard shortcuts, camera interaction.

**Out of scope for Phase 4**: Alternative algorithm notations. Each algorithm case has one canonical notation string in Phase 4. Displaying alternative notations (e.g., mirror variants, different move orders that produce the same case) is deferred to a later phase. The current data model and UI do not need to accommodate multiple notation variants yet.

---

## 1. CubeViewer Layout

### Purpose

`CubeViewer.svelte` is a thin shell: a `<canvas>` element inside a sizing container. It has no UI of its own. Its job is to give the Three.js scene a correctly-sized DOM surface and to expose imperative methods the parent page can call (load algorithm, step forward, etc.).

### Container Structure

```
<div class="cube-viewer-container">   ← sizing wrapper
  <canvas bind:this={canvas} />       ← Three.js target
  <div class="cube-loading">...</div> ← loading overlay (conditional)
</div>
```

The container does all the sizing work. The canvas is always 100%×100% of the container.

### Sizing by Context

The container receives its size from the parent page, not from internal logic. Two contexts:

#### Home Page (Hero)

The parent applies:

```html
<div class="cube-hero-wrapper">
  <CubeViewer />
</div>
```

```css
.cube-hero-wrapper {
  width: min(60vw, 60vh, 500px);
  aspect-ratio: 1;
  min-width: 280px;
  margin: 0 auto;
}
```

Tailwind equivalent: `w-[min(60vw,60vh,500px)] min-w-[280px] aspect-square mx-auto`

The cube-viewer-container inside fills 100% of this wrapper. The canvas is square, auto-sized, centered on the page. The cube floats in the center of the hero section above the intro text and navigation cards.

#### Algorithm Detail Page — Desktop (>1024px)

The page uses a two-column layout:

```
+---------------------------+---------------------------+
|                           |                           |
|     CubeViewer            |     Algorithm Info        |
|     (left column)         |     (right column)        |
|                           |                           |
+---------------------------+---------------------------+
```

Left column sizing:

- Width: 50% of the content container (`w-1/2`)
- Max width: 500px (`max-w-[500px]`)
- Aspect ratio: 1:1 (`aspect-square`)
- The column itself flexes to fill available space; the cube-hero-wrapper inside is capped at max-width

Tailwind for the page-level two-column container:

```html
<div class="flex flex-col lg:flex-row gap-8 items-start">
  <div class="w-full lg:w-1/2 lg:max-w-[500px] aspect-square flex-shrink-0">
    <CubeViewer />
  </div>
  <div class="flex-1 min-w-0">
    <!-- algorithm info + PlaybackControls -->
  </div>
</div>
```

#### Algorithm Detail Page — Tablet (640–1024px) and Mobile (<640px)

Stacked layout (same column, cube on top):

```
+---------------------------+
|                           |
|     CubeViewer            |
|     (full width)          |
|                           |
+---------------------------+
|     Algorithm Info +      |
|     PlaybackControls      |
+---------------------------+
```

The `flex-col` on the page container is already the default before `lg:flex-row` kicks in.

Mobile cube sizing:
- Width: 100% of the content container minus page padding
- Max width: 480px (`max-w-[480px]`)
- Max height: 50vh (`max-h-[50vh]`) — caps the cube on short mobile screens so the Play button is not pushed off-screen
- Centered: `mx-auto`
- Aspect ratio: 1:1 (the `max-h-[50vh]` cap overrides the aspect ratio on short screens, producing a slightly non-square canvas — acceptable at that size)

On small screens (< 360px), the cube shrinks naturally with the viewport — no hard minimum below 280px because at that width the page itself has very little margin.

### CubeViewer Component Props

```typescript
interface CubeViewerProps {
  // Optional: passes initial algorithm notation to load on mount
  algorithm?: string;

  // Optional: whether to auto-rotate on the home hero (future enhancement)
  autoRotate?: boolean;
}
```

The component exposes these methods to parents via `bind:this`:

```typescript
interface CubeViewerMethods {
  loadAlgorithm(notation: string): void;
  stepForward(): void;
  stepBack(): void;
  reset(): void;
}
```

Parents call these directly (no event bus needed for Phase 4). The `PlaybackControls` component does not call these directly — it writes to `cubeStore`, and `CubeViewer` reacts to the store.

### Orbit Controls: Interaction Design

Users control the camera with:

| Input | Action |
|-------|--------|
| Left mouse drag | Orbit (rotate around cube) |
| Right mouse drag | Disabled (pan is off) |
| Scroll wheel | Zoom in/out |
| Two-finger pinch (mobile) | Zoom in/out |
| One-finger drag (mobile) | Orbit |
| Double-click / double-tap | Reset camera to default position (400ms ease-out) |

**Conflict resolution with playback**: Orbit is always available regardless of playback state. The user can rotate the cube while an animation plays. This is intentional — watching a move from a different angle is a valid learning action.

**Cursor feedback**: Set `cursor: grab` on the canvas container; `cursor: grabbing` while dragging. Use a CSS class toggled by `mousedown`/`mouseup` events on the container.

```css
.cube-viewer-container {
  cursor: grab;
}
.cube-viewer-container.is-dragging {
  cursor: grabbing;
}
```

### Touch Gestures

Three.js `OrbitControls` handles touch natively once `enableZoom: true`. No custom touch code is needed. The canvas element should have `touch-action: none` to prevent the browser from intercepting touches for scrolling while the user is interacting with the cube.

```html
<canvas bind:this={canvas} style="touch-action: none;" />
```

This is the only mobile-specific canvas attribute needed.

### Loading State

Before Three.js initializes, show a skeleton/placeholder rather than a blank canvas. The loading state is a positioned overlay inside the container, shown while the component has not yet called `onMount`.

**Design**: Dark square with a centered spinner using DaisyUI's `loading` component.

```html
{#if !initialized}
  <div class="absolute inset-0 flex items-center justify-center bg-base-200 rounded-lg">
    <span class="loading loading-spinner loading-lg text-primary"></span>
  </div>
{/if}
```

The container needs `position: relative` (`relative` class) for the overlay to work.

The spinner disappears immediately when `onMount` completes and `CubeScene` has been instantiated. There is no fade — the cube appears immediately on first render, avoiding a flash of empty canvas.

If Three.js fails to initialize (e.g., WebGL not supported), replace the spinner with an error message:

```html
<div class="absolute inset-0 flex items-center justify-center bg-base-200 rounded-lg">
  <div class="text-center text-base-content/60 text-sm px-4">
    <p>3D view unavailable</p>
    <p class="text-xs mt-1">WebGL is not supported in this browser</p>
  </div>
</div>
```

### Visual Integration with Page

From Phase 3: the canvas background matches the page background (`--b1` DaisyUI variable). This means:

- No border on the canvas or container
- No box shadow
- No rounded corners on the canvas itself (the canvas fills its container flush)
- The container may have `rounded-lg` applied from the parent if desired, but the canvas has no visual border of its own
- The cube floats directly on the page

---

## 2. PlaybackControls Layout

### Component Overview

`PlaybackControls.svelte` renders below the CubeViewer on mobile and in the right column on desktop. It contains:

1. The algorithm notation display (sequence of moves, current move highlighted)
2. The transport button bar (step back, play/pause, step forward, reset)
3. The speed selector

These are always in this vertical order regardless of screen size.

**State ownership**: `PlaybackControls` is a read-only consumer of `cubeStore`. It does not drive step logic directly. Instead, it dispatches intent (e.g., user pressed Step Forward) and the store — which mirrors the animator's state — applies the transition. This keeps the component stateless with respect to playback position.

**`stepBack` implementation note**: The animator only moves forward. `stepBack` is implemented by the store rewinding through a state history array (snapshots of cube state at each step boundary), not by running the animator in reverse. The component is unaware of this distinction — it simply calls the store action.

### Algorithm Notation Display

The notation strip shows the full algorithm as a sequence of move tokens, with the current move highlighted. This is the primary visual connection between the controls and what the cube is doing.

**Design**:

- Horizontal scrollable flex row of move tokens
- Each token is a DaisyUI `badge` element
- Current move: `badge-primary` with slightly larger text
- Completed moves: `badge-ghost` (muted)
- Future moves: `badge-outline` (dim)
- The current move token automatically scrolls into view as playback advances

```html
<div class="flex flex-wrap gap-1.5 py-2 overflow-x-auto">
  {#each moves as move, i}
    <span class="badge badge-lg font-mono
      {i < stepIndex ? 'badge-ghost opacity-50' : ''}
      {i === stepIndex ? 'badge-primary font-bold' : ''}
      {i > stepIndex ? 'badge-outline' : ''}">
      {move}
    </span>
  {/each}
</div>
```

Font: `font-mono` for all move tokens. Monospace is critical here — move tokens like `R`, `R'`, `R2`, `U`, `U'` need to align cleanly and not cause badge widths to shift during playback. This reduces visual noise as the highlight moves through the sequence.

Token spacing: `gap-1.5` (6px). Dense enough to feel like a sequence, not a list.

Scroll behavior: `scroll-behavior: smooth` on the container, with a `scrollIntoView` call on the current token whenever `stepIndex` changes.

#### Notation Strip Loading State

Before the algorithm data arrives (store is loading), replace the token row with a skeleton placeholder:

```html
{#if loading}
  <div class="flex gap-1.5 py-2">
    {#each Array(8) as _}
      <span class="badge badge-lg badge-ghost animate-pulse w-10">&nbsp;</span>
    {/each}
  </div>
{/if}
```

Eight placeholder badges at fixed width give a realistic approximation of a short algorithm. The `animate-pulse` opacity cycle signals loading without a spinner.

#### Notation Strip Error State

If no algorithm is loaded (e.g., the algorithm ID in the URL is invalid), display a message in place of the token row:

```html
{#if error || moves.length === 0}
  <div class="flex items-center gap-2 py-2 text-sm text-base-content/50 italic">
    <span>No algorithm loaded</span>
  </div>
{/if}
```

This state also disables the Play and Step Forward buttons (covered under Disabled States below).

### Transport Buttons

Five buttons arranged in a single `join` (DaisyUI button group):

```
[ ⏮ ] [ ◀ ] [ ▶ / ⏸ ] [ ▶▶ ] [ ⏹ ]
```

Wait — there are 4 actions (step back, play/pause, step forward, reset), not 5. The correct arrangement:

```
[ ⏮ Reset ] [ ◀ Step Back ] [ ▶ Play / ⏸ Pause ] [ ▶ Step Fwd ]
```

Layout:

```html
<div class="join">
  <button class="btn btn-ghost btn-square join-item" title="Reset (R)" aria-label="Reset">
    <!-- reset icon -->
  </button>
  <button class="btn btn-square join-item" title="Step back (←)" aria-label="Step back">
    <!-- step back icon -->
  </button>
  <button class="btn btn-primary btn-square join-item" title="Play / Pause (Space)" aria-label="{isPlaying ? 'Pause' : 'Play'}">
    <!-- play or pause icon, toggled by isPlaying -->
  </button>
  <button class="btn btn-square join-item" title="Step forward (→)" aria-label="Step forward">
    <!-- step forward icon -->
  </button>
</div>
```

#### Icon Choices

Use SVG icons from the Heroicons set (MIT license, commonly used with Tailwind projects). All icons at 20×20px (`w-5 h-5`).

| Button | Icon Name | Heroicons identifier |
|--------|-----------|---------------------|
| Reset | Arrow path (circular arrow) | `arrow-path` |
| Step back | Backward step | `backward` |
| Play | Play | `play` |
| Pause | Pause | `pause` |
| Step forward | Forward step | `forward` |

The Play/Pause button swaps icons based on `isPlaying` state. Use `btn-primary` for this button only — it is the primary action and should stand out visually.

The step back and step forward buttons use the default `btn` style (solid, same visual weight as each other).

The Reset button uses `btn-ghost` — lower visual weight than the step buttons to signal that it is a different kind of action (destructive/restorative rather than sequential). Ghost style keeps it available without competing for attention during normal step-through usage.

#### Text Labels on Mobile (Step Back / Step Forward)

On mobile, step back and step forward buttons display a short text label beneath the icon. Icon-only controls are ambiguous for beginners who may not recognise the skip-backward/skip-forward icons as single-step actions.

Implementation: replace `btn-square` with a fixed-width button that stacks icon and label vertically on small screens.

```html
<!-- Step back — mobile shows label, desktop icon-only -->
<button class="btn join-item flex flex-col items-center gap-0.5 px-3 sm:btn-square sm:px-0"
        title="Step back (←)" aria-label="Step back">
  <!-- backward icon, w-5 h-5 -->
  <span class="text-[10px] leading-none sm:hidden">Back</span>
</button>

<!-- Step forward — same pattern -->
<button class="btn join-item flex flex-col items-center gap-0.5 px-3 sm:btn-square sm:px-0"
        title="Step forward (→)" aria-label="Step forward">
  <!-- forward icon, w-5 h-5 -->
  <span class="text-[10px] leading-none sm:hidden">Fwd</span>
</button>
```

`sm:hidden` hides the label at tablet and above. `sm:btn-square` restores the square shape on desktop. The Reset and Play/Pause buttons remain icon-only at all sizes — Reset is a recognizable circular-arrow icon and Play/Pause is universally understood.

#### Button Sizes

- Desktop: `btn-md` (default, ~40px height)
- Mobile: `btn-md` as well — do not reduce size on mobile, these are touch targets and need to be at least 44px

Step back and step forward buttons expand slightly wider on mobile to accommodate the text label. `btn-square` is removed on mobile for these two buttons only (see above).

All other buttons (`btn-square`) keep equal width and height.

#### Disabled States

- Step back: disabled when `stepIndex === 0`
- Step forward: disabled when `stepIndex === moves.length - 1` and `!isPlaying`
- Reset: never disabled (always useful to have)
- Play: disabled when `moves.length === 0` (no algorithm loaded)

Apply the `btn-disabled` class and `aria-disabled="true"` when a button is disabled. Do not use the native `disabled` attribute — it prevents tooltip display and looks inconsistent across browsers.

### Speed Selector

A compact row beneath the transport buttons, labeled "Speed":

```
Speed   [ Slow ]  [ Normal ]  [ Fast ]
```

Implementation: DaisyUI `join` with 3 `btn` items. The active speed gets `btn-active` (or `btn-primary` — see note below).

```html
<div class="flex items-center gap-3 mt-3">
  <span class="text-sm text-base-content/60 font-medium">Speed</span>
  <div class="join">
    <button class="btn btn-sm join-item {speed === 'slow' ? 'btn-active' : ''}"
            title="500ms per move"
            on:click={() => setSpeed('slow')}>
      Slow
    </button>
    <button class="btn btn-sm join-item {speed === 'normal' ? 'btn-active' : ''}"
            title="250ms per move"
            on:click={() => setSpeed('normal')}>
      Normal
    </button>
    <button class="btn btn-sm join-item {speed === 'fast' ? 'btn-active' : ''}"
            title="120ms per move"
            on:click={() => setSpeed('fast')}>
      Fast
    </button>
  </div>
</div>
```

Speed values (from Phase 3 spec):

| Label | Duration | Use case |
|-------|----------|----------|
| Slow | 500ms | Beginners studying individual moves |
| Normal | 250ms | Default; balanced learning and efficiency |
| Fast | 120ms | Experienced cubers scanning algorithms |

Default: **Normal** (250ms). The speed setting persists for the session but does not need localStorage persistence in Phase 4.

Note on active style: `btn-active` in DaisyUI uses a slight inset shadow. For clearer differentiation, `btn-primary` on the active speed button is acceptable. Use `btn-active` as the default — it is subtler and does not compete with the primary Play button. If the visual distinction is unclear in testing, switch to `btn-primary` for the active speed.

### Keyboard Shortcut Hints

Show keyboard shortcuts as `kbd` elements inline with their associated buttons. On desktop, show them as tooltip-style text below each button. On mobile, hide them entirely.

Desktop layout (below the join group):

```html
<div class="hidden lg:flex justify-center gap-2 mt-1 text-xs text-base-content/40">
  <span><kbd class="kbd kbd-xs">R</kbd> Reset</span>
  <span><kbd class="kbd kbd-xs">←</kbd> Back</span>
  <span><kbd class="kbd kbd-xs">Space</kbd> Play</span>
  <span><kbd class="kbd kbd-xs">→</kbd> Fwd</span>
</div>
```

`hidden lg:flex` ensures these hints only appear on desktop. On mobile, users discover controls by tapping. Showing shortcut hints on mobile adds visual noise without utility (mobile users do not have keyboards).

The `title` attribute on each button already provides a tooltip with the shortcut on hover, which works well on desktop as a secondary discovery mechanism.

### Full PlaybackControls Structure

```
PlaybackControls.svelte
│
├── [Algorithm notation strip]
│   └── Flex row of badge tokens, current highlighted in primary
│
├── [Transport button group]
│   └── join: Reset · Step Back · Play/Pause · Step Forward
│
├── [Speed selector]
│   └── "Speed" label + join: Slow · Normal · Fast
│
└── [Keyboard hints — desktop only]
    └── hidden lg:flex row of kbd hints
```

Outer container: no special wrapper classes. The component renders into whatever column or stacked section the parent provides. Use `space-y-3` between the notation strip, button group, and speed selector for consistent vertical rhythm.

### Responsive Behavior

#### Desktop (>1024px)

Controls sit in the right column next to the cube. The column has natural width from `flex-1`. The notation strip may wrap across multiple lines if the algorithm is long (e.g., a 21-move PLL). `flex-wrap` handles this correctly. The transport buttons and speed selector stay on one line.

#### Tablet (640–1024px) and Mobile (<640px)

Controls sit below the cube in a single column. Full width. Same layout — no changes needed. The notification strip wraps if needed. The transport button group is centered via the parent column.

On mobile specifically, add `justify-center` to the transport `join` wrapper so the buttons are centered on narrow screens rather than left-aligned:

```html
<div class="flex justify-center lg:justify-start">
  <div class="join">...</div>
</div>
```

---

## 3. Algorithm Detail Page: Full Layout

This shows how CubeViewer and PlaybackControls combine on the detail page.

### Desktop Layout

```
┌─ Navbar ──────────────────────────────────────────────────────────────┐
│  CubeHill        OLL   PLL                              [Theme Toggle] │
└───────────────────────────────────────────────────────────────────────┘

┌─ main.container ──────────────────────────────────────────────────────┐
│                                                                       │
│  ┌─ Left column (lg:w-1/2, max 500px) ────┐  ┌─ Right column ──────┐ │
│  │                                        │  │                     │ │
│  │                                        │  │  OLL 21 — T-Shape   │ │
│  │        [ 3D CUBE VIEWER ]              │  │                     │ │
│  │        (square, floats on bg)          │  │  R U R' U R U2 R'   │ │
│  │                                        │  │  ○ ○ ● ○ ○ ○ ○      │ │
│  │                                        │  │                     │ │
│  │                                        │  │  [ ⏮ ][ ◀ ][ ▶ ][ ▶ ] │ │
│  │                                        │  │                     │ │
│  │                                        │  │  Speed: Slow Normal Fast │ │
│  │                                        │  │                     │ │
│  │                                        │  │  R  ←  Space  →     │ │
│  └────────────────────────────────────────┘  │                     │ │
│                                              │  [← OLL 20] [OLL 22 →] │ │
│                                              └─────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
```

Right column content order (top to bottom):
1. Case title and ID (e.g., "OLL 21 — T-Shape")
2. Algorithm notation strip
3. Transport button group
4. Speed selector
5. Keyboard shortcut hints
6. Prev/Next case navigation links

### Mobile Layout

```
┌─ Navbar ──────────────────────────────┐
│  CubeHill                      [☰]    │
└───────────────────────────────────────┘

┌─ main.container ──────────────────────┐
│                                       │
│  OLL 21 — T-Shape                     │
│                                       │
│  ┌─ Cube (full width, max 480px) ───┐  │
│  │                                  │ │
│  │     [ 3D CUBE VIEWER ]           │ │
│  │     (square)                     │ │
│  │                                  │ │
│  └──────────────────────────────────┘ │
│                                       │
│  R U R' U R U2 R'                     │
│  ○ ○ ● ○ ○ ○ ○                        │
│                                       │
│       [ ⏮ ][ ◀ ][ ▶ ][ ▶ ]            │
│                                       │
│  Speed: [ Slow ] [ Normal ] [ Fast ]  │
│                                       │
│  [← OLL 20]              [OLL 22 →]  │
│                                       │
└───────────────────────────────────────┘
```

Note on prev/next navigation: on desktop, prev/next links appear top-right of the content area. On mobile they move to the bottom, below the controls, so they do not compete with the primary playback interaction.

---

## 4. DaisyUI Component Summary

| Element | DaisyUI class(es) | Notes |
|---------|-------------------|-------|
| Transport button group | `join`, `btn btn-square join-item` | Play gets `btn-primary`; Reset gets `btn-ghost`; step buttons get default `btn` |
| Speed selector | `join`, `btn btn-sm join-item`, `btn-active` | 3 items: Slow, Normal, Fast |
| Move token (future) | `badge badge-lg badge-outline font-mono` | |
| Move token (current) | `badge badge-lg badge-primary font-bold font-mono` | |
| Move token (past) | `badge badge-lg badge-ghost font-mono opacity-50` | |
| Keyboard hint | `kbd kbd-xs` | Desktop only, `hidden lg:inline` |
| Loading spinner | `loading loading-spinner loading-lg text-primary` | Inside `absolute inset-0` overlay |

---

## 5. Accessibility

### Keyboard Navigation

All interactive controls must be reachable via Tab. The focus order for the detail page:

1. Navbar links
2. Prev/Next case links
3. Transport buttons (Reset → Step Back → Play/Pause → Step Forward)
4. Speed selector buttons

The cube canvas itself does not receive keyboard focus (Tab skips it). Keyboard controls for the cube (Space, arrows, R) are document-level listeners, not focus-dependent. This matches the pattern in `components.md`.

### ARIA Labels

- Transport buttons: `aria-label` on each button (the icon provides no text)
- Play/Pause button: dynamic `aria-label` that updates with state (`"Play"` or `"Pause"`)
- Speed buttons: `aria-pressed="true"` on the active speed button
- Notation strip: `aria-label="Algorithm notation"` on the container; `aria-current="true"` on the current move token

### Screen Reader Announcements

When playback advances a step, announce the current move:

```html
<div aria-live="polite" aria-atomic="true" class="sr-only">
  {currentMove ? `Move: ${currentMove}` : ''}
</div>
```

`aria-live="polite"` does not interrupt the user. The announcement updates with each step so a screen reader user knows which move the cube just performed.

---

## 6. Theme Handling

The PlaybackControls component uses only DaisyUI semantic color classes (`btn`, `badge-primary`, `text-base-content`, etc.) — no hardcoded colors. This means dark/light theme switching is automatic. No additional theme code is needed in this component.

The CubeViewer container similarly uses `bg-base-200` only for the loading state overlay. The canvas itself uses the Three.js background color synced to `--b1` (specified in Phase 3).

---

## Summary of Key Values (Quick Reference)

```
CUBE VIEWER
  home hero size:       min(60vw, 60vh, 500px), aspect-square
  home hero min:        280px
  detail desktop:       lg:w-1/2, lg:max-w-[500px], aspect-square
  detail mobile/tablet: w-full, max-w-[480px], max-h-[50vh], aspect-square, mx-auto
  canvas touch:         touch-action: none
  cursor:               grab / grabbing
  loading:              DaisyUI loading-spinner, loading-lg, text-primary
  no border:            canvas floats on page bg, no visual separation

PLAYBACK CONTROLS
  notation tokens:      badge-lg, font-mono, gap-1.5
    past:               badge-ghost, opacity-50
    current:            badge-primary, font-bold
    future:             badge-outline
    loading:            animate-pulse placeholder badges (8×)
    error/empty:        "No algorithm loaded" italic muted text
  transport group:      join, btn btn-square join-item
    play/pause:         btn-primary (accent)
    reset:              btn-ghost (lower visual weight, different action type)
    step back/fwd:      btn (default)
  step labels (mobile): "Back" / "Fwd" text below icon, sm:hidden on desktop
  button size:          btn-md (both desktop and mobile, 44px+ touch target)
  speed selector:       btn btn-sm join-item, btn-active for selected
    slow:               500ms
    normal:             250ms (default)
    fast:               120ms
  kbd hints:            hidden lg:flex, kbd kbd-xs
  mobile centering:     flex justify-center lg:justify-start

LAYOUT (DETAIL PAGE)
  page container:       flex flex-col lg:flex-row gap-8 items-start
  left col (cube):      w-full lg:w-1/2 lg:max-w-[500px] aspect-square flex-shrink-0
  right col (controls): flex-1 min-w-0
  controls spacing:     space-y-3 between notation, buttons, speed
```
