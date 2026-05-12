# Handoff — Portfolio V2 Performance Optimization
**Date:** 2026-05-12
**Branch:** `main` (pushed to `origin/main`)
**Backup:** `origin/pre-optimization` — exact state before this session's changes

---

## Goal Statement

Leon's personal portfolio site (`portfolio-v2`) is a cyberpunk 3D alley scene built with React 19 + Vite + React Three Fiber v9 + Three.js r184. The site was causing severe GPU load (laptop overheating immediately on open). This session's goal was to reduce rendering cost by ~60–70% with no perceptible quality loss to the end user, targeting 30fps and preserving the cyberpunk atmosphere.

---

## What Was Done This Session

### Decisions Made

| Decision | Rationale |
|---|---|
| DPR capped at `[1, 1.5]` | On Retina MacBook, uncapped 2x DPR = 4× the pixels per frame |
| `frameloop="demand"` + `FrameDriver` at 30fps | Portfolio is mostly static — no reason to render at 120Hz |
| Removed `<Environment preset="city">` | HDR env map immediately overrides it; wasted GPU work |
| Replaced 2 `rectAreaLight`s with nothing | Most expensive light type; warm amber feel preserved by ceiling point light |
| Removed 2 symmetric orange point lights `[-4,3,6]` / `[4,3,6]`, added 1 merged → removed entirely | Merged light at `[0,3,6]` landed directly above car center, creating an orange orb artifact on the car roof (visible in screenshot). Removed rather than repositioned |
| Removed `<Rain />` | CPU `useFrame` loop updating 650 particles every frame; `Rain.jsx` left intact for future reintroduction |
| Removed `mipmapBlur` from Bloom | Eliminates ~4 fullscreen downsample/upsample passes per frame |
| `Car.jsx`, `SceneDressing.jsx`, cyan/magenta lights — untouched | Protected areas; hero asset quality and scene atmosphere preserved |

### Files Changed

| File | Change |
|---|---|
| `src/App.jsx` | Added `dpr={[1, 1.5]}`, `frameloop="demand"`, inline `FrameDriver` component |
| `src/components/Scene.jsx` | Removed `RectAreaLightUniformsLib`, duplicate env, rectAreaLights, orange pair + merged light, `<Rain />` |
| `src/components/PostFX.jsx` | Removed `mipmapBlur` from `<Bloom>` |

### Current Light Rig (Scene.jsx)

5 lights remain (was 11):
- `ambientLight` — `#3a2a50` intensity 4.0 (purple base fill)
- `directionalLight` — `[2,20,8]` cool moonlight `#7799cc`
- `pointLight` — `[0,9,6]` warm ceiling `#ffcc66` intensity 2.5
- `pointLight` — `[-5,8,4]` cyan `#00ccff` (Leva-controlled)
- `pointLight` — `[8,8,3]` magenta `#cc44ff` (Leva-controlled)

### Commits (all on `main`)

```
234b2e7  perf: cap DPR to 1.5, add 30fps FrameDriver with demand frameloop
347530d  fix: remove unused useFrame import from App.jsx
fdafbcc  perf: remove duplicate env, rect lights, merge orange lights, remove rain
037dab5  perf: remove mipmapBlur from Bloom to cut post-processing passes
1045912  fix: remove low orange point light that was creating orb artifact on car roof
```

### Artefacts

- Spec: `docs/superpowers/specs/2026-05-12-rendering-performance-optimization-design.md`
- Plan: `docs/superpowers/plans/2026-05-12-rendering-performance-optimization.md`

---

## Failed / Rejected Approaches

- **Merging orange pair into `[0,3,6]`** — produced a visible orange orb artifact on the car roof. The car center sits at ~`[0.3, 0.6, 5.7]` and the merged light was directly above it. Removed entirely rather than repositioned; the warm ceiling light covers warmth from above.
- **Culling back-wall props** (graffiti, electrical boxes, cables at Z≈-7) — was initially included in the plan, then explicitly rejected by user. All back-wall props stay rendered and visible.

---

## Open Items (Pre-existing, Not From This Session)

From memory/project_overview.md:

1. **ManholeSteam disabled** — `showSteam={false}` in `Scene.jsx:132`. Needs enabling and visual check.
2. **`Object_4` conflict** — may be a car mesh present in both `MESH_TEXTURE_OVERRIDES` and `Car.jsx`; `AlleyTextures` could fight `Car.jsx` on that mesh. Needs investigation.
3. **Puddles.jsx unused** — exists at `src/components/Puddles.jsx` but not imported in `Scene.jsx`. Planned for re-add after road work.
4. **Portfolio placeholder content** — `leon@example.com`, `github.com/leon`, resume `href="#"` in `PortfolioWindow.jsx`.
5. **Debug components** — `TextureProof.jsx`, `AlleyColorTest.jsx` — confirm removed/not imported before production deploy.
6. **Rain reintroduction** — `Rain.jsx` is preserved. If scene feels too dry, a GPU-instanced or shader-based cheaper rain effect could replace the CPU loop version.
7. **Camera lock** — The user mentioned the production camera will be locked (no pan behind Z≈0). This is not yet implemented. Once locked, additional back-of-scene culling is safe.

---

## Next Actions (Suggested Priority)

1. **Visual QA** — open `localhost:5175` (`npm run dev`), confirm scene atmosphere, car look, bloom, damping on OrbitControls, Japanese sign animation all still work at 30fps.
2. **Camera lock** — implement the production orbit limits (`minAzimuthAngle`, `maxAzimuthAngle`, `maxPolarAngle`) that prevent users from panning behind the scene. This was a key assumption of the optimizations.
3. **Placeholder content** — wire up real email, GitHub URL, and resume PDF in `PortfolioWindow.jsx`.
4. **ManholeSteam** — flip `showSteam={false}` → `true` and assess GPU cost before shipping.
5. **Debug component audit** — grep for `TextureProof` and `AlleyColorTest` imports; remove if present.
6. **Production deploy** — `npm run build` produces `dist/`. The 1.6MB JS bundle warning is pre-existing; consider code-splitting Three.js if bundle size becomes a concern.

---

## Project Quick Reference

- **Dev server:** `npm run dev` → `localhost:5175`
- **Build:** `npm run build`
- **Stack:** React 19, Vite, React Three Fiber v9, Three.js r184, `@react-three/drei`, `@react-three/postprocessing`, Leva
- **Debug modes:** `?debug` (DebugViewer), `?place` (CarPlacer), `?signplace` (AlleyRadioSignHUD)
- **World bounds:** X/Z ±8m, Y 0–10.7m. Car center ~`[0.3, 0.6, 5.7]`. Camera start `[5,6,19]`, orbit target `[0,1.5,2]`.
- **Repo:** `https://github.com/ggttlplp201/myWorld.git`
- **Revert point:** `git checkout pre-optimization`

---

## Suggested Skills for Next Session

- `superpowers:brainstorming` — if implementing camera lock or rain reintroduction (design first)
- `superpowers:writing-plans` + `superpowers:subagent-driven-development` — for any multi-file feature work (portfolio content, camera lock)
- `superpowers:verification-before-completion` — before production deploy, run a full visual + build check
