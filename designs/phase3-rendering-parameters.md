# Phase 3: 3D Rendering Design Parameters

Design spec for the Three.js cube renderer. All values are implementation-ready. Reasoning is inline so the dev understands intent, but the **bold values** are what to code.

---

## 1. Cubie Appearance

### Style Direction: Stickerless Modern

The cube should look like a modern **stickerless speedcube** (like a GAN or MoYu WeiLong). This means:

- The colored plastic IS the cubie face -- there are no separate "sticker" overlays with visible edges.
- The body (visible between faces and at edges/corners) is dark plastic.

This is the look most competitive cubers associate with quality cubes in 2024+, and it renders cleaner on screen than a stickered look (no sticker peel, no edge shimmer).

### Geometry Values

| Parameter | Value | Notes |
|-----------|-------|-------|
| Cubie body size | **0.85 units** per side | Placed on integer grid (-1, 0, 1), so gap between cubies is 0.15 units |
| Body corner radius | **0.08 units** | Subtle rounding. Use `RoundedBoxGeometry` from three/examples or a beveled BoxGeometry. If too complex, a standard BoxGeometry is acceptable for Phase 3 -- the gap and coloring matter more than rounding. |
| Face color inset | **0.03 units** from each edge of the cubie face | The colored portion of each face is slightly smaller than the full 0.85 face, leaving a thin dark border visible. This creates the "stickerless" pill-shaped color region. |
| Face (sticker) size | **0.79 units** (0.85 - 2*0.03) | The colored PlaneGeometry that sits on each visible face |
| Face offset from body | **0.001 units** outward from the body surface | Just enough to prevent z-fighting. Not visually perceptible. |
| Face corner radius | **0.06 units** | Rounded rectangle shape for sticker faces. If using PlaneGeometry (no built-in rounding), this can be achieved with a ShapeGeometry from a rounded rect path. Alternatively, skip face rounding in Phase 3 and use a simple plane -- it still looks good with the inset. |

### Body Material

- **Color**: `#1a1a1a` (very dark gray, not pure black -- allows subtle shading to read)
- **Material type**: `MeshStandardMaterial` with `roughness: 0.85`, `metalness: 0.0`
- Matte plastic look, no reflections

### Implementation Priority

For Phase 3, the minimum viable cubie is: standard `BoxGeometry` body at 0.85 scale, `PlaneGeometry` stickers at 0.79 scale offset by 0.001, dark body material. Corner rounding on body and faces can be deferred to a polish pass.

---

## 2. Sticker Colors

### Adjusted for Screen Readability

Standard competition cube colors are designed for physical lighting. On screen, especially on dark backgrounds, some adjustments improve contrast and reduce eye strain. The changes are subtle -- a cuber would still immediately recognize these as "the right colors."

| Face | Standard (approx) | CubeHill Value | Adjustment Rationale |
|------|--------------------|----------------|---------------------|
| White (U) | `#FFFFFF` | **`#FFFFFF`** | No change. Pure white reads well on dark backgrounds. |
| Red (R) | `#B71234` | **`#DC2626`** | Slightly brighter and more saturated. Dark reds disappear on dark themes. Tailwind red-600. |
| Green (F) | `#009B48` | **`#16A34A`** | Slightly warmer and brighter. Pure greens look dull on screen. Tailwind green-600. |
| Yellow (D) | `#FFD500` | **`#FACC15`** | Very slightly muted to reduce glare, especially on light themes. Tailwind yellow-400. |
| Orange (L) | `#FF5800` | **`#F97316`** | Slightly shifted toward amber for better red/orange differentiation. Tailwind orange-500. |
| Blue (B) | `#0046AD` | **`#2563EB`** | Noticeably brighter. Standard competition blue is very dark and unreadable on dark backgrounds. Tailwind blue-600. |

### Material Properties (all faces)

- **Material type**: `MeshStandardMaterial`
- **Roughness**: `0.4` (slight sheen, like real stickerless plastic)
- **Metalness**: `0.0`
- **Emissive**: `0x000000` (none -- colors come entirely from lighting)

### Rationale for Tailwind Alignment

Using Tailwind color palette values ensures that if we ever need to show these colors in 2D UI elements (case thumbnails, notation highlighting, legend), they will match without a separate color mapping.

---

## 3. Camera

### Default Position

- **Position**: `(3.5, 3.0, 3.5)` looking at `(0, 0, 0)`
- This is a slight adjustment from the spec's `(3,3,3)`. The extra 0.5 on X and Z versus Y creates a view that is slightly more "looking down" at the cube, which better reveals the **U (top) face** while still showing R and F clearly.
- The U face is the most important for OLL visualization. R and F are important for PLL. This angle balances all three.

### Field of View

- **FOV**: `45` degrees (vertical)
- Narrower than the Three.js default of 75. A narrower FOV reduces perspective distortion, making the cube look more like an orthographic "diagram" while retaining depth cues. This is better for algorithm study than a wide-angle dramatic view.

### Orbit Controls

| Parameter | Value | Notes |
|-----------|-------|-------|
| Min distance | **4.0** | Prevents zooming so close that the cube fills past the canvas edge |
| Max distance | **12.0** | Prevents zooming so far that the cube becomes a speck |
| Enable damping | **true** | |
| Damping factor | **0.08** | Smooth but not floaty |
| Enable pan | **false** | Cube stays centered |
| Auto-rotate | **false** by default | Could be enabled on the home hero page as a future enhancement |
| Enable zoom | **true** | Via scroll wheel / pinch |

### Reset View

Provide a way to reset the camera to the default position (e.g., double-click or a reset button). The camera should animate back smoothly over **400ms** using ease-out.

---

## 4. Lighting

### Design Intent: Clean and Flat

Lighting should prioritize **sticker readability** over dramatic aesthetics. The user needs to quickly identify which face is which color. Shadows, specular highlights, and dramatic falloff all work against this goal.

### Light Setup

| Light | Type | Position | Intensity | Color |
|-------|------|----------|-----------|-------|
| Ambient | `AmbientLight` | n/a | **0.6** | `#FFFFFF` |
| Key light | `DirectionalLight` | `(5, 8, 5)` | **0.8** | `#FFFFFF` |
| Fill light | `DirectionalLight` | `(-3, 4, -3)` | **0.3** | `#FFFFFF` |

### Rationale

- **High ambient (0.6)**: Ensures all faces are readable even when facing away from the key light. A face in "shadow" should still be clearly identifiable by color.
- **Key light from upper-right-front**: Matches the default camera angle. The faces the user sees most (U, R, F) get the most direct light.
- **Fill light from opposite side**: Prevents the back/left/bottom faces from going completely dark when the user orbits. Low intensity so it does not flatten the cube entirely -- some depth perception is still desirable.
- **No shadows**: Set `castShadow: false` on all lights. Shadows on a Rubik's cube add visual noise without conveying useful information.
- **White light only**: Colored lighting would distort sticker color perception.

---

## 5. Animation

### Timing

| Parameter | Value | Notes |
|-----------|-------|-------|
| Default move duration | **250ms** | Slightly faster than the spec's 300ms suggestion. After testing algorithm playback mentally: at 300ms, a 15-move PLL algorithm takes 4.5 seconds, which feels sluggish on repeat viewing. At 250ms it takes 3.75s -- snappier without losing readability. |
| Fast mode duration | **120ms** | For experienced users who want to scan algorithms quickly. Toggled via a speed control. |
| Slow mode duration | **500ms** | For beginners studying individual moves. |

### Easing

- **Curve**: Ease-in-out cubic (`t < 0.5 ? 4*t*t*t : 1 - pow(-2*t+2, 3) / 2`)
- Starts and ends slowly, fast in the middle. This makes the start and end positions of each move easy to perceive (the eye catches the "rest" moments) while keeping the overall pace brisk.
- Implement as a simple easing function applied to a 0-to-1 progress value in the `requestAnimationFrame` loop. No tween library needed.

### Gap Between Moves

- **Inter-move delay**: `0ms` (none)
- The ease-in-out curve already creates a natural visual pause at the transition between moves. Adding an explicit gap makes playback feel stuttery.

### Design Feel

The animation should feel **precise and mechanical** -- like a well-lubricated speedcube, not like a bouncy UI animation. No overshoot, no bounce, no elastic effects. The cube is a tool, not a toy.

---

## 6. Cube Size and Canvas

### Home Page (Hero)

- The cube canvas should occupy a **square region** sized at approximately **min(60vw, 60vh, 500px)**
- This makes it prominent without overwhelming the page
- Centered horizontally, with introductory text and navigation below it
- Minimum canvas size: **280px** (below this, orbit interaction becomes frustrating on mobile)

### Algorithm Detail Page

- **Desktop (>1024px)**: Side-by-side layout. Cube canvas takes the left column at roughly **50%** of the content area width, maintaining a 1:1 aspect ratio. Max width **500px**.
- **Mobile (<640px)**: Stacked layout. Cube canvas fills the full content width minus padding, maintaining 1:1 aspect ratio. Use `aspect-ratio: 1` CSS.
- **Tablet (640-1024px)**: Same as mobile (stacked), but with more horizontal padding so the cube does not stretch too wide. Max width **480px**, centered.

### Canvas Padding

- The cube should appear to "float" in the center of the canvas with visual breathing room. The camera distance and FOV already handle this -- at the default camera position with FOV 45, the cube will occupy roughly **60-65%** of the canvas width, leaving natural padding.
- No additional CSS padding inside the canvas element. The 3D scene handles its own composition.

### Background

- The canvas `preserveDrawingBuffer` is not needed (we are not doing screenshots from the canvas).
- The renderer should use `alpha: false` and set a scene background color.

---

## 7. Background

### Canvas Background = Page Background

The 3D canvas background should **exactly match** the page background. Read the DaisyUI `--b1` CSS variable and apply it as the Three.js scene background color (as described in `theme-integration.md`).

### No Visual Separation

Do **not** add a border, shadow, or different background shade to the canvas area. The cube should feel like it is floating directly on the page, not inside a "viewer window." This creates a cleaner, more integrated feel and avoids the "embedded applet" look.

### Theme Transition

When the user toggles themes, the canvas background should update in the same frame as the CSS transition. Since Three.js renders on `requestAnimationFrame`, there may be a 1-frame delay -- this is acceptable and imperceptible. Do not add a CSS transition to the canvas element itself.

---

## Summary of Key Values (Quick Reference)

```
CUBIE
  body size:          0.85
  body color:         #1A1A1A
  body roughness:     0.85
  face (sticker) size: 0.79
  face offset:        0.001
  face roughness:     0.4

COLORS
  white:   #FFFFFF
  red:     #DC2626
  green:   #16A34A
  yellow:  #FACC15
  orange:  #F97316
  blue:    #2563EB

CAMERA
  position:     (3.5, 3.0, 3.5)
  lookAt:       (0, 0, 0)
  FOV:          45
  near clip:    0.1
  far clip:     100

ORBIT
  min distance: 4.0
  max distance: 12.0
  damping:      0.08
  pan:          disabled

LIGHTING
  ambient:      intensity 0.6, color #FFFFFF
  key light:    position (5, 8, 5), intensity 0.8, color #FFFFFF
  fill light:   position (-3, 4, -3), intensity 0.3, color #FFFFFF

ANIMATION
  default:      250ms ease-in-out cubic
  fast:         120ms
  slow:         500ms
  inter-move:   0ms

CANVAS
  home hero:    min(60vw, 60vh, 500px) square
  detail desktop: 50% width, max 500px, 1:1 ratio
  detail mobile:  full width, max 480px, 1:1 ratio
  min size:     280px
  background:   synced to DaisyUI --b1
```
