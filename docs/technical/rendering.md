# 3D Rendering

This document describes the Three.js rendering layer for the 3D Rubik's cube visualization. All rendering code lives in `src/lib/three/`.

## Architecture Overview

The rendering layer is a set of plain TypeScript classes that manage a Three.js scene. They are **not** Svelte components — they are imperative objects instantiated inside `onMount` of the `CubeViewer.svelte` component.

```
CubeScene (owns the scene, camera, renderer)
├── CubeMesh (builds and manages the 26 cubies)
├── CubeAnimator (handles face-turn animations)
└── OrbitControls (user camera rotation)
```

## CubeScene

The main entry point for the 3D scene.

### Constructor

Takes an `HTMLCanvasElement` and sets up:

- `THREE.Scene` with a background color (read from DaisyUI CSS variables)
- `THREE.PerspectiveCamera` positioned at `(3.5, 3.0, 3.5)` looking at the origin — a 3/4 angle that biases slightly toward the U face for OLL readability
- `THREE.WebGLRenderer` bound to the provided canvas, with antialiasing enabled
- Ambient light + two directional lights (key + fill) for clean, shadow-free illumination that keeps all faces readable from any orbit angle
- `OrbitControls` for user-controlled camera rotation

### Methods

- `resize(width: number, height: number)` — Updates camera aspect ratio and renderer size. Called by `ResizeObserver`.
- `render()` — Called on each `requestAnimationFrame`. Updates controls, renders the scene.
- `dispose()` — Cleans up all Three.js resources. Called on `onDestroy`.
- `setBackgroundColor(color: string)` — Updates the scene background to match the current theme.

## CubeMesh

Builds the visual representation of the Rubik's cube.

### Construction

A 3x3x3 grid of cubies, 26 in total (the invisible center cube is omitted). Each cubie is a `THREE.Group` containing:

1. **Body**: A slightly rounded `BoxGeometry` with black material (the plastic body of the cubie)
2. **Stickers**: Colored `PlaneGeometry` faces offset slightly outward from the body. Only the externally visible faces have stickers (a corner has 3, an edge has 2, a center has 1).

### Cubie Positions

Cubies are placed at integer coordinates from -1 to 1:

- Corner at `(1, 1, 1)` = URF corner (Up-Right-Front)
- Edge at `(0, 1, 1)` = UF edge (Up-Front)
- Center at `(0, 1, 0)` = U center (Up)

### Color Mapping

The `updateColors(state: number[54])` method maps the 54-element state array to sticker materials:

- Each sticker mesh knows its position on the cube (which face, which index)
- The method reads the color value from the state array and sets the material color accordingly

### Face Grouping

`getFaceCubies(face: Face): THREE.Object3D[]` returns the 9 cubies on a given face. Used by the animator to group cubies for rotation. A cubie "belongs to" a face based on its position:

- U face: all cubies with `y === 1`
- R face: all cubies with `x === 1`
- F face: all cubies with `z === 1`
- etc.

## CubeAnimator

Handles smooth face-turn animations.

### Animation Strategy

When a move is requested:

1. **Identify cubies**: Use `getFaceCubies()` to get the 9 cubies on the turning face.
2. **Create turn group**: Create a temporary `THREE.Group` at the origin. Reparent the 9 cubies into this group.
3. **Tween rotation**: Animate the group's rotation around the appropriate axis. "Clockwise" is always defined as **looking at the face from the outside of the cube** (the standard Rubik's cube convention):

   | Face | Axis | Clockwise direction (looking at face) | Angle sign                 |
   | ---- | ---- | ------------------------------------- | -------------------------- |
   | U    | Y    | Looking down at the top → CW          | -90° (negative Y rotation) |
   | D    | Y    | Looking up at the bottom → CW         | +90° (positive Y rotation) |
   | R    | X    | Looking at the right side → CW        | -90° (negative X rotation) |
   | L    | X    | Looking at the left side → CW         | +90° (positive X rotation) |
   | F    | Z    | Looking at the front → CW             | -90° (negative Z rotation) |
   | B    | Z    | Looking at the back → CW              | +90° (positive Z rotation) |

   Counter-clockwise (prime moves) reverse the sign. Double moves use ±180° (sign doesn't matter for 180°).

4. **Complete**: When the animation finishes (~300ms):
   - Reparent cubies back to the scene root
   - **Reset all cubie transforms** to their canonical grid positions
   - Call `updateColors()` with the new logical state

#### Scene Graph Reparenting (Visual)

The reparenting strategy during animation, shown as three scene graph snapshots:

```
BEFORE (idle)              DURING (animating R)         AFTER (complete)

Scene                      Scene                        Scene
├── cubie(1,1,1)           ├── cubie(1,1,-1)            ├── cubie(1,1,1)   ← reset
├── cubie(1,1,0)           ├── cubie(1,-1,-1)           ├── cubie(1,1,0)     transforms
├── cubie(1,1,-1)          ├── ...                      ├── cubie(1,1,-1)    + recolor
├── cubie(1,0,1)           ├── (17 other cubies)        ├── cubie(1,0,1)
├── cubie(1,0,0)           │                            ├── cubie(1,0,0)
├── cubie(1,0,-1)          └── TurnGroup (temp)         ├── cubie(1,0,-1)
├── cubie(1,-1,1)              │ rotation: -90° X       ├── cubie(1,-1,1)
├── cubie(1,-1,0)              ├── cubie(1,1,1)         ├── cubie(1,-1,0)
├── cubie(1,-1,-1)             ├── cubie(1,1,0)         ├── cubie(1,-1,-1)
├── ... (17 others)            ├── cubie(1,1,-1)        ├── ... (17 others)
                               ├── cubie(1,0,1)
                               ├── cubie(1,0,0)
                               ├── cubie(1,0,-1)
                               ├── cubie(1,-1,1)
                               ├── cubie(1,-1,0)
                               └── cubie(1,-1,-1)
```

The 9 cubies with `x === 1` are reparented into a temporary `TurnGroup`. The group rotates around the X axis. On completion, cubies return to the scene root with canonical transforms, and colors are updated from the logical state.

### Drift Prevention (Critical)

**Never accumulate cubie rotations across multiple moves.**

After each animation completes, every cubie's position and rotation are reset to their canonical values (integer positions, identity rotation). The visual state is then reconstructed purely from the logical `number[54]` state array via `updateColors()`.

This prevents floating-point drift that would cause cubies to gradually misalign after many moves. The logical state is always the source of truth.

### Animation Timing

Speed levels (from `ANIMATION_DURATION` in `CubeAnimator.ts`):

| Speed | Duration | Use |
|-------|----------|-----|
| `default` | 250ms | Normal playback |
| `fast` | 120ms | Experienced users scanning algorithms |
| `slow` | 500ms | Beginners studying individual moves |

Easing: Ease-in-out cubic. No external tween library — the easing function is a 5-line inline implementation.

Inter-move delay: 0ms. The ease-in-out curve creates a natural pause at the start/end of each move.

### Sequential Animation

`CubeAnimator` uses an internal move queue and a state machine (see Animation State Machine below). Calls to `play()` drain `moveQueue` one move at a time via `playNext()`. The caller does not manage an `async/await` loop — the animator handles sequencing internally.

`CubeViewer` uses `animator.play()` / `animator.pause()` / `animator.step()` / `animator.reset()`. The animator's `AnimationState` (`'idle' | 'animating' | 'paused'`) is the source of truth for playback status.

`animate(move)` is still available as a one-shot imperative call that returns a `Promise<void>`. Use it only when animating a single move outside the queue context.

### Animation Interruption

If the user triggers a new action while an animation is in progress (e.g., loading a new algorithm, clicking step-forward rapidly, or pressing reset mid-playback):

1. **New algorithm loaded**: Cancel the current animation immediately. Snap the in-progress move to its final state (apply the remaining rotation instantly, then reset transforms and update colors). Then load the new algorithm's initial state.

2. **Step during playback**: Pause auto-playback. If a move is mid-animation, let it finish (do not cancel), then do not advance to the next move automatically.

3. **Reset during playback**: Cancel the current animation. Snap cubies to canonical positions. Restore the initial unsolved state. Clear playback history.

4. **Rapid step-forward clicks**: Queue the next step. If an animation is already running, wait for it to complete before starting the next. Do not skip animations — each move should be visually shown, even if briefly.

The key invariant: **the logical cube state and the visual state must always agree after any animation completes or is cancelled**. If an animation is cancelled mid-tween, snap the logical state forward (apply the move) and reset cubie transforms to match.

#### Implementation note: TurnGroup tagging

`cancelAndSnap()` in `CubeAnimator` locates in-flight TurnGroups by scanning the scene for objects with `userData['isTurnGroup'] === true`. The `animateMove()` method **must** set this flag on every TurnGroup it creates:

```typescript
const turnGroup = new THREE.Group();
turnGroup.userData['isTurnGroup'] = true; // required for cancelAndSnap detection
this.scene.add(turnGroup);
```

Without this flag, `cancelAndSnap` cannot find or clean up TurnGroups and cancellation will silently fail (cubies left orphaned inside the unremoved group). This is a known gap that must be fixed before cancellation is exercised in production.

### Animation State Machine

![Animation State Machine](images/animation-state-machine.svg)

> Source: `diagrams/animation-state-machine.d2`

**States:** Idle, Animating, Paused

**Transitions:**

- `[start]` --> Idle
- Idle --> Animating: play / step
- Animating --> Idle: last move done
- Animating --> Animating: move done, more queued
- Animating --> Paused: pause
- Animating --> Idle: reset
- Animating --> Idle: new algorithm
- Paused --> Animating: play / step
- Paused --> Idle: reset
- Paused --> Idle: new algorithm

When transitioning out of Animating via reset or new algorithm, the in-progress animation is snapped to completion (rotation applied instantly, transforms reset, colors updated) before the state change takes effect.

## OrbitControls

Wraps `THREE.OrbitControls` (`src/lib/three/controls.ts`) with these settings:

- **Damping**: Enabled, factor `0.08` (smooth but not floaty)
- **Auto-rotate**: Disabled by default (could be enabled on the home page hero as a future enhancement)
- **Zoom limits**: Min distance `4.0`, max distance `12.0`
- **Pan**: Disabled — the cube stays centered
- **Zoom**: Enabled (scroll wheel / pinch)

## Canvas Integration

### Mounting

`CubeViewer.svelte` creates a `<canvas>` element and passes it to `CubeScene` in `onMount`:

```svelte
<script>
  let canvas: HTMLCanvasElement;
  let scene: CubeScene;

  onMount(() => {
    scene = new CubeScene(canvas);
    return () => scene.dispose();
  });
</script>

<canvas bind:this={canvas}></canvas>
```

### Resizing

A `ResizeObserver` watches the canvas container and calls `scene.resize()` on size changes. This is more reliable than `window.resize` events, especially in flex/grid layouts.

### Theme-Aware Background

When the theme changes (dark ↔ light), read the DaisyUI `--b1` CSS variable from the DOM, resolve it to an `rgb(...)` string via a temporary element, and pass it to `scene.setBackgroundColor()`. See `theme-integration.md` for the correct resolution pattern — passing the raw `--b1` value directly to `THREE.Color` does not work because DaisyUI 5 stores values as bare oklch channels.

## Performance

The cube is lightweight for Three.js:

- 26 cubies × ~4 faces each = ~104 meshes
- Well under 200 draw calls — no optimization needed
- `requestAnimationFrame` loop should stop rendering when the tab is not visible (check `document.hidden`)
