# WIP

## Stack

- **React 19** + **Vite**
- **@react-three/fiber v9** + **@react-three/drei v10**
- **THREE.js r165+**
- Post-processing via `@react-three/postprocessing`

## Dev

```bash
npm install
npm run dev      # localhost:5175
npm run build
```

## Architecture

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
