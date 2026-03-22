# Contributing to the Wiki

Best practices for writing and maintaining the CubeHill `docs/` wiki. Owned by the Software Architect.

## Folder Structure & Ownership

| Folder | Owner | Scope |
|--------|-------|-------|
| `docs/technical/` | **Architect** | Architecture, implementation details, data models, rendering, deployment |
| `docs/product/` | **PM** | Stack decisions, algorithm inventory, pages/layout, theming UX |
| `docs/process/` | **Architect** (contributing.md, browser-tools.md), **UX Designer** (figma-tools.md, shared with Architect + PM), **PM** (issue-tracking.md) | Workflows and team conventions |

Each page has exactly one owner. The owner writes and maintains the page. Other team members can suggest changes, but the owner has final say.

## Formatting Standards

### Structure

- Every page starts with an H1 (`#`) title
- Use H2 (`##`) for major sections, H3 (`###`) for subsections
- Lead with a one-line summary of what the page covers
- Include a cross-reference to the companion page (technical ↔ product) near the top if one exists

### Content

- Use code blocks with language tags (` ```typescript `, ` ```bash `, etc.) for all code
- Use tables for structured data (move definitions, component lists, route maps)
- Use ASCII diagrams for data flow and hierarchy — keep them simple enough to read in a terminal
- Write in present tense ("The store manages..." not "The store will manage...")
- Document the *why* behind decisions, not just the *what*

### Naming

- Use the canonical names for files and types (e.g., `CubeState.ts`, `Algorithm`, `Move`)
- Reference files with their path from the project root (e.g., `src/lib/cube/CubeState.ts`)
- Use standard cubing notation names (OLL, PLL, Sune, T Perm) — don't invent abbreviations

## Keeping Docs Listings in Sync

**Whenever a doc page is added, removed, or renamed, you MUST update the docs listings in both `CLAUDE.md` and `README.md` in the same commit.** This has been missed multiple times — treat it as a hard rule, not a nice-to-have.

Checklist before committing a docs change that adds, removes, or renames a page:

1. Update the `Project Architecture` section in `CLAUDE.md`
2. Update the corresponding section in `README.md`
3. Update the cross-reference pairs table in this file (if the change involves a technical/product pair)
4. All three updates go in the same commit as the new/renamed/removed page

## When to Create a New Page vs. Update an Existing One

**Create a new page** when:
- A wholly new architectural area is introduced (e.g., a new subsystem)
- The topic doesn't fit naturally into any existing page
- An existing page would become unwieldy by absorbing the new content

**Update an existing page** when:
- The change refines, extends, or corrects existing content
- The topic is already covered — even partially — on a current page
- The new content is a natural subsection of an existing page

**Default to updating.** New pages add navigation overhead. Only create one if the content truly warrants standalone treatment.

## Cross-Referencing Between Technical and Product Docs

The technical/product split means related information often lives in two places. Cross-references keep them connected.

### Format

Use relative Markdown links with a descriptive prefix:

```markdown
For the TypeScript data model, see [Technical: Algorithm Data Model](../technical/algorithm-data-model.md).
```

```markdown
For theme selection UX, see [Product: Theming](../product/theming.md).
```

### Rules

- Every technical page that has a product counterpart should link to it (and vice versa), typically in the opening paragraph
- Use the pattern `[Technical: Page Name]` or `[Product: Page Name]` so the link text indicates which folder the target is in
- Don't duplicate content across technical and product docs — link instead
- If you find yourself writing the same information in both places, move it to whichever page owns that concern and link from the other

### Current Cross-Reference Pairs

| Technical | Product |
|-----------|---------|
| `architecture.md` | `stack-decisions.md` |
| `algorithm-data-model.md` | `algorithms.md` |
| `components.md` | `pages-and-layout.md` |
| `theme-integration.md` | `theming.md` |

## How to Flag Docs That Need Updates

When you notice a doc is stale, inaccurate, or incomplete — but you're not the owner or don't have time to fix it right now:

1. **Create a beads issue**: `bd create --title="Update docs/technical/rendering.md — animation timing section is outdated" --type=task --priority=3 -l "docs"`
2. **Assign to the owner**: Use `--assignee` to assign to the page owner (Architect for technical, PM for product)
3. **Be specific**: Say what's wrong or missing, not just "needs update"

If you're the page owner, just fix it directly — no issue needed for small corrections.

## Review Process for Docs Changes

### Who Reviews

- **Technical docs** (`docs/technical/`): Architect writes; PM reviews for consistency with product docs
- **Product docs** (`docs/product/`): PM writes; Architect reviews for technical accuracy
- **Process docs** (`docs/process/`): Owner writes; the other owner reviews

### Periodic Docs Review

The Architect conducts a periodic review of all docs, checking for:

- **Accuracy**: Do the docs match the current code? Are there factual errors?
- **Consistency**: Is terminology used the same way across all pages? Do cross-references resolve correctly?
- **Completeness**: Are there undocumented decisions, missing sections, or gaps in coverage?
- **Freshness**: Has the code changed since the docs were last updated? Are there stale sections?
- **Structure**: Does the current organization still make sense as the project evolves?

Findings are filed as individual beads issues assigned to the page owner.

### When to Review

- At the start of each session (quick scan)
- After any significant implementation change
- When a new doc page is created (check cross-references)
