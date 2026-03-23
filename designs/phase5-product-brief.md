# Phase 5: Algorithm Data & Browse UI — Product Brief

**Issue**: cubehill-3j2
**Status**: In progress
**Owner**: Product Manager

This brief is the input document for the UX Designer (design tasks 3j2.11–3j2.13) and the Software Architect (data model and routing decisions). It defines what users see, how they navigate, and what "done" looks like for each design task.

---

## 1. What Phase 5 Delivers

Phase 5 is the first release where CubeHill is genuinely useful to a speedcuber. Prior phases built the 3D viewer, playback controls, and theming. This phase connects that infrastructure to real algorithm data and gives users a way to browse and reach any OLL or PLL case.

After Phase 5:

- All 57 OLL cases and all 21 PLL cases exist as static TypeScript data in `src/lib/data/`.
- Users can browse algorithms by group on the OLL and PLL listing pages.
- Users can click any card to reach that case's detail page, where the Phase 4 cube viewer loads the correct algorithm.
- The home page orients new visitors and directs them into the algorithm sets.
- The command palette (Cmd+K) allows jumping to any case by name or notation.

Nothing in Phase 5 requires a network request at runtime. All data is compiled into the static build.

---

## 2. User Journey

The primary user journey for Phase 5:

```
Home → OLL Listing → OLL Case Detail
Home → PLL Listing → PLL Case Detail
```

Secondary access path (power users):

```
Cmd+K → type "T Perm" → jump to PLL detail page
Cmd+K → type "dot" → jump into OLL Dot cases
```

Within a listing page, users can also navigate directly to a case detail page and then step through adjacent cases using prev/next navigation already specified in the Phase 4 detail page layout.

### User Types and Goals

**Beginner cubers**: Arriving from a tutorial, they want to understand what an algorithm looks like and see it animated step-by-step. They do not know OLL/PLL terminology yet. The home page and listing pages must not assume prior knowledge.

**Intermediate cubers**: Learning full PLL or working through CFOP. They know which case they are looking for. They want to find it quickly, see the standard notation, and watch the algorithm to check their memorization.

**Advanced cubers**: Scanning for alternative algorithms or checking specific cases. They use Cmd+K and prev/next navigation heavily. Card density and keyboard access matter more to them than introductory text.

---

## 3. Key Product Decisions

### 3.1 How Algorithms Are Grouped

**OLL listing**: Algorithms are grouped by shape (the pattern of oriented stickers on the top face). The groups follow the jperm.net convention documented in `docs/product/algorithms.md`. Groups appear in this order on the listing page:

1. All Edges Oriented / OCLL (7 cases) — shown first because these are the 2-look OLL cases beginners learn
2. T-Shape (2 cases)
3. Square (2 cases)
4. P-Shape (4 cases)
5. W-Shape (2 cases)
6. Fish (4 cases)
7. Knight Move (4 cases)
8. Awkward (4 cases)
9. Big Lightning (4 cases)
10. Small Lightning (4 cases)
11. C-Shape (2 cases)
12. I-Shape (4 cases)
13. L-Shape (6 cases)
14. Dot (8 cases) — shown last; these are the hardest and least common

The OCLL group at the top is a deliberate product decision: beginners enter via 2-look OLL, and the OCLL cases (Sune, Anti-Sune, H, Pi, etc.) are what they learn first. Dot cases are last because they are the most advanced.

**PLL listing**: Algorithms are grouped by which pieces are permuted:

1. Edges Only (4 cases: Ua, Ub, H, Z) — shown first because these are the 2-look PLL cases
2. Corners Only (2 cases: Aa, Ab) — shown second for the same reason
3. Both Edges and Corners (15 cases) — shown last, arranged alphabetically within the group

Within the "Both" group, alphabetical ordering is fine. The grouping itself provides enough structure.

### 3.2 What Goes on a Card vs. a Detail Page

**Cards show**:
- Case name (e.g., "OLL 21", "T Perm")
- 2D pattern thumbnail (OLL: colored grid showing oriented stickers; PLL: arrow diagram)
- Group label (shown in the group header, not repeated on every card)
- Probability (e.g., "1/54")
- A "2-look" badge if the case is part of the 2-look OLL or 2-look PLL set

Cards do not show: the algorithm notation, the case number for PLLs, alternative algorithms. These live on the detail page. Cards are for recognition and navigation, not for learning the algorithm.

**Detail pages show** (extending the Phase 4 layout):
- Case name and canonical number (OLL) or name (PLL)
- Group label
- Probability and learn-priority indicator
- The 3D cube viewer with the unsolved state pre-loaded
- PlaybackControls with the full notation sequence
- Alternative notations (listed below PlaybackControls as plain text, labeled "Alternative algorithms:")
- Prev/next case navigation (already designed in Phase 4)

### 3.3 The 2-Look Path

The 2-look algorithms are a curated learning path for beginners. They are identified in the data via a `isTwoLook` boolean field. On cards and in section headers, cases that belong to the 2-look path get a "Start Here" badge or marker.

The 2-look OLL cases are:
- **Edge orientation (cross)**: OLL 49, 50, 51, 52 (no corners oriented, edges in cross or dot)
- **OCLL (corner orientation)**: OLL 21 (H), 22 (Pi), 23 (Headlights), 24 (Chameleon), 25 (Bowtie), 26 (Anti-Sune), 27 (Sune)

The 2-look PLL cases are:
- **Corner permutation**: Aa Perm, Ab Perm
- **Edge permutation**: Ua Perm, Ub Perm, H Perm, Z Perm

The data model needs an `isTwoLook` field. The Architect should add this to `algorithm-data-model.md`. The UI surfaces it as a visual indicator — the exact visual treatment is for the UX Designer to determine.

### 3.4 Probability Display

Probability is a fraction (e.g., "1/54") from the data. On cards, display it as-is. On detail pages, add a brief human-readable interpretation: for example, "1 in 54 solves" next to the fraction. Do not compute percentages — fractions are the standard cubing community format and more scannable.

### 3.5 Alternative Notations

The `altNotations` field is an array of strings. When non-empty, display these below the primary PlaybackControls on the detail page, under the heading "Alternative algorithms". Each alternative is displayed as a text list with a numbered label ("Alt 1:", "Alt 2:"). Clicking an alternative loads it into the cube viewer and PlaybackControls in place of the primary algorithm. This requires cubeStore to support swapping the active algorithm — the Architect should verify this is in scope for Phase 5 or defer it to Phase 6.

**Decision**: For Phase 5, display alternative algorithms as text-only. Clicking to load them can be Phase 6. This keeps Phase 5 focused on data and browsing.

### 3.6 Home Page Role

The home page is a navigation hub and a first impression, not a documentation page. It should be short, visually led, and require no prior cubing knowledge to understand.

The home page does not attempt to explain CFOP or the last layer in detail. One sentence of context is enough. The three prominent actions are: explore OLL, explore PLL, and use Cmd+K to jump to a case.

---

## 4. Design Tasks

### 4.1 Task 3j2.11 — AlgorithmCard + AlgorithmList (Browse Grid)

**What the user sees**: A grid of cards, grouped under section headers. The grid adapts from 1 column on mobile to 4 columns on wide desktop. Section headers span the full grid width.

**Design requirements**:

1. **Card anatomy**: Each card contains, in order from top to bottom:
   - Pattern thumbnail (square, fills the card width): OLL uses a 3×3 color grid; PLL uses an arrow diagram on a neutral square background
   - Case name (bold, 1 line)
   - Probability (muted, smaller text)
   - Optional "Start Here" badge for 2-look cases

2. **Pattern thumbnails**:
   - OLL thumbnails: a 3×3 grid where each cell is either yellow (oriented) or a muted gray/neutral (not oriented). The center is always yellow. Cells are small squares with thin gaps, no border radius. Use the theme's `warning` color or a fixed yellow for oriented stickers; use `base-300` for unoriented. The thumbnail must be theme-aware (background adapts to dark/light mode).
   - PLL thumbnails: arrows overlaid on a 3×3 grid of neutral squares. Arrow style should be consistent with a speedcubing diagram convention — SVG arrows from source square to destination square, with arrowheads. Use the theme's `primary` color for arrows.

3. **Group headers**: Full-width text labels that separate card groups. Style as a smaller heading (e.g., `text-sm font-semibold uppercase tracking-wide text-base-content/60`). Include the case count in parentheses after the group name (e.g., "Dot Cases (8)"). A thin horizontal rule below the header separates it from the card grid.

4. **Card interaction**: Cards are links. Hover state should provide clear visual feedback — a subtle lift (box shadow or border color change) and a cursor pointer. On mobile, tap feedback (brief highlight) is handled by the browser default or a short active state.

5. **Card sizing**: Cards should not be too tall. The thumbnail should take roughly 60% of the card height; the name and probability take the remaining 40%. On desktop (4 columns), cards will be roughly 160–200px wide. On mobile (1 column), they fill the full container width.

6. **Empty group behavior**: If a group has zero cases (should not happen in production, but may happen during development before all data is filled in), the group header is omitted. Do not render an empty section.

**AlgorithmList component behavior**:
- Receives an array of `Algorithm` objects
- Groups them by `group` field in the defined order (not alphabetical — use the canonical group order from section 3.1 of this brief)
- Renders a group header followed by a responsive grid for each group
- The grid uses: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`

**Acceptance criteria**:
- [ ] Card renders with thumbnail, name, and probability for any OLL or PLL case
- [ ] OLL thumbnail shows correct yellow/neutral grid for any 9-element boolean pattern
- [ ] PLL thumbnail renders arrows for any PermutationArrow[] pattern
- [ ] 2-look cases show a visual badge or indicator
- [ ] Cards link to the correct detail page using the `base` path prefix
- [ ] Group headers appear in the canonical group order, not alphabetical order
- [ ] Group headers show the case count
- [ ] Grid layout is responsive: 1/2/3/4 columns at mobile/sm/lg/xl
- [ ] Hover state is visually clear
- [ ] All DaisyUI color classes are semantic (no hardcoded colors)

---

### 4.2 Task 3j2.12 — Algorithm Detail Page (Real Data)

**What the user sees**: The Phase 4 detail page layout, now populated with real algorithm data. The cube viewer loads the actual unsolved state for the selected case. The notation strip shows the real moves. The page title shows the real case name.

This task extends the Phase 4 design rather than replacing it. The layout, cube sizing, PlaybackControls, and keyboard controls are all already specified. Phase 5 adds the data layer: loading the right algorithm for the current route, displaying case metadata, and wiring alternative notations.

**Design requirements**:

1. **Page-level metadata** (appears in the right column above the notation strip):
   - Case name as the page heading (e.g., `<h1>OLL 21</h1>`, `<h1>T Perm</h1>`)
   - Group label below the heading (e.g., "OCLL — All Edges Oriented") as muted text
   - Probability row: the fraction from data (e.g., "1/54"), followed by a separator, followed by a 2-look badge if `isTwoLook` is true

2. **Algorithm loading**: On page load, the detail page reads the case `id` from the route, finds the matching algorithm in the static data array, applies the inverse to get the unsolved cube state, and loads that state into `cubeStore`. This happens in the page's `onMount`. If the `id` does not match any case, show an error state (simple text: "Case not found").

3. **Alternative notations display** (Phase 5 scope: text only, no interactive loading):
   - Appears below the speed selector and keyboard hints in the right column
   - Heading: "Alternative algorithms" (`text-sm font-semibold` style)
   - Each alternative shown as a numbered list with the notation in `font-mono`
   - Only rendered when `altNotations` is non-empty

4. **Prev/Next navigation**: Already specified in Phase 4. In Phase 5, these links become functional — they navigate to the adjacent case in the same category. The order is the canonical numeric/alphabetical order for the category (OLL 1 through 57; PLL alphabetical by name). The first case in the set has no "prev" link; the last has no "next" link.

5. **Page title (browser tab)**: Use the SvelteKit `<svelte:head>` block to set `<title>OLL 21 — CubeHill</title>` (or PLL equivalent). This is important for bookmarking and sharing.

**Acceptance criteria**:
- [ ] Correct algorithm loads into the cube viewer for any valid OLL or PLL case ID
- [ ] Case name, group, and probability display correctly
- [ ] 2-look badge appears when `isTwoLook` is true
- [ ] Notation strip shows the correct move sequence
- [ ] Alternative algorithms section appears when `altNotations` is non-empty
- [ ] Prev/Next navigation links are functional and point to adjacent cases
- [ ] Invalid case IDs show a clear error state
- [ ] Browser `<title>` reflects the case name
- [ ] Page is fully prerenderable (uses `entries()` export, works with `adapter-static`)

---

### 4.3 Task 3j2.13 — Home Page

**What the user sees**: A short, visually prominent landing page with an interactive 3D cube in the center, a one-line introduction to CubeHill, and two large navigation cards directing users to OLL and PLL.

**Design requirements**:

1. **Hero section**: The primary element is the 3D cube viewer, sized as specified in Phase 4 (`min(60vw, 60vh, 500px)`, `aspect-square`, `min-w-[280px]`). The cube is visible immediately on page load (no above-the-fold scroll required on desktop). The cube is not loaded with any algorithm — it shows the solved state by default and responds to user orbit/zoom.

2. **Tagline**: A single line of text directly below the cube. Suggested copy: "Learn speedcubing algorithms with an interactive 3D cube." This is a product description, not a call to action. Keep it to one sentence. The UX Designer may refine the copy but should not replace it with a heading or add sub-paragraphs. If the designer wants to propose alternative copy, they should note it in the design artifact with a rationale.

3. **Navigation cards**: Two equal-width cards side by side (on desktop and tablet) or stacked (on mobile), directing users to OLL and PLL. Each card:
   - Has a clear label: "OLL" and "PLL"
   - Has a brief subtitle: "57 cases — Orient the Last Layer" and "21 cases — Permute the Last Layer"
   - Has a visual anchor: a sample pattern thumbnail (one representative OLL case for the OLL card; one representative PLL case for the PLL card). The Cubing Advisor should confirm which cases are most visually recognizable. Suggested defaults: OLL 27 (Sune, a well-known shape) for OLL; T Perm for PLL.
   - Links to the respective listing page (`/oll/` and `/pll/`)
   - Has a hover state consistent with algorithm cards elsewhere in the app

4. **Cmd+K hint**: A small, low-prominence line below the navigation cards: "Press Cmd+K to jump to any algorithm." Use `kbd` elements for the key. Hide on mobile (keyboard shortcut is not relevant). This hints at a power-user feature without cluttering the page for beginners.

5. **Layout constraints**:
   - On desktop: cube fills center of the viewport, cards appear below as two columns
   - On mobile: cube on top (appropriately sized per Phase 4 mobile spec), tagline below, cards stacked below that
   - The page should not require scrolling to see the two navigation cards on a standard desktop viewport (1280×800 or larger). On smaller screens, some scrolling is acceptable.
   - Do not add decorative elements, background gradients, or hero images. The cube is the visual centerpiece. The rest of the page is clean and minimal.

6. **No marketing copy**: The home page is not a landing page for an unfamiliar product. It is the entry point for users who already know they want to look at speedcubing algorithms. Do not add paragraphs of explanation, feature lists, or social proof sections.

**Acceptance criteria**:
- [ ] 3D cube is visible above the fold on desktop (1280×800) without scrolling
- [ ] Tagline is present and legible
- [ ] Two navigation cards link to `/oll/` and `/pll/` with correct base-path prefix
- [ ] Navigation cards show count and description
- [ ] Navigation cards show a sample pattern thumbnail
- [ ] Cards are side-by-side on desktop, stacked on mobile
- [ ] Cmd+K hint is visible on desktop and hidden on mobile
- [ ] No algorithm is pre-loaded into the cube on the home page
- [ ] Page uses `<svelte:head>` to set `<title>CubeHill — Speedcubing Algorithm Visualizer</title>`
- [ ] Page is clean: no decorative backgrounds, no marketing paragraphs

---

## 5. Information Hierarchy Summary

The three page types form a clear hierarchy:

```
Home
  ├── Introduces CubeHill
  ├── Directs users to OLL or PLL
  └── Hints at Cmd+K for power users

OLL / PLL Listing
  ├── Groups algorithms by shape or type
  ├── Shows a thumbnail, name, and probability per case
  └── Highlights 2-look cases for beginners

Algorithm Detail
  ├── Loads the correct cube state for the case
  ├── Provides playback controls (Phase 4)
  ├── Shows metadata (group, probability, 2-look status)
  └── Lists alternative algorithms (text-only in Phase 5)
```

Each level narrows focus. The home page is broad orientation. The listing page is structured browsing. The detail page is deep engagement with one case.

---

## 6. Data Model Note for the Architect

The data model in `docs/technical/algorithm-data-model.md` needs one addition before implementation begins: an `isTwoLook` boolean field on `BaseAlgorithm`. This field identifies cases that belong to the 2-look OLL or 2-look PLL learning path. The 2-look cases are enumerated in section 3.3 of this brief.

The Architect should update `algorithm-data-model.md` to add this field and confirm the set of cases that receive `isTwoLook: true`. The Cubing Advisor should validate the list before data entry begins.

---

## 7. Out of Scope for Phase 5

The following are intentionally deferred:

- **Interactive alternative algorithm loading**: Clicking an `altNotations` entry to load it into the cube viewer. Deferred to Phase 6.
- **Filtering or search on listing pages**: The command palette provides search. In-page filtering is not needed in Phase 5.
- **Favorites or progress tracking**: No user state persistence in Phase 5.
- **Animated pattern thumbnails**: Static 2D thumbnails only. A future phase could animate the thumbnail on hover.
- **Case comparison**: Viewing two cases side-by-side. Deferred.
- **Algorithm notation variants toggle**: The speed selector already handles playback speed. Switching between multiple notations interactively is Phase 6.

---

## 8. Handoff Notes

**For the UX Designer**: Design tasks 3j2.11, 3j2.12, and 3j2.13. Produce wireframes in Figma (file `fiCCEbCrIIZqYVIm9XTjiD`) on a new page named **Phase 5 — Browse UI**. Export screenshots to `designs/` and create a `designs/phase5-wireframes.md` doc in the same format as `designs/phase4-wireframes.md`. The Phase 4 detail page layout is already approved — for 3j2.12, extend it rather than redesign it.

**For the Software Architect**: Review section 6 (data model note). Confirm that `cubeStore.loadAlgorithm()` can be called from a SvelteKit page's `onMount` and that the detail page route can prerender using `entries()`. The routing and prerendering approach is already documented in `docs/product/pages-and-layout.md` and `docs/technical/components.md` — no architecture changes are expected, just confirmation.

**For the Cubing Advisor**: Validate the 2-look case list in section 3.3. Confirm the sample cases proposed for the home page navigation cards (OLL 27 for OLL, T Perm for PLL). Verify all 78 algorithm notations (57 OLL + 21 PLL) in `docs/product/algorithms.md` before the Full-Stack Dev begins data entry.

**For the Full-Stack Dev**: Do not begin data entry until the Cubing Advisor has validated the algorithm list and the Architect has confirmed the data model update. Data entry and component implementation can proceed in parallel once those two gates are cleared.
