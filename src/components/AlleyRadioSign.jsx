/**
 * AlleyRadioSign — attaches the ALLEY RADIO panel to the translucent sign mesh.
 *
 * Architecture:
 *   AlleyRadioSign (default) — 3D, inside Canvas. Scans scene, tracks selected
 *     mesh via useFrame, places the Html panel flush to the sign surface.
 *   AlleyRadioSignHUD (named) — pure DOM, render OUTSIDE Canvas in App.jsx.
 *
 * Debug:  ?signplace
 *   Controls: mesh select, normal offset, plane X/Y, correction rotations,
 *             scale. "Fit" button auto-computes scale from sign bounding box.
 *   After tuning → Copy constants → paste SIGN_* below.
 */

import { Html } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import AlleyRadioPanel from './music/AlleyRadioPanel'

/* ── Baked constants ──────────────────────────────────────────────────── */
const SIGN_MESH_NAME = 'Cube025_Hologram_Sign_0'   // target mesh in GLB
const SIGN_OFFSET_N  = 0.03                         // nudge in front of sign face
const SIGN_POS       = [5.141, 2.738, 2.660]        // world-space fallback (from signplace)
const SIGN_SCALE     = 0.132387418613481
const SIGN_CORR_ROT  = [Math.PI / 2, 0, 0]          // correction after mesh quaternion
const _BAKED_QUAT    = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0))

/* ── URL param ────────────────────────────────────────────────────────── */
export const IS_SIGN_DEBUG =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('signplace')

/* ── Mesh scan helpers ────────────────────────────────────────────────── */
const KEYWORDS = ['hologram', 'noen', 'sign', 'screen', 'neon', 'panel', 'glass', 'window']

function getMaterialNames(node) {
  return (Array.isArray(node.material) ? node.material : [node.material])
    .map(m => m?.name).filter(Boolean)
}
function nodeMatchesKeyword(node) {
  const all = [node.name, ...getMaterialNames(node)].map(s => s.toLowerCase())
  return KEYWORDS.some(k => all.some(n => n.includes(k)))
}

/* ── Module-level refs shared across reconciler boundary ──────────────── */
// Actual THREE.js mesh objects (can't go in React state)
const _meshesRef = { current: [] }

// Simple pub-sub store for React state that bridges Canvas ↔ DOM
const _defaultControls = {
  meshIdx:  0,
  offsetN:  0.03,   // along sign normal (depth)
  offsetX:  0,      // local sign plane X
  offsetY:  0,      // local sign plane Y
  corrRotX: Math.PI / 2,   // correction after mesh quat — try ±π/2 first
  corrRotY: 0,
  corrRotZ: 0,
  scale:    0.02,   // groupScale → world width = 420 × scale × 0.025
}

const _store = (() => {
  let state = { candidates: [], controls: { ..._defaultControls } }
  const ls = new Set()
  return {
    get: () => state,
    set: upd => { state = { ...state, ...upd }; ls.forEach(l => l(state)) },
    sub: l => { ls.add(l); return () => ls.delete(l) },
  }
})()

function useStore() {
  const [snap, setSnap] = useState(() => _store.get())
  useEffect(() => _store.sub(setSnap), [])
  return snap
}

/* ── Pre-allocated scratch vectors (avoid GC in useFrame) ─────────────── */
const _va = new THREE.Vector3()
const _vb = new THREE.Vector3()
const _vc = new THREE.Vector3()
const _vd = new THREE.Vector3()
const _qa = new THREE.Quaternion()
const _qb = new THREE.Quaternion()
const _sa = new THREE.Vector3()
const _eu = new THREE.Euler()

/* ── 3D sign panel — tracks selected mesh every frame ─────────────────── */
function SignMesh({ targetMesh }) {
  const groupRef = useRef()

  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    const { offsetN, offsetX, offsetY, corrRotX, corrRotY, corrRotZ, scale } =
      _store.get().controls

    if (targetMesh) {
      targetMesh.updateWorldMatrix(true, false)
      targetMesh.matrixWorld.decompose(_va, _qa, _sa)

      // Local axes of the sign mesh in world space
      _vb.set(0, 0, 1).applyQuaternion(_qa)  // mesh local +Z (normal)
      _vc.set(1, 0, 0).applyQuaternion(_qa)  // mesh local +X (right)
      _vd.set(0, 1, 0).applyQuaternion(_qa)  // mesh local +Y (up)

      g.position
        .copy(_va)
        .addScaledVector(_vb, offsetN)
        .addScaledVector(_vc, offsetX)
        .addScaledVector(_vd, offsetY)

      // Base orientation from mesh, then apply correction
      g.quaternion.copy(_qa)
      _eu.set(corrRotX, corrRotY, corrRotZ, 'XYZ')
      _qb.setFromEuler(_eu)
      g.quaternion.multiply(_qb)
    } else {
      g.position.set(...SIGN_POS)
      g.quaternion.copy(_BAKED_QUAT)
    }

    g.scale.setScalar(scale)
  })

  return (
    <group ref={groupRef}>
      <Html transform center occlude={false} zIndexRange={[50, 0]} style={{ pointerEvents: 'auto' }}>
        <AlleyRadioPanel />
      </Html>
    </group>
  )
}

/* ── Wireframe bounding box ───────────────────────────────────────────── */
function BoundsBox({ center, size }) {
  if (!center || !size) return null
  return (
    <mesh position={[center.x, center.y, center.z]}>
      <boxGeometry args={[size.x, size.y, size.z]} />
      <meshBasicMaterial color="#ff00ff" wireframe transparent opacity={0.75} />
    </mesh>
  )
}

/* ── Debug 3D component (inside Canvas) ───────────────────────────────── */
function AlleyRadioSignDebug() {
  const { scene } = useThree()
  const foundRef = useRef(false)
  const { candidates, controls } = useStore()

  useFrame(() => {
    if (foundRef.current || !scene) return
    const found = []
    scene.traverse(n => {
      if (!n.isMesh || !nodeMatchesKeyword(n)) return
      n.updateWorldMatrix(true, true)
      const box    = new THREE.Box3().setFromObject(n)
      const center = box.getCenter(new THREE.Vector3())
      const size   = box.getSize(new THREE.Vector3())
      found.push({ name: n.name || '(unnamed)', matNames: getMaterialNames(n).join(', '), center, size, mesh: n })
    })
    if (found.length > 0) {
      foundRef.current = true
      // Hologram / Noen first
      found.sort((a, b) => {
        const hi = s => ['hologram', 'noen'].some(k => s.toLowerCase().includes(k))
        return (hi(a.name) ? 0 : 1) - (hi(b.name) ? 0 : 1)
      })
      _meshesRef.current = found.map(f => f.mesh)
      const displayCandidates = found.map(({ name, matNames, center, size }) => ({ name, matNames, center, size }))

      // Auto-fit scale from first (hologram) candidate
      const first = found[0]
      const dims  = [first.size.x, first.size.y, first.size.z].sort((a, b) => a - b)
      // Second-smallest dimension = sign face width (smallest = depth/thickness)
      const faceW  = dims[1] || dims[0]
      // panel world width = 420 × scale × 0.025; solve for scale to fit faceW
      const autoScale = Math.max(0.001, Math.min(0.2, faceW / (420 * 0.025)))

      _store.set({
        candidates: displayCandidates,
        controls: { ..._store.get().controls, scale: autoScale },
      })
    }
  })

  const idx        = Math.max(0, Math.min(Math.floor(controls.meshIdx), candidates.length - 1))
  const targetMesh = _meshesRef.current[idx] ?? null
  const sel        = candidates[idx] ?? null

  return (
    <>
      {sel && <BoundsBox center={sel.center} size={sel.size} />}
      <SignMesh targetMesh={targetMesh} />
    </>
  )
}

/* ── Production baked component ───────────────────────────────────────── */
// Same rendering path as SignMesh in debug: Html + AlleyRadioPanel.
// Dynamic mesh lookup so placement always matches signplace exactly.
function AlleyRadioSignBaked() {
  const groupRef    = useRef()
  const signMeshRef = useRef(null)
  const { scene }   = useThree()

  useFrame(() => {
    const g = groupRef.current
    if (!g) return

    // Cache sign mesh — O(n) only on first successful lookup
    if (!signMeshRef.current) {
      signMeshRef.current = scene.getObjectByName(SIGN_MESH_NAME) ?? 'not_found'
    }
    const sign = signMeshRef.current === 'not_found' ? null : signMeshRef.current

    if (sign) {
      sign.updateWorldMatrix(true, false)
      sign.matrixWorld.decompose(_va, _qa, _sa)

      _vb.set(0, 0, 1).applyQuaternion(_qa)
      g.position.copy(_va).addScaledVector(_vb, SIGN_OFFSET_N)

      g.quaternion.copy(_qa)
      _eu.set(...SIGN_CORR_ROT, 'XYZ')
      _qb.setFromEuler(_eu)
      g.quaternion.multiply(_qb)
    } else {
      g.position.set(...SIGN_POS)
      g.quaternion.copy(_BAKED_QUAT)
      _eu.set(...SIGN_CORR_ROT, 'XYZ')
      _qb.setFromEuler(_eu)
      g.quaternion.multiply(_qb)
    }

    g.scale.setScalar(SIGN_SCALE)
  })

  return (
    <group ref={groupRef}>
      <Html transform center occlude={false} zIndexRange={[50, 0]} style={{ pointerEvents: 'auto' }}>
        <AlleyRadioPanel />
      </Html>
    </group>
  )
}

/* ── Default export — 3D only, goes inside Canvas ─────────────────────── */
export default function AlleyRadioSign() {
  return IS_SIGN_DEBUG ? <AlleyRadioSignDebug /> : <AlleyRadioSignBaked />
}

/* ════════════════════════════════════════════════════════════════════════
   Named export: AlleyRadioSignHUD
   Render OUTSIDE the Canvas in App.jsx. Pure React DOM.
   ════════════════════════════════════════════════════════════════════════ */
export function AlleyRadioSignHUD() {
  const { candidates, controls } = useStore()
  const maxIdx = Math.max(0, candidates.length - 1)
  const idx    = Math.max(0, Math.min(Math.floor(controls.meshIdx), maxIdx))
  const sel    = candidates[idx] ?? null

  const set = patch => _store.set({ controls: { ..._store.get().controls, ...patch } })

  const handleFit = () => {
    if (!sel) return
    const dims   = [sel.size.x, sel.size.y, sel.size.z].sort((a, b) => a - b)
    const faceW  = dims[1] || dims[0]
    const fitted = Math.max(0.0005, Math.min(0.2, faceW / (420 * 0.025)))
    set({ scale: fitted })
  }

  const handleCopy = () => {
    const c = controls
    const out = [
      `// ── Paste into AlleyRadioSign.jsx ──`,
      sel ? `// Mesh: "${sel.name}"` : '',
      `const SIGN_POS      = [${sel
        ? [sel.center.x + 0, sel.center.y + 0, sel.center.z + c.offsetN]
            .map(v => v.toFixed(3)).join(', ')
        : SIGN_POS.join(', ')}]`,
      `const SIGN_SCALE    = ${c.scale}`,
      `const SIGN_CORR_ROT = [${[c.corrRotX, c.corrRotY, c.corrRotZ].map(v => v.toFixed(4)).join(', ')}]`,
    ].filter(Boolean).join('\n')
    console.log(out)
    navigator.clipboard?.writeText(out).catch(() => {})
  }

  const label  = { minWidth: 72, display: 'inline-block', opacity: 0.65, fontSize: 9 }
  const valBox = { minWidth: 40, display: 'inline-block', textAlign: 'right', fontSize: 9 }
  const PI     = Math.PI

  const row = (key, text, min, max, step) => {
    const val     = controls[key]
    const isAngle = key.startsWith('corrRot')
    const display = isAngle
      ? `${(val / PI).toFixed(2)}π`
      : Number(val).toFixed(key === 'meshIdx' ? 0 : 4)
    return (
      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
        <span style={label}>{text}</span>
        <input
          type="range" min={min} max={max} step={step} value={val}
          onChange={e => set({ [key]: parseFloat(e.target.value) })}
          style={{ flex: 1, accentColor: '#b66cff' }}
        />
        <span style={valBox}>{display}</span>
      </div>
    )
  }

  const btnStyle = {
    padding: '4px 0', width: '48%', background: 'rgba(60,20,120,0.8)',
    color: '#c89aff', border: '1px solid rgba(182,108,255,0.5)',
    fontFamily: 'Courier New,monospace', fontSize: 9, cursor: 'pointer', borderRadius: 1,
  }

  return (
    <div style={{
      position: 'fixed', top: 16, left: 16, zIndex: 9999,
      background: 'rgba(5,2,14,0.95)', color: '#c89aff',
      padding: '12px 16px', fontFamily: 'Courier New,monospace', fontSize: 10,
      width: 310, border: '1px solid rgba(182,108,255,0.45)', lineHeight: 1.7, borderRadius: 2,
    }}>
      <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 8 }}>
        ◉ SIGN PLACE <span style={{ opacity: 0.5, fontSize: 9 }}>(?signplace)</span>
      </div>

      <div style={{ marginBottom: 8, fontSize: 9, opacity: 0.8 }}>
        {candidates.length === 0 ? 'Scanning scene…' : `${candidates.length} candidates`}
        {sel && (
          <>
            <br /><span style={{ color: '#fff' }}>#{idx}: {sel.name}</span>
            <br />size: {sel.size.x.toFixed(3)} × {sel.size.y.toFixed(3)} × {sel.size.z.toFixed(3)}
          </>
        )}
      </div>

      <div style={{ borderTop: '1px solid rgba(182,108,255,0.2)', paddingTop: 6, marginBottom: 4, fontSize: 9, opacity: 0.5 }}>
        TARGET
      </div>
      {row('meshIdx', 'mesh #',  0,    maxIdx,  1)}

      <div style={{ borderTop: '1px solid rgba(182,108,255,0.2)', paddingTop: 6, marginBottom: 4, marginTop: 4, fontSize: 9, opacity: 0.5 }}>
        POSITION (local sign plane)
      </div>
      {row('offsetN', 'normal',  -0.5, 0.5,   0.005)}
      {row('offsetX', 'plane X', -2,   2,     0.02 )}
      {row('offsetY', 'plane Y', -2,   2,     0.02 )}

      <div style={{ borderTop: '1px solid rgba(182,108,255,0.2)', paddingTop: 6, marginBottom: 4, marginTop: 4, fontSize: 9, opacity: 0.5 }}>
        CORRECTION ROTATION (try ±π/2 on X first)
      </div>
      {row('corrRotX', 'rot X', -PI, PI, 0.05)}
      {row('corrRotY', 'rot Y', -PI, PI, 0.05)}
      {row('corrRotZ', 'rot Z', -PI, PI, 0.05)}

      <div style={{ borderTop: '1px solid rgba(182,108,255,0.2)', paddingTop: 6, marginBottom: 4, marginTop: 4, fontSize: 9, opacity: 0.5 }}>
        SCALE  <span style={{ opacity: 0.6 }}>(world_w = 420 × scale × 0.025)</span>
      </div>
      {row('scale', 'scale', 0.0005, 0.2, 0.0005)}

      <div style={{ marginTop: 6, maxHeight: 90, overflowY: 'auto', fontSize: 8 }}>
        {candidates.map((c, i) => (
          <div
            key={i}
            style={{ color: i === idx ? '#fff' : 'rgba(182,108,255,0.35)', cursor: 'pointer' }}
            onClick={() => set({ meshIdx: i })}
          >
            {i === idx ? '▶ ' : '  '}{i}: {c.name}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button style={btnStyle} onClick={handleFit}>Fit to sign</button>
        <button style={btnStyle} onClick={handleCopy}>Copy constants</button>
      </div>
    </div>
  )
}
