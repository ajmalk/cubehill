# CubeHill

A speedcubing algorithm visualizer — a static web app with a 3D Rubik's cube, algorithm browsing UI, command palette, and keyboard controls.

## Stack

- **Framework**: Svelte 5 + SvelteKit (with `adapter-static`)
- **Build**: Vite
- **3D Rendering**: Three.js
- **Command Palette**: ninja-keys (web component)
- **Styling**: DaisyUI + Tailwind CSS
- **Language**: TypeScript
- **Diagrams**: D2
- **Hosting**: GitHub Pages

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Build static site to build/
npm run preview      # Preview production build locally
```

### Diagrams (D2)

```bash
d2 input.d2 output.svg          # Render D2 diagram to SVG
d2 --watch input.d2 output.svg  # Live preview while editing
```

D2 source files live in `docs/*/diagrams/`, rendered SVGs in `docs/*/images/`. See `docs/process/contributing.md` for the full workflow.

## Knowledge Management

- **Beads (`bd`)** — tracks all work items: tasks, bugs, features, reviews. Short-lived, actionable. Run `bd prime` for full command reference.
- **Wiki (`docs/`)** — stores long-term knowledge: architecture, design decisions, conventions, data models. Persistent reference.

When in doubt: if it's something to _do_, put it in beads. If it's something to _know_, put it in docs.

### Agent Isolation

When agents work in parallel on code, use `isolation: "worktree"` to give each agent its own git worktree and branch. Beads syncs issues across worktrees via Dolt.

## Project Architecture

See `docs/` for detailed documentation:

**Technical** (`docs/technical/`):

- `architecture.md` — Project structure and data flow
- `cube-engine.md` — Cube state model, moves, notation parsing
- `rendering.md` — Three.js 3D rendering and animation
- `deployment.md` — GitHub Pages deployment, CI pipeline strategy, branch protection
- `algorithm-data-model.md` — Algorithm TypeScript types and interfaces
- `components.md` — Svelte component APIs, stores, keyboard controls, command palette
- `linting.md` — ESLint + Prettier setup, configuration, CI integration
- `testing.md` — Testing strategy, framework choices, what to test, CI integration
- `theme-integration.md` — Theme store, FOUC prevention, CSS variable sync with Three.js

**Product** (`docs/product/`):

- `stack-decisions.md` — Stack choices and reasoning
- `algorithms.md` — OLL/PLL case inventory, grouping tables, learning priority
- `pages-and-layout.md` — Pages, responsive layout, navigation
- `theming.md` — DaisyUI theme system, theme-aware components
- `roadmap.md` — 10-phase development roadmap, dependencies, critical path

**Process** (`docs/process/`):

- `feature-development.md` — 6-stage feature development loop
- `browser-tools.md` — Playwright MCP browser tools for agents
- `figma-tools.md` — Figma MCP tools for design creation and implementation
- `contributing.md` — Best practices for contributing to the wiki
- `issue-tracking.md` — Beads issue tracking standards and best practices

## Key Conventions

### Docs Freshness
- When implementation diverges from docs (new package versions, API changes, config changes), update the affected docs **in the same PR or commit** — never leave docs stale
- This applies to all agents: if you change code that contradicts a doc, you own the doc update too

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
4. **UX Designer** — creates designs, defines interaction patterns, owns `designs/` folder
5. **Cubing Advisor** — validates algorithm correctness and beginner-friendliness
6. **Code Reviewer / QA** — reviews code, checks builds

Docs are organized into 3 folders with clear ownership: `docs/technical/` (Architect), `docs/product/` (PM), `docs/process/` (shared). No shared pages — each topic is split into its technical and product halves.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->

## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**

- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
