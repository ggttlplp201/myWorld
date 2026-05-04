import { useEffect } from 'react'
import { useControls } from 'leva'
import { usePBRTextureSet, applyRepeat } from '../utils/textures'

// py=0.48 — alley slab puts the road surface at approximately world Y=0.48.
// Tune with the Leva panel, then bake.
const D = {
  px: 0,    py: 0.48, pz: 4.0,
  w:  5.5,  l:  8.6,  ry: 0,
  repX: 2.0, repY: 6.0,
}

export const ROAD_Y = D.py

export default function RoadOverlay() {
  const { px, py, pz, w, l, ry, repX, repY } = useControls('RoadOverlay', {
    px:   { value: D.px,   step: 0.05,  label: 'pos X' },
    py:   { value: D.py,   step: 0.01,  label: 'pos Y' },
    pz:   { value: D.pz,   step: 0.1,   label: 'pos Z' },
    w:    { value: D.w,    step: 0.1,   label: 'width' },
    l:    { value: D.l,    step: 0.1,   label: 'length' },
    ry:   { value: D.ry,   step: 0.01,  label: 'rot Y' },
    repX: { value: D.repX, step: 0.25,  label: 'repeat X' },
    repY: { value: D.repY, step: 0.25,  label: 'repeat Y' },
  }, { collapsed: true })

  const tex = usePBRTextureSet('/assets/textures/asphalt', {
    color:     'color.jpg',
    normal:    'normal.jpg',
    roughness: 'rough.jpg',
    ao:        'ao.jpg',
  })

  useEffect(() => { applyRepeat(tex, repX, repY) }, [tex, repX, repY])

  return (
    <mesh
      position={[px, py, pz]}
      rotation={[-Math.PI / 2, 0, ry]}
      renderOrder={1}
    >
      <planeGeometry args={[w, l]} />
      <meshStandardMaterial
        map={tex.map}
        normalMap={tex.normalMap}
        roughnessMap={tex.roughnessMap}
        aoMap={tex.aoMap}
        color="#1c1c1c"
        roughness={0.82}
        metalness={0.0}
        aoMapIntensity={0.7}
        normalScale={[0.4, 0.4]}
        envMapIntensity={0.5}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
    </mesh>
  )
}
