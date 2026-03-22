# Linting & Formatting

This document describes the linting and formatting setup for CubeHill — tools, configuration, CI integration, and editor setup.

## Tools

### ESLint (Linting)

**Chosen over**: Biome, TSLint (deprecated)

ESLint is the standard JavaScript/TypeScript linter with first-class Svelte support:

- `eslint` — core linter
- `@eslint/js` — recommended JS rules
- `typescript-eslint` — TypeScript-aware rules (type-checked)
- `eslint-plugin-svelte` — Svelte-specific rules (accessibility, reactivity, best practices)
- `svelte-eslint-parser` — parses `.svelte` files so ESLint can lint them

Why not Biome: Biome is fast but lacks Svelte support. Since most of our code is in `.svelte` files or tightly coupled to Svelte conventions, we need `eslint-plugin-svelte`.

### Prettier (Formatting)

**Chosen over**: ESLint for formatting, Biome formatter

Prettier handles all formatting — ESLint handles only correctness/quality rules:

- `prettier` — core formatter
- `prettier-plugin-svelte` — formats `.svelte` files (template expressions, script blocks, style blocks)
- `prettier-plugin-tailwindcss` — auto-sorts Tailwind CSS class names (must be loaded last)

This follows the standard separation: Prettier owns whitespace/formatting, ESLint owns logic/correctness. No overlap, no conflicts.

## Configuration

### ESLint — Flat Config (`eslint.config.js`)

CubeHill uses ESLint's flat config format (the default since ESLint v9):

```javascript
import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import globals from 'globals';

export default ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: ts.parser,
      },
    },
  },
  {
    ignores: ['build/', '.svelte-kit/', 'node_modules/'],
  },
);
```

Key points:

- TypeScript rules apply to all `.ts` files
- Svelte files use `svelte-eslint-parser` with the TypeScript parser for `<script lang="ts">` blocks
- `build/`, `.svelte-kit/`, and `node_modules/` are ignored
- No custom rule overrides initially — start with the recommended presets and relax only if a rule causes friction

### Prettier (`.prettierrc`)

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "plugins": ["prettier-plugin-svelte", "prettier-plugin-tailwindcss"],
  "overrides": [
    {
      "files": "*.svelte",
      "options": {
        "parser": "svelte"
      }
    }
  ]
}
```

Key choices:

- **Single quotes**: Consistent with SvelteKit's scaffolded defaults
- **Semicolons**: Explicit over implicit — fewer ASI edge cases
- **100 char print width**: Wider than Prettier's default 80, which avoids excessive wrapping in template expressions and Tailwind class strings
- **Tailwind plugin loaded last**: Required by `prettier-plugin-tailwindcss` — it must run after other plugins

### Prettier Ignore (`.prettierignore`)

```
build/
.svelte-kit/
node_modules/
package-lock.json
.beads/dolt/
```

## npm Scripts

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

- `lint` — check for errors (CI uses this)
- `lint:fix` — auto-fix what's fixable (development)
- `format` — reformat all files (development)
- `format:check` — check formatting without modifying files (CI uses this)

## CI Integration

Both linting and formatting checks run as gates in the CI pipeline. See the CI Pipeline Strategy section in [deployment.md](deployment.md) for the full workflow.

In the PR check job:

```yaml
- run: npm run lint # ESLint — catches bugs, unused vars, Svelte issues
- run: npm run format:check # Prettier — ensures consistent formatting
```

Both must pass before a PR can be merged. `format:check` (not `format`) is used in CI — it reports violations without modifying files.

## Editor Setup

### VS Code (Recommended)

Install these extensions:

- **ESLint** (`dbaeumer.vscode-eslint`) — inline lint errors
- **Prettier** (`esbenp.prettier-vscode`) — format on save
- **Svelte for VS Code** (`svelte.svelte-vscode`) — Svelte language support

Recommended `.vscode/settings.json` (checked into the repo):

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[svelte]": {
    "editor.defaultFormatter": "svelte.svelte-vscode"
  },
  "eslint.validate": ["javascript", "typescript", "svelte"]
}
```

### Other Editors

Any editor with ESLint and Prettier integration works. The config files (`.prettierrc`, `eslint.config.js`) are editor-agnostic. The key requirement is format-on-save — formatting should never be a manual step.

## Dependencies to Install

During scaffolding, install these dev dependencies:

```bash
npm install -D \
  eslint \
  @eslint/js \
  typescript-eslint \
  eslint-plugin-svelte \
  svelte-eslint-parser \
  globals \
  prettier \
  prettier-plugin-svelte \
  prettier-plugin-tailwindcss
```
