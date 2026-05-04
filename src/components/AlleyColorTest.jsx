import { useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { useControls } from 'leva'
import * as THREE from 'three'

export default function AlleyColorTest() {
  const { scene } = useGLTF('/assets/alley.glb')

  const { colorAll } = useControls('AlleyColorTest', {
    colorAll: { value: false, label: 'paint all orange' },
  }, { collapsed: true })

  useEffect(() => {
    // Test A: add a bright orange box directly into the useGLTF scene object.
    // If this box appears at (0, 3, 5) → we share the same scene instance as Alley.
    // If it does NOT appear → scene is a different clone and material mutations are useless.
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: '#ff4400' })
    )
    box.position.set(0, 3, 5)
    box.name = '__debug_orange_box__'

    if (colorAll) {
      scene.add(box)
    }

    // Test B: traverse and repaint all non-emissive meshes orange
    const orange = new THREE.MeshBasicMaterial({ color: '#ff4400' })
    let count = 0
    scene.traverse(n => {
      if (!n.isMesh) return
      const mats = Array.isArray(n.material) ? n.material : [n.material]
      if (mats.some(m => m.emissiveIntensity > 0.5)) return
      if (colorAll) {
        n.material = orange
        count++
      }
    })

    console.log(`[AlleyColorTest] colorAll=${colorAll}  meshes_painted=${count}  scene_children=${scene.children.length}`)

    return () => {
      scene.remove(box)
    }
  }, [scene, colorAll])

  // Test C: declarative R3F mesh — if this bright box appears at (0, 5, 5)
  // the component IS mounted and rendering. Completely independent of scene mutation.
  return colorAll ? (
    <mesh position={[0, 5, 5]}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshBasicMaterial color="#00ff00" />
    </mesh>
  ) : null
}
