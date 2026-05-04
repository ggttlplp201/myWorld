import { useMemo } from 'react'
import * as THREE from 'three'
import { ROAD_Y } from './RoadOverlay'

const LANE_Y   = ROAD_Y + 0.015
const DASH_W   = 0.10
const DASH_L   = 0.90
const Z_DASHES = [1.4, 2.6, 3.8, 5.0, 6.2, 7.4]

export default function LaneMarkings() {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#d8a83a',
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  }), [])

  return (
    <group>
      {Z_DASHES.map(z => (
        <mesh
          key={z}
          position={[0, LANE_Y, z]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={20}
          material={mat}
        >
          <planeGeometry args={[DASH_W, DASH_L]} />
        </mesh>
      ))}
    </group>
  )
}
