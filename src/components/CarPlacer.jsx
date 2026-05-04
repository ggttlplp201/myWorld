/**
 * CarPlacer — live tuning mode for car placement.
 * Activated via ?place in the URL.
 *
 * Workflow:
 *   1. Open http://localhost:5173/?place
 *   2. Drag Leva sliders until car sits correctly on road with rear facing camera.
 *   3. Click "Log constants" — values are printed to console.
 *   4. Copy printed constants into Car.jsx and Scene.jsx.
 *   5. Remove ?place from URL.
 */
import { useEffect, useRef, useState, Suspense } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { useGLTF, OrbitControls, Line, Environment } from '@react-three/drei'
import { useControls, button, Leva } from 'leva'
import * as THREE from 'three'

/* ─── raycaster singleton ─────────────────────────────────────────── */
const _ray   = new THREE.Raycaster()
_ray.far     = 20

/* ─── bounding-box helper rendered in R3F ───────────────────────── */
function BoxHelper({ target }) {
  const meshRef = useRef()
  useEffect(() => {
    if (!target || !meshRef.current) return
    const box  = new THREE.Box3().setFromObject(target)
    const size = box.getSize(new THREE.Vector3())
    const c    = box.getCenter(new THREE.Vector3())
    meshRef.current.position.copy(c)
    meshRef.current.scale.set(size.x, size.y, size.z)
  })
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial wireframe color="#00ff88" transparent opacity={0.55} />
    </mesh>
  )
}

/* ─── wheel-contact raycasters ───────────────────────────────────── */
const WHEEL_LOCALS = [
  new THREE.Vector3( 1.2,  0, -1.4), // rear-left
  new THREE.Vector3(-1.2,  0, -1.4), // rear-right
  new THREE.Vector3( 1.2,  0,  1.4), // front-left
  new THREE.Vector3(-1.2,  0,  1.4), // front-right
]
function WheelContacts({ carRoot, roadMeshes }) {
  const [hits, setHits] = useState([])

  useFrame(() => {
    if (!carRoot) return
    const results = WHEEL_LOCALS.map(local => {
      const world = local.clone().applyMatrix4(carRoot.matrixWorld)
      const origin = world.clone().add(new THREE.Vector3(0, 2, 0))
      _ray.set(origin, new THREE.Vector3(0, -1, 0))
      const ints = _ray.intersectObjects(roadMeshes, true)
      const hit  = ints[0]
      return {
        origin: world.clone(),
        hitY:   hit ? hit.point.y : null,
        diff:   hit ? Math.abs(world.y - hit.point.y) : null,
      }
    })
    setHits(results)
  })

  return hits.map((h, i) => (
    h.hitY !== null && (
      <mesh key={i} position={[h.origin.x, h.hitY, h.origin.z]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color={h.diff < 0.15 ? '#00ff00' : '#ff2200'} />
      </mesh>
    )
  ))
}

/* ─── road guide lines ───────────────────────────────────────────── */
function RoadGuides({ roadY }) {
  const pts = (x, z0, z1, y) =>
    [new THREE.Vector3(x, y + 0.01, z0), new THREE.Vector3(x, y + 0.01, z1)]
  return (
    <>
      {/* road centre */}
      <Line points={pts(0, -10, 10, roadY)}  color="#ffff00" lineWidth={1.5} dashed dashSize={0.3} gapSize={0.2} />
      {/* left curb clearance */}
      <Line points={pts(-3, -10, 10, roadY)} color="#ff8800" lineWidth={1} dashed dashSize={0.2} gapSize={0.2} />
      {/* right curb clearance */}
      <Line points={pts( 3, -10, 10, roadY)} color="#ff8800" lineWidth={1} dashed dashSize={0.2} gapSize={0.2} />
    </>
  )
}

/* ─── main placer scene ──────────────────────────────────────────── */
function PlacerScene() {
  const { camera, scene } = useThree()
  const { scene: alley }  = useGLTF('/assets/alley.glb')
  const { scene: car }    = useGLTF('/assets/delorean.glb')
  const carRoot           = useRef()
  const alleyRoot         = useRef()
  const [roadY,  setRoadY]  = useState(0)
  const [roadMeshes, setRoadMeshes] = useState([])
  const [carObj, setCarObj] = useState(null)

  /* Leva controls */
  const [
    { posX, posY, posZ, rotY, carScale, camX, camY, camZ, camTX, camTY, camTZ, showHelpers },
    set,
  ] = useControls(() => ({
    '— CAR —': { value: true, editable: false, label: '' },
    posX:  { value: 0,    min: -10,  max: 10,  step: 0.05, label: 'pos X' },
    posY:  { value: 0,    min: -3,   max: 5,   step: 0.02, label: 'pos Y' },
    posZ:  { value: 5,    min: -10,  max: 15,  step: 0.05, label: 'pos Z' },
    rotY:  { value: Math.PI, min: -Math.PI, max: Math.PI, step: 0.01, label: 'rot Y' },
    carScale: { value: 0.8, min: 0.1, max: 3, step: 0.05, label: 'scale' },
    '— CAMERA —': { value: true, editable: false, label: '' },
    camX:  { value: 0,    min: -15,  max: 15,  step: 0.1,  label: 'cam X' },
    camY:  { value: 4,    min: 0.5,  max: 15,  step: 0.1,  label: 'cam Y' },
    camZ:  { value: 18,   min: 5,    max: 40,  step: 0.1,  label: 'cam Z' },
    camTX: { value: 0,    min: -10,  max: 10,  step: 0.1,  label: 'target X' },
    camTY: { value: 2,    min: -2,   max: 10,  step: 0.1,  label: 'target Y' },
    camTZ: { value: 4,    min: -10,  max: 15,  step: 0.1,  label: 'target Z' },
    '— DEBUG —': { value: true, editable: false, label: '' },
    showHelpers: { value: true, label: 'show helpers' },
    'Snap car to road (raycast)': button((get) => snapCarToRoad(get('posX'), get('posY'), get('posZ'))),
    'Log constants': button((get) => logConstants(get)),
  }))

  /* ── resolve road surface Y via downward raycast from car XZ ── */
  function snapCarToRoad(curPosX, curPosY, curPosZ) {
    if (!alleyRoot.current) return
    const origin = new THREE.Vector3(curPosX, 10, curPosZ)
    _ray.set(origin, new THREE.Vector3(0, -1, 0))
    const meshes = []
    alleyRoot.current.traverse(n => { if (n.isMesh) meshes.push(n) })
    const hits = _ray.intersectObjects(meshes, true)
    if (!hits.length) { console.warn('No road hit under car XZ'); return }
    const ry = hits[0].point.y
    setRoadY(ry)
    console.log('Road Y from raycast:', ry)

    if (!carRoot.current) return
    carRoot.current.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(carRoot.current)
    const carMinY = box.min.y
    const newY = curPosY + (ry - carMinY)
    set({ posY: parseFloat(newY.toFixed(3)) })
    console.log(`Car min Y was ${carMinY.toFixed(3)}, adjusted posY to ${newY.toFixed(3)}`)
  }

  function logConstants(get) {
    const px  = get('posX'),   py  = get('posY'),   pz  = get('posZ')
    const ry  = get('rotY'),   cs  = get('carScale')
    const cx  = get('camX'),   cy  = get('camY'),   cz  = get('camZ')
    const ctx = get('camTX'),  cty = get('camTY'),  ctz = get('camTZ')
    const out = `
// ── Tuned placement constants — paste into Car.jsx + Scene.jsx ──────────
const ROAD_Y  = ${roadY.toFixed(4)}

// Car.jsx
const CAR_POS    = [${px.toFixed(4)}, ${py.toFixed(4)}, ${pz.toFixed(4)}]
const CAR_SCALE  = ${cs.toFixed(4)}
const CAR_ROT_Y  = ${ry.toFixed(4)}   // Math.PI ≈ ${Math.PI.toFixed(4)}

// Scene.jsx camera
const CAM_START  = { x: ${cx.toFixed(2)}, y: ${cy.toFixed(2)}, z: ${cz.toFixed(2)} }
const CAM_TARGET = [${ctx.toFixed(2)}, ${cty.toFixed(2)}, ${ctz.toFixed(2)}]
`
    console.log(out)
    const el = document.createElement('pre')
    el.textContent = out
    el.style.cssText = 'position:fixed;top:10px;left:10px;z-index:9999;background:#000a;color:#0f0;padding:12px;font-size:11px;pointer-events:none;border:1px solid #0f04'
    document.body.appendChild(el)
    setTimeout(() => document.body.removeChild(el), 8000)
  }

  /* ── sync camera from controls ── */
  useFrame(() => {
    // Only move camera if NOT being dragged by OrbitControls
    // (orbit controls overrides this during drag, which is fine)
    camera.position.set(camX, camY, camZ)
  })

  /* ── collect road meshes for wheel raycasts ── */
  useEffect(() => {
    if (!alleyRoot.current) return
    const meshes = []
    alleyRoot.current.traverse(n => { if (n.isMesh) meshes.push(n) })
    setRoadMeshes(meshes)
    setCarObj(carRoot.current)
  }, [alley, car])

  return (
    <>
      <OrbitControls
        target={[camTX, camTY, camTZ]}
        enablePan enableZoom
        onChange={e => {
          // Sync camera position back to Leva (read-only sync while orbiting)
          const p = camera.position
          set({ camX: parseFloat(p.x.toFixed(2)), camY: parseFloat(p.y.toFixed(2)), camZ: parseFloat(p.z.toFixed(2)) })
        }}
      />

      <Environment files="/assets/street_lamp.hdr" background={false} />
      <ambientLight color="#ffffff" intensity={1.5} />
      <directionalLight position={[10, 20, 10]} intensity={2.0} />
      <directionalLight position={[-8, 10, -8]} intensity={0.5} color="#aaccff" />

      {showHelpers && <axesHelper args={[5]} />}
      {showHelpers && <gridHelper args={[30, 30, '#555', '#333']} position={[0, roadY, 0]} />}
      {showHelpers && <RoadGuides roadY={roadY} />}

      {/* Alley model */}
      <group ref={alleyRoot}>
        <primitive object={alley} position={[0, 1.1, 0]} scale={0.01} />
      </group>

      {/* Car model */}
      <group ref={carRoot} position={[posX, posY, posZ]} rotation-y={rotY} scale={carScale}>
        <primitive object={car} />
      </group>

      {/* Car bounding box */}
      {showHelpers && carRoot.current && <BoxHelper target={carRoot.current} />}

      {/* Wheel contact markers */}
      {showHelpers && carRoot.current && roadMeshes.length > 0 && (
        <WheelContacts carRoot={carRoot.current} roadMeshes={roadMeshes} />
      )}
    </>
  )
}

/* ─── exported wrapper ───────────────────────────────────────────── */
export default function CarPlacer() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#090909' }}>
      <Leva
        theme={{ sizes: { rootWidth: '300px' } }}
        titleBar={{ title: 'Car Placer', drag: true }}
        collapsed={false}
      />
      <Canvas
        camera={{ position: [0, 4, 18], fov: 55, near: 0.05, far: 300 }}
        style={{ position: 'absolute', inset: 0 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <PlacerScene />
        </Suspense>
      </Canvas>
      <div style={{
        position: 'fixed', bottom: 14, left: '50%', transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', fontSize: 11,
        pointerEvents: 'none', letterSpacing: '0.1em',
      }}>
        Orbit: drag · Zoom: scroll · "Snap car to road" auto-computes Y · "Log constants" copies values to console
      </div>
    </div>
  )
}
