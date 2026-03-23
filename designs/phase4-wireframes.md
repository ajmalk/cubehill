# Phase 4 Wireframes — Algorithm Detail Page Layout

Rough layout wireframes for the CubeViewer + PlaybackControls page. These are structural sketches only — gray rectangles with text labels. The detailed component spec is in `phase4-svelte-integration.md`.

## Design Artifacts

**Figma file**: Design (`fiCCEbCrIIZqYVIm9XTjiD`), page: **Phase 4 — CubeViewer & PlaybackControls**

**Wireframe screenshots** (exported from Figma):
- [Desktop wireframe (Figma)](https://www.figma.com/design/fiCCEbCrIIZqYVIm9XTjiD?node-id=16-463) — Desktop layout (>1024px), frame `16:463`
- [Mobile wireframe (Figma)](https://www.figma.com/design/fiCCEbCrIIZqYVIm9XTjiD?node-id=16-512) — Mobile layout (<640px), frame `16:512`

![Desktop wireframe](phase4-desktop-wireframe.png)
![Mobile wireframe](phase4-mobile-wireframe.png)

**Related design docs**:
- `designs/phase4-svelte-integration.md` — Full component spec (sizing, interaction, states, accessibility)
- `designs/phase3-rendering-parameters.md` — Visual parameters for the 3D cube itself

## Figma Location

File: **Design** (`fiCCEbCrIIZqYVIm9XTjiD`)
Page: **Phase 4 — CubeViewer & PlaybackControls**
Section: **Phase 4 Designs** (below existing component annotation frames)

| Wireframe | Frame Name | Node ID |
|-----------|-----------|---------|
| Desktop Layout | Wireframe — Desktop Layout | `16:463` |
| Mobile Layout | Wireframe — Mobile Layout | `16:512` |

## Desktop Layout (>1024px)

Two-column flex layout. Cube on the left occupies ~half the content width (max 500px, square). Right column stacks vertically:

```
[ Navbar                                              ]

[ 3D Cube Canvas    ] [ Algorithm Info                ]
[                   ] [ Notation: R  U  R'  U  R  U2  R' ]
[                   ] [ Transport: ⏮  ◀  ▶/⏸  ▶▶       ]
[    (square)       ] [ Speed: Slow | Normal | Fast    ]
[                   ] [ Keyboard hints: R ← Space →   ]
```

Tailwind: `flex flex-col lg:flex-row gap-8 items-start`
Left col: `w-full lg:w-1/2 lg:max-w-[500px] aspect-square flex-shrink-0`
Right col: `flex-1 min-w-0`

## Mobile Layout (<640px)

Single column. Cube full-width on top, controls below. Transport buttons centered.

```
[ Navbar                     ]

  OLL 21 — T-Shape

[ 3D Cube Canvas             ]
[   (full width, square)     ]

  Notation: R  U  R'  U  R  U2  R'

       [ ⏮  ◀  ▶/⏸  ▶▶ ]

  Speed: [ Slow ] [ Normal ] [ Fast ]
```

Tailwind: `flex-col` (default before `lg:flex-row`)
Cube: `w-full max-w-[480px] mx-auto aspect-square`
Transport: `flex justify-center`
