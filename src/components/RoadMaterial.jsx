import { useEffect } from 'react'
import { useGLTF }   from '@react-three/drei'
import * as THREE    from 'three'
import { usePBRTextureSet, applyRepeat } from '../utils/textures'

const INCLUDE_KW = ['road', 'asphalt', 'street']
const EXCLUDE_KW = ['sidewalk', 'curb', 'concrete', 'building', 'wall', 'floor', 'slab',
                    'line', 'lane', 'mark', 'marking', 'stripe', 'dash', 'center', 'divid',
                    'paint', 'arrow', 'yellow', 'white', 'decal']

function meshLabel(n) {
  const mats = Array.isArray(n.material) ? n.material : [n.material]
  return (n.name + ' ' + mats.map(m => m.name).join(' ')).toLowerCase()
}

function ensureUV(n, uvScale = 300) {
  const geo = n.geometry
  if (!geo.attributes.uv) {
    const pos = geo.attributes.position
    const arr = new Float32Array(pos.count * 2)
    for (let i = 0; i < pos.count; i++) {
      arr[i * 2]     = pos.getX(i) / uvScale
      arr[i * 2 + 1] = pos.getZ(i) / uvScale
    }
    geo.setAttribute('uv',  new THREE.BufferAttribute(arr, 2))
    geo.setAttribute('uv2', new THREE.BufferAttribute(arr.slice(), 2))
  } else if (!geo.attributes.uv2) {
    geo.setAttribute('uv2', geo.attributes.uv.clone())
  }
}

export default function RoadMaterial() {
  const { scene } = useGLTF('/assets/alley.glb')

  const asphalt = usePBRTextureSet('/assets/asphalt', {
    color:     'color.jpg',
    normal:    'normal.jpg',
    roughness: 'roughness.jpg',
    ao:        'ao.jpg',
  })

  useEffect(() => {
    applyRepeat(asphalt, 1, 1)

    let count = 0

    scene.traverse(n => {
      if (!n.isMesh) return
      const label = meshLabel(n)

      if (import.meta.env.DEV) {
        console.log(`[Alley mesh] "${n.name}"  mat="${label}"`)
      }

      const included = INCLUDE_KW.some(k => label.includes(k))
      const excluded = EXCLUDE_KW.some(k => label.includes(k))
      if (!included || excluded) return

      ensureUV(n)

      n.material = new THREE.MeshStandardMaterial({
        ...asphalt,
        color:           new THREE.Color('#1c1c1c'),
        roughness:       0.82,
        metalness:       0.0,
        aoMapIntensity:  0.7,
        normalScale:     new THREE.Vector2(0.4, 0.4),
        envMapIntensity: 0.5,
      })
      n.material.needsUpdate = true
      count++
      if (import.meta.env.DEV)
        console.log(`[RoadMaterial] Applied asphalt to "${n.name}"`)
    })

    if (import.meta.env.DEV && count === 0)
      console.warn('[RoadMaterial] No road mesh found — check [Alley mesh] logs and refine INCLUDE_KW')
  }, [scene, asphalt])

  return null
}
