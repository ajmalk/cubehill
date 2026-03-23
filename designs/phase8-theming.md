# Phase 8: Theming — Design Spec

Design spec for full-system theming: DaisyUI theme integration, Three.js CSS variable sync, ninja-keys light/dark styling, theme persistence, and FOUC prevention.

**Inputs**: `docs/product/theming.md`, `designs/phase3-rendering-parameters.md`, `designs/phase4-svelte-integration.md`, `designs/phase6-command-palette.md`.

## Design Artifacts

**Figma file**: Design (`fiCCEbCrIIZqYVIm9XTjiD`), page: **Phase 8 — Theming**

### Figma Frames

| Frame | Node ID | Description |
|-------|---------|-------------|
| Detail Page — Dark Theme | `35:750` | OLL 21 detail page in dark theme |
| Detail Page — Light Theme | `35:810` | OLL 21 detail page in light theme |
| Navbar — Desktop with Theme Toggle | `35:872` | Toggle button location annotated |

All frames are in **Section: "Phase 8: Theming — Side-by-Side Comparison"** on page **Phase 8 — Theming**.

### Current State Screenshots (app as-built before Phase 8)

These screenshots document what Phase 8 must fix:

- `phase8-home-dark.png` — Home page, dark theme (canvas bg syncs correctly)
- `phase8-detail-dark.png` — Detail page, dark theme (canvas bg syncs correctly)
- `phase8-detail-light.png` — Detail page, light theme (**canvas bg does not sync — visible bug**)
- `phase8-browse-light.png` — Browse/listing page, light theme (cards look correct)

**Primary bug confirmed**: In light mode, the Three.js canvas background remains dark (`#1a1a1a`-range) while the page background is white. This creates a jarring visual box around the cube. Phase 8 must resolve this.

---

## 1. Theme Palette

CubeHill supports exactly **two themes**: `light` and `dark`. These are the DaisyUI v5 built-in themes — no custom theme is needed.

### Decision: No "Cubehill" Custom Theme

The Phase 6 command palette spec listed a "Cubehill" theme entry. **This is dropped.** Reasons:

- DaisyUI v5's built-in `light` and `dark` themes are clean and appropriate for a speedcubing tool.
- A custom theme requires maintaining custom CSS variables across every DaisyUI component — significant maintenance burden.
- The cubing community already broadly accepts both light and dark; there is no specific brand-color expectation for a tool like this.
- The command palette `THEME` section should offer only `Dark` and `Light`.

The Phase 6 command palette spec must be updated to remove the `Cubehill` entry (the Architect will own the corresponding update to `docs/technical/components.md`).

### Default Theme

**Dark** is the default theme. The cubing community predominantly uses dark-themed tools (ruwix.com, algdb.net, speedsolving.com all default dark or offer it prominently). First-time visitors to CubeHill should see the dark experience.

---

## 2. Three.js Scene Theming

The canvas must feel like the cube floats directly on the page — no visible "viewer box." This requires the Three.js renderer background to match the DaisyUI base background exactly.

### Background Color Sync

| Theme | DaisyUI variable | Approximate value | Three.js hex |
|-------|-----------------|-------------------|--------------|
| Dark | `--b1` | `oklch(20% 0.02 264)` | `#222636` (approx) |
| Light | `--b1` | `oklch(100% 0 0)` | `#FFFFFF` |

**Implementation approach** (for the Architect/Dev to spec technically):

1. Read the computed value of `--b1` from the document root using `getComputedStyle(document.documentElement).getPropertyValue('--color-base-100')` (DaisyUI v5 uses `--color-*` prefixed variables internally).
2. Convert the resolved OKLCH color to hex/rgb for Three.js.
3. Call `renderer.setClearColor(resolvedColor, 1)` after every theme change.
4. Subscribe to the theme store; re-read and re-apply on every theme change.

The existing Phase 3 spec already established this intention (`background: synced to DaisyUI --b1`). Phase 8 is the implementation milestone.

### Lighting

Lighting does **not** change per theme. The light setup from Phase 3 (ambient 0.6, key 0.8, fill 0.3, all white) works correctly in both themes. The sticker colors are vibrant enough to read clearly on both white and dark backgrounds.

If the team notices stickers looking washed out on the light theme during testing, consider a small ambient reduction to 0.5 in light mode — but this is a quality-of-life polish item, not a Phase 8 requirement.

### Sticker Colors

Sticker colors are **constant across themes**. They are calibrated in Phase 3 for screen readability and work equally well on dark and light backgrounds. Do not adjust them per theme.

| Face | Color | Hex |
|------|-------|-----|
| White (U) | Pure white | `#FFFFFF` |
| Red (R) | Tailwind red-600 | `#DC2626` |
| Green (F) | Tailwind green-600 | `#16A34A` |
| Yellow (D) | Tailwind yellow-400 | `#FACC15` |
| Orange (L) | Tailwind orange-500 | `#F97316` |
| Blue (B) | Tailwind blue-600 | `#2563EB` |
| Body (between faces) | Very dark gray | `#1A1A1A` |

The dark cubie body (`#1A1A1A`) contrasts correctly against both the dark page background (close but distinct) and the white page background (high contrast). No adjustment needed.

---

## 3. Component Theme Audit

All DaisyUI components (`btn`, `card`, `badge`, `kbd`, `join`) adapt automatically via CSS custom properties. No per-component manual theming is needed for those. The only manual work is the Three.js canvas (covered above) and ninja-keys (covered in Section 4).

### AlgorithmCard (Browse Page)

The cards use DaisyUI `card` and `bg-base-200`. Tested in both themes — adapts correctly. The 2D OLL/PLL pattern thumbnails use yellow (`#FACC15`) and dark gray (`#4B5563`) which are theme-independent and read well in both modes.

**Status: No changes needed.**

### Notation Pills (PlaybackControls)

Move tokens use `badge-primary`, `badge-ghost`, `badge-outline`. All DaisyUI semantic classes. Current move (primary) is the same blue-purple in both themes. Past/future moves auto-adapt.

**Status: No changes needed.**

### Transport Buttons (PlaybackControls)

Play button uses `btn-primary`. Reset uses `btn-ghost`. Step buttons use `btn` default. All auto-adapt.

**Status: No changes needed.**

### Speed Selector

Active speed button uses `btn-primary` or `btn-active`. Auto-adapts.

**Status: No changes needed.**

### Home Page Hero

The hero section uses `bg-base-100` (implicit, from page body) with descriptive text in `text-base-content`. The CubeViewer canvas sits inside this section. The canvas background sync (Section 2 above) is the only fix needed here.

**Status: Canvas bg fix required (Phase 8 primary deliverable).**

### Navigation / Header

The navbar uses DaisyUI `navbar` component classes. Logo uses `text-primary`. Nav links use `text-base-content`. Theme toggle button is a `btn-ghost btn-circle`. All adapt correctly.

**Status: No changes needed.**

### 2-Look Badge

The `2-Look` badge in the detail page uses a hardcoded amber/yellow background (`bg-warning`/`badge-warning`). This color is intentional and does not need to change per theme. It remains readable in both themes.

**Status: No changes needed.**

---

## 4. ninja-keys Theming

Phase 6 specified CSS custom properties for the dark theme only. Here are both themes.

The Phase 6 spec hardcoded dark values directly (e.g., `oklch(15% 0.01 260)` for the modal background). For Phase 8, these should be expressed using DaisyUI variables where possible, with explicit fallback values for where ninja-keys uses properties that DaisyUI does not map cleanly.

### Full Property Table

| Property | Dark value | Light value | Notes |
|----------|-----------|-------------|-------|
| `--ninja-width` | `560px` | `560px` | Unchanged |
| `--ninja-top` | `120px` | `120px` | Adjusted to `16px` on mobile (both themes) |
| `--ninja-key-border-radius` | `6px` | `6px` | Unchanged |
| `--ninja-modal-background` | `oklch(15% 0.01 260)` | `oklch(100% 0 0)` | White modal on light theme |
| `--ninja-modal-shadow` | `0 24px 48px rgba(0,0,0,0.6)` | `0 12px 32px rgba(0,0,0,0.15)` | Lighter shadow on light |
| `--ninja-selected-background` | `oklch(26% 0.08 260)` | `oklch(93% 0.01 264)` | Light: subtle gray highlight |
| `--ninja-text-color` | `oklch(92% 0.005 260)` | `oklch(15% 0.01 264)` | High-contrast text in each |
| `--ninja-placeholder-color` | `oklch(55% 0.01 260)` | `oklch(55% 0.01 264)` | Same muted value works both |
| `--ninja-footer-background` | `oklch(12% 0.01 260)` | `oklch(95% 0.005 264)` | Light: slightly off-white footer |
| `--ninja-footer-color` | `oklch(55% 0.01 260)` | `oklch(45% 0.01 264)` | Slightly darker muted on light |
| `--ninja-accent-color` | `oklch(65% 0.18 260)` | `oklch(55% 0.22 264)` | Primary blue, slightly deeper on light for contrast |
| `--ninja-z-index` | `9999` | `9999` | Unchanged |
| `--ninja-backdrop-filter` | `blur(4px)` | `blur(4px)` | Phase 6 backdrop blur |

### Implementation Pattern

The correct way to apply theme-reactive styles to ninja-keys is via a CSS block that responds to the `data-theme` attribute on `<html>`:

```css
/* Default (dark) */
ninja-keys {
  --ninja-modal-background: oklch(15% 0.01 260);
  --ninja-selected-background: oklch(26% 0.08 260);
  --ninja-text-color: oklch(92% 0.005 260);
  --ninja-footer-background: oklch(12% 0.01 260);
  --ninja-footer-color: oklch(55% 0.01 260);
  --ninja-accent-color: oklch(65% 0.18 260);
  --ninja-modal-shadow: 0 24px 48px rgba(0, 0, 0, 0.6);
  /* ... shared properties ... */
}

/* Light theme override */
[data-theme="light"] ninja-keys {
  --ninja-modal-background: oklch(100% 0 0);
  --ninja-selected-background: oklch(93% 0.01 264);
  --ninja-text-color: oklch(15% 0.01 264);
  --ninja-footer-background: oklch(95% 0.005 264);
  --ninja-footer-color: oklch(45% 0.01 264);
  --ninja-accent-color: oklch(55% 0.22 264);
  --ninja-modal-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}
```

This approach is SSR-safe and requires no JavaScript — it follows the same pattern as DaisyUI's own theming.

### Overlay (Backdrop)

The backdrop behind the modal uses `rgba(0, 0, 0, 0.55)` in dark mode. In light mode, use `rgba(0, 0, 0, 0.3)` — a lighter overlay since the page content is already light and a heavy overlay creates unnecessary visual weight.

---

## 5. Theme Toggle UX

### Primary Entry Point: Navbar

The theme toggle button lives in the navbar, always visible. It is a circular button (32×32px) positioned between the `PLL` link and the `[⌘K]` hint.

Desktop navbar layout (left to right):

```
[ CubeHill ]  OLL  PLL  [ ⌘K ]  [ ☀/🌙 ]
```

The toggle is the rightmost element — secondary in the visual hierarchy but reachable without scrolling or opening any menu.

**Icon convention**:
- Dark theme active → show moon icon (clicking switches to light)
- Light theme active → show sun icon (clicking switches to dark)

The icon should represent the **current** theme, not the action (this is the most common convention on the web — show what you have, not what you'll get). This matches the current implementation.

### Secondary Entry Point: Command Palette

The command palette (⌘K) includes a `THEME` section with two commands:

```
THEME
├── Dark   → apply dark theme
└── Light  → apply light theme
```

The active theme should show a checkmark or indicator beside the active entry so the user knows which is current. Theme applies immediately without closing the palette (live preview behavior, per Phase 6 spec).

### No Other Theme Entry Points

There is no theme selector in any other location. The browse page, detail page, and home page do not have inline theme controls — the navbar toggle is sufficient and consistent.

### Mobile

On mobile (<640px), the navbar layout is:

```
[ CubeHill ]  [ ☀/🌙 ]
```

The theme toggle is still in the navbar, right-aligned. The OLL and PLL links move to a hamburger menu or are shown inline (per Phase 4 spec). The theme toggle stays visible at all times — it is lightweight enough (one button) to keep in the top bar on mobile.

---

## 6. FOUC Prevention

FOUC (Flash of Unstyled Content) in theming context means: the user loads the page, sees the wrong theme for 1-2 frames, then the correct theme snaps in. This is visually jarring.

### Root Cause

If the theme is stored in `localStorage` and applied after hydration, the page first renders with the default theme (dark) then switches. If the user preferred light, they see a dark flash.

### Solution: Inline Script in `<head>`

Inject a tiny blocking script in `<head>` (before any CSS loads) that reads `localStorage` and sets `data-theme` on `<html>` synchronously:

```html
<script>
  // Runs synchronously before any CSS or JS loads
  (function() {
    const stored = localStorage.getItem('cubehill-theme');
    const theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  })();
</script>
```

This script is intentionally tiny (no dependencies, no async). It runs before the browser paints, so the user never sees the wrong theme.

**Key constraints**:
- Must be placed in `<head>` before any `<link>` tags
- Must be inline (not a separate file) — a separate file would introduce a network round-trip delay
- Must not throw — if `localStorage` is unavailable (private browsing), default to `dark`
- Must not read `document.body` or any DOM element — only `document.documentElement` is available this early

### SvelteKit Integration

In SvelteKit, the correct location is `src/app.html` inside the `<head>` block:

```html
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  %sveltekit.head%
  <script>
    (function() {
      try {
        const stored = localStorage.getItem('cubehill-theme');
        const theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    })();
  </script>
</head>
```

The `try/catch` handles `localStorage` being blocked (Safari ITP in private mode, strict browser settings).

### Three.js Sync on First Load

On first load, the Three.js scene must read the correct theme immediately. Since Three.js initializes in `onMount` (which runs after the theme is already set by the inline script), this is automatic — `getComputedStyle` will return the correct `--b1` value at mount time.

No additional coordination is needed beyond the inline script.

---

## 7. Transition Behavior

Theme changes should be **instant**, not animated.

**Rationale**: CSS transitions on `background-color` during a full-theme switch cause a cascade of intermediate states across every component simultaneously. This looks chaotic, not elegant. The "snap" from one theme to another feels intentional and clean — like flipping a physical switch.

The one exception is the theme toggle button icon, which may use a short rotation or scale animation (100-150ms) as tactile feedback that the button was pressed. This is limited to the icon, not the page content.

**Three.js background**: The canvas background updates at the next `requestAnimationFrame` after the theme change (1-frame delay, imperceptible at 60fps). No CSS transition on the canvas element.

**ninja-keys**: The CSS custom properties update synchronously with the `data-theme` attribute change. The palette, if open during a theme switch, snaps to the new theme immediately — which is intentional (users switching themes via the palette can see the live result).

---

## 8. Theme Persistence

### Storage Key

Use `localStorage` key `cubehill-theme`. Simple string value: `'dark'` or `'light'`.

### Read / Write Flow

```
Page load
  → inline script reads localStorage → sets data-theme on <html>
  → SvelteKit hydrates → themeStore initializes from current data-theme attribute
  → user toggles theme → themeStore updates → data-theme attribute updates → localStorage updates
```

The store reads the initial value from the DOM attribute (which was set by the inline script), not from localStorage directly. This avoids a second localStorage read and keeps the store as the single source of truth post-hydration.

### Fallback Behavior

| Condition | Behavior |
|-----------|----------|
| No localStorage entry | Default to `dark` |
| Invalid value in localStorage | Default to `dark` |
| localStorage unavailable | Default to `dark` (caught in inline script try/catch) |
| User has OS dark mode preference | Use `prefers-color-scheme` as tie-breaker only if no localStorage entry; still defaults to `dark` if both are absent |

The `prefers-color-scheme` media query can inform the initial default when no preference is stored:

```javascript
// Only run if no stored preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const theme = prefersDark ? 'dark' : 'light';
```

This is a nice-to-have; the simpler approach (always default to dark) is acceptable for Phase 8.

---

## 9. Summary of Phase 8 Implementation Tasks

For the Full-Stack Dev and Architect to action:

| Task | Owner | Priority |
|------|-------|----------|
| Fix Three.js canvas bg sync in light theme | Dev | Critical |
| Add inline FOUC-prevention script to `app.html` | Dev | Critical |
| Implement theme persistence via localStorage | Dev | Critical |
| Add light-theme CSS properties for ninja-keys | Dev | High |
| Remove `Cubehill` theme entry from command palette | Dev | High |
| Verify `themeStore` initializes from DOM attribute (not localStorage) | Dev | High |
| Add `[data-theme="light"] ninja-keys` CSS block | Dev | High |
| Verify sticker colors in light mode (no changes expected) | Dev | Medium |
| Optional: respect `prefers-color-scheme` as initial default | Dev | Low |

---

## Quick Reference

```
THEMES
  supported:        dark (default), light
  no custom theme:  Cubehill theme removed from spec

THREE.JS
  canvas bg:        synced to DaisyUI --b1 on mount and every theme change
  lighting:         unchanged between themes (ambient 0.6, key 0.8, fill 0.3)
  sticker colors:   constant, no per-theme adjustment

FOUC PREVENTION
  method:           inline script in <head> before CSS
  key:              localStorage 'cubehill-theme'
  fallback:         dark

THEME PERSISTENCE
  key:              'cubehill-theme'
  values:           'dark' | 'light'
  fallback:         'dark'

THEME TOGGLE LOCATION
  primary:          navbar button (rightmost, always visible)
  secondary:        command palette THEME section (Dark / Light)
  transition:       instant (no CSS animation on content)
  toggle icon:      may have 100-150ms rotation animation

NINJA-KEYS LIGHT THEME
  modal bg:         oklch(100% 0 0)           (white)
  selected bg:      oklch(93% 0.01 264)       (light gray)
  text:             oklch(15% 0.01 264)       (near black)
  footer bg:        oklch(95% 0.005 264)      (off-white)
  footer text:      oklch(45% 0.01 264)       (medium gray)
  accent:           oklch(55% 0.22 264)       (primary blue, deeper)
  shadow:           0 12px 32px rgba(0,0,0,0.15)
  backdrop:         rgba(0, 0, 0, 0.30)       (lighter overlay)
```
