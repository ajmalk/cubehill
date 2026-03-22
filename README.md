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

| Page | Description |
|------|-------------|
| [stack.md](docs/stack.md) | Stack choices and reasoning |
| [architecture.md](docs/architecture.md) | Project structure and data flow |
| [cube-engine.md](docs/cube-engine.md) | Cube state model, moves, notation parser |
| [rendering.md](docs/rendering.md) | Three.js 3D rendering and animation |
| [algorithms.md](docs/algorithms.md) | Algorithm data model, OLL/PLL cases |
| [ui.md](docs/ui.md) | UI components, routing, command palette, keyboard controls |
| [theming.md](docs/theming.md) | DaisyUI theming, dark/light mode |
| [deployment.md](docs/deployment.md) | GitHub Pages deployment setup |
| [issue-tracking.md](docs/issue-tracking.md) | Issue tracking standards |

## Contributing

Read [`CLAUDE.md`](CLAUDE.md) for project conventions, key architectural decisions, and team structure.

## License

[MIT](LICENSE)
