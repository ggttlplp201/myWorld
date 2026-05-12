import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { useControls, button } from 'leva'
import * as THREE from 'three'
import { PICKER_KEYS } from '../utils/alleyMaterials'

// Cyan highlight for initial selection (before any key is assigned)
const SEL_MAT = new THREE.MeshBasicMaterial({ color: '#00ffff', side: THREE.DoubleSide })

// Solid-color previews per picker key — applied immediately on dropdown change
// for instant feedback before AlleyTextures re-renders with the real PBR material
const PREVIEW_MAT = {
  plaster:         new THREE.MeshBasicMaterial({ color: '#c4b89a' }),
  concrete:        new THREE.MeshBasicMaterial({ color: '#9a9184' }),
  brick:           new THREE.MeshBasicMaterial({ color: '#9a7860' }),
  darkMetal:       new THREE.MeshBasicMaterial({ color: '#1a1a1a' }),
  metalTrim:       new THREE.MeshBasicMaterial({ color: '#505050' }),
  rubber:          new THREE.MeshBasicMaterial({ color: '#0a0a0a' }),
  corrugatedMetal: new THREE.MeshBasicMaterial({ color: '#606060' }),
  woodPole:        new THREE.MeshBasicMaterial({ color: '#5c3d28' }),
}

export default function TexturePicker({ meshOverrides = {}, onOverride }) {
  const { camera, gl, scene } = useThree()

  const selectedRef       = useRef(null)  // currently highlighted mesh
  const savedMatRef       = useRef(null)  // material before SEL_MAT — null after assignment
  const meshOverridesRef  = useRef(meshOverrides)
  const fnCopySel  = useRef(() => {})
  const fnCopyAll  = useRef(() => {})
  const fnClear    = useRef(() => {})

  // Keep fresh ref so button closures never go stale
  useEffect(() => { meshOverridesRef.current = meshOverrides }, [meshOverrides])

  const [{ enabled, category }, set] = useControls('TexturePicker', () => ({
    enabled:  { value: false, label: '▶ Enable (click mesh)' },
    mesh:     { value: '—',   label: 'Mesh name' },
    mat:      { value: '—',   label: 'Materials' },
    center:   { value: '—',   label: 'World center' },
    size:     { value: '—',   label: 'World size' },
    multiMat: { value: '—',   label: '⚠ multi-material' },
    category: { value: 'original', options: PICKER_KEYS, label: 'Texture key' },
    'Copy selected': button(() => fnCopySel.current()),
    'Copy all':      button(() => fnCopyAll.current()),
    'Clear':         button(() => fnClear.current()),
  }), { collapsed: true })

  // Button delegates — updated each render
  fnCopySel.current = () => {
    const m = selectedRef.current
    if (!m) { console.warn('[TexturePicker] nothing selected'); return }
    const name = m.userData.originalMeshName ?? m.name
    const out  = JSON.stringify({ [name]: meshOverridesRef.current[name] ?? 'original' }, null, 2)
    navigator.clipboard.writeText(out)
    console.log('[TexturePicker] copied selected:\n', out)
  }

  fnCopyAll.current = () => {
    const out = JSON.stringify(meshOverridesRef.current, null, 2)
    navigator.clipboard.writeText(out)
    console.log('[TexturePicker] all mappings:\n', out)
  }

  fnClear.current = () => {
    if (selectedRef.current && savedMatRef.current !== null) {
      selectedRef.current.material = savedMatRef.current
    }
    selectedRef.current = null
    savedMatRef.current = null
    set({ mesh: '—', mat: '—', center: '—', size: '—', multiMat: '—', category: 'original' })
  }

  // Respond to dropdown changes
  useEffect(() => {
    const m = selectedRef.current
    if (!m) return
    const name = m.userData.originalMeshName ?? m.name

    if (category === 'original') {
      // Remove override — AlleyTextures will restore category or original material
      const next = { ...meshOverridesRef.current }
      delete next[name]
      onOverride?.(next)
      // Restore saved material while AlleyTextures re-applies
      if (savedMatRef.current !== null) m.material = savedMatRef.current
    } else {
      // Apply override — show preview immediately, real PBR follows via AlleyTextures
      onOverride?.({ ...meshOverridesRef.current, [name]: category })
      m.material = PREVIEW_MAT[category] ?? SEL_MAT
      savedMatRef.current = null  // assignment made — don't restore on deselect
    }
  }, [category]) // eslint-disable-line react-hooks/exhaustive-deps

  // Raycast click handler
  useEffect(() => {
    if (!enabled) {
      if (selectedRef.current && savedMatRef.current !== null) {
        selectedRef.current.material = savedMatRef.current
      }
      selectedRef.current = null
      savedMatRef.current = null
      return
    }

    const canvas = gl.domElement
    const rc = new THREE.Raycaster()
    let downX = 0, downY = 0

    const onDown = e => { downX = e.clientX; downY = e.clientY }

    const onClick = e => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) return

      const rect  = canvas.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width)  *  2 - 1,
        ((e.clientY - rect.top)  / rect.height) * -2 + 1,
      )
      rc.setFromCamera(mouse, camera)
      const hits = rc.intersectObject(scene, true).filter(h => h.object.isMesh)
      if (!hits.length) return

      const mesh = hits[0].object
      if (mesh === selectedRef.current) return

      // Restore previous selection's material (only if no assignment was made)
      if (selectedRef.current && savedMatRef.current !== null) {
        selectedRef.current.material = savedMatRef.current
      }

      if (!mesh.userData.originalMeshName) mesh.userData.originalMeshName = mesh.name

      // Warn if combined mesh (single mesh, multiple material slots)
      const matArray = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      if (matArray.length > 1) {
        console.warn('[TexturePicker] combined mesh — multiple material slots, cannot texture individual faces:', {
          mesh: mesh.userData.originalMeshName,
          slots: matArray.map(m => m.name),
        })
      }

      selectedRef.current = mesh
      savedMatRef.current = mesh.material  // save current (AlleyTextures or original)

      const name    = mesh.userData.originalMeshName
      const current = meshOverridesRef.current[name] ?? 'original'

      // Show highlight or existing preview
      mesh.material = current === 'original' ? SEL_MAT : (PREVIEW_MAT[current] ?? SEL_MAT)

      mesh.updateWorldMatrix(true, true)
      const box = new THREE.Box3().setFromObject(mesh)
      const c   = new THREE.Vector3(), s = new THREE.Vector3()
      box.getCenter(c); box.getSize(s)
      const fmt = v => v.toFixed(2)

      set({
        mesh:     name,
        mat:      (mesh.userData.originalMaterialNames ?? []).join(', '),
        center:   c.toArray().map(fmt).join(', '),
        size:     s.toArray().map(fmt).join(', '),
        multiMat: matArray.length > 1 ? `${matArray.length} slots — texture applies to all` : '—',
        category: current,
      })

      console.log('[TexturePicker]', {
        mesh: name, materials: mesh.userData.originalMaterialNames,
        center: c.toArray().map(v => +fmt(v)), size: s.toArray().map(v => +fmt(v)),
        currentKey: current,
      })
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('click', onClick)
    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('click', onClick)
    }
  }, [enabled, camera, gl, scene, set])

  return null
}
