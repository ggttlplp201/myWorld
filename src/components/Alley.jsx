import { Suspense, useEffect, useMemo, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import AlleyTextures from './AlleyTextures'
import TexturePicker from './TexturePicker'
import { MESH_TEXTURE_OVERRIDES } from '../utils/alleyMaterials'

/*
  Asset facts (from debug viewer):
    Size (local): 1600 × 1066 × 1600  — model is in centimetres
    Center (local): 0.024, 423.3, 0
    Bottom (local Y): 423.3 − 533.3 = −110  → at scale 0.01 = −1.1m

  With scale={0.01} and position.y=+1.1:
    World size:   16 × 10.7 × 16 m
    World Y min:  0  (floor at ground)
    World Y max:  10.7 m
    World XZ:     −8 to +8 m on both axes, centered at origin
    Front facade: faces +Z (toward camera — confirmed by debug view)

  No rotation needed.
  No external texture files — model uses vertex/material colours only.
*/

const EMISSIVE = {
  Window_1:       { intensity: 2.5 },
  Lamppost_Light: { intensity: 4   },
  Noen_Sign:      { intensity: 6   },
}

export default function Alley() {
  const { scene: gltfScene } = useGLTF('/assets/alley.glb')
  const scene = useMemo(() => gltfScene.clone(true), [gltfScene])

  // Picker assignments this session (empty on load, never persists on its own)
  const [pickerOverrides, setPickerOverrides] = useState({})
  // Merged at render time: static code wins as base, picker overrides on top.
  // Spread here (not useMemo) so HMR changes to MESH_TEXTURE_OVERRIDES are
  // always reflected without a full page reload.
  const meshOverrides = { ...MESH_TEXTURE_OVERRIDES, ...pickerOverrides }

  useEffect(() => {
    scene.traverse(n => {
      if (!n.isMesh) return
      const mats = Array.isArray(n.material) ? n.material : [n.material]
      mats.forEach(m => {
        m.envMapIntensity = 2.0
        const cfg = EMISSIVE[m.name]
        if (cfg) {
          m.emissiveIntensity = cfg.intensity
          m.toneMapped = false
          m.needsUpdate = true
        }
      })

      if (import.meta.env.DEV) {
        const isSign = mats.some(m => m.name === 'Noen_Sign')
        if (isSign) {
          n.updateWorldMatrix(true, true)
          const box = new THREE.Box3().setFromObject(n)
          const c   = box.getCenter(new THREE.Vector3())
          const sz  = box.getSize(new THREE.Vector3())
          console.log(
            `[Alley] Noen_Sign mesh "${n.name}"` +
            ` center=[${c.x.toFixed(2)}, ${c.y.toFixed(2)}, ${c.z.toFixed(2)}]` +
            ` size=[${sz.x.toFixed(2)}, ${sz.y.toFixed(2)}, ${sz.z.toFixed(2)}]`
          )
        }
      }
    })
  }, [scene])

  return (
    <group>
      <primitive object={scene} position={[0, 1.1, 0]} scale={0.01} />

      {/* Dark sky plane behind building's back face (world Z ≈ −8) */}
      <mesh position={[0, 6, -14]}>
        <planeGeometry args={[50, 22]} />
        <meshBasicMaterial color="#02010a" />
      </mesh>

      <Suspense fallback={null}>
        <AlleyTextures scene={scene} meshOverrides={meshOverrides} />
        {import.meta.env.DEV && (
          <TexturePicker scene={scene} meshOverrides={meshOverrides} onOverride={setPickerOverrides} />
        )}
      </Suspense>
    </group>
  )
}

useGLTF.preload('/assets/alley.glb')
