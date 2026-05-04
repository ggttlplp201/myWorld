import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useControls, folder } from 'leva'
import * as THREE from 'three'

export default function Rain() {
  const ctrl = useControls({
    'Rain': folder({
      rainEnabled: { value: true,  label: 'enabled' },
      rainCount:   { value: 650,   min: 100, max: 1200, step: 50,   label: 'count' },
      rainOpacity: { value: 0.16,  min: 0.0, max: 0.5,  step: 0.01, label: 'opacity' },
      rainSpeed:   { value: 9.0,   min: 1,   max: 30,   step: 0.5,  label: 'speed' },
      rainSlant:   { value: 0.07,  min: 0,   max: 0.4,  step: 0.01, label: 'slant' },
    }, { collapsed: true }),
  })
  const ctrlRef = useRef(ctrl)
  ctrlRef.current = ctrl

  const count = Math.max(100, Math.round(ctrl.rainCount))

  // Per-drop state packed: x, y, z, length, speedMult, xDrift
  const dropData = useMemo(() => {
    const d = new Float32Array(count * 6)
    for (let i = 0; i < count; i++) {
      d[i*6+0] = (Math.random() - 0.5) * 22
      d[i*6+1] = Math.random() * 18
      d[i*6+2] = (Math.random() - 0.5) * 24 + 4
      d[i*6+3] = 0.12 + Math.random() * 0.18
      d[i*6+4] = 0.55 + Math.random() * 0.90
      d[i*6+5] = (Math.random() - 0.5) * 0.025
    }
    return d
  }, [count])

  // Positions buffer: 2 vertices × 3 floats per drop
  const { geometry, positions } = useMemo(() => {
    const positions = new Float32Array(count * 6)
    const geo  = new THREE.BufferGeometry()
    const attr = new THREE.BufferAttribute(positions, 3)
    attr.setUsage(THREE.DynamicDrawUsage)
    geo.setAttribute('position', attr)
    return { geometry: geo, positions }
  }, [count])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((_, dt) => {
    const { rainEnabled, rainSpeed, rainSlant } = ctrlRef.current
    if (!rainEnabled) return

    const fall = rainSpeed * dt

    for (let i = 0; i < count; i++) {
      dropData[i*6+1] -= fall * dropData[i*6+4]
      dropData[i*6+0] += dropData[i*6+5]

      if (dropData[i*6+1] < -0.5) {
        dropData[i*6+1] = 16 + Math.random() * 4
        dropData[i*6+0] = (Math.random() - 0.5) * 22
      }

      const x   = dropData[i*6+0]
      const y   = dropData[i*6+1]
      const z   = dropData[i*6+2]
      const len = dropData[i*6+3]

      // top vertex (tilted by slant)
      positions[i*6+0] = x + rainSlant * len
      positions[i*6+1] = y + len
      positions[i*6+2] = z
      // bottom vertex
      positions[i*6+3] = x
      positions[i*6+4] = y
      positions[i*6+5] = z
    }

    geometry.attributes.position.needsUpdate = true
  })

  if (!ctrl.rainEnabled) return null

  return (
    <lineSegments geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial
        color="#d9e6ff"
        transparent
        opacity={ctrl.rainOpacity}
        depthWrite={false}
      />
    </lineSegments>
  )
}
