# Stack Choices

This document explains the technology choices for CubeHill and the reasoning behind each decision.

## Framework: Svelte 5 + SvelteKit + Vite

**Chosen over**: React + Vite, Vanilla JS + Vite, Next.js

### Why Svelte

- **Lighter than React**: Svelte compiles away at build time — no virtual DOM overhead, smaller bundle. CubeHill is a custom interactive app, not a typical component-heavy web page, so React's ecosystem premium is less valuable.
- **More structure than Vanilla JS**: The app has enough UI structure (algorithm browser, navigation, multiple pages) that a framework is justified. Building routing, state management, and component lifecycle from scratch in vanilla JS would be significant effort.
- **Svelte 5 runes**: The new `$state` reactivity model is clean and works well for managing cube state, playback state, and theme preferences.
- **SvelteKit**: Provides file-based routing, SSR/SSG, and `adapter-static` for GitHub Pages — all built in.
- **Vite**: SvelteKit uses Vite under the hood — fast dev server with HMR, optimized production builds.

### Why not React

- The command palette (ninja-keys) and 3D engine (Three.js) are both framework-agnostic, so React's ecosystem advantage for those components doesn't apply.
- React Three Fiber (R3F) is excellent but adds a layer of abstraction we don't need for a single, focused 3D scene.
- Heavier runtime for an app that's primarily a 3D viewer with navigation.

### Why not Next.js

- Next.js is designed for server-rendered apps. CubeHill is a fully static site.
- Requires `output: 'export'` config to produce static files — fighting against its default design.
- Heavier tooling for no practical benefit over SvelteKit + adapter-static.

### Why not Vanilla JS

- Too much manual work for routing, component rendering, and state management.
- The algorithm browser, navigation, and multiple pages benefit from a component model.

## 3D Rendering: Three.js

**Chosen over**: React Three Fiber, CSS 3D Transforms, Babylon.js

### Why Three.js

- Industry-standard WebGL library with a large community and extensive documentation.
- Many existing Rubik's cube implementations as reference.
- Full control over geometry, materials, lighting, and animation.
- Framework-agnostic — works with Svelte via imperative initialization in `onMount`.

### Why not React Three Fiber

- Only makes sense with React. Since we chose Svelte, R3F isn't an option.
- Even with React, R3F adds abstraction over Three.js that isn't needed for a single focused 3D scene.

### Why not CSS 3D Transforms

- No real lighting or shadows — limited visual quality.
- Complex face-turn animations are janky with CSS transforms.
- Insufficient for smooth, professional-looking algorithm visualization.

### Why not Babylon.js

- Full game engine — significantly more powerful than needed for a cube visualizer.
- Much larger bundle size for features we won't use (physics, particles, etc.).

## Command Palette: ninja-keys

**Chosen over**: cmdk, command-pal, light-cmd-palette

### Why ninja-keys

- **Web Component**: Framework-agnostic — works with Svelte without any wrapper or adapter.
- **Nested menus**: Perfect for organizing algorithms by category (OLL → cases, PLL → cases).
- **Auto-registers hotkeys**: Can bind keyboard shortcuts to specific algorithms automatically.
- **Polished UI**: Looks good out of the box with light/dark theme support.
- **Cmd+K / Ctrl+K**: Uses the standard convention users expect.

### Why not cmdk

- React-only. Since we chose Svelte, it's not an option.
- Excellent library if using React, but the React lock-in isn't worth it for just the command palette.

### Why not command-pal

- Good option with fuzzy search (fuse.js), but ninja-keys has more polished UI and nested menu support.
- Fuzzy search is a nice-to-have but not critical — ninja-keys' built-in search + keywords field handles algorithm discovery well.

### Why not light-cmd-palette

- Too basic — no nested menus, no per-command shortcuts, no dynamic command management.
- Missing features that matter for organizing 78+ algorithms.

## Styling: DaisyUI + Tailwind CSS

**Chosen over**: Skeleton UI, vanilla CSS

### Why DaisyUI

- **Pure CSS, zero JavaScript**: No bundle size impact beyond the CSS.
- **65+ components, 35+ themes**: Pre-built navigation, menus, cards, and buttons cover the algorithm browser UI needs.
- **Massive community**: 39k GitHub stars, actively maintained (99.2% issue resolution rate).
- **Framework-agnostic**: Works with Svelte or anything else — just CSS class names.
- **Simple mental model**: Semantic class names like `btn`, `menu`, `navbar` — easy to learn and use.
- **Dark mode**: Multiple dark themes available out of the box with `data-theme` attribute switching.

### Why not Skeleton UI

- Currently in a v2 → v3 transition with breaking changes — risky for a new project.
- Smaller community (5.9k stars vs 39k).
- More opinionated design system — harder to achieve a custom look.
- While Svelte-native, the transition instability is a concern.

### Why not vanilla CSS

- The app has enough traditional UI (navigation, algorithm cards, lists, menus) that utility classes and pre-built components save significant time.
- DaisyUI's theme system provides dark/light mode for free.
- Can still write custom CSS where needed — DaisyUI doesn't prevent it.

## Language: TypeScript

**Chosen over**: JavaScript

### Why TypeScript

- Cube state management involves complex data (54-sticker arrays, permutation cycles, algorithm parsing) where types prevent subtle bugs.
- Three.js has excellent TypeScript support via `@types/three`.
- Refactoring is safer — renaming a move type propagates through the codebase.
- IDE support (autocompletion, error detection) speeds up development.
- SvelteKit has first-class TypeScript support.

## Hosting: GitHub Pages

**Chosen over**: Vercel, Netlify, self-hosted

### Why GitHub Pages

- Free hosting for static sites.
- Integrated with the GitHub repository — deploy via GitHub Actions on push to main.
- SvelteKit's `adapter-static` produces a `build/` folder that maps directly to GitHub Pages.
- No server required — the app is fully static (algorithm data is bundled at build time).
- Simple `.nojekyll` file bypasses Jekyll processing.

### Configuration required

- `paths.base` set to `/cubehill` in production (GitHub Pages serves from a subpath).
- `trailingSlash: 'always'` for correct route resolution.
- `adapter-static` with `fallback: '404.html'`.
