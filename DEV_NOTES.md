# Portfolio V2 — Dev Notes

**Project**: Cyberpunk alley scene — personal portfolio  
**Stack**: React 19 + Vite + @react-three/fiber v9 + @react-three/drei v10 + THREE.js r184 + @react-three/postprocessing v3.0.4 + Leva  
**Dev server**: `npm run dev` → `localhost:5175`

---

## Project Goal

First-person cyberpunk alley viewed from outside (camera at Z=19 looking in). A DeLorean sits on the road. Clicking it opens a hologram UI with portfolio content (about, projects, resume, contact).

**World coordinates** (after `alley.glb` scale=0.01 + position.y=+1.1):
- Alley bounds: X/Z ±8m, Y 0–10.7m
- Camera start: `[5, 6, 19]` → orbit target `[0, 1.5, 2]`
- Car world center: `[0.3, 0.6, 5.7]` — front Z≈3.97, rear Z≈7.41, road Y≈0, car roof Y≈3.6

---

## Component Map

| File | Purpose |
|------|---------|
| `Scene.jsx` | Root 3D scene, lights, OrbitControls, camera init, EnvMap |
| `Alley.jsx` | Loads `alley.glb`, merges overrides, renders `AlleyTextures` + `TexturePicker` |
| `AlleyTextures.jsx` | PBR texture pass on alley GLB meshes — receives `scene` + `meshOverrides` as props |
| `TexturePicker.jsx` | **DEV only** — click-to-assign texture workflow; "Copy all" → paste into `MESH_TEXTURE_OVERRIDES` |
| `utils/alleyMaterials.js` | Single source of truth: `MESH_TEXTURE_OVERRIDES`, `TEXTURE_DEFS`, `PICKER_KEYS` |
| `Car.jsx` | DeLorean GLB — `classifyCarPart()` maps GLB material names to named material slots |
| `SceneDressing.jsx` | Props: neon sign, AC unit, cables, electrical boxes, graffiti, trash bags, Japanese sign, traffic cones, vending machine |
| `HologramUI.jsx` | Html overlay at `[0,3.5,9]` — portfolio sections |
| `PortfolioWindow.jsx` | Four sections: about, projects, resume, contact (**contact/resume are placeholders**) |
| `AlleyRadioSign.jsx` | Music panel on alley wall; debug via `?signplace` |
| `Rain.jsx` | LineSegments rain with Leva controls |
| `ManholeSteam.jsx` | Steam effect — currently `showSteam={false}` in Scene.jsx |
| `PostFX.jsx` | Bloom (luminanceThreshold 0.65, intensity 0.8, mipmapBlur) + Vignette |
| `Puddles.jsx` | Unused — re-add after road texture work |

**URL debug modes**: `?debug` → DebugViewer, `?place` → CarPlacer, `?signplace` → AlleyRadioSignHUD

---

## Car Material System (`Car.jsx`)

The car uses a **classification-by-material-name** approach — no heuristics, no color thresholds.

### `classifyCarPart(materialName)` — confirmed GLB material name mapping

| GLB material name | Part slot | Material type |
|---|---|---|
| `delorean` | `body` | MeshPhysical — warm silver stainless |
| `sides` | `darkBody` | MeshPhysical — dark lower panels |
| `window`, `windshield` | `glass` | MeshPhysical — smoked glass |
| `wheels` | `tire` | MeshStandard — black rubber |
| `wheels_2` | `wheelMetal` | MeshStandard — wheel metal |
| `cooler`, `metal_parts`, `back_part`, `mr_fusion`, `mr_fusion_2` | `darkMetal` | MeshPhysical — dark machinery |
| `front_part` | `frontFascia` | MeshPhysical — dark front bumper |
| `time_circuits` | `purpleAccent` | **EMISSIVE** — purple neon strip, emissiveIntensity 4.0 |
| `buttons` | `redIndicator` | **EMISSIVE** — red cylinders, emissiveIntensity 3.4 |
| `buttons_2`, `circuits_2` | `orangeIndicator` | **EMISSIVE** — orange indicators |
| `front_part_2` | `warmLights` | **EMISSIVE** — headlights/taillights, emissiveIntensity 10.0 |
| `mr_fusion_3` | `whiteDeckLight` | **EMISSIVE** — rear deck white light |
| `board`, `circuits` | `board` | MeshStandard — dark circuit board |
| `cables` | `cable` | MeshStandard — near-black cables |

Unrecognized names log `[CarMaterial:unclassified]` in DEV console.

### Car body material values (current)
- `body`: color `#aaa59b`, metalness 1.0, roughness 0.24, envMapIntensity 3.2, clearcoat 0.2
- All materials are module-level singletons via `useMemo(() => makeCarMaterials(), [])`

### Car PointLights (tight lamp spill — not road blobs)
```
FRONT_LEFT_LIGHT_POS  [4.05, 1.78, 4.55]  #ffe9a8  intensity=0.22  distance=1.6
FRONT_RIGHT_LIGHT_POS [4.05, 1.78, 6.85]  #ffe9a8  intensity=0.22  distance=1.6
REAR_LIGHT_POS        [-3.35, 1.35, 5.7]  #ffd0a0  intensity=0.75  distance=2.4
```

---

## Scene Lighting (`Scene.jsx` — current)

```jsx
<ambientLight color="#3a2a50" intensity={4.0} />
<directionalLight position={[2, 20, 8]} intensity={0.8} color="#7799cc" />           // moonlight
<pointLight position={[-4, 3, 6]} color="#ff6600" intensity={3.0} distance={16} />   // orange sign spill
<pointLight position={[ 4, 3, 6]} color="#ffaa00" intensity={3.0} distance={16} />   // orange sign spill
<pointLight position={[ 0, 9, 6]} color="#ffcc66" intensity={2.5} distance={22} />   // warm ceiling
<pointLight position={[-5, 8, 4]} color="#00ccff" intensity={cyanIntensity}  distance={12} decay={2.5} />  // cyan (Leva)
<pointLight position={[ 8, 8, 3]} color="#cc44ff" intensity={magentaIntensity} distance={14} decay={2.5} /> // magenta (Leva)
<rectAreaLight position={[-2, 3.5, 7.5]} color="#ffaa44" intensity={warmWindowIntensity} />
<rectAreaLight position={[ 2, 3.5, 7.5]} color="#ffaa44" intensity={warmWindowIntensity} />
```

Cyan and magenta are at **Y=8** intentionally — previously at Y=2–5 they created road blobs.  
Environment: city preset (reflection fallback) + street_lamp.hdr (overrides when loaded).

---

## Texture System

### Architecture (single source of truth)
```js
// alleyMaterials.js
export const MESH_TEXTURE_OVERRIDES = { "MeshName": "textureKey", ... }
```
`Alley.jsx` merges static overrides with live picker state each render:
```js
const meshOverrides = { ...MESH_TEXTURE_OVERRIDES, ...pickerOverrides }
```
`AlleyTextures` applies: **exact mesh override → category fallback → original GLB material**

### Current `MESH_TEXTURE_OVERRIDES`
```js
"Storeftront_Roof001_Railing_0": "metal027"
"Cube026_Railing_0":             "metal027"
"Placeholder_Lamppost_Metal_0":  "woodPole"
"Cube014_Material004_0":         "rust"
"Cube014_Metal_0":               "paintedMetal014"
"Object_4":                      "metal012"      // ⚠ may be a car mesh — verify
"Floor_Asphalt_0":               "asphalt025c"
"Cube040_Concrete_0":            "concrete019"
"Cube020_wINDOW_bLINDS_0":       "imperfections"
```

> ⚠ `Object_4` is listed here but may belong to the DeLorean GLB. If car body material looks wrong, check if AlleyTextures is fighting Car.jsx on this mesh and remove the entry.

### Category fallback (CATS in AlleyTextures.jsx)
| Category | GLB material name(s) | Texture key |
|---|---|---|
| `walls` | `Building_Walls` | `plaster` |
| `roofCap` | `Building_Texture_2`, mesh `Plane__0` | solid `#2b2b26` |
| `concrete` | `Concrete` | `concrete020` |
| `curb` | `Curb` | solid `#8a8377` |
| `wires` | `Wires`, `Wires_2` | `rubber` |
| `railing` | `Railing`, `Metal027_2K-JPG` | `painted-metal006` |
| `metal` | `Metal`, `Door_Frame`, `wINDOW_bLINDS` | `metal-trim` |
| `door` | `Metal_Door*` | `corrugated-steel` |
| `pipes` | `Material002` | `metal006` |
| `lamppost` | mesh `Placeholder_Lamppost_Metal_0` | `wood015` |
| `floorStrip` | `Material.001`–`.003` | solid dark |
| `darkTrim` | `Material.004`–`.006` | solid dark |

### Texture folders in `public/assets/textures/`
```
plaster/            color, normal, rough
bricks/             color, normal, rough, ao
concrete020/        color, normal, rough
concrete-walk/      color, normal, rough
rubber/             color, normal, rough
painted-metal006/   color, normal, rough, metalness, ao
metal-trim/         color, normal, rough, metalness
corrugated-steel/   color, normal, rough, metalness, ao
wood015/            color, normal, rough
metal006/           color, normal, rough, metalness
metal025/           color, normal, rough, metalness
rust/               color, normal, rough, metalness
painted-metal014/   color, normal, rough, metalness, ao
smear/              color, normal, rough
asphalt025c/        color, normal, rough, ao
concrete019/        color, normal, rough
imperfections/      color, normal             ← window blinds
metal-ac/           color, normal, rough, metalness
painted-metal-box/  color, normal, rough, metalness, ao
public/assets/metal012/  color, normal, roughness, metalness  ← note: "roughness.jpg" not "rough.jpg"
```

### TexturePicker workflow (DEV only)
1. Enable "▶ Enable (click mesh)" in Leva panel
2. Click a mesh → shows name, material, world bounds
3. Select key from dropdown → preview applied immediately
4. "Copy all" → paste JSON into `MESH_TEXTURE_OVERRIDES`

---

## PostFX

```jsx
<Bloom luminanceThreshold={0.65} luminanceSmoothing={0.35} intensity={0.8} mipmapBlur />
<Vignette offset={0.2} darkness={0.85} />
```

Emissive materials need `toneMapped: false` AND output luminance > 0.65 to trigger bloom halos. If glow isn't visible, lower `luminanceThreshold` to 0.5.

---

## Failed Approaches — Do Not Retry

1. **RectAreaLight over road** — creates physically exact rectangular floor patch, cannot be hidden by resizing. Use PointLights at Y≥7 for any colored fill that could reach the road.

2. **Leva for final car material values** — Leva persists slider values in `localStorage`. Stale cached values override code defaults silently. Never use Leva controls for car body material. Hardcode all values.

3. **Color-threshold emissive detection** — checking `b > 0.5`, `r > 0.45` etc. to detect accent strips is unreliable across GLBs. Use `classifyCarPart()` with exact material names instead.

4. **`isMeshStandardMaterial` guard after first material swap** — after the first traversal replaces GLB materials with new `MeshPhysicalMaterial`, re-runs see the new type and skip meshes. Always snapshot originals to `userData.origMats` before any modification.

5. **PointLights below Y=3** — anything at Y<3 with `distance>6` creates visible colored road blobs on the wet asphalt. Keep scene fills at Y≥7 unless `distance≤2`.

6. **Normal map on car body at low roughness** — Metal012 normalMap scatters reflections and makes mirror-finish metal look matte. Remove normalMap for polished surfaces.

---

## Architecture Bug Fixes (historical)

**HMR stale state**: `useState(MESH_TEXTURE_OVERRIDES)` captured the initial empty `{}` on first HMR load. Fix: spread static const inline each render, only `pickerOverrides` in state.

**isEmissive false positives**: `emissiveIntensity` defaults to `1` in Three.js even when emissive color is black. Fix: `materialIsActuallyEmissive()` checks name keywords OR actual non-black emissive RGB.

**useGLTF cloning**: `AlleyTextures` calling `useGLTF` independently got a cloned scene — mutations had no effect. Fix: `AlleyTextures` receives `scene` as prop from `Alley.jsx`.

**Global texture repeat mutation**: `.repeat` set directly on `useTexture` cache mutated shared objects. Fix: `buildMaterial()` clones every texture before setting repeat/colorSpace.

---

## Pending Work

- [ ] **Verify car materials** — body silver, `time_circuits` glows purple, `front_part_2` glows warm white, `buttons` glows red
- [ ] **`Object_4` conflict** — check if AlleyTextures' `metal012` override fights Car.jsx on this mesh
- [ ] **Enable ManholeSteam** — change `showSteam={false}` → `true` in Scene.jsx
- [ ] **Road texture** — `Cube031_Road_0` still original (lane markings preserved); consider wet-asphalt look
- [ ] **Puddles** — `Puddles.jsx` exists, not imported; position near car at Z=3–7
- [ ] **Portfolio data** — contact section has `leon@example.com` / `github.com/leon` placeholders; resume link is `href="#"`
- [ ] **Remove debug components** — confirm `TextureProof.jsx` and `AlleyColorTest.jsx` are not imported before ship
- [ ] **More texture assignments** — use `uncatDebug` toggle in AlleyTextures Leva panel (hot-pink = uncategorized mesh) to find remaining unassigned meshes

---

## Useful Commands

```bash
# Dev server
cd "/Users/leon/Library/Mobile Documents/com~apple~CloudDocs/Development/portfolio-v2"
npm run dev

# Kill stale dev servers
lsof -iTCP -sTCP:LISTEN -P | grep node
kill <PID>
```
