import { useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import { useControls } from 'leva'
import * as THREE from 'three'
import { ROAD_Y } from './RoadOverlay'

const PUDDLE_Y = ROAD_Y + 0.025

// World-space positions within the road overlay footprint (X ≈ ±2.5, Z ≈ 0–8)
// Kept away from car body (car X ≈ −1.5→2.1, Z ≈ 4.0→7.4)
// Placed near-camera side for visibility (larger Z = closer to viewer at Z=19)
const PUDDLES = [
  { pos: [-2.2,  7.0], size: [1.4, 0.55], rotY: 0.20 },  // left of car rear
  { pos: [ 2.2,  6.5], size: [1.6, 0.60], rotY: 1.15 },  // right of car rear
  { pos: [ 0.3,  7.9], size: [1.2, 0.42], rotY: 0.00 },  // near entrance center
  { pos: [-2.0,  4.8], size: [1.0, 0.38], rotY: 0.85 },  // left mid-alley
  { pos: [ 2.0,  3.2], size: [1.1, 0.42], rotY: 2.30 },  // right deeper alley
]

export default function Puddles() {
  const { showPuddleDebug } = useControls('Puddles', {
    showPuddleDebug: { value: true, label: 'debug (cyan)' },
  }, { collapsed: true })

  const normalMap = useTexture('/assets/puddle/normal.jpg')
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping
  normalMap.repeat.set(1.5, 1.5)

  const material = useMemo(() => {
    if (showPuddleDebug) {
      return new THREE.MeshBasicMaterial({
        color: '#00c8ff',
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
      })
    }
    return new THREE.MeshPhysicalMaterial({
      color: '#0b1020',
      transparent: true,
      opacity: 0.42,
      roughness: 0.04,
      metalness: 0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      normalMap,
      normalScale: new THREE.Vector2(0.3, 0.3),
      depthWrite: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    })
  }, [showPuddleDebug, normalMap])

  return (
    <group>
      {PUDDLES.map((p, i) => (
        <mesh
          key={i}
          position={[p.pos[0], PUDDLE_Y, p.pos[1]]}
          rotation={[-Math.PI / 2, 0, p.rotY]}
          renderOrder={15}
          material={material}
        >
          <planeGeometry args={[p.size[0], p.size[1]]} />
        </mesh>
      ))}
    </group>
  )
}
