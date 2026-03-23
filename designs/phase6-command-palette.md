# Phase 6: Command Palette — Design Spec

Design spec for the ninja-keys command palette integration. Covers trigger mechanics, command structure, search behaviour, keyboard navigation, visual design, and mobile considerations.

**Input**: PM roadmap Phase 6 deliverables, existing component spec in `docs/technical/components.md`.

## Design Artifacts

**Figma file**: Design (`fiCCEbCrIIZqYVIm9XTjiD`), page: **Phase 6 — Command Palette**

### Figma Frames

| Frame | Node ID | Figma Link |
|-------|---------|------------|
| Open State (Desktop) | `28:625` | [Open in Figma](https://www.figma.com/design/fiCCEbCrIIZqYVIm9XTjiD?node-id=28-625) |
| Nested OLL Groups | `28:667` | [Open in Figma](https://www.figma.com/design/fiCCEbCrIIZqYVIm9XTjiD?node-id=28-667) |
| Search Results ("T perm") | `28:716` | [Open in Figma](https://www.figma.com/design/fiCCEbCrIIZqYVIm9XTjiD?node-id=28-716) |

All frames are in **Section: "Phase 6: Command Palette"** on page **Phase 6 — Command Palette**.

### Wireframe Screenshots

#### Open State (Desktop)

![Command Palette — Open State](phase6-open-wireframe.png)

#### Nested Menu — OLL Groups

![Command Palette — Nested OLL Groups](phase6-nested-wireframe.png)

#### Search Results

![Command Palette — Search Results](phase6-search-wireframe.png)

**Related design docs**:
- `designs/phase5-browse-ui.md` — Browse UI spec (command palette navigates to these pages)
- `designs/phase4-wireframes.md` — Phase 4 Figma frames and node IDs
- `docs/technical/components.md` — CommandPalette component spec and ninja-keys integration

---

## Design Principles

1. **Speed first.** The command palette is for power users who want to skip the browse UI entirely. Every interaction should feel instant.
2. **Discoverable, not required.** The Cmd+K hint in the navbar makes it findable; beginners can ignore it and use the browse UI.
3. **Cross-OLL/PLL search is the killer feature.** A cuber who knows "T Perm" but doesn't remember whether it's OLL or PLL can just type it.
4. **Keyboard-complete.** Every action in the palette must be reachable by keyboard alone. Mouse/touch are supported but secondary.

---

## 1. Trigger

### Desktop

- **Keyboard shortcut**: `Cmd+K` (macOS) / `Ctrl+K` (Windows/Linux)
- ninja-keys handles this natively via its `hotkey` attribute — no custom JS needed for the trigger
- The shortcut works on every page (palette is mounted in `+layout.svelte`)

### Navbar Hint

The navbar shows a `[Cmd+K]` affordance on the right side, adjacent to the ThemeToggle. This is the primary discoverability surface for new users.

Implementation: a `<kbd>` element styled with DaisyUI's `kbd` class, rendered as a clickable button that also opens the palette (`ninja.open()`).

```
[ CubeHill ]  [ OLL ]  [ PLL ]  [ ☀/🌙 ]  [ ⌘K ]
```

On mobile, the `[⌘K]` hint becomes a search icon button (magnifying glass). Tapping it opens the palette programmatically.

### Mobile Trigger

Cmd+K is not available on mobile. Two entry points:

1. **Search icon in navbar** — tapping opens the palette (`ninja.open()`)
2. **Long-press on any AlgorithmCard** — future consideration, not Phase 6

The palette itself works identically on mobile once open (touch scrolling of the result list, tap to select).

---

## 2. Visual Design

### Overlay

- **Backdrop**: semi-transparent black overlay covers the entire viewport (`rgba(0, 0, 0, 0.55)`)
- **Backdrop blur**: `backdrop-filter: blur(4px)` on the overlay — softens the background page content without hiding context
- ninja-keys renders its own overlay; configure via CSS custom properties

### Modal

- **Width**: 560px on desktop, `calc(100vw - 32px)` on mobile (16px margin each side)
- **Max height**: 60vh, with the result list scrolling internally if content overflows
- **Position**: centered horizontally, offset 120px from the top (not truly centered vertically — top-biased feels more natural for a "command" tool)
- **Border radius**: 12px
- **Background**: `oklch(15% 0.01 260)` (dark neutral, slightly cool — matches the app's dark theme)
- **Border**: 1px solid `oklch(28% 0.02 260)` (subtle separation from the overlay)
- **Shadow**: `0 24px 48px rgba(0, 0, 0, 0.6)` — elevates the modal clearly above the page

### Search Bar (top zone)

- **Height**: 52px
- **Background**: slightly lighter than modal (`oklch(20% 0.01 260)`)
- **Padding**: 16px horizontal
- **Search icon**: left-aligned, muted colour
- **Placeholder**: "Search algorithms, navigate, change theme…" — communicates all three capabilities
- **ESC hint**: right-aligned, muted, 11px — visible even before typing
- **Clear button** (X): appears once the user starts typing, replaces ESC hint
- **Text cursor**: accent blue, blinking

### Divider

1px horizontal rule between the search bar and the result list, colour matching the border.

### Result Items

Each item row is 32px tall (compact) when showing top-level items, 48px tall when showing search results (to accommodate the notation sub-line).

**Top-level item anatomy:**
```
[ icon ]  [ Label ]                    [ badge / count ]
```

**Search result item anatomy:**
```
[ PLL ]  [ T Perm      ]                              [ → ]
         [ R U R' U'… (notation preview, 11px muted) ]
```

- Icon/category pill: 32x18px pill with green (PLL) or amber (OLL) background, white 9px medium text
- Label: 14px semi-bold, primary text colour
- Notation preview: 11px regular, muted colour — truncated at ~60 chars
- Active row: `oklch(26% 0.08 260)` background, 6px border radius, arrow indicator on the right

### Section Labels

Between result groups: 10px uppercase medium, muted colour, 16px left padding.

```
NAVIGATION
ALGORITHMS
THEME
```

### Hint Bar (bottom zone)

36px dark strip at the bottom of the modal (slightly darker than modal body). 11px regular muted text showing keyboard shortcuts. Updates contextually:

- Root level: `↑↓ navigate    ↵ select    ESC close    ▸ has sub-menu`
- Inside a group: `↑↓ navigate    ↵ open group    ESC / ← back to root    ▸ has sub-menu`
- Search mode: `↑↓ navigate    ↵ open algorithm    ESC clear / close`

---

## 3. Command Structure

```
Root
├── NAVIGATION
│   ├── Home                        → navigate to /
│   ├── OLL Algorithms              → navigate to /oll/
│   └── PLL Algorithms              → navigate to /pll/
│
├── ALGORITHMS
│   ├── OLL ▸                       → opens OLL groups level
│   │   ├── Dot Cases ▸             → opens OLL Dot Cases level
│   │   │   ├── OLL 1               → navigate to /oll/oll-1/
│   │   │   ├── OLL 2               → navigate to /oll/oll-2/
│   │   │   ├── OLL 3               → navigate to /oll/oll-3/
│   │   │   └── OLL 4               → navigate to /oll/oll-4/
│   │   ├── T-Shape ▸
│   │   ├── S-Shape ▸
│   │   ├── Square ▸
│   │   ├── C-Shape ▸
│   │   ├── W-Shape ▸
│   │   ├── Corner Cases ▸
│   │   ├── P-Shape ▸
│   │   ├── L-Shape ▸
│   │   ├── Fish ▸
│   │   ├── Knight Move ▸
│   │   ├── Awkward ▸
│   │   └── All Crosses ▸
│   └── PLL ▸                       → opens PLL groups level
│       ├── Adjacent Corner Swap ▸
│       ├── Diagonal Corner Swap ▸
│       ├── Edge Cycles ▸
│       └── Skip
│
└── THEME
    ├── Dark                        → apply dark theme immediately
    └── Light                       → apply light theme immediately
    (Cubehill theme deferred to Phase 8 — the cubehill DaisyUI theme does not exist yet)
```

### Command Data Shape (ninja-keys)

Each entry in `ninja.data` follows this shape:

```typescript
interface NinjaCommand {
  id: string;           // unique, e.g. 'oll-1', 'theme-dark', 'nav-home'
  title: string;        // display label, e.g. 'OLL 1', 'T Perm', 'Dark'
  parent?: string;      // id of parent command for nesting
  keywords?: string;    // additional search terms (space-separated)
  section?: string;     // section header label
  handler?: () => void; // action on selection
  // icon?: string       // ninja-keys supports icon HTML; use for category pills
}
```

### Keywords for Search Enhancement

Each algorithm command should include keywords beyond the name:

| Command | Extra keywords |
|---------|---------------|
| OLL 1 | `oll dot cases` |
| T Perm | `pll adjacent corner` |
| All cases | notation string (e.g. `R U R' U'`) |

This allows cubers to search by move sequence — a power-user workflow.

---

## 4. Search Behaviour

### What is searchable

ninja-keys fuzzy-matches against `title` and `keywords` together. Configure each algorithm command with:

- `title`: case name (e.g. "T Perm", "OLL 21")
- `keywords`: group name + category + notation string

### Scope

- Typing activates global search across **all** commands: navigation, all 57 OLL cases, all 21 PLL cases, and theme commands
- The nested menu structure collapses — results are shown flat
- When inside a sub-menu (e.g. OLL groups), typing re-scopes search to that level only. ninja-keys handles this via `parent` filtering when a `parent` is active

### Result display in search mode

- Item height expands from 32px to 48px to accommodate the notation sub-line
- Category pill (PLL/OLL) replaces the generic icon, so users can instantly distinguish PLL from OLL results
- Result count shown in the section header ("3 RESULTS")
- No section dividers in search mode — all results in one flat list

### No-results state

- Show: "No results for '[query]'" in muted text, centered in the result area
- Below: suggestions — "Try searching by notation (e.g. R U R')" in 11px italic muted

---

## 5. Keyboard Navigation

### Root level

| Key | Action |
|-----|--------|
| `↑` / `↓` | Move selection up/down |
| `Enter` | Execute selected command (navigate, open sub-menu, or apply theme) |
| `Escape` | Close palette |
| Any printable character | Start typing to search |
| `Tab` | Move selection down (same as ↓) |
| `Shift+Tab` | Move selection up (same as ↑) |

### Inside a sub-menu

| Key | Action |
|-----|--------|
| `↑` / `↓` | Move selection within the current level |
| `Enter` | Open sub-group or execute (navigate to algorithm) |
| `Escape` | Go up one level |
| `←` (Left Arrow) | Go up one level |
| Any printable character | Search within current level |

### Search mode

| Key | Action |
|-----|--------|
| `↑` / `↓` | Move selection through results |
| `Enter` | Navigate to selected algorithm / execute command |
| `Escape` (query non-empty) | Clear query, return to root view |
| `Escape` (query empty) | Close palette |

### Accessibility

- The ninja-keys web component provides its own ARIA role management (`role="dialog"`, `aria-modal`, `aria-label`)
- The search input is automatically focused when the palette opens — no extra JS needed
- Focus is trapped within the palette while open (ninja-keys handles this)
- On close, focus returns to the element that was focused before opening

---

## 6. Selection Actions

### Navigation commands

```
Home         → goto(resolve('/'))
OLL Alg.     → goto(resolve('/oll/'))
PLL Alg.     → goto(resolve('/pll/'))
```

Palette closes immediately after navigation.

### Algorithm commands

```
OLL 1        → goto(resolve('/oll/oll-1/'))
T Perm       → goto(resolve('/pll/t-perm/'))
```

Palette closes immediately after navigation. The detail page loads the algorithm via `cubeStore.loadAlgorithm()` in its `onMount`.

### Theme commands

```
Dark         → themeStore.setTheme('dark')   (no navigation, palette stays open)
Light        → themeStore.setTheme('light')
```

The "Cubehill" theme command was deferred to Phase 8 — it depends on a distinct cubehill DaisyUI theme being defined first.

Theme applies **immediately** (live preview) without closing the palette. The user can switch themes rapidly to compare. Close manually with Escape.

### Sub-menu commands (OLL, PLL group entries)

These have no `handler` — they only set the active `parent` to drill into the next level. ninja-keys handles this internally.

---

## 7. Mobile Considerations

### Trigger

- The navbar `[⌘K]` hint is replaced by a search icon button (magnifying glass, 24px) on screens narrower than 640px
- Tapping calls `ninja.open()` programmatically

### Modal sizing

- Width: `calc(100vw - 32px)` (16px gutter each side)
- Position: 16px from the top (vs 120px on desktop) to maximise result list space on small screens
- Max height: `70vh` — taller than desktop to show more results without scrolling

### Virtual keyboard

- When the palette opens on mobile, the search input focuses and the virtual keyboard appears
- This pushes the modal up. The modal should be positioned with `top: 16px` (not centered) so it stays visible above the keyboard
- The result list area should shrink to fit the remaining space — use `max-height: calc(70vh - 120px)` as a fallback

### Touch interaction

- Result rows have min-height 44px (WCAG touch target recommendation)
- Tap a row to select it
- Swipe down to dismiss (native scroll-to-dismiss not implemented in Phase 6; ESC or tap-outside closes)
- The backdrop (outside the modal) is tappable to close

---

## 8. Animation & Motion

- **Open**: modal fades in + scales up from 96% to 100% over 150ms (`ease-out`)
- **Close**: modal fades out over 100ms (`ease-in`) — slightly faster than open
- **Backdrop**: fades in/out with the modal
- **Row highlight**: instant (0ms transition) — keyboard navigation should feel instant, not laggy
- **Theme switch**: `color-scheme` and CSS variable update is instant; Three.js scene sync follows in the same microtask

ninja-keys provides its own animation defaults. Override via CSS custom properties if needed.

---

## 9. ninja-keys CSS Custom Properties

The following custom properties should be set on the `ninja-keys` element to match the CubeHill dark theme:

```css
ninja-keys {
  --ninja-width: 560px;
  --ninja-top: 120px;
  --ninja-key-border-radius: 6px;
  --ninja-modal-background: oklch(15% 0.01 260);
  --ninja-modal-shadow: 0 24px 48px rgba(0, 0, 0, 0.6);
  --ninja-selected-background: oklch(26% 0.08 260);
  --ninja-text-color: oklch(92% 0.005 260);
  --ninja-placeholder-color: oklch(55% 0.01 260);
  --ninja-footer-background: oklch(12% 0.01 260);
  --ninja-footer-color: oklch(55% 0.01 260);
  --ninja-accent-color: oklch(65% 0.18 260);
  --ninja-z-index: 9999;
}
```

Adjust `--ninja-top` to `16px` on mobile via a media query.

---

## 10. Cmd+K Hint in Navbar

The navbar hint is the primary discoverability surface. Design:

```
Desktop:
[ CubeHill ]  OLL  PLL  [ ☀/🌙 ]  [ ⌘K ]

Mobile:
[ CubeHill ]  [ ≡ ]              [ 🔍 ]
```

The `[⌘K]` badge on desktop uses DaisyUI's `kbd` component styling. It should look like a keyboard key, not a button. Clicking it opens the palette.

On mobile, a 24px magnifying glass icon (no text) in the top-right of the navbar opens the palette. This is the only mobile trigger in Phase 6.

The hint should be subtle enough not to distract from the primary navigation links, but prominent enough to be noticed by curious users on their first visit.
