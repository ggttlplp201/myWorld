import { useState, Suspense, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import { Leva } from 'leva'
import Scene from './components/Scene'
import DebugViewer from './components/DebugViewer'
import CarPlacer from './components/CarPlacer'
import { AlleyRadioSignHUD, IS_SIGN_DEBUG } from './components/AlleyRadioSign'

// Use exact key matching so ?signdebug, ?signplace etc. don't accidentally
// trigger the asset-debugger or car-placer modes.
const _params   = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
const IS_DEBUG  = _params?.has('debug')  ?? false
const IS_PLACER = _params?.has('place')  ?? false

/* ── Loading overlay (lives outside Canvas) ─────────────────────────── */
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

/* ── FrameDriver (30fps demand render loop) ────────────────────────── */
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

/* ── App ─────────────────────────────────────────────────────────────── */
export default function App() {
  if (IS_DEBUG)  return <DebugViewer />
  if (IS_PLACER) return <CarPlacer />

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050208' }}>
      <Canvas
        dpr={[1, 1.5]}
        frameloop="demand"
        camera={{ position: [5, 6, 19], fov: 55, near: 0.05, far: 200 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <FrameDriver fps={30} />
        <color attach="background" args={['#050208']} />
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
