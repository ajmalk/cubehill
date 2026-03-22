# Theming

This document describes the DaisyUI theming system, dark/light mode switching, FOUC prevention, and how CSS theme variables are synchronized with the Three.js scene.

## DaisyUI Theme System

DaisyUI themes are applied via the `data-theme` attribute on the `<html>` element. Switching themes is as simple as changing this attribute — no JavaScript runtime, no CSS-in-JS, no class toggling on individual elements.

```html
<html data-theme="dark">  <!-- All DaisyUI components render in dark mode -->
<html data-theme="light"> <!-- All DaisyUI components render in light mode -->
```

### Configured Themes

The `tailwind.config.js` configures exactly two themes:

```javascript
module.exports = {
  // ...
  daisyui: {
    themes: ['light', 'dark'],
  },
};
```

DaisyUI ships with 35+ themes, but CubeHill uses only `light` and `dark` to keep the UI focused. These themes define CSS custom properties (e.g., `--b1` for base background, `--bc` for base content/text, `--p` for primary color) that all DaisyUI components consume.

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

### Theme Resolution Order

1. **localStorage**: If the user has previously chosen a theme, use it
2. **System preference**: Check `prefers-color-scheme` media query
3. **Default**: Fall back to `dark`

## FOUC Prevention (Flash of Unstyled Content)

A critical UX issue: if the theme is applied only after Svelte hydrates (in `onMount`), there is a visible flash where the page renders with the wrong theme before JavaScript runs.

### The Problem

1. HTML is served with no `data-theme` attribute (or a hardcoded default)
2. The browser paints the page with the default theme
3. JavaScript loads and reads `localStorage`
4. The correct theme is applied — causing a visible flash

### The Solution: Inline Blocking Script

An inline `<script>` in `src/app.html` runs **before** the page paints, setting the correct theme immediately:

```html
<!-- src/app.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script>
      // Runs before paint — prevents FOUC
      (function() {
        const saved = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = saved || (prefersDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
      })();
    </script>
    %sveltekit.head%
  </head>
  <body>
    %sveltekit.body%
  </body>
</html>
```

This script is intentionally **not** in an external file or a Svelte component. It must be inline in the HTML shell so it executes synchronously before first paint.

### Why This Works

- Inline `<script>` tags in the `<head>` are **parser-blocking** — the browser will not render any content until they finish executing
- `localStorage.getItem()` is synchronous
- `setAttribute()` is synchronous
- The DaisyUI CSS custom properties are already in the stylesheet — once `data-theme` is set, the correct colors are applied before anything is painted

## CSS Variable Sync with Three.js

The Three.js scene must match the page theme. Since Three.js manages its own WebGL colors (not CSS), theme changes must be manually propagated.

### Background Color Sync

The Three.js scene background should match the DaisyUI base background color (`--b1`). When the theme changes:

1. Read the computed CSS variable from the DOM
2. Convert it to a Three.js-compatible color
3. Apply it to the scene background

```typescript
function syncThemeToScene(scene: CubeScene) {
  const style = getComputedStyle(document.documentElement);
  const bgColor = style.getPropertyValue('--b1').trim();
  scene.setBackgroundColor(bgColor);
}
```

### DaisyUI Color Format

DaisyUI 4 uses oklch color values in its CSS custom properties (e.g., `--b1: 0.2 0.02 260`). These are oklch lightness, chroma, and hue values without the `oklch()` wrapper.

To use these in Three.js:

```typescript
function daisyColorToHex(cssVar: string): string {
  // Read the computed style (browser resolves oklch to rgb)
  const el = document.createElement('div');
  el.style.color = `oklch(${cssVar})`;
  document.body.appendChild(el);
  const computed = getComputedStyle(el).color; // returns "rgb(r, g, b)"
  document.body.removeChild(el);
  // Parse and convert to hex for Three.js
  return rgbStringToHex(computed);
}
```

Alternatively, use `getComputedStyle` on an element that already has the DaisyUI class applied, and read its resolved `background-color` directly — this avoids manual color parsing.

### Sticker Colors

Cube sticker colors (white, red, green, yellow, orange, blue) are **not** theme-dependent. They use fixed hex values matching the standard Rubik's cube color scheme, regardless of whether the page is in light or dark mode.

The black cubie body color is also fixed — it represents the physical black plastic of a real Rubik's cube.

### When to Sync

Theme-to-scene sync runs:
1. **On mount**: When the `CubeViewer` first initializes, read the current theme
2. **On theme toggle**: When the user switches themes, update the scene background

The `ThemeToggle` component (or the theme store) can dispatch a callback or use Svelte reactivity to trigger the sync:

```typescript
$effect(() => {
  // Re-runs whenever `theme` changes
  if (scene) {
    syncThemeToScene(scene);
  }
});
```

## Theme-Aware Components

### ninja-keys

The `ninja-keys` web component supports theming via CSS custom properties. It can be styled to match DaisyUI's current theme:

```css
ninja-keys {
  --ninja-accent-color: oklch(var(--p));      /* DaisyUI primary */
  --ninja-text-color: oklch(var(--bc));        /* DaisyUI base content */
  --ninja-modal-background: oklch(var(--b1));  /* DaisyUI base background */
}
```

This ensures the command palette looks consistent in both light and dark modes without any JavaScript color bridging.

### Algorithm Cards

Algorithm cards use DaisyUI's `card` component class, which automatically adapts to the active theme. The 2D pattern thumbnails on cards use a neutral grid with colored/uncolored sticker indicators that work in both themes.

### Playback Controls

Buttons use DaisyUI's `btn` classes, which inherit theme colors automatically. Active/pressed states follow the theme's primary color.

## Summary of Theme Data Flow

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
             └── Reads CSS variable --b1, calls scene.setBackgroundColor()
                 └── Three.js canvas background updates
```
