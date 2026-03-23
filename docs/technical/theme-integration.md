# Theme Integration

This document describes the theme store, FOUC prevention technique, and CSS variable synchronization with Three.js. For theme selection UX and theme-aware component styling, see [Product: Theming](../product/theming.md).

## Implementation Status

Several theming deliverables were completed during Phase 4. This table tracks what is already in place vs. what Phase 8 needs to add.

| Deliverable | Status | Notes |
|---|---|---|
| Theme store with persistence | Done (Phase 4) | `themeStore.svelte.ts` |
| FOUC prevention | Done (Phase 4) | Inline script in `src/app.html` |
| Three.js background sync | Done (Phase 4) | `CubeViewer` `$effect` + `syncBackground()` |
| Three.js lighting sync | **Phase 8** | Lights are hardcoded; need per-theme tuning |
| ninja-keys CSS variable styling | **Phase 8** | Depends on Phase 6 `CommandPalette` component |
| Full component theme audit | **Phase 8** | Formal verification pass, not yet done |

---

## Theme Store

`src/lib/stores/themeStore.svelte.ts` manages the user's theme preference using Svelte 5 runes:

```typescript
let theme = $state<'light' | 'dark'>('dark');

function toggleTheme() {
  theme = theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') {
    theme = saved;
  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    theme = 'light';
  } else {
    theme = 'dark';
  }
  document.documentElement.setAttribute('data-theme', theme);
}
```

`initTheme()` is called from `+layout.svelte`'s `onMount`. This means the store always reflects the correct theme before any child component mounts.

### Theme Resolution Order

1. **localStorage**: If the user has previously chosen a theme, use it
2. **System preference**: Check `prefers-color-scheme` media query
3. **Default**: Fall back to `dark`

---

## FOUC Prevention (Flash of Unstyled Content)

**Status: Implemented.**

### The Problem

1. HTML is served with no `data-theme` attribute (or a hardcoded default)
2. The browser paints the page with the default theme
3. JavaScript loads and reads `localStorage`
4. The correct theme is applied — causing a visible flash

### The Solution: Inline Blocking Script

An inline `<script>` in `src/app.html` runs **before** the page paints, setting the correct theme immediately:

```html
<!-- src/app.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script>
      // Runs before paint — prevents FOUC
      (function () {
        const saved = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = saved || (prefersDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
      })();
    </script>
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

This script is intentionally **not** in an external file or a Svelte component. It must be inline in the HTML shell so it executes synchronously before first paint.

### Why This Works

- Inline `<script>` tags in the `<head>` are **parser-blocking** — the browser will not render any content until they finish executing
- `localStorage.getItem()` is synchronous
- `setAttribute()` is synchronous
- The DaisyUI CSS custom properties are already in the stylesheet — once `data-theme` is set, the correct colors are applied before anything is painted

---

## CSS Variable Sync with Three.js

The Three.js scene must match the page theme. Since Three.js manages its own WebGL colors (not CSS), theme changes must be manually propagated.

### Background Color Sync

**Status: Implemented.**

The Three.js scene background matches the DaisyUI base background color (`bg-base-100`). When the theme changes, `CubeViewer`'s `$effect` detects the `themeStore.theme` change and calls `scene.syncBackground()`.

#### DaisyUI Color Format — Critical Detail

DaisyUI 5 + Tailwind 4 uses oklch colors internally. `THREE.Color` does not understand oklch. The implemented solution in `resolveDaisyColor()` (in `CubeScene.ts`) works around this with a canvas pixel readback:

1. Create a temporary `div` with `class="bg-base-100"` and append it off-screen
2. Read `getComputedStyle(el).backgroundColor` — the browser resolves oklch to `rgb(r, g, b)`
3. Draw that color onto a 1×1 canvas and read the pixel back as `[r, g, b]` integers
4. Return a `#rrggbb` hex string that `THREE.Color` accepts natively

**Do not do this:**
```typescript
const b1 = getComputedStyle(document.documentElement).getPropertyValue('--b1').trim();
scene.setBackgroundColor(b1); // Wrong: raw oklch channel values, THREE.Color cannot parse
```

**The implemented approach:**
```typescript
export function resolveDaisyColor(className = 'bg-base-100', fallback = '#1d232a'): string {
  const el = document.createElement('div');
  el.className = className;
  el.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;';
  document.body.appendChild(el);
  const computed = getComputedStyle(el).backgroundColor;
  document.body.removeChild(el);
  // Draw to canvas and read back pixel — guaranteed RGB regardless of input format
  const canvas = document.createElement('canvas');
  canvas.width = 1; canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = computed;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}
```

The sync is triggered from `CubeViewer`:

```typescript
$effect(() => {
  const _theme = themeStore.theme; // creates reactive dependency
  if (scene && initialized && _theme) {
    scene.syncBackground();
  }
});
```

### Lighting Sync

**Status: Phase 8 deliverable.**

Currently `CubeScene.setupLights()` uses hardcoded intensities regardless of the active theme:

```typescript
// Current — theme-unaware
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
```

In light mode the scene background is very bright (near white), which makes the cube look flat because the ambient contribution is relatively low compared to the background. Phase 8 should add a `syncLighting(theme: 'light' | 'dark')` method to `CubeScene` that adjusts ambient and directional light intensities.

**Proposed values (to be verified by the UX Designer):**

| Light | Dark mode | Light mode |
|---|---|---|
| Ambient intensity | 0.6 | 0.8 |
| Key light intensity | 0.8 | 0.6 |
| Fill light intensity | 0.3 | 0.25 |

The rationale: dark backgrounds need stronger key and fill lights to make cubies pop; light backgrounds benefit from higher ambient to avoid harsh shadows.

`CubeViewer`'s `$effect` should be extended to also call `syncLighting`:

```typescript
$effect(() => {
  const _theme = themeStore.theme;
  if (scene && initialized && _theme) {
    scene.syncBackground();
    scene.syncLighting(_theme);
  }
});
```

### Sticker Colors

Cube sticker colors (white, red, green, yellow, orange, blue) are **not** theme-dependent. They use fixed hex values matching the standard Rubik's cube color scheme, regardless of whether the page is in light or dark mode.

The black cubie body color is also fixed — it represents the physical black plastic of a real Rubik's cube.

---

## ninja-keys Theming

**Status: Phase 8 deliverable. Depends on Phase 6 (CommandPalette component).**

ninja-keys is a web component that supports styling via CSS custom properties. The `CommandPalette` component (implemented in Phase 6) will include the following in its scoped `<style>` block or in `src/app.css`:

```css
ninja-keys {
  --ninja-width: 560px;
  --ninja-top: 120px;
  --ninja-key-border-radius: 6px;
  --ninja-z-index: 9999;

  /* Dark theme values (DaisyUI "dark") */
  --ninja-modal-background: oklch(15% 0.01 260);
  --ninja-modal-shadow: 0 24px 48px rgba(0, 0, 0, 0.6);
  --ninja-selected-background: oklch(26% 0.08 260);
  --ninja-text-color: oklch(92% 0.005 260);
  --ninja-placeholder-color: oklch(55% 0.01 260);
  --ninja-footer-background: oklch(12% 0.01 260);
  --ninja-footer-color: oklch(55% 0.01 260);
  --ninja-accent-color: oklch(65% 0.18 260);
}

@media (max-width: 639px) {
  ninja-keys {
    --ninja-top: 16px;
  }
}
```

### Theme-Aware Approach

Because ninja-keys sits inside the shadow DOM, CSS custom properties are the only styling mechanism available. DaisyUI's own custom properties (e.g. `oklch(var(--b1))`) can be used directly in the values — they inherit through shadow DOM boundaries:

```css
ninja-keys {
  --ninja-modal-background: oklch(var(--b1));
  --ninja-text-color: oklch(var(--bc));
  --ninja-accent-color: oklch(var(--p));
  --ninja-selected-background: oklch(var(--b2));
  --ninja-footer-background: oklch(var(--b3));
}
```

This approach means the palette automatically adapts when the user switches between light and dark themes — no JavaScript needed, no hardcoded oklch values. The Phase 6 design spec provides hardcoded dark-theme values as a reference; Phase 8 should replace those with DaisyUI variable references so both themes work correctly.

**Decision**: Use DaisyUI CSS variable references rather than hardcoded oklch values. The Phase 6 design spec hardcoded values are dark-theme only; the variable approach handles both themes automatically and is less brittle against future DaisyUI version changes.

---

## Component Theme Audit

**Status: Phase 8 deliverable.**

All Svelte components that render visible UI must be verified to look correct in both light and dark themes. Most components use DaisyUI utility classes which inherit theme colors automatically, but the audit should confirm this and catch any hardcoded colors that would break in one theme.

### Components to Verify

| Component | Theme-sensitive elements | Audit notes |
|---|---|---|
| `Navbar` | `bg-base-100`, `border-base-300` | Uses DaisyUI classes — expected to pass |
| `ThemeToggle` | `btn-ghost`, SVG `fill-current` | Uses DaisyUI classes — expected to pass |
| `CubeViewer` | Three.js canvas background, loading spinner, error state | Background sync implemented; spinner uses `text-primary` |
| `PlaybackControls` | Buttons, badge colors, notation strip, keyboard hints | Uses DaisyUI classes; `badge-warning` color should be verified |
| `AlgorithmCard` | Card background, OLL pattern SVG, PLL pattern SVG | **OLL/PLL thumbnails use hardcoded oklch values** — see note below |
| `AlgorithmList` | Group headers, card grid | Uses DaisyUI classes — expected to pass |

### OLL and PLL Thumbnail SVG Colors

`AlgorithmCard.svelte` uses hardcoded oklch values for the pattern thumbnails:

```svelte
<!-- OLL: oriented cell = yellow, unoriented = dark grey -->
fill={oriented ? 'oklch(85% 0.2 95)' : 'oklch(40% 0 0)'}

<!-- PLL: all background cells = dark grey -->
fill="oklch(40% 0 0)"
```

The dark grey (`oklch(40% 0 0)`) is intentional — it represents unoriented/neutral cube faces, analogous to the physical grey plastic showing through. This color is theme-independent by design. However, both values should be spot-checked in light mode to ensure the contrast is acceptable against the card's `bg-base-200` background.

If contrast is insufficient in light mode, options are:
- Use `oklch(35% 0 0)` for the neutral cells (slightly darker)
- Switch to `currentColor` with a CSS custom property defined per theme

This decision should be made during the Phase 8 component audit with visual verification in both themes.

### Detail Pages

The route pages (`/oll/`, `/pll/`, `/oll/[id]/`, `/pll/[id]/`, `/`) use DaisyUI layout and typography classes. These should be verified alongside the component audit.

---

## Theme Data Flow

```
User clicks ThemeToggle (or first page load)
        │
        ▼
themeStore updates `theme` state
        │
        ├──► document.documentElement.setAttribute('data-theme', theme)
        │    └── All DaisyUI components update automatically via CSS
        │
        ├──► localStorage.setItem('theme', theme)
        │    └── Persisted for next visit
        │
        └──► CubeViewer.$effect detects change
             ├── scene.syncBackground()  → Three.js canvas background updates
             └── scene.syncLighting()   → Ambient/key/fill intensities update [Phase 8]
```

FOUC prevention (inline script in `app.html`) runs before this flow, ensuring the correct `data-theme` is applied before any paint occurs.

---

## Phase 8 Subtask Summary

| Subtask | Description |
|---|---|
| `cubehill-n6o.1` | Add `syncLighting(theme)` to `CubeScene`; extend `CubeViewer` `$effect` to call it |
| `cubehill-n6o.2` | Add ninja-keys CSS custom properties to `CommandPalette` component using DaisyUI variable references (after Phase 6 lands) |
| `cubehill-n6o.3` | Visual audit of all components in both light and dark themes; fix any hardcoded colors that fail the contrast check |
