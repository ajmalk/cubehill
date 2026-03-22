# CubeHill

A speedcubing algorithm visualizer — a static web app with a 3D Rubik's cube, algorithm browsing UI, command palette, and keyboard controls.

## Stack

- **Framework**: Svelte 5 + SvelteKit (with `adapter-static`)
- **Build**: Vite
- **3D Rendering**: Three.js
- **Command Palette**: ninja-keys (web component)
- **Styling**: DaisyUI + Tailwind CSS
- **Language**: TypeScript
- **Hosting**: GitHub Pages

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Build static site to build/
npm run preview      # Preview production build locally
```

## Project Architecture

See `docs/` for detailed documentation:

- `docs/stack.md` — Stack choices and reasoning
- `docs/architecture.md` — Project structure and data flow
- `docs/cube-engine.md` — Cube state model, moves, notation parsing
- `docs/rendering.md` — Three.js 3D rendering and animation
- `docs/algorithms.md` — Algorithm data model, OLL/PLL cases
- `docs/ui.md` — UI components, routing, command palette, keyboard controls
- `docs/theming.md` — DaisyUI theming, dark/light mode
- `docs/deployment.md` — GitHub Pages deployment setup

## Key Conventions

### Cube State
- Cube state is a `number[54]` array — each index maps to a sticker position, each value is a color
- State is **immutable** — every move returns a new array, never mutate in place
- This is the single source of truth; the 3D renderer reads from it

### Three.js + Svelte Integration
- Three.js must only initialize client-side — always wrap in `onMount` or guard with `{#if browser}`
- Three.js is treated as an imperative side-effect, not made reactive
- After each animation, reset cubie transforms to canonical positions and re-color from logical state (prevents floating-point drift)

### Routing & Links
- All internal links and `goto()` calls must use `base` from `$app/paths` as prefix
- This is required for GitHub Pages where the app lives at `/cubehill/`

### SSR Safety
- `ninja-keys` and `three` both require browser APIs
- Use dynamic `import()` inside `onMount` or `{#if browser}` guards
- Never import Three.js or ninja-keys at the top level of a `.svelte` file

### Keyboard Controls
- Disable cube keyboard shortcuts when the command palette is open
- Disable when any text input is focused
- Check for these conditions before processing keystrokes

## Algorithm Data
- OLL: 57 cases, PLL: 21 cases
- Stored as static TypeScript arrays in `src/lib/data/`
- Each case has: id, name, category, notation, pattern, group, probability

## Team

This project uses a team of 5 agents:

1. **Product Manager** — manages team, prioritizes work, writes/maintains docs
2. **Full-Stack Dev** — implements all code
3. **UX Expert** — reviews UI/UX decisions
4. **Cubing Advisor** — validates algorithm correctness and beginner-friendliness
5. **Code Reviewer / QA** — reviews code, checks builds
