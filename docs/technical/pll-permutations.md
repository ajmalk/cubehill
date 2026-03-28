# PLL Permutation Reference

Verified pure PLL state permutations — what you see on the cube before solving.

## Grid

```
0(UBL) | 1(UB)  | 2(UBR)
3(UL)  |   .    | 5(UR)
6(UFL) | 7(UF)  | 8(UFR)
```

Array format: `[pos0, pos1, pos2, pos3, pos5, pos6, pos7, pos8]`
Identity (solved): `[0, 1, 2, 3, 5, 6, 7, 8]`

Convention: "slot filled from" — value at index i means position i has the piece from that position.

## U rotation (clockwise from above)

Corners: 0→6→8→2→0, Edges: 1→3→7→5→1
U_PERM = `[2, 5, 8, 1, 7, 0, 3, 6]`

## All 21 States

### Edges Only

| Case | Cycle | Permutation | Prob |
|------|-------|-------------|------|
| Ua | (1,5,7) | `[0, 7, 2, 3, 1, 6, 5, 8]` | 1/18 |
| Ub | (1,7,5) | `[0, 5, 2, 3, 7, 6, 1, 8]` | 1/18 |
| H | (1↔7)(3↔5) | `[0, 7, 2, 5, 3, 6, 1, 8]` | 1/72 |
| Z | (1↔5)(3↔7) | `[0, 5, 2, 7, 1, 6, 3, 8]` | 1/36 |

### Corners Only

| Case | Cycle | Permutation | Prob |
|------|-------|-------------|------|
| Aa | (0,8,2) | `[8, 1, 0, 3, 5, 6, 7, 2]` | 1/18 |
| Ab | (0,2,8) | `[2, 1, 8, 3, 5, 6, 7, 0]` | 1/18 |
| E | (0↔2)(6↔8) | `[2, 1, 0, 3, 5, 8, 7, 6]` | 1/36 |

### Adjacent Corner Swaps

| Case | Cycle | Permutation | Prob |
|------|-------|-------------|------|
| T | (2↔8)(3↔5) | `[0, 1, 8, 5, 3, 6, 7, 2]` | 1/18 |
| F | (2↔8)(1↔7) | `[0, 7, 8, 3, 5, 6, 1, 2]` | 1/18 |
| Ja | (0↔2)(1↔3) | `[2, 3, 0, 1, 5, 6, 7, 8]` | 1/18 |
| Jb | (2↔8)(5↔7) | `[0, 1, 8, 3, 7, 6, 5, 2]` | 1/18 |
| Ra | (2↔8)(1↔3) | `[0, 3, 8, 1, 5, 6, 7, 2]` | 1/18 |
| Rb | (0↔2)(5↔7) | `[2, 1, 0, 3, 7, 6, 5, 8]` | 1/18 |

### Diagonal Corner Swaps

| Case | Cycle | Permutation | Prob |
|------|-------|-------------|------|
| Y | (0↔8)(1↔3) | `[8, 3, 2, 1, 5, 6, 7, 0]` | 1/18 |
| V | (0↔8)(1↔5) | `[8, 5, 2, 3, 1, 6, 7, 0]` | 1/18 |
| Na | (2↔6)(3↔5) | `[0, 1, 6, 5, 3, 2, 7, 8]` | 1/36 |
| Nb | (0↔8)(3↔5) | `[8, 1, 2, 5, 3, 6, 7, 0]` | 1/36 |

### G Perms (3-cycle pairs)

States shown (inverse of algorithm effect).

| Case | Corner cycle | Edge cycle | Permutation | Prob |
|------|-------------|------------|-------------|------|
| Ga | (0,6,2) | (1,5,3) | `[2, 3, 6, 5, 1, 0, 7, 8]` | 1/18 |
| Gb | (0,2,6) | (1,3,5) | `[6, 5, 0, 1, 3, 2, 7, 8]` | 1/18 |
| Gc | (0,8,6) | (3,7,5) | `[6, 1, 2, 5, 7, 8, 3, 0]` | 1/18 |
| Gd | (0,6,2) | (1,7,3) | `[2, 3, 6, 7, 5, 0, 1, 8]` | 1/18 |

## Visual Reference

Each number shows "this slot has the piece from position [number]". Dot = piece is home.

```
── EDGES ONLY ──────────────────────────

Ua:  .  | 7  | .        Ub:  .  | 5  | .
     .  |    | 1             .  |    | 7
     .  | 5  | .             .  | 1  | .

H:   .  | 7  | .        Z:   .  | 5  | .
     5  |    | 3             7  |    | 1
     .  | 1  | .             .  | 3  | .

── CORNERS ONLY ────────────────────────

Aa:  8  | .  | 0        Ab:  2  | .  | 8
     .  |    | .             .  |    | .
     .  | .  | 2             .  | .  | 0

E:   2  | .  | 0
     .  |    | .
     8  | .  | 6

── ADJACENT CORNER SWAPS ───────────────

T:   .  | .  | 8        F:   .  | 7  | 8
     5  |    | 3             .  |    | .
     .  | .  | 2             .  | 1  | 2

Ja:  2  | 3  | 0        Jb:  .  | .  | 8
     1  |    | .             .  |    | 7
     .  | .  | .             .  | 5  | 2

Ra:  .  | 3  | 8        Rb:  2  | .  | 0
     1  |    | .             .  |    | 7
     .  | .  | 2             .  | 5  | .

── DIAGONAL CORNER SWAPS ───────────────

Y:   8  | 3  | .        V:   8  | 5  | .
     1  |    | .             .  |    | 1
     .  | .  | 0             .  | .  | 0

Na:  .  | .  | 6        Nb:  8  | .  | .
     5  |    | 3             5  |    | 3
     2  | .  | .             .  | .  | 0

── G PERMS ─────────────────────────────

Ga:  2  | 3  | 6        Gb:  6  | 5  | 0
     5  |    | 1             1  |    | 3
     0  | .  | .             2  | .  | .

Gc:  6  | .  | .        Gd:  2  | 3  | 6
     5  |    | 7             7  |    | .
     8  | 3  | 0             0  | 1  | .
```

## Notes

- Permutations are STATES (what you see), not algorithm effects
- Algorithm effect = `invertPerm(state)` (since applying the alg to the state gives solved)
- For 2-cycle cases (swaps), state = algorithm effect (self-inverse)
- For 3-cycle cases, state and algorithm effect have reversed cycle direction
- Na/Nb probability is 1/36 (2-fold U2 symmetry), not 1/72
