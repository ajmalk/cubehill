# Testing Strategy

This document describes the testing framework choices, what to test, and how tests are organized. For interactive browser-based testing by agents, see [Process: Browser Tools](../process/browser-tools.md).

## Framework Choices

### Unit Tests: Vitest

**Chosen over**: Jest

Vitest is the natural choice for a Vite/SvelteKit project:
- Native Vite integration — shares the same config, transforms, and plugin pipeline
- Compatible with Jest's API (`describe`, `it`, `expect`) so the learning curve is zero
- Fast — uses Vite's module resolution and esbuild transforms
- First-class TypeScript support without additional configuration
- SvelteKit's `create-svelte` scaffolder offers Vitest as the default testing option

Jest would require separate Babel/TypeScript transforms and additional configuration to work with Vite's module system. There's no benefit over Vitest for this stack.

### E2E Tests: Playwright

**Chosen over**: Cypress, relying solely on Playwright MCP

Playwright test files provide automated, repeatable E2E coverage that runs in CI:
- Tests full user flows in a real browser — navigation, 3D rendering, theme switching, command palette
- Catches deployment regressions (broken base paths, missing prerendered pages, SSR errors)
- Runs headlessly in GitHub Actions alongside the build
- The same tool the team already uses via MCP, so mental model is shared

**Why not just Playwright MCP?** MCP browser tools are for ad-hoc interactive testing by agents. They're valuable for visual review and debugging but don't provide repeatable CI coverage. Both serve different purposes:
- **Playwright MCP**: Agent-driven exploration, visual verification, debugging
- **Playwright test files**: Automated regression tests in CI

**Why not Cypress?** Playwright has better multi-browser support, faster execution, and the team already has Playwright MCP familiarity. Cypress adds a different API to learn for no practical benefit here.

### Component Tests: Not Now

**Decision**: Skip dedicated Svelte component testing for the initial build.

Reasoning:
- The cube engine (pure TypeScript) is where correctness matters most — unit tests cover this thoroughly
- Most Svelte components are thin wrappers: `AlgorithmCard` renders data, `AlgorithmList` maps over arrays, `Navbar` renders links. Bugs in these components surface immediately in E2E tests or visual review.
- `CubeViewer` is the most complex component, but its behavior depends on Three.js (which can't meaningfully run in jsdom). E2E tests with Playwright are the right tool for verifying 3D rendering.
- Component testing setup (jsdom + @testing-library/svelte) adds configuration overhead for limited value in this project
- If component complexity grows (e.g., complex form interactions, conditional rendering logic), revisit this decision

## What to Test

### Unit Tests (Vitest)

High-value targets in the cube engine — all pure TypeScript, no DOM or framework dependencies:

| Area | What to Test |
|------|-------------|
| `CubeState.ts` | `solved()` returns correct initial state; state is a 54-element array; color values are correct |
| `moves.ts` | Each face move produces the correct permutation; prime moves reverse clockwise moves; double moves equal two clockwise moves; `applyMove` returns a new array (immutability) |
| `notation.ts` | Parses basic moves (R, U, F); parses modifiers (R', R2); parses wide moves (Rw, r); parses slices (M, E, S); parses rotations (x, y, z); handles whitespace; throws on invalid tokens |
| `invertAlgorithm` | Inverse of inverse equals original; applying algorithm then inverse returns to solved state |
| Algorithm data | All 57 OLL cases present with valid fields; all 21 PLL cases present; no duplicate IDs; all IDs are URL-safe; all notations parse without error; OLL patterns are boolean[9] with center true; PLL patterns are PermutationArrow[] |

Algorithm data validation is especially valuable — it catches typos in notation strings, missing cases, or malformed patterns at test time rather than at runtime.

### E2E Tests (Playwright)

Smoke tests that verify the deployed app works end-to-end:

| Area | What to Test |
|------|-------------|
| Navigation | Home page loads; OLL listing loads with 57 cards; PLL listing loads with 21 cards; detail pages load for sample cases |
| Routing | All links use correct base path; direct URL navigation works (no 404s); trailing slashes are enforced |
| 3D Rendering | Canvas element mounts; no WebGL errors in console; no JavaScript errors on any page |
| Theme | Toggle switches between light and dark; preference persists across navigation; no FOUC on page load |
| Command Palette | Opens with Cmd+K; search returns results; selecting a result navigates correctly |
| Playback | Play button starts animation; step forward advances; reset returns to initial state |

E2E tests run against `npm run build && npm run preview` to test the production build, not the dev server. This catches base path and prerendering issues.

## Test Organization

```
cubehill/
├── src/
│   └── lib/
│       └── cube/
│           ├── CubeState.ts
│           ├── CubeState.test.ts      # Co-located unit tests
│           ├── moves.ts
│           ├── moves.test.ts
│           ├── notation.ts
│           └── notation.test.ts
├── tests/
│   └── e2e/
│       ├── navigation.test.ts         # E2E: page navigation and routing
│       ├── algorithm-browse.test.ts   # E2E: algorithm listing and detail pages
│       ├── playback.test.ts           # E2E: 3D viewer playback controls
│       └── theme.test.ts              # E2E: theme switching and persistence
├── vitest.config.ts
└── playwright.config.ts
```

Unit tests are co-located with their source files (`*.test.ts` next to the module). E2E tests live in a top-level `tests/e2e/` directory.

## CI Integration

Add a test job to `.github/workflows/deploy.yml` that runs before the deploy job:

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: 'npm'
    - run: npm ci
    - run: npm test              # Unit tests (vitest)
    - run: npx playwright install --with-deps
    - run: npm run build
    - run: npm run test:e2e      # E2E tests against production build
```

The deploy job should depend on the test job (`needs: test`) so broken builds are never deployed.

## npm Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```
