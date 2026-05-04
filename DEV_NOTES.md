# Portfolio V2 — Dev Notes

**Project**: Cyberpunk alley scene — personal portfolio  
**Stack**: React 19 + Vite + @react-three/fiber v9 + @react-three/drei v10 + THREE.js r165+  
**Dev server**: `npm run dev` → `localhost:5175`  
**Working directory**: `/Users/leon/Library/Mobile Documents/com~apple~CloudDocs/Development/portfolio-v2/`

---

## Scene Overview

A first-person cyberpunk alley viewed from outside (camera at Z=19 looking in). A DeLorean sits on the road. Clicking it opens a hologram UI with portfolio content.

Key world coordinates (after `alley.glb` scale=0.01 + position.y=+1.1):
- World bounds: X/Z ±8m, Y 0–10.7m
- Camera start: `[5, 6, 19]` → active: `[2, 3, 11]`
- Orbit target: `[0, 1.5, 2]`

---

## Component Map

| File | Purpose |
|------|---------|
| `Scene.jsx` | Root 3D scene, camera animation, lights |
| `Alley.jsx` | Loads `alley.glb`, merges overrides, renders `AlleyTextures` + `TexturePicker` |
| `AlleyTextures.jsx` | PBR texture pass on alley GLB meshes — receives `scene` + `meshOverrides` prop |
| `TexturePicker.jsx` | **DEV only** — click-to-assign texture workflow, Leva panel, Copy all output |
| `utils/alleyMaterials.js` | Single source of truth: `MESH_TEXTURE_OVERRIDES`, `TEXTURE_DEFS`, `PICKER_KEYS` |
| `Car.jsx` | DeLorean, clickable, activates hologram |
| `SceneDressing.jsx` | Props: neon sign, AC unit, cables, electrical boxes, graffiti, trash bags, Japanese sign, traffic cones, vending machine |
| `HologramUI.jsx` | Holographic portfolio windows, shown when car is active |
| `AlleyRadioSign.jsx` | Animated radio/music sign on the alley wall |
| `Rain.jsx` | LineSegments rain system with Leva controls |
| `PostFX.jsx` | Post-processing (bloom, etc.) |
| `TextureProof.jsx` | **DEBUG** — brick-textured plane at Z=15. Remove when done. |
| `AlleyColorTest.jsx` | **DEBUG** — orange paint test. Remove when done. |
| `RoadOverlay.jsx` | Unused (kept on disk, not imported) |
| `LaneMarkings.jsx` | Unused (kept on disk, not imported) |
| `Puddles.jsx` | Unused (kept on disk, not imported) |

---

## Architecture: Single Source of Truth for Mesh Textures

All per-mesh texture assignments live in `src/utils/alleyMaterials.js`:

```js
// Paste TexturePicker "Copy all" output here to persist assignments
export const MESH_TEXTURE_OVERRIDES = {
  "Building_Top_Building_Texture_2_0": "metal025",
  "Shop_Top_Building_Texture_2_0":     "metal025",
  "Storeftront_Roof001_Railing_0":     "metal027",
  "Cube026_Railing_0":                 "metal027",
  "Placeholder_Lamppost_Metal_0":      "woodPole",
  "Cube014_Material004_0":             "rust",
  "Cube014_Metal_0":                   "paintedMetal014",
  "Cube040_Concrete_0":                "smear",
}
```

`Alley.jsx` merges static overrides with live picker state at render time:
```js
const meshOverrides = { ...MESH_TEXTURE_OVERRIDES, ...pickerOverrides }
```
This means HMR changes to `MESH_TEXTURE_OVERRIDES` are always reflected without a full reload.

`AlleyTextures` receives `meshOverrides` as a prop and applies: **exact mesh override first**, category fallback second, original material if no match.

### TexturePicker workflow (DEV only)
1. Enable "▶ Enable (click mesh)" in Leva panel
2. Click a mesh → see its name, material, world bounds
3. Select texture key from dropdown → preview applied immediately
4. "Copy all" → paste JSON into `MESH_TEXTURE_OVERRIDES` in `alleyMaterials.js`

---

## Bug Fixed: HMR State Initialization

**The bug**: `useState(MESH_TEXTURE_OVERRIDES)` in Alley.jsx captured the initial empty `{}` when the app first loaded via HMR. Even after adding overrides to the const, React preserved the stale empty state — meshes fell back to category materials instead of showing overrides.

**The fix**: Split state so the static const is spread inline on every render, never captured in state:
```js
const [pickerOverrides, setPickerOverrides] = useState({})
const meshOverrides = { ...MESH_TEXTURE_OVERRIDES, ...pickerOverrides }
```

---

## Bug Fixed: isEmissive() False Positive

**The bug**: `isEmissive()` checked `m.emissiveIntensity > 0.5`. In Three.js, `MeshStandardMaterial.emissiveIntensity` defaults to `1` even when emissive color is black — so almost every mesh was treated as emissive and skipped.

**The fix**: `materialIsActuallyEmissive()` checks material name (window/lamp/neon/sign/etc.) OR actual non-black emissive color (`e.r/g/b > 0.01`). Same fix applied in `SceneDressing.jsx`.

Also fixed: `<Leva />` was never rendered in `App.jsx` — added `<Leva hidden={!import.meta.env.DEV} />`.

---

## Bug Fixed: useGLTF Cloning (Critical)

**The bug**: `AlleyTextures` called `useGLTF('/assets/alley.glb')` independently. In drei v10, this returns a **cloned scene per call** — material mutations had zero effect on what `Alley.jsx` rendered.

**The fix**: `AlleyTextures` no longer calls `useGLTF`. It receives `scene` as a prop from `Alley.jsx` which owns the single cloned instance.

---

## Bug Fixed: Global Texture Repeat Mutation

**The bug**: Setting `.repeat` directly on textures from `useTexture` mutated shared cached objects — all materials using the same texture folder got identical repeat values.

**The fix**: `buildMaterial()` in `AlleyTextures.jsx` clones every texture before setting repeat and colorSpace. Each material has fully independent texture instances.

---

## Texture Pass — Current State

### Texture folders in `public/assets/textures/`

```
plaster/           color, normal, rough
bricks/            color, normal, rough, ao
concrete020/       color, normal, rough
concrete-walk/     color, normal, rough
rubber/            color, normal, rough
painted-metal006/  color, normal, rough, metalness, ao
metal-trim/        color, normal, rough, metalness
corrugated-steel/  color, normal, rough, metalness, ao
wood015/           color, normal, rough
metal006/          color, normal, rough, metalness
metal025/          color, normal, rough, metalness
rust/              color, normal, rough, metalness
painted-metal014/  color, normal, rough, metalness, ao
smear/             color, normal, rough
asphalt/           color, normal, rough, ao         ← road, do not touch yet
imperfections/     color, normal, rough
metal-ac/          color, normal, rough, metalness  ← SceneDressing AcUnit
painted-metal-box/ color, normal, rough, metalness, ao ← SceneDressing ElectricalBoxes
concrete-right/    color, normal, rough             ← legacy, may be unused

public/assets/metal012/  color, normal, roughness, metalness  ← Car body ("roughness.jpg" not "rough.jpg")
```

### Category fallback mapping (AlleyTextures CATS array)

These apply by GLB material name when no exact mesh override exists:

| Category | GLB Material Name(s) | Texture Key | Debug Color |
|----------|---------------------|-------------|-------------|
| `walls` | `Building_Walls` | `plaster` | Purple `#aa00ff` |
| `roofCap` | `Building_Texture_2`, mesh `Plane__0` | `bricks` | Pink `#ff00cc` |
| `concrete` | `Concrete` | `concrete020` | Cyan `#00ffff` |
| `curb` | `Curb` | `concrete-walk` | Light blue `#00ccff` |
| `wires` | `Wires`, `Wires_2` | `rubber` | Green `#00ff44` |
| `railing` | `Railing`, `Metal027_2K-JPG` | `painted-metal006` | Yellow `#ffff00` |
| `metal` | `Metal`, `Door_Frame`, `wINDOW_bLINDS` | `metal-trim` | Grey `#cccccc` |
| `door` | `Metal_Door*` | `corrugated-steel` | Orange `#ff8800` |
| `pipes` | `Material002` | `metal006` | Blue `#aaaaff` |
| `lamppost` | mesh `Placeholder_Lamppost_Metal_0` | `wood015` | Brown `#cc8844` |
| `floorStrip` | `Material.001`–`.003` | `metal-trim` | Amber `#ffaa00` |
| `darkTrim` | `Material.004`–`.006` | `metal-trim` | Pink `#ff66cc` |

### Exact mesh overrides (MESH_TEXTURE_OVERRIDES — current)

| Mesh | Texture Key | Notes |
|------|-------------|-------|
| `Building_Top_Building_Texture_2_0` | `metal025` | Roof panel, Metal025 |
| `Shop_Top_Building_Texture_2_0` | `metal025` | Roof panel, Metal025 |
| `Storeftront_Roof001_Railing_0` | `metal027` | Roof railing — Metal027 (NOT PaintedMetal006) |
| `Cube026_Railing_0` | `metal027` | Roof railing — Metal027 |
| `Placeholder_Lamppost_Metal_0` | `woodPole` | Wood015 pole |
| `Cube014_Material004_0` | `rust` | Rust005 |
| `Cube014_Metal_0` | `paintedMetal014` | PaintedMetal014 |
| `Cube040_Concrete_0` | `smear` | Smear002 concrete wall |

### Emissive materials (protected, never overwritten)
- `Window_1` — intensity 2.5
- `Lamppost_Light` — intensity 4
- `Noen_Sign` — intensity 6

### Road meshes (protected by `isRoad` guard)
- `Floor_Asphalt_0` / mat `Asphalt`
- `Cube031_Road_0` / mat `Road`

---

## TEXTURE_DEFS keys

Picker-selectable keys (shown in TexturePicker dropdown via `PICKER_KEYS`):
`original`, `plaster`, `concrete`, `brick`, `darkMetal`, `metalTrim`, `rubber`, `corrugatedMetal`, `woodPole`

Named override keys (used in `MESH_TEXTURE_OVERRIDES`):
`metal025`, `metal027`, `woodPole`, `rust`, `paintedMetal014`, `smear`

Internal category keys (fallback only, not in picker):
`walls`, `roofCap`, `curb`, `wires`, `railing`, `metal`, `door`, `pipes`, `lamppost`, `floorStrip`, `darkTrim`

---

## Scene Lighting (Scene.jsx — current values)

```jsx
<ambientLight color="#3a2a50" intensity={4.0} />
<directionalLight position={[2, 20, 8]} intensity={0.8} color="#7799cc" />
<pointLight position={[-4, 3, 6]} color="#ff6600" intensity={3.0} distance={16} decay={2} />
<pointLight position={[ 4, 3, 6]} color="#ffaa00" intensity={3.0} distance={16} decay={2} />
<pointLight position={[ 0, 5, 5]} color="#00eeff" intensity={2.5} distance={18} decay={2} />
<pointLight position={[ 0, 8, 2]} color="#aa44ff" intensity={2.0} distance={14} decay={2} />
<pointLight position={[0, 9, 6]}  color="#ffcc66" intensity={2.5} distance={22} decay={2} />
```

Car active adds: two red rear lights + one blue flux light.

---

## What's Pending

1. **Road/asphalt** — `Floor_Asphalt_0` / `Cube031_Road_0`. Deferred — lane markings need preserving.
2. **Puddles** — `Puddles.jsx` exists but not imported. Re-add after road work.
3. **Uncategorized meshes** — Use `uncatDebug` toggle in AlleyTextures Leva panel (hot-pink = uncategorized). `floorStrip` / `darkTrim` material names `Material.001`–`.006` (with dot) are guesses — verify with uncatDebug.
4. **Debug components** — `TextureProof.jsx` and `AlleyColorTest.jsx` are still imported/rendered. Remove before shipping.
5. **More picker assignments** — Many meshes likely still on category fallback or original material.

---

## SceneDressing Props — PBR Status

| Prop | Texture | Notes |
|------|---------|-------|
| OpenSign | none | Emissive orange neon `#ff6633`, intensity 5 |
| ElectricalBoxes | `painted-metal-box/` | Dark green `#3a4a3a`, metallic |
| Cables | `rubber/` | Near-black `#1a1a1a` |
| AcUnit | `metal-ac/` | Silver `#c0c0b8`, metallic |
| Graffiti | none | Decal — keep original |
| GarbageBags | none | Keep original |
| JapaneseSign | none | Animated, keep original |
| TrafficCone | none | Keep original |
| VendingMachine | none | Keep original |

---

## Rain

`Rain.jsx` — `THREE.LineSegments` with `BufferGeometry`. Leva controls:
- `rainEnabled`, `rainCount` (650), `rainOpacity` (0.16), `rainSpeed` (9.0), `rainSlant` (0.07)
- Color: `#d9e6ff`, `depthWrite: false`

---

## Ruflo MCP

Ruflo was not connected. Fixed by running:
```bash
claude mcp add ruflo -- npx -y ruflo@latest mcp start
```
Registered in `/Users/leon/.claude.json` (project-local config). Restart Claude Code for MCP tools (`memory_store`, `memory_search`, `hooks_route`, etc.) to be available.

Daemon was already running (PID 30920). Memory DB at `.swarm/memory.db`.

---

## Useful Commands

```bash
# Dev server
cd "/Users/leon/Library/Mobile Documents/com~apple~CloudDocs/Development/portfolio-v2"
npm run dev

# Kill stale servers
lsof -iTCP -sTCP:LISTEN -P | grep node

# Check ruflo
claude mcp list
npx @claude-flow/cli@latest doctor
```
