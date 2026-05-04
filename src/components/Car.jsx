import { useRef, useEffect, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { usePBRTextureSet, applyRepeat } from '../utils/textures'

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
const ROAD_Y    = 0
const CAR_POS   = [-0.6, -0.5, -4.8]

const RING_POS  = [0.3, ROAD_Y + 0.02, 5.7]

// Blinker point light positions: front and rear corners (world space)
const BL_FL = [-1.5, 0.5, 4.1]   // front-left
const BL_FR = [ 2.1, 0.5, 4.1]   // front-right
const BL_RL = [-1.5, 0.5, 7.3]   // rear-left
const BL_RR = [ 2.1, 0.5, 7.3]   // rear-right

const BLINK_HZ = 1.5

export default function Car({ carActive, setCarActive }) {
  const { scene }       = useGLTF('/assets/delorean.glb')
  const metal012 = usePBRTextureSet('/assets/metal012', {
    color:     'color.jpg',
    normal:    'normal.jpg',
    roughness: 'roughness.jpg',
    metalness: 'metalness.jpg',
  })
  const groupRef        = useRef()
  const [hovered, setHovered] = useState(false)
  const tailMats        = useRef([])
  const blinkerMats     = useRef([])
  const pulse           = useRef(0)
  const blinkerPhase    = useRef(0)
  // point light refs — always mounted, intensity driven in useFrame
  const blFL = useRef(), blFR = useRef(), blRL = useRef(), blRR = useRef()

  useEffect(() => {
    const tails = [], blinkers = []
    scene.traverse(n => {
      if (!n.isMesh) return
      const mats = Array.isArray(n.material) ? n.material : [n.material]
      const name = n.name.toLowerCase()
      mats.forEach(m => {
        m.envMapIntensity = 1.5
        if (m.emissiveIntensity > 0) {
          m.emissiveIntensity *= 1.8
          m.toneMapped = false
        }
        if (!m.isMeshStandardMaterial) return

        // Amber/orange blinker materials — clearly separated from red brake lights
        const isAmber    = m.color && m.color.r > 0.45 && m.color.g > 0.28 && m.color.b < 0.25
        const isBlinkName = ['turn', 'signal', 'blink', 'indicator', 'amber', 'orange'].some(k => name.includes(k))
        if (isAmber || isBlinkName) {
          m._origBE  = m.emissive.clone()
          m._origBEI = m.emissiveIntensity
          blinkers.push(m)
          return
        }

        // Red tail / brake lights
        const isRed   = m.color && m.color.r > 0.4 && m.color.g < 0.25 && m.color.b < 0.25
        const isTailName = ['tail', 'brake', 'stop', 'lamp', 'light'].some(k => name.includes(k))
        if (isRed || isTailName) {
          m._origE  = m.emissive.clone()
          m._origEI = m.emissiveIntensity
          tails.push(m)
        }
      })
    })
    tailMats.current    = tails
    blinkerMats.current = blinkers
  }, [scene])

  // Tail lights on/off with car activation
  useEffect(() => {
    tailMats.current.forEach(m => {
      if (carActive) {
        m.emissive.set('#ff1500')
        m.emissiveIntensity = 12
        m.toneMapped = false
      } else {
        m.emissive.copy(m._origE)
        m.emissiveIntensity = m._origEI
      }
    })
    if (!carActive) {
      blinkerPhase.current = 0
      blinkerMats.current.forEach(m => {
        m.emissive.copy(m._origBE)
        m.emissiveIntensity = m._origBEI
      })
      ;[blFL, blFR, blRL, blRR].forEach(r => { if (r.current) r.current.intensity = 0 })
    }
  }, [carActive])

  useFrame((_, dt) => {
    if (!groupRef.current) return

    // Hover pulse
    if (hovered && !carActive) {
      pulse.current += dt * 2.5
      groupRef.current.scale.setScalar(1 + Math.sin(pulse.current) * 0.004)
    } else {
      groupRef.current.scale.setScalar(1)
    }

    // Hazard flash
    if (!carActive) return
    blinkerPhase.current += dt
    const on = Math.floor(blinkerPhase.current * BLINK_HZ * 2) % 2 === 0

    blinkerMats.current.forEach(m => {
      if (on) { m.emissive.set('#ff9900'); m.emissiveIntensity = 18; m.toneMapped = false }
      else    { m.emissive.set('#000000'); m.emissiveIntensity = 0 }
    })

    const li = on ? 12 : 0
    if (blFL.current) blFL.current.intensity = li
    if (blFR.current) blFR.current.intensity = li
    if (blRL.current) blRL.current.intensity = li
    if (blRR.current) blRR.current.intensity = li
  })

  // Material polish — silver stainless body (Metal012), tinted glass, rubber tires
  useEffect(() => {
    applyRepeat(metal012, 2, 2)

    scene.traverse(n => {
      if (!n.isMesh) return
      const mats = Array.isArray(n.material) ? n.material : [n.material]
      const nm = `${n.name} ${mats.map(m => m.name).join(' ')}`.toLowerCase()

      if (import.meta.env.DEV) {
        const m0 = mats[0]
        if (m0?.isMeshStandardMaterial)
          console.log(`[Car mat] mesh="${n.name}" mat="${mats[0].name}" rough=${m0.roughness.toFixed(2)} metal=${m0.metalness.toFixed(2)} emI=${m0.emissiveIntensity.toFixed(2)} color=${m0.color.getHexString()}`)
      }

      mats.forEach(m => {
        if (!m.isMeshStandardMaterial) return
        if (m.emissiveIntensity > 0.1) return   // never touch light materials

        if (['glass','window','windshield','visor','screen'].some(k => nm.includes(k))) {
          m.color.set('#0a1828')
          m.roughness       = 0.06
          m.metalness       = 0.12
          m.transparent     = true
          m.opacity         = 0.62
          m.envMapIntensity = 3.5
          m.needsUpdate     = true
        } else if (['tire','tyre','rubber','wheel'].some(k => nm.includes(k))) {
          m.color.set('#0e0e0e')
          m.roughness   = 0.92
          m.metalness   = 0.0
          m.needsUpdate = true
        } else if (['body','hood','door','fender','panel','gullwing','trunk','steel','stainless'].some(k => nm.includes(k))) {
          // Replace with Metal012 brushed stainless steel
          m.map          = metal012.map
          m.normalMap    = metal012.normalMap
          m.roughnessMap = metal012.roughnessMap
          m.metalnessMap = metal012.metalnessMap
          m.color.set('#b8b5aa')
          m.roughness       = 0.38
          m.metalness       = 0.85
          m.envMapIntensity = 2.5
          m.needsUpdate     = true
        } else if (['trim','chrome','bumper','rim','hub'].some(k => nm.includes(k))) {
          m.color.set('#9a9a9a')
          m.roughness       = 0.28
          m.metalness       = 0.92
          m.envMapIntensity = 2.2
          m.needsUpdate     = true
        }
      })
    })
  }, [scene, metal012])

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'default'
    return () => { document.body.style.cursor = 'default' }
  }, [hovered])

  return (
    <>
      <group ref={groupRef}>
        <primitive
          object={scene}
          position={CAR_POS}
          rotation-y={Math.PI}
          scale={0.86}
          onClick={e => { e.stopPropagation(); setCarActive(v => !v) }}
          onPointerOver={e => { e.stopPropagation(); setHovered(true) }}
          onPointerOut={() => setHovered(false)}
        />
      </group>

      {/* Hazard point lights — always mounted, intensity 0 until car active */}
      <pointLight ref={blFL} position={BL_FL} color="#ff9900" intensity={0} distance={4} decay={2} />
      <pointLight ref={blFR} position={BL_FR} color="#ff9900" intensity={0} distance={4} decay={2} />
      <pointLight ref={blRL} position={BL_RL} color="#ff9900" intensity={0} distance={4} decay={2} />
      <pointLight ref={blRR} position={BL_RR} color="#ff9900" intensity={0} distance={4} decay={2} />

      {hovered && !carActive && (
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
