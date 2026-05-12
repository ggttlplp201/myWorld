# Rendering Performance Optimization

**Date:** 2026-05-12  
**Goal:** Reduce GPU load to stop laptop overheating. Target 30 FPS. Moderate quality tradeoff acceptable; scene atmosphere must be preserved.

## Context

The scene is a cyberpunk 3D alley rendered with React Three Fiber. In production, the camera will be locked — users cannot pan to see behind Z≈0 (the back of the alley). This unlocks aggressive culling of back-of-scene geometry.

Current bottlenecks identified:
- No DPR cap: renders at native 2x on Retina = 4× the pixels
- No frame rate cap: runs at display refresh (120Hz on MacBook Pro ProMotion)
- 11 dynamic lights including 2 `rectAreaLight`s (the most expensive light type)
- Dual `<Environment>` mounts — city preset is immediately overridden by the HDR
- Rain: 650-particle CPU loop running every frame via `useFrame`
- `mipmapBlur` on Bloom adds multi-pass fullscreen work

## What We Do NOT Touch

- All car (`Car.jsx`) materials — hero asset, `MeshPhysicalMaterial` clearcoat stays
- Cyan and magenta mood lights — define the cyberpunk atmosphere
- Bloom effect — stays enabled, minor tune only
- All back-wall props — `Cables`, `ElectricalBoxes`, `BackWallSection` (graffiti) all stay rendered and visible

## Changes

### App.jsx

1. Add `dpr={[1, 1.5]}` to `<Canvas>` — caps pixel ratio at 1.5 on Retina (imperceptible difference, ~56% fewer pixels vs 2x)
2. Add `frameloop="demand"` to `<Canvas>` — R3F only renders when `invalidate()` is called
3. Add a `<FrameDriver fps={30} />` component inline in `App.jsx` — calls `invalidate()` at 30fps via `requestAnimationFrame` loop with delta gating. This drives the render loop at exactly 30fps.

```jsx
function FrameDriver({ fps = 30 }) {
  const { invalidate } = useThree()
  useEffect(() => {
    let id
    let last = 0
    const interval = 1000 / fps
    const tick = (now) => {
      id = requestAnimationFrame(tick)
      if (now - last < interval) return
      last = now
      invalidate()
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [fps, invalidate])
  return null
}
```

### Scene.jsx

4. Remove `RectAreaLightUniformsLib` import and `RectAreaLightUniformsLib.init()` call
5. Remove first `<Environment preset="city">` — the HDR that follows overrides it; the city preset is wasted work
6. Remove both `<rectAreaLight>` elements — the most expensive light type; warm amber feel preserved by the remaining orange point lights
7. Merge the two symmetric orange point lights at `[-4,3,6]` and `[4,3,6]` into a single light at `[0,3,6]` with `intensity={4.5}` (combined; slightly boosted to compensate for removing the rect lights)
8. Remove `<Rain />` component and its import

Light count after: 6 (was 11)
- `ambientLight`
- `directionalLight` (moonlight)
- 1× orange point (merged from 2)
- 1× warm point `[0,9,6]`
- 1× cyan point `[-5,8,4]`
- 1× magenta point `[8,8,3]`

### PostFX.jsx

9. Remove `mipmapBlur` prop from `<Bloom>` — bloom stays, just without the multi-mip pass

### SceneDressing.jsx

No changes — all props including back-wall components stay rendered.

## Expected Gains

| Change | Estimated gain |
|---|---|
| DPR cap 2x → 1.5x | ~44% fewer pixels shaded per frame |
| 30fps cap | ~50% fewer frames rendered |
| Remove 5 lights (2 rect + 2 orange + city env) | ~25% shader complexity reduction |
| Remove rain useFrame loop | eliminates 650-iteration CPU work per frame |
| Remove mipmapBlur | eliminates ~4 fullscreen passes per frame |

Combined: estimated 60–70% reduction in GPU work per second.

## Files Changed

- `src/App.jsx`
- `src/components/Scene.jsx`
- `src/components/PostFX.jsx`
