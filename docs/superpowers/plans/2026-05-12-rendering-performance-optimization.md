# Rendering Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce GPU load from an uncapped 120fps Retina render to a 30fps capped 1.5x DPR render, remove expensive lights and post-processing passes, and eliminate the rain CPU loop — targeting 60–70% GPU work reduction with no perceptible quality loss.

**Architecture:** Three independent edits across three files. `App.jsx` gets the DPR cap and a `FrameDriver` component that drives the render loop at 30fps via `frameloop="demand"`. `Scene.jsx` drops the duplicate env map, replaces 5 lights with 3, and removes Rain. `PostFX.jsx` drops one bloom pass flag.

**Tech Stack:** React Three Fiber v9, Three.js r184, `@react-three/postprocessing`, Vite

---

## File Map

| File | Change |
|---|---|
| `src/App.jsx` | Add `dpr`, `frameloop="demand"`, inline `FrameDriver` component |
| `src/components/Scene.jsx` | Remove `RectAreaLightUniformsLib`, duplicate `<Environment>`, 2 `rectAreaLight`s, 2 orange `pointLight`s (→ 1 merged), `<Rain />` and its import |
| `src/components/PostFX.jsx` | Remove `mipmapBlur` from `<Bloom>` |
| `src/components/Rain.jsx` | **Not touched** — preserved for potential future reintroduction |

---

## Task 1: Cap DPR and add 30fps FrameDriver in App.jsx

**Files:**
- Modify: `src/App.jsx`

The Canvas currently renders at full device pixel ratio (2x on Retina = 4× the pixel count). Adding `dpr={[1, 1.5]}` caps it. Adding `frameloop="demand"` stops R3F's default uncapped animation loop — it only renders when `invalidate()` is called. The `FrameDriver` component calls `invalidate()` at 30fps using a `requestAnimationFrame` loop with delta gating. Pointer events (hover on car, OrbitControls damping) still work because R3F calls `invalidate()` automatically on interaction events in demand mode.

- [ ] **Step 1: Read the current file**

Read `src/App.jsx` in full before editing.

- [ ] **Step 2: Add `FrameDriver` component and update Canvas props**

The complete updated `App.jsx` — replace the file content with the following (only the Canvas section and a new component change; everything else is identical):

```jsx
import { useState, Suspense, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import { Leva } from 'leva'
import Scene from './components/Scene'
import DebugViewer from './components/DebugViewer'
import CarPlacer from './components/CarPlacer'
import { AlleyRadioSignHUD, IS_SIGN_DEBUG } from './components/AlleyRadioSign'

const _params   = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
const IS_DEBUG  = _params?.has('debug')  ?? false
const IS_PLACER = _params?.has('place')  ?? false

function LoadingScreen() {
  const { progress, active } = useProgress()
  const [gone, setGone] = useState(false)
  const [fading, setFading] = useState(false)
  const once = useRef(false)

  useEffect(() => {
    const go = () => {
      if (once.current) return
      once.current = true
      setFading(true)
      setTimeout(() => setGone(true), 900)
    }
    if (!active && progress >= 98) go()
    const t = setTimeout(go, 12000)
    return () => clearTimeout(t)
  }, [active, progress])

  if (gone) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: '#050208',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Courier New, monospace',
      transition: 'opacity 0.8s',
      opacity: fading ? 0 : 1,
      pointerEvents: fading ? 'none' : 'all',
    }}>
      <p style={{ color: '#00ffcc', fontSize: 11, letterSpacing: '0.4em', marginBottom: 36 }}>
        LEON MENG · PORTFOLIO
      </p>
      <div style={{ width: 260, height: 1, background: 'rgba(255,255,255,0.1)', position: 'relative' }}>
        <div style={{
          position: 'absolute', inset: 0, right: 'auto',
          width: `${progress}%`, background: 'linear-gradient(90deg,#00ffcc,#aa44ff)',
          boxShadow: '0 0 8px #00ffcc', transition: 'width 0.3s',
        }} />
      </div>
      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, letterSpacing: '0.2em', marginTop: 10 }}>
        {Math.round(progress)}%
      </p>
    </div>
  )
}

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

export default function App() {
  if (IS_DEBUG)  return <DebugViewer />
  if (IS_PLACER) return <CarPlacer />

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050208' }}>
      <Canvas
        camera={{ position: [5, 6, 19], fov: 55, near: 0.05, far: 200 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        frameloop="demand"
        style={{ position: 'absolute', inset: 0 }}
      >
        <color attach="background" args={['#050208']} />
        <FrameDriver fps={30} />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <LoadingScreen />
      {IS_SIGN_DEBUG && <AlleyRadioSignHUD />}
      <Leva hidden={!import.meta.env.DEV} />
    </div>
  )
}
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: no errors, dist output produced.

- [ ] **Step 4: Spot-check in browser**

```bash
npm run dev
```

Open `localhost:5175`. Verify:
- Scene loads and renders
- OrbitControls damping still works (drag and release — camera decelerates smoothly)
- Car hover ring appears on mouse-over

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "perf: cap DPR to 1.5, add 30fps FrameDriver with demand frameloop"
```

---

## Task 2: Remove duplicate Environment, rect lights, merge orange lights, remove Rain in Scene.jsx

**Files:**
- Modify: `src/components/Scene.jsx`

Five changes in one file:
1. Remove `RectAreaLightUniformsLib` import and init call (no longer needed — zero rectAreaLights after this task)
2. Remove `<Environment preset="city">` — the HDR `<Environment files="...">` that follows overrides the city preset entirely; loading it is wasted GPU work
3. Remove both `<rectAreaLight>` elements — the most GPU-expensive light type; warm amber window glow is preserved by the existing orange point lights
4. Merge the two symmetric orange `pointLight`s at `[-4,3,6]` and `[4,3,6]` into one at `[0,3,6]` with `intensity={4.5}` (combined intensity, slightly boosted to compensate for the removed rect lights)
5. Remove `<Rain />` and its import — `Rain.jsx` is not deleted; it can be reintroduced later as a cheaper GPU-instanced effect if needed

- [ ] **Step 1: Read the current file**

Read `src/components/Scene.jsx` in full before editing.

- [ ] **Step 2: Remove RectAreaLightUniformsLib import and init**

Remove this import line:
```js
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
```

Remove this call (just below the imports, before the `EnvMap` function):
```js
RectAreaLightUniformsLib.init()
```

- [ ] **Step 3: Remove duplicate Environment and update EnvMap**

Replace the `EnvMap` function:

```jsx
function EnvMap() {
  return <Environment files="/assets/street_lamp.hdr" background={false} />
}
```

- [ ] **Step 4: Remove Rain import**

Remove this import line:
```js
import Rain from './Rain'
```

- [ ] **Step 5: Replace lights and remove Rain JSX**

In the `Scene` return, replace the three orange point lights and two rectAreaLights block with a single merged orange light, and remove `<Rain />`.

Remove these four elements (the two symmetric orange lights, and the two rectAreaLights):
```jsx
<pointLight position={[-4, 3, 6]} color="#ff6600" intensity={3.0} distance={16} decay={2} />
<pointLight position={[ 4, 3, 6]} color="#ffaa00" intensity={3.0} distance={16} decay={2} />
```
```jsx
<rectAreaLight
  position={[-2, 3.5, 7.5]}
  width={4} height={3}
  color="#ffaa44"
  intensity={warmWindowIntensity}
/>
<rectAreaLight
  position={[ 2, 3.5, 7.5]}
  width={4} height={3}
  color="#ffaa44"
  intensity={warmWindowIntensity}
/>
```

Remove `<Rain />`.

Leave `<pointLight position={[0, 9, 6]} color="#ffcc66" intensity={2.5} distance={22} decay={2} />` untouched — the warm ceiling light stays.

Add one merged orange light immediately before the unchanged ceiling light:
```jsx
<pointLight position={[0, 3, 6]} color="#ff8800" intensity={4.5} distance={18} decay={2} />
```

- [ ] **Step 6: Remove unused Leva warmWindowIntensity control**

Since `warmWindowIntensity` was only used by the removed `rectAreaLight` elements, remove it from the `useControls` call. Replace:

```js
const { showReflectionCards, cyanIntensity, magentaIntensity, warmWindowIntensity } = useControls({
  'Lighting': folder({
    showReflectionCards: { value: false,  label: 'show reflection cards' },
    cyanIntensity:       { value: 2.5, min: 0, max: 12, step: 0.1, label: 'cyan intensity' },
    magentaIntensity:    { value: 0.7, min: 0, max: 12, step: 0.1, label: 'magenta intensity' },
    warmWindowIntensity: { value: 4.0, min: 0, max: 12, step: 0.1, label: 'warm window intensity' },
  }, { collapsed: true }),
})
```

With:

```js
const { showReflectionCards, cyanIntensity, magentaIntensity } = useControls({
  'Lighting': folder({
    showReflectionCards: { value: false,  label: 'show reflection cards' },
    cyanIntensity:       { value: 2.5, min: 0, max: 12, step: 0.1, label: 'cyan intensity' },
    magentaIntensity:    { value: 0.7, min: 0, max: 12, step: 0.1, label: 'magenta intensity' },
  }, { collapsed: true }),
})
```

- [ ] **Step 7: Verify build passes**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 8: Visual check in browser**

```bash
npm run dev
```

Open `localhost:5175`. Verify:
- Scene mood is intact — cyberpunk atmosphere, warm orange/amber glow, cyan and magenta accents visible
- No console errors about `RectAreaLightUniformsLib`
- No rain (expected)

- [ ] **Step 9: Commit**

```bash
git add src/components/Scene.jsx
git commit -m "perf: remove duplicate env, rect lights, merge orange lights, remove rain"
```

---

## Task 3: Remove mipmapBlur from Bloom in PostFX.jsx

**Files:**
- Modify: `src/components/PostFX.jsx`

`mipmapBlur` causes the bloom pass to downsample the render target through multiple mip levels and then upsample — several extra fullscreen passes per frame. Removing it keeps bloom visible with a slightly sharper falloff, which is imperceptible at normal viewing distance.

- [ ] **Step 1: Read the current file**

Read `src/components/PostFX.jsx` in full before editing.

- [ ] **Step 2: Remove mipmapBlur**

Replace:
```jsx
<Bloom luminanceThreshold={0.65} luminanceSmoothing={0.35} intensity={0.8} mipmapBlur />
```

With:
```jsx
<Bloom luminanceThreshold={0.65} luminanceSmoothing={0.35} intensity={0.8} />
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 4: Visual check in browser**

Open `localhost:5175`. Verify:
- Bloom glow is still visible on emissive materials (car accent lights, neon sign)
- No visible jarring difference vs before

- [ ] **Step 5: Commit**

```bash
git add src/components/PostFX.jsx
git commit -m "perf: remove mipmapBlur from Bloom to cut post-processing passes"
```

---

## Task 4: Final verification

- [ ] **Step 1: Full build**

```bash
npm run build
```

Expected: clean build, no warnings about unused imports.

- [ ] **Step 2: Open browser and do a full scene walkthrough**

```bash
npm run dev
```

Check:
- Loading screen appears and fades
- Scene renders: alley, car, dressing props (including graffiti, electrical boxes, cables on back wall), neon signs, bloom, vignette
- Car hover ring and pointer events work
- OrbitControls damping works (drag + release)
- Japanese sign animation runs
- No console errors

- [ ] **Step 3: Check GPU activity (optional but recommended)**

On macOS: open Activity Monitor → GPU History (Window menu). Compare before/after — expect noticeably lower GPU usage at idle.

- [ ] **Step 4: Final commit if any loose changes remain**

```bash
git status
```

If clean, no action needed. The three feature commits are the complete record.
