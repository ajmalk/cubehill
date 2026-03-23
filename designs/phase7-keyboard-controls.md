# Phase 7: Keyboard Controls — Design Spec

Design spec for keyboard shortcut consolidation, new shortcut additions, visual hint display, and safety guard behavior.

**Inputs**: Existing keyboard handler in `src/routes/oll/[id]/+page.svelte` and `src/routes/pll/[id]/+page.svelte`, `designs/phase6-command-palette.md`, `docs/product/pages-and-layout.md`, `docs/technical/components.md`.

---

## 1. Full Keyboard Shortcut Inventory

### 1.1 Key Binding Table

| Key | Action | Context | Notes |
|-----|--------|---------|-------|
| `Space` | Play / Pause toggle | Algorithm detail pages | Already implemented. `preventDefault` to avoid page scroll |
| `ArrowRight` | Step forward one move | Algorithm detail pages | Already implemented. `preventDefault` to avoid horizontal scroll |
| `ArrowLeft` | Step back one move | Algorithm detail pages | Already implemented. `preventDefault` to avoid horizontal scroll |
| `R` | Reset to start of algorithm | Algorithm detail pages | Already implemented. Case-insensitive |
| `1` | Set speed to Slow | Algorithm detail pages | Not yet implemented |
| `2` | Set speed to Normal | Algorithm detail pages | Not yet implemented |
| `3` | Set speed to Fast | Algorithm detail pages | Not yet implemented |
| `[` | Navigate to previous algorithm | Algorithm detail pages | Implicit in title attributes, not yet wired in handler |
| `]` | Navigate to next algorithm | Algorithm detail pages | Implicit in title attributes, not yet wired in handler |
| `Cmd+K` / `Ctrl+K` | Open command palette | All pages | Handled natively by ninja-keys — no custom JS needed |
| `T` | Toggle theme (dark ↔ light) | All pages | New shortcut |
| `Escape` | Close command palette | Command palette open | Handled by ninja-keys |
| `↑` / `↓` | Navigate palette results | Command palette open | Handled by ninja-keys |
| `Enter` | Select palette item | Command palette open | Handled by ninja-keys |

### 1.2 Shortcut Categories

**Playback shortcuts** (detail pages only): `Space`, `ArrowRight`, `ArrowLeft`, `R`, `1`, `2`, `3`

**Navigation shortcuts** (detail pages only): `[`, `]`

**Global shortcuts** (all pages): `Cmd+K` / `Ctrl+K`, `T`

**Command palette internals** (when palette open): `↑`, `↓`, `Enter`, `Escape`, `←` — all handled by ninja-keys, not custom code

---

## 2. Shortcut Decisions and Rationale

### Speed keys (1 / 2 / 3)

The `1`, `2`, `3` keys appear in the button `title` attributes in the Phase 4 design but the `handleKeydown` switch statement does not implement them. They should be wired up.

### Prev / Next algorithm ([ / ])

The prev/next nav buttons already have `title="Previous: {name} (keyboard: [)"` and `title="Next: {name} (keyboard: ])"`, advertising keys that are not yet wired. This is a visible inconsistency that Phase 7 must resolve — the handler should use `goto(resolve(...))` to navigate programmatically, matching what clicking the button does.

`[` and `]` are intuitive because they're adjacent, bracket-shaped, and commonly used for "previous/next" in media players and IDEs. They do not conflict with any text editing context (guarded out when an input is focused).

### Theme toggle (T)

A single-key theme toggle on `T` is a low-conflict, high-utility shortcut. Cubers often switch themes to compare how the cube looks. `T` is not used by any other shortcut and is easy to remember (T = Theme).

This shortcut works globally (all pages), not just detail pages, because the ThemeToggle is in the navbar and available everywhere.

Do not add separate `D` (dark) and `L` (light) keys — the command palette already covers that use case for users who want explicit control.

### Navigation to OLL / PLL listing (not added)

Shortcuts like `O` for OLL listing or `P` for PLL listing are tempting but not included. On detail pages, `O` and `P` are easy to hit accidentally during note-taking. The command palette (`Cmd+K`) covers this use case well for power users. Omitting reduces cognitive load.

### Home navigation (not added)

`H` for Home is omitted for the same reason. The navbar and command palette cover this.

---

## 3. Safety Guards

Shortcuts are suppressed when any of the following conditions is true. Guards are evaluated in priority order — first matching guard wins.

### Guard Priority Order

1. **Command palette open** — highest priority. When `commandPaletteStore.open` is `true`, suppress all custom shortcuts. The palette has its own complete keyboard handling via ninja-keys and must not be interfered with.

2. **Text input focused** — suppress when `document.activeElement` is `INPUT`, `TEXTAREA`, `SELECT`, or any element with `contenteditable`. The exact check:
   ```typescript
   const tag = (document.activeElement as HTMLElement)?.tagName;
   const isEditable = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag ?? '');
   const isContentEditable = !!(document.activeElement as HTMLElement)?.isContentEditable;
   if (isEditable || isContentEditable) return;
   ```

3. **Modal dialogs** — if a `<dialog>` element with `open` attribute exists in the DOM, suppress shortcuts. This is a defensive guard for future phases (Phase 7 itself doesn't add modals). Check: `!!document.querySelector('dialog[open]')`.

### What is NOT guarded

- `Cmd+K` / `Ctrl+K` — ninja-keys registers this globally and does not need a guard. Attempting to guard it would fight the library.
- Orbit controls (mouse drag on the cube) — these are mouse events, not keyboard events, so they don't interact with `keydown` guards.

### Guard Consistency

Both `oll/[id]` and `pll/[id]` currently implement guards 1 and 2 identically. After consolidation (see Section 5), the guard logic lives in one place, so consistency is guaranteed automatically.

---

## 4. Visual Hints

### 4.1 Current State

The `PlaybackControls` component already renders keyboard hints at the bottom of the controls on desktop (hidden on mobile via `lg:hidden`):

```
[R] Reset   [←] Back   [Space] Play   [→] Fwd
```

This is good. The hints are subtle (muted colour, `aria-hidden`), non-intrusive, and positioned close to the controls they describe.

### 4.2 Required Changes

**Add speed hints.** The speed selector currently shows Slow / Normal / Fast buttons without key hints. Add `[1]`, `[2]`, `[3]` hints below or adjacent to the speed buttons, matching the style of the existing playback hints. Integrate into the existing hints row rather than adding a separate row:

```
[R] Reset   [←] Back   [Space] Play   [→] Fwd   [1/2/3] Speed
```

**Add prev/next hints.** Since `[` and `]` will be wired up, they should be hinted near the prev/next navigation buttons. These buttons are in the page template (not in `PlaybackControls`), so the hint belongs inline with those buttons rather than in the controls hint bar.

Proposed prev/next button with hint:

```
← T Perm    [[]                        N Perm →    []]
```

The `[[]` hint uses a `<kbd>` element styled with DaisyUI's `kbd kbd-xs` class, placed directly below or beside the button label. Keep it subtle — same muted colour as the existing hints.

On mobile, omit the `[` and `]` hints (they are hidden with `hidden lg:inline`). Mobile users navigate with taps, not bracket keys.

### 4.3 Hints on Other Pages

**Listing pages (OLL / PLL)**: No keyboard hints needed. The only shortcuts active on listing pages are `Cmd+K` (already hinted in the navbar) and `T` (a global shortcut that doesn't need per-page documentation — it's on the ThemeToggle button itself via `title` attribute).

**Home page**: Same as listing pages — no keyboard hints needed beyond the navbar Cmd+K hint.

### 4.4 Theme Toggle Hint

The `ThemeToggle` button in the navbar should have `title="Toggle theme (T)"` added to its props. This surfaces the shortcut on hover without cluttering the UI with visible text.

### 4.5 Hints Layout Wireframe (Updated)

The updated keyboard hints row inside `PlaybackControls`:

```
Desktop:
┌──────────────────────────────────────────────┐
│  [↺] [◀◀] [▶] [▶▶]                          │
│                                              │
│  R U R' F ...                               │
│                                              │
│  Speed   [Slow] [Normal] [Fast]              │
│                                              │
│  [R] Reset  [←] Back  [Space] Play  [→] Fwd  [1/2/3] Speed │
└──────────────────────────────────────────────┘
```

The hints row wraps naturally if the container is narrow. All `<kbd>` elements use DaisyUI `kbd kbd-xs` class.

For the prev/next section (in the page template, below `PlaybackControls`):

```
Desktop:
┌──────────────────────────────────────────────┐
│  ← T Perm  [[]              N Perm →  []]   │
└──────────────────────────────────────────────┘
```

The `[kbd]` hints sit immediately after the button text, outside the `<a>` tag, in a `<span class="text-xs opacity-40 hidden lg:inline">`.

---

## 5. Architecture Recommendation: Shared Keyboard Handler

### Current Problem

The `handleKeydown` function is duplicated in:
- `src/routes/oll/[id]/+page.svelte`
- `src/routes/pll/[id]/+page.svelte`

These are byte-for-byte identical. Any fix or addition must be applied twice. This is the primary technical debt Phase 7 should resolve.

### Recommended Solution: Svelte Action

Create `src/lib/actions/keyboardControls.ts` as a Svelte action (use directive). This is idiomatic Svelte 5 and allows detail pages to simply attach the handler:

```svelte
<!-- In oll/[id]/+page.svelte and pll/[id]/+page.svelte -->
<svelte:window use:keyboardControls={{ prevCase, nextCase, category: 'oll' }} />
```

The action receives a config object with the contextual data needed for navigation (prev/next case info, category prefix for `goto`). The action registers/deregisters the event listener itself via the Svelte action lifecycle (`return { destroy() { ... } }`).

**Action signature:**

```typescript
interface KeyboardControlsConfig {
  prevCase: { id: string } | null;
  nextCase: { id: string } | null;
  category: 'oll' | 'pll';
}

export function keyboardControls(
  node: Window | HTMLElement,
  config: KeyboardControlsConfig
): { destroy(): void; update(config: KeyboardControlsConfig): void }
```

The action reads `commandPaletteStore.open` and `cubeStore` directly (imported from their modules), so the page does not need to pass those as config.

### Alternative: Shared Component

A `<KeyboardControls>` renderless component is also workable but is more boilerplate than a Svelte action. Actions are the right tool for imperative DOM/window interactions in Svelte.

### What Stays in the Page Template

Navigation-related data (`prevCase`, `nextCase`) must stay in the page, since each detail route fetches its own data. The action receives this as config. Everything else (cubeStore interactions, guard logic) moves into the action.

### Global Shortcuts (Theme Toggle)

The `T` theme shortcut operates on all pages. It should be registered in `+layout.svelte`, not in the detail page action. This prevents it from being mounted/unmounted on every page navigation. Implementation:

```svelte
<!-- src/routes/+layout.svelte -->
<svelte:window onkeydown={handleGlobalKeydown} />
```

Where `handleGlobalKeydown` handles only `T` (and any future global shortcuts), with the same guards (command palette check, input focus check).

---

## 6. Accessibility

### Keyboard Navigation of UI Controls

The playback control buttons (`PlaybackControls.svelte`) are standard `<button>` elements and are fully keyboard-navigable with `Tab` / `Shift+Tab` and `Enter` / `Space`. No changes needed here.

The speed selector buttons use `aria-pressed` to communicate the active state to screen readers. This is already implemented correctly.

The prev/next navigation uses `<a>` elements (not `<button>`), so they are in the natural tab order and work with `Enter` to activate. Correct.

### Keyboard Hints and Screen Readers

The existing hints row uses `aria-hidden="true"`. This is correct — the hints are redundant for screen readers because the buttons already have `aria-label` and `title` attributes that include the key name (e.g., `title="Reset to start of algorithm (R)"`). Do not expose the visual hints to screen readers; it creates noise.

The same `aria-hidden="true"` treatment applies to the new speed hints and prev/next hints.

### Focus Management on Algorithm Navigation

When `[` or `]` triggers navigation to a prev/next algorithm, focus should land on the main heading (`<h1>`) of the new page, not on the previously focused element (which no longer exists). This is handled automatically by SvelteKit's page navigation focus reset behavior — no extra code is needed.

If SvelteKit's default focus reset is insufficient (focus lands on `<body>` rather than `<h1>`), add `autofocus` to the `<h1>` element on detail pages as a fallback.

### Shortcut Discoverability for Screen Reader Users

The `title` attribute on buttons is announced by most screen readers on focus, which surfaces the key name. However, `title` is not reliable across all AT combinations.

For the most important shortcut (Space = play/pause), the `aria-label` on the play button already reads "Play" or "Pause" and changes reactively. Adding "(Space)" to the `aria-label` is not recommended — it conflates the action label with a keyboard shortcut hint, which is an ARIA anti-pattern.

The safest approach is to ensure the shortcut hints in `PlaybackControls` are in a visually hidden `<span>` that IS visible to screen readers for users who want that context. However, given that the existing approach (aria-hidden hints + title attributes on buttons) is already workable, no change is required for Phase 7. This is a future enhancement if screen reader testing reveals a gap.

### ARIA for the `[` / `]` Navigation Hints

The inline `[kbd]` hints next to the prev/next buttons must be wrapped in `aria-hidden="true"`:

```html
<a href="..." class="btn btn-ghost btn-sm gap-1">
  ← {prevCase.name}
</a>
<span class="kbd kbd-xs opacity-40 hidden lg:inline" aria-hidden="true">[</span>
```

This keeps the `<a>` label clean ("← T Perm") without appending keyboard hint text that would be read aloud redundantly.

---

## 7. Out of Scope

The following are intentionally excluded from Phase 7:

- **Vim-style `h`/`l` for step** — conflicts with navigation mnemonics and is a niche preference. The command palette search is the right "power user" path.
- **`j`/`k` for prev/next algorithm** — `j`/`k` are vertical navigation. Algorithms in CubeHill are presented in a list but navigated linearly; `[`/`]` is more intuitive.
- **Number row for algorithm jumping** — too many cases (57 OLL, 21 PLL) for direct number access.
- **Mobile keyboard shortcuts** — mobile hardware keyboards are an edge case. The app's mobile UX is touch-first; keyboard shortcuts are a desktop feature.
- **Custom shortcut configuration** — not needed for v1.
