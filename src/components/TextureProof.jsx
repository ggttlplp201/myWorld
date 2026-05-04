import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

// Temporary debug component — a 2×2 plane at eye level right in front of the
// camera (Z=15, Y=2.5). If bricks appear here, texture loading from the public
// folder is working. Remove this component once the texture pass is confirmed.
export default function TextureProof() {
  const map = useTexture('/assets/textures/bricks/color.jpg')
  map.colorSpace = THREE.SRGBColorSpace
  map.wrapS = map.wrapT = THREE.RepeatWrapping
  map.repeat.set(1, 1)

  return (
    <mesh position={[0, 2.5, 15]} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial map={map} side={THREE.DoubleSide} />
    </mesh>
  )
}
