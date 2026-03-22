# Issue Tracking

This project uses **beads** (`bd`) for all issue tracking. This document defines the standards and best practices for how the team creates, manages, and closes issues.

Run `bd prime` for the full command reference.

## Core Principles

1. **Everything is tracked.** Any work that takes more than a couple of minutes gets a beads issue — code, docs, reviews, bug fixes, investigations.
2. **Issues are actionable.** Each issue describes a concrete piece of work with a clear "done" state. Long-term knowledge goes in `docs/`, not in issues.
3. **Claim before starting.** Always `bd update <id> --claim` before beginning work. This prevents duplicate effort and gives the team visibility into who's doing what.
4. **Close when done.** Don't leave issues lingering. Close them as soon as the work is complete and verified.
5. **One issue, one concern.** Don't bundle unrelated work into a single issue. If a review finds 3 problems, create 3 issues.

## Issue Types

| Type | When to Use |
|------|-------------|
| `task` | General work item (default). Use for most things. |
| `bug` | Something is broken or incorrect. |
| `feature` | New functionality or enhancement. |
| `chore` | Maintenance, cleanup, dependency updates. |
| `epic` | A larger initiative spanning multiple issues. Use `bd epic create`. |
| `decision` | An architecture or design decision that needs to be made and recorded. |

## Labels

Use labels to categorize issues by area. Standard labels for this project:

| Label | Area |
|-------|------|
| `architecture` | Project structure, data flow, technical design |
| `cube-engine` | Cube state, moves, notation parser |
| `rendering` | Three.js, animations, 3D visualization |
| `ui` | Svelte components, pages, routing |
| `ux` | User experience, interaction design, accessibility |
| `cubing` | Algorithm accuracy, notation, domain correctness |
| `theming` | DaisyUI, dark/light mode, styling |
| `deployment` | GitHub Pages, CI/CD, build config |
| `bug` | Defects and broken behavior |
| `code-quality` | Code review findings, refactoring |
| `critical` | Must fix — blocks progress or causes incorrect behavior |

Multiple labels can be applied to a single issue. Use `bd create -l "label1,label2"`.

## Statuses

| Status | Meaning |
|--------|---------|
| `open` | Available to work on. Not yet started. |
| `in_progress` | Someone has claimed it and is actively working. |
| `blocked` | Cannot proceed — waiting on a dependency or decision. |
| `deferred` | Intentionally postponed for later. |
| `closed` | Work is complete and verified. |

## Writing Good Issues

### Titles
- Start with a verb: "Add", "Fix", "Update", "Review", "Verify"
- Be specific: "Fix Ua Perm algorithm notation" not "Fix algorithm"
- Keep it short but descriptive — someone should understand the scope from the title alone

### Descriptions
- **What**: What needs to be done
- **Why**: Why it matters (skip for obvious tasks)
- **Acceptance criteria**: How to know it's done (for non-trivial tasks)

Example:
```
bd create "Add touch gesture handling for mobile cube interaction" \
  -d "OrbitControls intercepts touch events, preventing page scroll on mobile. Need to implement two-finger rotate or a dedicated touch zone so scrolling works alongside cube rotation." \
  -l "ux,rendering,critical"
```

### When to Add Acceptance Criteria
- Features and enhancements: always
- Bug fixes: describe the expected behavior after the fix
- Simple tasks (typos, config changes): not needed — the title is enough
- Reviews: describe what should be reviewed and what "approved" means

## Dependencies

Use dependencies to sequence work:

```bash
bd dep add <id> --blocks <other-id>    # This issue blocks another
bd dep add <id> --relates-to <other-id> # Related but not blocking
```

`bd ready` only shows issues with no open blockers — so dependencies automatically control what's available to work on.

## Epics

Use epics to group related issues into larger initiatives:

```bash
bd epic create "Phase 3: Cube State Engine"
bd create "Implement CubeState.ts" --parent <epic-id>
bd create "Implement moves.ts" --parent <epic-id>
bd create "Implement notation.ts" --parent <epic-id>
```

Epics correspond to implementation phases. Each phase from the project plan should be an epic.

## PM Hygiene Duties

The Product Manager is responsible for keeping the issue tracker healthy:

### Start of Session
- Run `bd status` for an overview
- Run `bd ready` to see what's available
- Run `bd stale` to find issues that haven't been updated recently

### Periodic Checks
- **Open issues**: Are any stale, missing assignees, unclear, or blocked on resolved items?
- **Recently closed issues**: Was the work actually completed? Are there uncaptured follow-ups?
- **Consistency**: Do issues follow these standards — proper labels, clear titles, descriptions where needed?
- **Compliance**: Is every teammate tracking their work? If not, message them.

### Useful Commands
```bash
bd list                              # All open issues
bd list --all                        # Including closed
bd list -a "full-stack-dev"          # Issues by assignee
bd list -l "critical"               # Issues by label
bd list --status in_progress         # What's being worked on
bd stale                             # Issues not updated recently
bd status                            # Overview and statistics
```

## Session Workflow (All Agents)

1. `bd ready` — find available work
2. `bd update <id> --claim` — claim it
3. Do the work
4. `bd close <id>` — mark done
5. If you discover additional work, `bd create` new issues
6. End of session: `bd sync`, `git push`
