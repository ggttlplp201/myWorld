# myWorld — Cyberpunk Portfolio (WIP)

> **Work in progress** — active development, not yet production-ready.

An interactive 3D personal portfolio built as a first-person cyberpunk alley scene. A DeLorean sits on the road — click it to open a holographic UI with portfolio content.

## Stack

- **React 19** + **Vite**
- **@react-three/fiber v9** + **@react-three/drei v10**
- **THREE.js r165+**
- Post-processing via `@react-three/postprocessing`

## Scene

- First-person cyberpunk alley viewed from outside (camera at Z=19 looking in)
- Custom PBR texture pass on alley GLB meshes
- Dynamic rain system, neon lighting, scene dressing (AC unit, cables, signage, vending machine, traffic cones, graffiti)
- Animated radio sign on the alley wall
- Clickable DeLorean → hologram portfolio UI
- Bloom + post-processing stack

## Dev

```bash
npm install
npm run dev      # localhost:5175
npm run build
```

## Architecture

All per-mesh texture assignments live in a single source of truth:

```
src/utils/alleyMaterials.js   — MESH_TEXTURE_OVERRIDES, TEXTURE_DEFS, PICKER_KEYS
src/components/Scene.jsx      — Root 3D scene, camera animation, lights
src/components/Alley.jsx      — Loads alley.glb, merges texture overrides
src/components/AlleyTextures.jsx — PBR texture pass on alley meshes
src/components/Car.jsx        — DeLorean, clickable, activates hologram
src/components/HologramUI.jsx — Holographic portfolio windows
src/components/SceneDressing.jsx — Props: neon, AC, cables, signs, cones, etc.
src/components/Rain.jsx       — LineSegments rain with Leva controls
src/components/PostFX.jsx     — Post-processing (bloom, etc.)
```

## What's Pending

- [ ] Road/asphalt texture pass (lane markings need preserving first)
- [ ] Puddles (`Puddles.jsx` exists, not yet wired in)
- [ ] Verify uncategorized meshes via `uncatDebug` Leva toggle
- [ ] Remove debug components (`TextureProof.jsx`, `AlleyColorTest.jsx`) before shipping
- [ ] More TexturePicker mesh assignments
- [ ] Portfolio content in HologramUI
