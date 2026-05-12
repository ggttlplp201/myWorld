import { Suspense, useEffect, useRef } from 'react'
import { useGLTF, Clone, useAnimations } from '@react-three/drei'
import { useControls, button } from 'leva'
import * as THREE from 'three'
import { usePBRTextureSet, applyRepeat } from '../utils/textures'

const TX = '/assets/textures'

// All BAKED values were recorded with the GLB scene scale reset to (1,1,1).
// Called synchronously during render so it's applied before the group mounts.
function resetScale(scene) { scene.scale.set(1, 1, 1) }

const D = '/assets/dressing/'

const BAKED = {
  openSign:       { pos: [-6.500, 4.450,  1.780], rot: [ 0.0200, -1.5900, -0.0100], scale: 0.3132 },
  electricalBoxes:{ pos: [ 1.700, 1.110, -7.680], rot: [ 0.0000, -1.5708,  0.0000], scale: 0.8866 },
  cables:         { pos: [ 3.740, 8.210, -6.730], rot: [ 0.0000,  0.0000, -0.0600], scale: 0.2938 },
  acUnit:         { pos: [ 6.960, 4.820, -0.500], rot: [ 0.0100,  1.5700,  0.0000], scale: 0.0400 },
  graffiti: [
    { pos: [1.530, 0.000, -7.700], rot: [0.0000, 0.0000, 0.0000], scale: 1.1700 },
    { pos: [1.530, 3.550, -7.700], rot: [0.0000, 0.0000, 0.0000], scale: 1.1700 },
  ],
  garbageBags:    { pos: [-4.230, 0.990,  0.360], rot: [-0.1150, -1.5750,  0.0000], scale: 0.0100 },
  japaneseSign:   { pos: [ 2.090, 7.040, -1.540], rot: [ 0.0000,  0.0000,  0.0000], scale: 0.5535 },
  trafficCone: [
    { pos: [-4.300, 0.600, 4.300], rot: [0.0000, 0.0000, 0.0000], scale: 0.00580 },
    { pos: [-4.300, 0.600, 7.350], rot: [0.0000, 0.0000, 0.0000], scale: 0.00580 },
  ],
  vendingMachine: { pos: [ 5.390, 1.150, -1.550], rot: [ 0.0000,  0.0000,  0.0000], scale: 0.0100 },
}

function OpenSign() {
  const { scene } = useGLTF(`${D}neon_open_sign.glb`)
  resetScale(scene)
  const { pos, rot, scale } = BAKED.openSign

  useEffect(() => {
    scene.traverse(n => {
      if (!n.isMesh) return
      ;(Array.isArray(n.material) ? n.material : [n.material]).forEach(m => {
        const nm = (m.name || '').toLowerCase()
        if (['open','neon','glow','light','glass','emit','bulb','led'].some(k => nm.includes(k))) {
          m.emissive          = new THREE.Color('#ff6633')
          m.emissiveIntensity = 5
          m.toneMapped        = false
          m.needsUpdate       = true
        }
      })
    })
  }, [scene])

  return (
    <group position={pos} rotation={rot} scale={scale}>
      <primitive object={scene} />
    </group>
  )
}
useGLTF.preload(`${D}neon_open_sign.glb`)

function ElectricalBoxes() {
  const { scene } = useGLTF(`${D}electrical_boxes.glb`)
  resetScale(scene)
  const { pos, rot, scale } = BAKED.electricalBoxes
  const tex = usePBRTextureSet(`${TX}/painted-metal-box`, {
    color: 'color.jpg', normal: 'normal.jpg', roughness: 'rough.jpg',
    metalness: 'metalness.jpg', ao: 'ao.jpg',
  })
  useEffect(() => {
    applyRepeat(tex, 1, 1)
    const mat = new THREE.MeshStandardMaterial({
      ...tex, color: new THREE.Color('#3a4a3a'),
      roughness: 0.55, metalness: 0.65, envMapIntensity: 1.2,
      aoMapIntensity: 0.8,
    })
    if (tex.normalMap) mat.normalScale = new THREE.Vector2(0.4, 0.4)
    scene.traverse(n => {
      if (!n.isMesh) return
      const mats = Array.isArray(n.material) ? n.material : [n.material]
      if (mats.some(m => { const e = m.emissive; return (!!e && (e.r > 0.01 || e.g > 0.01 || e.b > 0.01)) })) return
      n.material = mat
    })
  }, [scene, tex])
  return (
    <group position={pos} rotation={rot} scale={scale}>
      <primitive object={scene} />
    </group>
  )
}
useGLTF.preload(`${D}electrical_boxes.glb`)

function Cables() {
  const { scene } = useGLTF(`${D}cables.glb`)
  resetScale(scene)
  const { pos, rot, scale } = BAKED.cables
  const tex = usePBRTextureSet(`${TX}/rubber`, {
    color: 'color.jpg', normal: 'normal.jpg', roughness: 'rough.jpg',
  })
  useEffect(() => {
    applyRepeat(tex, 1, 6)
    const mat = new THREE.MeshStandardMaterial({
      ...tex, color: new THREE.Color('#1a1a1a'),
      roughness: 0.92, metalness: 0.0, envMapIntensity: 0.3,
    })
    if (tex.normalMap) mat.normalScale = new THREE.Vector2(0.4, 0.4)
    scene.traverse(n => {
      if (!n.isMesh) return
      n.material = mat
    })
  }, [scene, tex])
  return (
    <group position={pos} rotation={rot} scale={scale}>
      <primitive object={scene} />
    </group>
  )
}
useGLTF.preload(`${D}cables.glb`)

function AcUnit() {
  const { scene } = useGLTF(`${D}air_conditioner_unit_low_poly.glb`)
  resetScale(scene)
  const { pos, rot, scale } = BAKED.acUnit
  const tex = usePBRTextureSet(`${TX}/metal-ac`, {
    color: 'color.jpg', normal: 'normal.jpg', roughness: 'rough.jpg', metalness: 'metalness.jpg',
  })
  useEffect(() => {
    applyRepeat(tex, 2, 2)
    const mat = new THREE.MeshStandardMaterial({
      ...tex, color: new THREE.Color('#c0c0b8'),
      roughness: 0.45, metalness: 0.80, envMapIntensity: 1.8,
    })
    if (tex.normalMap) mat.normalScale = new THREE.Vector2(0.4, 0.4)
    scene.traverse(n => {
      if (!n.isMesh) return
      const mats = Array.isArray(n.material) ? n.material : [n.material]
      if (mats.some(m => { const e = m.emissive; return (!!e && (e.r > 0.01 || e.g > 0.01 || e.b > 0.01)) })) return
      n.material = mat
    })
  }, [scene, tex])
  return (
    <group position={pos} rotation={rot} scale={scale}>
      <primitive object={scene} />
    </group>
  )
}
useGLTF.preload(`${D}air_conditioner_unit_low_poly.glb`)

function BackWallSection() {
  const stateRef = useRef({})

  const { x, y, z, width, height, thickness, rotationY, debugColor, showGraffiti } = useControls('BackWall', {
    x:            { value: 1.7,   min: -10,        max: 10,         step: 0.01 },
    y:            { value: 4.0,   min: 0,          max: 15,         step: 0.01 },
    z:            { value: -7.88, min: -15,         max: 0,          step: 0.01 },
    width:        { value: 2.6,   min: 0.1,        max: 20,         step: 0.01 },
    height:       { value: 7.4,   min: 0.1,        max: 20,         step: 0.01 },
    thickness:    { value: 0.12,  min: 0.01,       max: 2,          step: 0.01 },
    rotationY:    { value: 0,     min: -Math.PI,   max: Math.PI,    step: 0.01 },
    debugColor:   false,
    showGraffiti: { value: true, label: 'show graffiti' },
    'Copy BackWall constants': button(() => {
      const { x, y, z, width, height, thickness, rotationY } = stateRef.current
      const out = JSON.stringify(
        { position: [x, y, z], size: [width, height, thickness], rotation: [0, rotationY, 0] },
        null, 2
      )
      console.log('[BackWall]', out)
      navigator.clipboard?.writeText(out).catch(() => {})
    }),
  }, { collapsed: true })

  // Keep ref current for button callback closure
  Object.assign(stateRef.current, { x, y, z, width, height, thickness, rotationY })

  const { scene: graffitiScene } = useGLTF(`${D}decal_-_graffiti_textures.glb`)
  resetScale(graffitiScene)
  const [a, b] = BAKED.graffiti

  const tex = usePBRTextureSet(`${TX}/bricks`, {
    color: 'color.jpg', normal: 'normal.jpg', roughness: 'rough.jpg', ao: 'ao.jpg',
  })

  const meshRef = useRef()
  const matRef  = useRef(null)

  // Build material with cloned (independent) textures
  useEffect(() => {
    const cloned = {}
    for (const [k, v] of Object.entries(tex)) {
      if (!v?.isTexture) continue
      const t = v.clone()
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      if (k === 'map') t.colorSpace = THREE.SRGBColorSpace
      t.needsUpdate = true
      cloned[k] = t
    }
    const mat = new THREE.MeshStandardMaterial({
      ...cloned,
      color:           new THREE.Color('#9a8070'),
      roughness:       0.9,
      envMapIntensity: 0.3,
      aoMapIntensity:  1.0,
    })
    mat.normalScale.set(0.6, 0.6)
    matRef.current = mat
    if (meshRef.current && !debugColor) meshRef.current.material = mat
  }, [tex]) // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle debug color on/off
  useEffect(() => {
    if (!meshRef.current) return
    meshRef.current.material = debugColor
      ? new THREE.MeshBasicMaterial({ color: '#ff00ff' })
      : (matRef.current ?? meshRef.current.material)
  }, [debugColor])

  // Update texture repeat when dimensions change
  useEffect(() => {
    const mat = matRef.current
    if (!mat) return
    const ru = Math.max(1, Math.round(width / 1.5))
    const rv = Math.max(1, Math.round(height / 1.5))
    for (const k of ['map', 'normalMap', 'roughnessMap', 'aoMap']) {
      const t = mat[k]
      if (t?.isTexture) { t.repeat.set(ru, rv); t.needsUpdate = true }
    }
  }, [width, height])

  return (
    <>
      <mesh ref={meshRef} position={[x, y, z]} rotation={[0, rotationY, 0]}>
        <boxGeometry args={[width, height, thickness]} />
      </mesh>

      {showGraffiti && (
        <>
          <group position={a.pos} rotation={a.rot} scale={a.scale}>
            <primitive object={graffitiScene} />
          </group>
          <group position={b.pos} rotation={b.rot} scale={b.scale}>
            <Clone object={graffitiScene} />
          </group>
        </>
      )}
    </>
  )
}
useGLTF.preload(`${D}decal_-_graffiti_textures.glb`)

function GarbageBags() {
  const { scene } = useGLTF(`${D}trash_bag.glb`)
  resetScale(scene)
  const { pos, rot, scale } = BAKED.garbageBags
  return (
    <group position={pos} rotation={rot} scale={scale}>
      <primitive object={scene} />
    </group>
  )
}
useGLTF.preload(`${D}trash_bag.glb`)

function JapaneseSign() {
  const { scene, animations } = useGLTF(`${D}cyberpunk_animated_japanese_led_neon_sign.glb`)
  resetScale(scene)
  const { pos, rot, scale } = BAKED.japaneseSign

  const groupRef = useRef()
  const { actions, names } = useAnimations(animations, groupRef)

  useEffect(() => {
    names.forEach(name => {
      const action = actions[name]
      if (!action) return
      action.reset().setLoop(THREE.LoopRepeat, Infinity).play()
    })
    return () => names.forEach(name => actions[name]?.stop())
  }, [actions, names])

  return (
    <group ref={groupRef} position={pos} rotation={rot} scale={scale}>
      <primitive object={scene} />
    </group>
  )
}
useGLTF.preload(`${D}cyberpunk_animated_japanese_led_neon_sign.glb`)

function TrafficCone() {
  const { scene } = useGLTF(`${D}traffic_cone_low_poly.glb`)
  resetScale(scene)
  const [a, b] = BAKED.trafficCone
  return (
    <>
      <group position={a.pos} rotation={a.rot} scale={a.scale}>
        <primitive object={scene} />
      </group>
      <group position={b.pos} rotation={b.rot} scale={b.scale}>
        <Clone object={scene} />
      </group>
    </>
  )
}
useGLTF.preload(`${D}traffic_cone_low_poly.glb`)

function VendingMachine() {
  const { scene } = useGLTF(`${D}retro_cyberpunk_vending_machine.glb`)
  resetScale(scene)
  const { pos, rot, scale } = BAKED.vendingMachine
  return (
    <group position={pos} rotation={rot} scale={scale}>
      <primitive object={scene} />
    </group>
  )
}
useGLTF.preload(`${D}retro_cyberpunk_vending_machine.glb`)

export default function SceneDressing() {
  return (
    <group name="scene-dressing">
      <Suspense fallback={null}><OpenSign /></Suspense>
      <Suspense fallback={null}><ElectricalBoxes /></Suspense>
      <Suspense fallback={null}><Cables /></Suspense>
      <Suspense fallback={null}><AcUnit /></Suspense>
      <Suspense fallback={null}><BackWallSection /></Suspense>
      <Suspense fallback={null}><GarbageBags /></Suspense>
      <Suspense fallback={null}><JapaneseSign /></Suspense>
      <Suspense fallback={null}><TrafficCone /></Suspense>
      <Suspense fallback={null}><VendingMachine /></Suspense>
    </group>
  )
}
