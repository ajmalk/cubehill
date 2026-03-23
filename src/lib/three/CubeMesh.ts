/**
 * CubeMesh.ts
 *
 * Builds the visual 3D representation of the Rubik's cube: 26 cubies on a
 * 3×3×3 integer grid (the invisible centre cubie is omitted).
 *
 * Each cubie is a THREE.Group containing:
 * - A BoxGeometry body (dark plastic, 0.85 units)
 * - Up to 3 PlaneGeometry sticker faces (coloured, 0.79 units, offset 0.001 outward)
 *
 * State array → sticker mapping is derived from the cube engine's index layout.
 * See docs/technical/cube-engine.md for the full index layout.
 *
 * See docs/technical/rendering.md and designs/phase3-rendering-parameters.md.
 */

import * as THREE from 'three';
import type { FaceMove } from '$lib/cube/types.js';

// ---------------------------------------------------------------------------
// Design constants (from designs/phase3-rendering-parameters.md)
// ---------------------------------------------------------------------------

const BODY_SIZE = 0.85;
const BODY_COLOR = 0x1a1a1a;
const BODY_ROUGHNESS = 0.85;

const STICKER_SIZE = 0.79;
const STICKER_OFFSET = 0.001; // outward from body surface to prevent z-fighting
const STICKER_ROUGHNESS = 0.4;

/**
 * Screen-optimised sticker colours (Tailwind-aligned).
 * Overrides the engine's COLOR_HEX which targets physical cube rendering.
 */
const STICKER_COLOR: Record<number, number> = {
  0: 0xffffff, // White  (U)
  1: 0xdc2626, // Red    (R) — Tailwind red-600
  2: 0x16a34a, // Green  (F) — Tailwind green-600
  3: 0xfacc15, // Yellow (D) — Tailwind yellow-400
  4: 0xf97316, // Orange (L) — Tailwind orange-500
  5: 0x2563eb, // Blue   (B) — Tailwind blue-600
};

// ---------------------------------------------------------------------------
// Sticker index → cubie position mapping
//
// Derived from cube engine cycle analysis. Each state index maps to a cubie
// position (gx, gy, gz) ∈ {-1, 0, 1}³ and a face normal direction.
//
// Formulae (i = face-local index 0–8):
//   U (state[0..8]):   gx=(i%3)-1, gy= 1, gz=1-⌊i/3⌋  — normal +y
//   R (state[9..17]):  gx= 1, gy=1-⌊i/3⌋, gz=1-(i%3)  — normal +x
//   F (state[18..26]): gx=(i%3)-1, gy=1-⌊i/3⌋, gz= 1  — normal +z
//   D (state[27..35]): gx=(i%3)-1, gy=-1, gz=1-⌊i/3⌋  — normal -y
//   L (state[36..44]): gx=-1, gy=1-⌊i/3⌋, gz=1-(i%3)  — normal -x
//   B (state[45..53]): gx=(i%3)-1, gy=1-⌊i/3⌋, gz=-1  — normal -z
// ---------------------------------------------------------------------------

interface StickerInfo {
  /** Cubie grid position. */
  gx: number;
  gy: number;
  gz: number;
  /** Normal axis: 'x', 'y', or 'z'. */
  axis: 'x' | 'y' | 'z';
  /** Normal sign: +1 or -1. */
  sign: number;
}

function stickerInfoForStateIndex(stateIdx: number): StickerInfo {
  if (stateIdx < 9) {
    const i = stateIdx;
    return {
      gx: (i % 3) - 1,
      gy: 1,
      gz: 1 - Math.floor(i / 3),
      axis: 'y',
      sign: 1,
    };
  } else if (stateIdx < 18) {
    const i = stateIdx - 9;
    return {
      gx: 1,
      gy: 1 - Math.floor(i / 3),
      gz: 1 - (i % 3),
      axis: 'x',
      sign: 1,
    };
  } else if (stateIdx < 27) {
    const i = stateIdx - 18;
    return {
      gx: (i % 3) - 1,
      gy: 1 - Math.floor(i / 3),
      gz: 1,
      axis: 'z',
      sign: 1,
    };
  } else if (stateIdx < 36) {
    const i = stateIdx - 27;
    return {
      gx: (i % 3) - 1,
      gy: -1,
      gz: 1 - Math.floor(i / 3),
      axis: 'y',
      sign: -1,
    };
  } else if (stateIdx < 45) {
    const i = stateIdx - 36;
    return {
      gx: -1,
      gy: 1 - Math.floor(i / 3),
      gz: 1 - (i % 3),
      axis: 'x',
      sign: -1,
    };
  } else {
    const i = stateIdx - 45;
    return {
      gx: (i % 3) - 1,
      gy: 1 - Math.floor(i / 3),
      gz: -1,
      axis: 'z',
      sign: -1,
    };
  }
}

// ---------------------------------------------------------------------------
// CubieData — internal record tracking each cubie
// ---------------------------------------------------------------------------

interface StickerRecord {
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  stateIndex: number;
}

interface CubieData {
  group: THREE.Group;
  /** Canonical grid position (integer -1, 0, 1). */
  gx: number;
  gy: number;
  gz: number;
  stickers: StickerRecord[];
}

// ---------------------------------------------------------------------------
// CubeMesh
// ---------------------------------------------------------------------------

export class CubeMesh {
  private readonly scene: THREE.Scene;
  private readonly cubies: CubieData[] = [];
  /** Maps cubie key "(gx,gy,gz)" → CubieData for fast lookup. */
  private readonly cubieByKey: Map<string, CubieData> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.buildCubies();
  }

  // -------------------------------------------------------------------------
  // Build
  // -------------------------------------------------------------------------

  private buildCubies(): void {
    // Build a reverse map: cubie key → sticker state indices
    const cubieStickers = new Map<string, number[]>();
    for (let idx = 0; idx < 54; idx++) {
      const info = stickerInfoForStateIndex(idx);
      const key = `${info.gx},${info.gy},${info.gz}`;
      if (!cubieStickers.has(key)) cubieStickers.set(key, []);
      cubieStickers.get(key)!.push(idx);
    }

    // Create each cubie
    for (let gx = -1; gx <= 1; gx++) {
      for (let gy = -1; gy <= 1; gy++) {
        for (let gz = -1; gz <= 1; gz++) {
          // Skip the invisible centre cubie
          if (gx === 0 && gy === 0 && gz === 0) continue;

          const key = `${gx},${gy},${gz}`;
          const stateIndices = cubieStickers.get(key) ?? [];
          const cubie = this.createCubie(gx, gy, gz, stateIndices);
          this.cubies.push(cubie);
          this.cubieByKey.set(key, cubie);
          this.scene.add(cubie.group);
        }
      }
    }
  }

  private createCubie(gx: number, gy: number, gz: number, stateIndices: number[]): CubieData {
    const group = new THREE.Group();
    group.position.set(gx, gy, gz);

    // --- Body ---
    const bodyGeo = new THREE.BoxGeometry(BODY_SIZE, BODY_SIZE, BODY_SIZE);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: BODY_COLOR,
      roughness: BODY_ROUGHNESS,
      metalness: 0,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(bodyMesh);

    // --- Stickers ---
    const stickers: StickerRecord[] = [];
    for (const stateIdx of stateIndices) {
      const info = stickerInfoForStateIndex(stateIdx);
      const stickerRecord = this.createSticker(info);
      group.add(stickerRecord.mesh);
      stickers.push({ ...stickerRecord, stateIndex: stateIdx });
    }

    return { group, gx, gy, gz, stickers };
  }

  private createSticker(info: StickerInfo): Omit<StickerRecord, 'stateIndex'> {
    const geo = new THREE.PlaneGeometry(STICKER_SIZE, STICKER_SIZE);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff, // placeholder; set by updateColors()
      roughness: STICKER_ROUGHNESS,
      metalness: 0,
      side: THREE.FrontSide,
    });
    const mesh = new THREE.Mesh(geo, material);

    // Position and orient the sticker plane on the correct face
    const offset = BODY_SIZE / 2 + STICKER_OFFSET;
    if (info.axis === 'x') {
      mesh.position.set(info.sign * offset, 0, 0);
      mesh.rotation.y = info.sign > 0 ? Math.PI / 2 : -Math.PI / 2;
    } else if (info.axis === 'y') {
      mesh.position.set(0, info.sign * offset, 0);
      mesh.rotation.x = info.sign > 0 ? -Math.PI / 2 : Math.PI / 2;
    } else {
      // z
      mesh.position.set(0, 0, info.sign * offset);
      if (info.sign < 0) {
        mesh.rotation.y = Math.PI;
      }
      // sign > 0: no rotation needed for +z face
    }

    return { mesh, material };
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Map a state array to sticker materials.
   * Call this after any logical state change.
   */
  updateColors(state: number[]): void {
    for (const cubie of this.cubies) {
      for (const sticker of cubie.stickers) {
        const colorIndex = state[sticker.stateIndex];
        const hex = STICKER_COLOR[colorIndex] ?? 0xffffff;
        sticker.material.color.setHex(hex);
      }
    }
  }

  /**
   * Return the 9 cubies on the given face (by cubie grid position).
   * U face = gy===1, D = gy===-1, R = gx===1, L = gx===-1, F = gz===1, B = gz===-1.
   */
  getFaceCubies(face: FaceMove): THREE.Group[] {
    const groups: THREE.Group[] = [];
    for (const cubie of this.cubies) {
      if (this.cubieOnFace(cubie, face)) {
        groups.push(cubie.group);
      }
    }
    return groups;
  }

  private cubieOnFace(cubie: CubieData, face: FaceMove): boolean {
    switch (face) {
      case 'U':
        return cubie.gy === 1;
      case 'D':
        return cubie.gy === -1;
      case 'R':
        return cubie.gx === 1;
      case 'L':
        return cubie.gx === -1;
      case 'F':
        return cubie.gz === 1;
      case 'B':
        return cubie.gz === -1;
    }
  }

  /**
   * Reset every cubie's position and rotation to canonical values.
   * Call this after each animation completes to prevent floating-point drift.
   * Then immediately call updateColors() with the new logical state.
   */
  resetTransforms(): void {
    for (const cubie of this.cubies) {
      cubie.group.position.set(cubie.gx, cubie.gy, cubie.gz);
      cubie.group.rotation.set(0, 0, 0);
      cubie.group.quaternion.identity();
    }
  }

  /**
   * Clean up all geometries and materials.
   */
  dispose(): void {
    for (const cubie of this.cubies) {
      // Dispose body
      const body = cubie.group.children[0] as THREE.Mesh;
      body.geometry.dispose();
      (body.material as THREE.Material).dispose();

      // Dispose stickers
      for (const sticker of cubie.stickers) {
        sticker.mesh.geometry.dispose();
        sticker.material.dispose();
      }

      this.scene.remove(cubie.group);
    }
    this.cubies.length = 0;
    this.cubieByKey.clear();
  }
}
