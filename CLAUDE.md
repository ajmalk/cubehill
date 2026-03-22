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

## Issue Tracking: Beads (`bd`)

This project uses **beads** (`bd`) for all task and issue tracking. Every piece of work — no matter how small — must be tracked as a beads issue.

### Rules

- **Use `bd` for ALL task tracking** — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- **Every task gets an issue** — before starting work, create or claim an issue
- **Update status as you work** — claim issues when starting, close when done
- **Use `docs/` for long-term knowledge** — architecture, design decisions, and planning live in the wiki (`docs/` folder). Beads tracks work items, not reference documentation.
- **Clear context before large tasks** — when taking on a larger task, review `bd ready` for available work and clear completed items

### Quick Reference

```bash
bd ready                    # Find available work
bd show <id>                # View issue details
bd create "title" -d "desc" # Create a new issue
bd update <id> --claim      # Claim work atomically
bd close <id>               # Complete work
bd list                     # List all issues
bd status                   # Overview and statistics
bd epic create "name"       # Create an epic for larger initiatives
bd dep add <id> --blocks <other-id>  # Add dependency
bd note <id> "note text"    # Add a note to an issue
```

### Session Workflow

1. Run `bd ready` to find available work
2. `bd update <id> --claim` to claim a task
3. Do the work
4. `bd close <id>` when done
5. Before ending a session: `bd dolt push` then `git push`

## Knowledge Management

- **Beads (`bd`)** — tracks all work items: tasks, bugs, features, reviews. Short-lived, actionable.
- **Wiki (`docs/`)** — stores long-term knowledge: architecture, design decisions, conventions, data models. Persistent reference.

When in doubt: if it's something to *do*, put it in beads. If it's something to *know*, put it in docs.

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

This project uses a team of 6 agents:

1. **Product Manager** — manages team, prioritizes work, owns non-technical decisions and product-focused docs
2. **Software Architect** — owns technical architecture decisions and maintains technical docs (architecture, cube-engine, rendering, deployment)
3. **Full-Stack Dev** — implements all code
4. **UX Expert** — reviews UI/UX decisions
5. **Cubing Advisor** — validates algorithm correctness and beginner-friendliness
6. **Code Reviewer / QA** — reviews code, checks builds

Shared doc pages (stack, algorithms, ui, theming) are co-owned by the PM and Architect — PM owns product aspects, Architect owns technical aspects.
