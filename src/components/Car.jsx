import { useMemo, useRef, useEffect, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/*
  DeLorean GLB local bounds:
    X: −5.3 → 3.2   center = −1.05   (car depth, front→back)
    Y:  1.1 → 3.6   bottom = 1.1     (height above local origin)
    Z: −14.2 → −10.2  center = −12.2 (car width, side→side)

  With scale=0.86 and rotation-y=PI:
    world_x_center = pos.x + 0.86×1.05  ≈ pos.x + 0.90
    world_y_bottom = pos.y + 0.86×1.1   ≈ pos.y + 0.95
    world_z_center = pos.z + 0.86×12.2  ≈ pos.z + 10.49

  With pos=[-0.6, -0.5, -4.8]:
    world_x_center ≈ 0.3    world_z_center ≈ 5.7
    world_z_front  ≈ -4.8 + 0.86×10.2 ≈ 3.97   (into alley)
    world_z_rear   ≈ -4.8 + 0.86×14.2 ≈ 7.41   (toward camera)
*/
const CAR_POS  = [-0.6, -0.5, -4.8]
const RING_POS = [0.3, 0.02, 5.7]
const FRONT_LEFT_LIGHT_POS  = [4.05, 1.78, 4.55]
const FRONT_RIGHT_LIGHT_POS = [4.05, 1.78, 6.85]
const REAR_LIGHT_POS  = [-3.35, 1.35, 5.7]

function matNames(mesh) {
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
  return mats.map(m => m?.name ?? '').filter(Boolean)
}

function primaryMatName(mesh) {
  const original = mesh.userData.originalMaterialNames
  return (original?.[0] ?? matNames(mesh)[0] ?? '').toLowerCase()
}

function makeSolid(material, { doubleSide = true } = {}) {
  material.transparent = false
  material.opacity = 1
  material.depthTest = true
  material.depthWrite = true
  material.side = doubleSide ? THREE.DoubleSide : THREE.FrontSide
  material.needsUpdate = true
  return material
}

function makeCarMaterials() {
  const body = makeSolid(new THREE.MeshPhysicalMaterial({
    name: 'delorean_body_stainless',
    color: '#aaa59b',
    metalness: 1.0,
    roughness: 0.24,
    envMapIntensity: 3.2,
    clearcoat: 0.2,
    clearcoatRoughness: 0.22,
  }))

  const darkBody = makeSolid(new THREE.MeshPhysicalMaterial({
    name: 'delorean_dark_side_panels',
    color: '#302b27',
    metalness: 0.85,
    roughness: 0.3,
    envMapIntensity: 2.2,
    clearcoat: 0.16,
    clearcoatRoughness: 0.28,
  }))

  const glass = makeSolid(new THREE.MeshPhysicalMaterial({
    name: 'delorean_smoked_glass',
    color: '#17100d',
    metalness: 0.0,
    roughness: 0.12,
    envMapIntensity: 2.0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.14,
  }))

  const tire = makeSolid(new THREE.MeshStandardMaterial({
    name: 'delorean_tire_rubber',
    color: '#070707',
    metalness: 0.0,
    roughness: 0.94,
    envMapIntensity: 0.15,
  }))

  const wheelMetal = makeSolid(new THREE.MeshStandardMaterial({
    name: 'delorean_wheel_metal',
    color: '#6f6b62',
    metalness: 0.9,
    roughness: 0.32,
    envMapIntensity: 2.6,
  }))

  const darkMetal = makeSolid(new THREE.MeshPhysicalMaterial({
    name: 'delorean_dark_machinery',
    color: '#211d19',
    metalness: 0.82,
    roughness: 0.38,
    envMapIntensity: 1.8,
    clearcoat: 0.12,
    clearcoatRoughness: 0.24,
  }))

  const frontFascia = makeSolid(new THREE.MeshPhysicalMaterial({
    name: 'delorean_front_fascia',
    color: '#26201b',
    metalness: 0.35,
    roughness: 0.32,
    envMapIntensity: 1.6,
    clearcoat: 0.12,
    clearcoatRoughness: 0.28,
  }))

  const purpleAccent = new THREE.MeshStandardMaterial({
    name: 'delorean_purple_accent_emissive',
    color: '#caa2ff',
    emissive: '#a15cff',
    emissiveIntensity: 4.0,
    toneMapped: false,
    metalness: 0.2,
    roughness: 0.18,
    envMapIntensity: 2.0,
  })
  purpleAccent.side = THREE.DoubleSide
  purpleAccent.depthTest = true
  purpleAccent.depthWrite = false
  purpleAccent.polygonOffset = true
  purpleAccent.polygonOffsetFactor = -4
  purpleAccent.polygonOffsetUnits = -4

  const redIndicator = new THREE.MeshStandardMaterial({
    name: 'delorean_red_indicator_emissive',
    color: '#ff3322',
    emissive: '#ff1408',
    emissiveIntensity: 3.4,
    toneMapped: false,
    metalness: 0.15,
    roughness: 0.32,
    envMapIntensity: 0.8,
  })

  const orangeIndicator = new THREE.MeshStandardMaterial({
    name: 'delorean_orange_indicator_emissive',
    color: '#ff5a22',
    emissive: '#ff3512',
    emissiveIntensity: 2.4,
    toneMapped: false,
    metalness: 0.15,
    roughness: 0.35,
    envMapIntensity: 0.8,
  })

  const warmLights = new THREE.MeshStandardMaterial({
    name: 'delorean_head_tail_light_emissive',
    color: '#fff4ce',
    emissive: '#ffe38c',
    emissiveIntensity: 10.0,
    toneMapped: false,
    metalness: 0.0,
    roughness: 0.12,
    envMapIntensity: 1.0,
  })
  warmLights.side = THREE.DoubleSide
  warmLights.depthTest = true
  warmLights.depthWrite = false
  warmLights.polygonOffset = true
  warmLights.polygonOffsetFactor = -6
  warmLights.polygonOffsetUnits = -6

  const frontLightHousing = makeSolid(new THREE.MeshPhysicalMaterial({
    name: 'delorean_front_light_housing',
    color: '#17120d',
    metalness: 0.25,
    roughness: 0.34,
    envMapIntensity: 1.2,
    clearcoat: 0.1,
    clearcoatRoughness: 0.28,
  }))

  const whiteDeckLight = new THREE.MeshStandardMaterial({
    name: 'delorean_white_deck_light_emissive',
    color: '#ffffff',
    emissive: '#fff4d6',
    emissiveIntensity: 3.4,
    toneMapped: false,
    metalness: 0.0,
    roughness: 0.2,
    envMapIntensity: 1.0,
  })

  const board = new THREE.MeshStandardMaterial({
    name: 'delorean_board',
    color: '#3f1b0e',
    metalness: 0.0,
    roughness: 0.62,
    envMapIntensity: 0.35,
  })

  const cable = new THREE.MeshStandardMaterial({
    name: 'delorean_cable',
    color: '#050505',
    metalness: 0.0,
    roughness: 0.9,
    envMapIntensity: 0.15,
  })

  return {
    body,
    darkBody,
    glass,
    tire,
    wheelMetal,
    darkMetal,
    frontFascia,
    purpleAccent,
    redIndicator,
    orangeIndicator,
    warmLights,
    frontLightHousing,
    whiteDeckLight,
    board,
    cable,
  }
}

function classifyCarPart(materialName) {
  switch (materialName) {
    case 'delorean':
      return 'body'
    case 'window':
    case 'windshield':
      return 'glass'
    case 'sides':
      return 'darkBody'
    case 'wheels':
      return 'tire'
    case 'wheels_2':
      return 'wheelMetal'
    case 'cooler':
    case 'metal_parts':
    case 'back_part':
    case 'mr_fusion':
    case 'mr_fusion_2':
      return 'darkMetal'
    case 'front_part':
      return 'frontFascia'
    case 'time_circuits':
      return 'purpleAccent'
    case 'buttons':
      return 'redIndicator'
    case 'buttons_2':
    case 'circuits_2':
      return 'orangeIndicator'
    case 'front_part_2':
      return 'warmLights'
    case 'mr_fusion_3':
      return 'whiteDeckLight'
    case 'board':
    case 'circuits':
      return 'board'
    case 'cables':
      return 'cable'
    default:
      return null
  }
}

export default function Car() {
  const { scene } = useGLTF('/assets/delorean.glb')
  const groupRef  = useRef()
  const [hovered, setHovered] = useState(false)
  const pulse     = useRef(0)
  const materials = useMemo(() => makeCarMaterials(), [])

  useEffect(() => {
    scene.traverse(n => {
      if (!n.isMesh) return
      if (!n.userData.originalMaterialNames) {
        n.userData.originalMaterialNames = matNames(n)
      }

      const sourceName = primaryMatName(n)
      const part = classifyCarPart(sourceName)
      if (!part || !materials[part]) {
        if (import.meta.env.DEV) {
          console.log(`[CarMaterial:unclassified] mesh="${n.name}" original="${sourceName}"`)
        }
        return
      }

      n.material = materials[part]
      n.material.needsUpdate = true
      n.visible = true
      n.frustumCulled = false
      n.renderOrder = part === 'purpleAccent' || part === 'warmLights' ? 20 : 0
      n.castShadow = false
      n.receiveShadow = false

      if (import.meta.env.DEV) {
        const m = materials[part]
        console.log(
          `[CarMaterial] ${part.padEnd(13)} mesh="${n.name}" original="${sourceName}" ` +
          `color=#${m.color?.getHexString?.() ?? 'n/a'} metal=${m.metalness ?? 'n/a'} ` +
          `rough=${m.roughness ?? 'n/a'} emissive=#${m.emissive?.getHexString?.() ?? '000000'} ` +
          `emissiveI=${m.emissiveIntensity ?? 0}`
        )
      }
    })
  }, [scene, materials])

  useFrame((_, dt) => {
    if (!groupRef.current) return
    if (hovered) {
      pulse.current += dt * 2.5
      groupRef.current.scale.setScalar(1 + Math.sin(pulse.current) * 0.004)
    } else {
      groupRef.current.scale.setScalar(1)
    }
  })

  return (
    <>
      <group ref={groupRef}>
        <primitive
          object={scene}
          position={CAR_POS}
          rotation-y={Math.PI}
          scale={0.86}
          onPointerOver={e => { e.stopPropagation(); setHovered(true) }}
          onPointerOut={() => setHovered(false)}
        />
      </group>

      {/* Real lamp spill only: no visible meshes, no floor glow sprites. */}
      <pointLight position={FRONT_LEFT_LIGHT_POS}  color="#ffe9a8" intensity={0.22} distance={1.6} decay={2.8} />
      <pointLight position={FRONT_RIGHT_LIGHT_POS} color="#ffe9a8" intensity={0.22} distance={1.6} decay={2.8} />
      <pointLight position={REAR_LIGHT_POS}  color="#ffd0a0" intensity={0.75} distance={2.4} decay={2.6} />

      {hovered && (
        <mesh rotation-x={-Math.PI / 2} position={RING_POS}>
          <ringGeometry args={[2.2, 2.4, 64]} />
          <meshBasicMaterial
            color="#00ffcc" transparent opacity={0.45}
            blending={THREE.AdditiveBlending} depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </>
  )
}

useGLTF.preload('/assets/delorean.glb')
