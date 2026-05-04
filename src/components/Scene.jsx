import { useRef, useEffect, Suspense } from 'react'
import { useThree } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { useControls, folder } from 'leva'
import gsap from 'gsap'
import Alley          from './Alley'
import Car            from './Car'
import HologramUI     from './HologramUI'
import AlleyRadioSign from './AlleyRadioSign'
import SceneDressing  from './SceneDressing'
import PostFX         from './PostFX'
import Rain           from './Rain'

function EnvMap() {
  return <Environment files="/assets/street_lamp.hdr" background={false} />
}

/*
  World layout after alley scale=0.01 + Y-offset 1.1:
    Alley model:   X [−8, 8], Y [0, 10.7], Z [−8, 8]
    Building front: faces +Z at Z ≈ +8
    Road/asphalt:  within model, centered at Z ≈ 0–8
    Car center:    [0, 0.6, 5]  (on road, rear facing +Z toward camera)
    Camera start:  Z=18, outside alley, looking in
*/
const CAM_START  = { x: 5, y: 6, z: 19 }
const CAM_ACTIVE = { x: 2, y: 3, z: 11 }
const TARGET     = [0, 1.5, 2]

export default function Scene({ carActive, setCarActive, activeWindow, setActiveWindow }) {
  const { camera } = useThree()
  const controlsRef = useRef()
  const busy = useRef(false)

  const { freeCamera } = useControls({
    'Camera': folder({ freeCamera: { value: false, label: 'free camera (zoom + full rotate)' } }, { collapsed: true }),
  })

  useEffect(() => {
    camera.position.set(CAM_START.x, CAM_START.y, CAM_START.z)
    camera.lookAt(...TARGET)
    camera.updateProjectionMatrix()
  }, [camera])

  useEffect(() => {
    const done = () => {
      busy.current = false
      if (controlsRef.current) controlsRef.current.enabled = true
    }
    if (controlsRef.current) controlsRef.current.enabled = false

    const dest = carActive ? CAM_ACTIVE : CAM_START
    const fov  = carActive ? 50 : 55
    const dur  = carActive ? 1.4 : 1.2

    gsap.killTweensOf(camera.position)
    gsap.killTweensOf(camera)
    gsap.to(camera.position, { ...dest, duration: dur, ease: 'power2.inOut', onComplete: done })
    gsap.to(camera, { fov, duration: dur, ease: 'power2.inOut',
      onUpdate: () => camera.updateProjectionMatrix() })
  }, [carActive, camera])

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        target={TARGET}
        enablePan={false}
        enableZoom={freeCamera}
        minPolarAngle={freeCamera ? 0          : Math.PI / 8}
        maxPolarAngle={freeCamera ? Math.PI    : Math.PI / 2.1}
        minAzimuthAngle={freeCamera ? -Infinity : -Math.PI / 2}
        maxAzimuthAngle={freeCamera ? Infinity  :  Math.PI / 2}
        rotateSpeed={0.45}
        dampingFactor={0.07}
        enableDamping
      />

      <Suspense fallback={null}><EnvMap /></Suspense>

      <fog attach="fog" args={['#050208', 22, 55]} />

      {/* Ambient fill — bright enough to read textures */}
      <ambientLight color="#3a2a50" intensity={4.0} />

      {/* Cool moonlight from above */}
      <directionalLight position={[2, 20, 8]} intensity={0.8} color="#7799cc" />

      {/* Neon spill from building windows / signs */}
      <pointLight position={[-4, 3, 6]} color="#ff6600" intensity={3.0} distance={16} decay={2} />
      <pointLight position={[ 4, 3, 6]} color="#ffaa00" intensity={3.0} distance={16} decay={2} />
      <pointLight position={[ 0, 5, 5]} color="#00eeff" intensity={2.5} distance={18} decay={2} />
      <pointLight position={[ 0, 8, 2]} color="#aa44ff" intensity={2.0} distance={14} decay={2} />

      {/* Street lamp warmth over road */}
      <pointLight position={[0, 9, 6]} color="#ffcc66" intensity={2.5} distance={22} decay={2} />

      {/* Car activation — rear red glow + flux blue */}
      {carActive && <>
        <pointLight position={[-1.5, 0.5, 7.4]} color="#ff2200" intensity={10} distance={6} decay={2} />
        <pointLight position={[ 1.5, 0.5, 7.4]} color="#ff2200" intensity={10} distance={6} decay={2} />
        <pointLight position={[ 0.3, 1.5, 5.7]} color="#00aaff" intensity={6}  distance={8} decay={2} />
      </>}

      <Suspense fallback={null}><Alley /></Suspense>
      <Suspense fallback={null}><Car carActive={carActive} setCarActive={setCarActive} /></Suspense>
      <AlleyRadioSign />
      <Suspense fallback={null}><SceneDressing /></Suspense>

      {carActive && (
        <HologramUI
          activeWindow={activeWindow}
          setActiveWindow={setActiveWindow}
          onClose={() => { setActiveWindow(null); setCarActive(false) }}
        />
      )}

      <Rain />

      <PostFX />
    </>
  )
}
