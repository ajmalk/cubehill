# Deployment

This document describes the GitHub Pages deployment setup for CubeHill, including SvelteKit static adapter configuration, base path handling, prerendering, and the GitHub Actions workflow.

## Overview

CubeHill is deployed as a fully static site to GitHub Pages. The build pipeline:

1. SvelteKit builds the app using `adapter-static`
2. Vite produces optimized static assets in the `build/` directory
3. GitHub Actions deploys `build/` to GitHub Pages on push to `main`
4. The site is served at `https://<username>.github.io/cubehill/`

There is no server — all algorithm data is bundled at build time, and all pages are prerendered to static HTML.

## SvelteKit Configuration

### `svelte.config.js`

```javascript
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/kit/vite';

const dev = process.argv.includes('dev');

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: '404.html',
      precompress: false,
      strict: true,
    }),
    paths: {
      base: dev ? '' : '/cubehill',
    },
    trailingSlash: 'always',
  },
};

export default config;
```

### Key Settings Explained

#### `adapter-static`

Produces a `build/` directory of static HTML, CSS, JS, and assets. No Node.js server is needed at runtime.

- **`pages` / `assets`**: Both point to `build/` — HTML pages and static assets go to the same directory
- **`fallback: '404.html'`**: Generates a 404 page for unmatched routes. GitHub Pages serves this automatically for unknown paths.
- **`strict: true`**: Fails the build if any page was not prerendered. This catches missing `entries()` definitions for dynamic routes.

#### `paths.base`

GitHub Pages serves project sites at a subpath: `https://<username>.github.io/cubehill/`. This means every URL, asset reference, and navigation call must be prefixed with `/cubehill`.

- **In production** (`npm run build`): `base` is set to `'/cubehill'`
- **In development** (`npm run dev`): `base` is set to `''` (empty string) so the dev server works at `localhost:5173/`

The `dev` flag is detected via `process.argv.includes('dev')`.

#### `trailingSlash: 'always'`

Forces all routes to end with a trailing slash (e.g., `/cubehill/oll/` not `/cubehill/oll`). This is required for static file hosting because:

- `/cubehill/oll/` maps to `/cubehill/oll/index.html` — a real file the server can find
- `/cubehill/oll` would need server-side rewrite rules that GitHub Pages doesn't support

Without this setting, navigating directly to a route (or refreshing the page) may return a 404 on GitHub Pages.

## Base Path Gotcha

**Every internal link and programmatic navigation must use the `base` path.**

This is the most common source of deployment bugs. Links that work in development (`href="/oll/"`) break in production because the actual URL is `/cubehill/oll/`.

### In Svelte Templates

```svelte
<script>
  import { base } from '$app/paths';
</script>

<a href="{base}/oll/">OLL Algorithms</a>
<a href="{base}/pll/{algo.id}/">{algo.name}</a>
```

### In Programmatic Navigation

```typescript
import { goto } from '$app/navigation';
import { base } from '$app/paths';

goto(`${base}/oll/${id}/`);
```

### In the Command Palette

Every `handler` in the ninja-keys command data must use `base`:

```typescript
{
  id: 'oll-1',
  title: 'OLL 1',
  handler: () => goto(`${base}/oll/oll-1/`),
}
```

### Common Mistakes

| Mistake | Correct |
|---------|---------|
| `href="/oll/"` | `href="{base}/oll/"` |
| `goto('/pll/pll-aa/')` | `goto(\`${base}/pll/pll-aa/\`)` |
| `<img src="/logo.png">` | `<img src="{base}/logo.png">` or put it in `static/` |

Static assets in the `static/` folder are automatically served with the correct base path by SvelteKit — but only when referenced through SvelteKit's asset handling, not via hardcoded absolute paths.

## Prerendering Dynamic Routes with `entries()`

SvelteKit's static adapter needs to know which dynamic routes exist at build time. For routes like `/oll/[id]/`, the adapter cannot discover valid `id` values automatically.

Each dynamic route must export an `entries()` function:

```typescript
// src/routes/oll/[id]/+page.ts
import { ollCases } from '$lib/data/oll';

export function entries() {
  return ollCases.map(c => ({ id: c.id }));
}

export const prerender = true;
```

```typescript
// src/routes/pll/[id]/+page.ts
import { pllCases } from '$lib/data/pll';

export function entries() {
  return pllCases.map(c => ({ id: c.id }));
}

export const prerender = true;
```

### What Happens Without `entries()`

If `entries()` is missing and `strict: true` is set in the adapter config, the build fails with an error like:

```
Error: The following routes were marked as prerenderable but were not prerendered:
  /oll/[id]
```

If `strict: false`, the build succeeds silently but the dynamic pages simply don't exist — users get 404s.

### Layout-Level Prerender

The root layout enables prerendering globally:

```typescript
// src/routes/+layout.ts
export const prerender = true;
```

This tells SvelteKit to prerender all pages. Individual pages inherit this setting.

## `.nojekyll` File

GitHub Pages runs Jekyll by default, which ignores files and directories starting with `_` (underscore). SvelteKit/Vite produces assets in a `_app/` directory, so without the `.nojekyll` file, these assets would be invisible to the web server.

The file is placed at `static/.nojekyll` (empty file, no content needed). SvelteKit copies everything in `static/` to the build output root, so it ends up at `build/.nojekyll`, which GitHub Pages respects.

**If this file is missing**: the deployed site loads the HTML but all JavaScript, CSS, and assets fail to load — the page appears broken with no interactivity or styling.

## GitHub Actions Workflow

The deployment is automated via `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: 'build'

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Workflow Explained

1. **Trigger**: Runs on every push to `main`
2. **Permissions**: Requires `pages: write` and `id-token: write` for the new GitHub Pages deployment API
3. **Concurrency**: Only one deployment runs at a time; queued deployments are not cancelled (to avoid partial deploys)
4. **Build job**: Checks out code, installs dependencies with `npm ci` (deterministic), runs `npm run build`
5. **Upload artifact**: Uploads the `build/` directory as a GitHub Pages artifact
6. **Deploy job**: Deploys the artifact to GitHub Pages using the official `deploy-pages` action

### GitHub Repository Settings

For this workflow to function, the repository must be configured:

1. Go to **Settings → Pages**
2. Under **Source**, select **GitHub Actions** (not "Deploy from a branch")
3. The workflow handles the rest — no branch or folder selection needed

### Environment Protection

The `github-pages` environment is created automatically. Optional: add environment protection rules (e.g., require approval before deploy) in **Settings → Environments**.

## CI Pipeline Strategy

### Two Workflows

The project uses two separate CI triggers with different purposes:

| Trigger | What Runs | Purpose |
|---------|-----------|---------|
| Pull request to `main` | Lint, unit tests, build | Gate: must all pass before merge |
| Push to `main` | Lint, unit tests, build, E2E tests, deploy | Full pipeline including deployment |

PRs run a fast feedback loop (lint + test + build). The full E2E suite and deployment only run after merge to `main`, since E2E tests are slower and deployment should only happen from a known-good main branch.

### PR Checks (CI Gate)

Every pull request must pass these checks before merge:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint          # ESLint
      - run: npm run format:check  # Prettier (check only, don't fix)
      - run: npm test              # Vitest unit tests
      - run: npm run build         # Build must succeed (catches type errors, missing entries())
```

If any step fails, the PR cannot be merged.

### Push to Main (Deploy Pipeline)

The deploy workflow (already documented above) is extended with a test gate:

```yaml
# .github/workflows/deploy.yml (updated)
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
      - run: npx playwright install --with-deps
      - run: npm run test:e2e    # E2E tests against production build

  build:
    needs: test               # Build only runs if tests pass
    # ... (existing build job)

  deploy:
    needs: build              # Deploy only runs if build succeeds
    # ... (existing deploy job)
```

The test job gates the build job, which gates the deploy job. A broken build is never deployed.

### Branch Protection Rules

Configure in **Settings → Branches → Branch protection rules** for `main`:

- **Require pull request before merging**: No direct pushes to main (except for initial setup)
- **Require status checks to pass**: Select the `check` job from the CI workflow
- **Require branches to be up to date**: Ensures PRs are rebased on latest main before merge
- **Do not allow bypassing**: Even admins must follow the process

### Branches and Beads Issues

Each beads issue maps to a feature branch and (usually) one PR:

```
cubehill-xyz  →  branch: cubehill-xyz  →  PR: "Title from issue"  →  merge to main
```

Conventions:
- Branch names match the beads issue ID: `cubehill-xyz`
- PR title matches the issue title
- Close the beads issue when the PR is merged (not when the PR is opened)
- If a PR addresses multiple issues, list all IDs in the PR description and close them all on merge
- If an issue requires no code change (e.g., a docs-only update pushed directly), close the issue after the push

## Local Preview

To test the production build locally before deploying:

```bash
npm run build    # Build with production base path (/cubehill)
npm run preview  # Serve the build/ directory locally
```

Note: `npm run preview` serves from the root, so links will point to `/cubehill/...` which won't resolve locally. To verify routing, either:
- Temporarily set `paths.base` to `''` and rebuild
- Or use a local server that mounts `build/` at the `/cubehill/` path

## Build Output Structure

After `npm run build`, the `build/` directory contains:

```
build/
├── .nojekyll
├── index.html                    # Home page
├── 404.html                      # Fallback 404 page
├── oll/
│   ├── index.html                # OLL listing page
│   ├── oll-1/index.html          # OLL case 1
│   ├── oll-2/index.html          # OLL case 2
│   └── ...                       # All 57 OLL cases
├── pll/
│   ├── index.html                # PLL listing page
│   ├── pll-aa/index.html         # Aa Perm
│   └── ...                       # All 21 PLL cases
└── _app/
    ├── immutable/                # Hashed JS/CSS chunks (long-cached)
    └── version.json              # Build version metadata
```

Each route becomes a directory with an `index.html` file, which is why `trailingSlash: 'always'` is required — it ensures SvelteKit generates this directory-based structure.
