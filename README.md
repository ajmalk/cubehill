# CubeHill

A speedcubing algorithm visualizer — an interactive web app with a 3D Rubik's cube, algorithm browsing, command palette, and keyboard controls.

## Features

- **3D Cube Visualization** — Interactive Three.js Rubik's cube with smooth face-turn animations and orbit controls
- **Algorithm Browser** — Browse all 57 OLL and 21 PLL cases, grouped by shape/type with 2D pattern thumbnails
- **Playback Controls** — Step through algorithms move-by-move, play/pause auto-playback, or reset to the initial state
- **Command Palette** — Cmd+K / Ctrl+K to search and jump to any algorithm instantly
- **Keyboard Shortcuts** — Space to play/pause, arrow keys to step, R to reset
- **Dark/Light Mode** — Theme toggle with system preference detection and no flash of unstyled content

## Tech Stack

Svelte 5 + SvelteKit | Three.js | ninja-keys | DaisyUI + Tailwind CSS | TypeScript

Hosted on GitHub Pages via `adapter-static`.

## Getting Started

```bash
npm install
npm run dev       # Start dev server at localhost:5173
npm run build     # Build static site to build/
npm run preview   # Preview production build
```

## Documentation

Detailed documentation lives in [`docs/`](docs/):

**Technical** (`docs/technical/`):

| Page | Description |
|------|-------------|
| [architecture.md](docs/technical/architecture.md) | Project structure and data flow |
| [cube-engine.md](docs/technical/cube-engine.md) | Cube state model, moves, notation parser |
| [rendering.md](docs/technical/rendering.md) | Three.js 3D rendering and animation |
| [deployment.md](docs/technical/deployment.md) | GitHub Pages deployment setup |
| [algorithm-data-model.md](docs/technical/algorithm-data-model.md) | Algorithm TypeScript types and interfaces |
| [components.md](docs/technical/components.md) | Svelte components, stores, keyboard controls |
| [theme-integration.md](docs/technical/theme-integration.md) | Theme store, FOUC prevention, Three.js sync |

**Product** (`docs/product/`):

| Page | Description |
|------|-------------|
| [stack-decisions.md](docs/product/stack-decisions.md) | Stack choices and reasoning |
| [algorithms.md](docs/product/algorithms.md) | OLL/PLL case inventory and learning priority |
| [pages-and-layout.md](docs/product/pages-and-layout.md) | Pages, responsive layout, navigation |
| [theming.md](docs/product/theming.md) | DaisyUI theme system, theme-aware components |

**Process** (`docs/process/`):

| Page | Description |
|------|-------------|
| [browser-tools.md](docs/process/browser-tools.md) | Playwright MCP browser tools for agents |
| [contributing.md](docs/process/contributing.md) | Best practices for contributing to the wiki |
| [issue-tracking.md](docs/process/issue-tracking.md) | Issue tracking standards |

## Contributing

Read [`CLAUDE.md`](CLAUDE.md) for project conventions, key architectural decisions, and team structure.

## License

[MIT](LICENSE)
