import { useRef, useEffect, Suspense } from 'react'
import { useThree } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { useControls, folder } from 'leva'
import * as THREE from 'three'
import Alley          from './Alley'
import Car            from './Car'
import AlleyRadioSign from './AlleyRadioSign'
import SceneDressing  from './SceneDressing'
import PostFX         from './PostFX'
import ManholeSteam   from './ManholeSteam'

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
const CAM_START = { x: 5, y: 6, z: 19 }
const TARGET    = [0, 1.5, 2]

export default function Scene() {
  const { camera } = useThree()
  const controlsRef = useRef()

  const { freeCamera } = useControls({
    'Camera': folder({ freeCamera: { value: false, label: 'free camera (full rotate)' } }, { collapsed: true }),
  })

  const { showReflectionCards, cyanIntensity, magentaIntensity } = useControls({
    'Lighting': folder({
      showReflectionCards: { value: false,  label: 'show reflection cards' },
      cyanIntensity:       { value: 2.5, min: 0, max: 12, step: 0.1, label: 'cyan intensity' },
      magentaIntensity:    { value: 0.7, min: 0, max: 12, step: 0.1, label: 'magenta intensity' },
    }, { collapsed: true }),
  })


  useEffect(() => {
    camera.position.set(CAM_START.x, CAM_START.y, CAM_START.z)
    camera.lookAt(...TARGET)
    camera.updateProjectionMatrix()
  }, [camera])

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        target={TARGET}
        enablePan={false}
        enableZoom={false}
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

      {/* Ambient fill */}
      <ambientLight color="#3a2a50" intensity={4.0} />

      {/* Cool moonlight from above */}
      <directionalLight position={[2, 20, 8]} intensity={0.8} color="#7799cc" />

      {/* Warm ceiling glow */}
      <pointLight position={[0, 9, 6]} color="#ffcc66" intensity={2.5} distance={22} decay={2} />

      {/* Cyan fill — high on left wall/storefront, cannot reach road */}
      <pointLight position={[-5, 8, 4]} color="#00ccff" intensity={cyanIntensity} distance={12} decay={2.5} />

      {/* Magenta rim — high right wall, cannot reach road */}
      <pointLight position={[8, 8, 3]} color="#cc44ff" intensity={magentaIntensity} distance={14} decay={2.5} />

      {/* Reflection cards — hidden by default; toggle via Leva → Lighting → show reflection cards */}
      <mesh position={[-14, 5, 2]} rotation-y={Math.PI / 2} visible={showReflectionCards}>
        <planeGeometry args={[20, 12]} />
        <meshBasicMaterial color="#003355" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[14, 5, 2]} rotation-y={-Math.PI / 2} visible={showReflectionCards}>
        <planeGeometry args={[20, 12]} />
        <meshBasicMaterial color="#2a0040" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 16, 4]} rotation-x={Math.PI / 2} visible={showReflectionCards}>
        <planeGeometry args={[20, 14]} />
        <meshBasicMaterial color="#1a0a00" side={THREE.DoubleSide} />
      </mesh>

      <Suspense fallback={null}><Alley /></Suspense>
      <Suspense fallback={null}><Car /></Suspense>
      <AlleyRadioSign />
      <Suspense fallback={null}><SceneDressing /></Suspense>
      <ManholeSteam showSteam={false} />

      <PostFX />
    </>
  )
}
