import { useEffect, useState, Suspense } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { useGLTF, OrbitControls, Bounds } from '@react-three/drei'
import * as THREE from 'three'

/* ── inner component: loads GLB, gathers data, frames camera ── */
function AlleyInspector({ onInfo, onBox }) {
  const { scene } = useGLTF('/assets/alley.glb')
  const { camera } = useThree()

  useEffect(() => {
    if (!scene) return

    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)

    // Gather per-material data
    const matMap = new Map()
    const nodes = []
    let meshCount = 0

    scene.traverse(node => {
      nodes.push(`${node.name || '(anon)'} [${node.type}]`)
      if (!node.isMesh) return
      meshCount++
      const mats = Array.isArray(node.material) ? node.material : [node.material]
      mats.forEach(m => {
        if (matMap.has(m.uuid)) return
        const texKeys = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap']
        const texCount = texKeys.filter(k => m[k]).length
        const em = m.emissive
        matMap.set(m.uuid, {
          name: m.name || '(unnamed)',
          type: m.type,
          textures: texCount,
          emissive: em ? `rgb(${[em.r, em.g, em.b].map(v => Math.round(v * 255)).join(',')})` : 'n/a',
          emissiveIntensity: m.emissiveIntensity ?? 'n/a',
          color: m.color ? `rgb(${[m.color.r, m.color.g, m.color.b].map(v => Math.round(v * 255)).join(',')})` : 'n/a',
        })
      })
    })

    const materials = [...matMap.values()]
    const totalTextures = materials.reduce((s, m) => s + m.textures, 0)

    // Frame camera: pull back far enough to see the whole model
    const maxDim = Math.max(size.x, size.y, size.z)
    const fovRad = (camera.fov ?? 60) * (Math.PI / 180)
    const dist = (maxDim / 2) / Math.tan(fovRad / 2) * 1.6
    camera.position.set(center.x, center.y + maxDim * 0.25, center.z + dist)
    camera.lookAt(center.x, center.y, center.z)
    camera.near = 0.01
    camera.far = dist * 20
    camera.updateProjectionMatrix()

    const info = {
      size:      `${size.x.toFixed(3)} × ${size.y.toFixed(3)} × ${size.z.toFixed(3)}`,
      center:    `${center.x.toFixed(3)}, ${center.y.toFixed(3)}, ${center.z.toFixed(3)}`,
      meshCount,
      totalTextures,
      materials,
      nodes: nodes.slice(0, 50),
    }

    onInfo(info)
    onBox({ dims: [size.x, size.y, size.z], center: [center.x, center.y, center.z] })

    // Also dump to console for easy copy-paste
    console.group('=== ALLEY GLB DEBUG ===')
    console.log('Path:     /assets/alley.glb')
    console.log('Size:    ', size)
    console.log('Center:  ', center)
    console.log('Meshes:  ', meshCount)
    console.log('Textures:', totalTextures)
    console.log('Materials:', materials)
    console.log('Nodes:   ', nodes)
    console.groupEnd()
  }, [scene]) // intentionally omits camera/onInfo/onBox — runs once on load

  return <primitive object={scene} />
}

/* ── main debug viewer ── */
export default function DebugViewer() {
  const [info, setInfo] = useState(null)
  const [box,  setBox]  = useState(null)

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a', display: 'flex' }}>

      {/* ── 3-D canvas ── */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas
          camera={{ position: [0, 10, 40], fov: 60 }}
          style={{ position: 'absolute', inset: 0 }}
          gl={{ antialias: true }}
        >
          {/* Neutral diagnostic lighting — not stylized */}
          <ambientLight color="#ffffff" intensity={1.5} />
          <directionalLight position={[10, 20, 10]}  intensity={2.5} />
          <directionalLight position={[-10, 10, -10]} intensity={0.8} color="#aaccff" />

          {/* Scene helpers */}
          <axesHelper args={[10]} />
          <gridHelper args={[100, 100, '#444', '#222']} />

          {/* Model */}
          <Suspense fallback={null}>
            <AlleyInspector onInfo={setInfo} onBox={setBox} />
          </Suspense>

          {/* Wireframe bounding box */}
          {box && (
            <mesh position={box.center}>
              <boxGeometry args={box.dims} />
              <meshBasicMaterial wireframe color="#00ff88" transparent opacity={0.55} />
            </mesh>
          )}

          <OrbitControls makeDefault />
        </Canvas>

        {!info && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#00ff88', fontFamily: 'monospace', fontSize: 14,
            pointerEvents: 'none',
          }}>
            Loading /assets/alley.glb …
          </div>
        )}
      </div>

      {/* ── debug panel ── */}
      <div style={{
        width: 360, flexShrink: 0,
        background: '#111', borderLeft: '1px solid #333',
        overflowY: 'auto', padding: '16px 14px',
        fontFamily: 'Courier New, monospace', fontSize: 11,
        color: '#00ff88', lineHeight: 1.7,
      }}>
        <div style={{ color: '#fff', fontSize: 13, fontWeight: 'bold', marginBottom: 14, letterSpacing: '0.1em' }}>
          ASSET DEBUGGER
        </div>
        <Row label="File" value="/assets/alley.glb" />

        {!info ? (
          <div style={{ color: '#888', marginTop: 12 }}>Waiting for asset…</div>
        ) : (
          <>
            <Row label="Meshes"    value={info.meshCount} />
            <Row label="Textures"  value={info.totalTextures} warn={info.totalTextures === 0} />
            <Row label="Size XYZ"  value={info.size} />
            <Row label="Center"    value={info.center} />

            <Divider label="MATERIALS" />
            {info.materials.length === 0
              ? <Warn>No materials found!</Warn>
              : info.materials.map((m, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ color: '#fff' }}>· {m.name}</div>
                  <div style={{ color: '#888', paddingLeft: 10 }}>
                    type: {m.type}<br />
                    textures: {m.textures}<br />
                    color: <span style={{ color: '#ffcc88' }}>{m.color}</span><br />
                    emissive: <span style={{ color: '#ff88cc' }}>{m.emissive}</span>
                    {' '}× {m.emissiveIntensity}
                  </div>
                </div>
              ))
            }

            <Divider label="SCENE NODES (first 50)" />
            {info.nodes.map((n, i) => (
              <div key={i} style={{ color: '#88ccff', marginBottom: 2, fontSize: 10 }}>· {n}</div>
            ))}

            <div style={{ marginTop: 16, color: '#555', fontSize: 10, borderTop: '1px solid #333', paddingTop: 10 }}>
              All data also logged to browser console (grouped).
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, warn }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
      <span style={{ color: '#888', minWidth: 100 }}>{label}</span>
      <span style={{ color: warn ? '#ff4444' : '#fff', fontWeight: warn ? 'bold' : 'normal' }}>{String(value)}</span>
    </div>
  )
}
function Divider({ label }) {
  return <div style={{ color: '#ffaa00', fontSize: 10, letterSpacing: '0.15em', marginTop: 16, marginBottom: 8 }}>— {label}</div>
}
function Warn({ children }) {
  return <div style={{ color: '#ff4444', fontWeight: 'bold' }}>{children}</div>
}
