import { useEffect, useRef } from 'react'
import { useControls } from 'leva'
import * as THREE from 'three'
import { usePBRTextureSet } from '../utils/textures'
import { TEXTURE_DEFS } from '../utils/alleyMaterials'

const T = '/assets/textures'

// ---------------------------------------------------------------------------
// Emissive / road helpers
// ---------------------------------------------------------------------------

function materialIsActuallyEmissive(m) {
  const name = (m.name || '').toLowerCase()
  const knownGlow = ['window','lamp','light','neon','noen','sign','hologram','glow'].some(k => name.includes(k))
  const e = m.emissive
  return knownGlow || (!!e && (e.r > 0.01 || e.g > 0.01 || e.b > 0.01))
}

function isEmissive(n) {
  if (n.userData.isEmissive !== undefined) return n.userData.isEmissive
  const mats = Array.isArray(n.material) ? n.material : [n.material]
  return mats.some(materialIsActuallyEmissive)
}

const ROAD_MATS = new Set(['Asphalt', 'Road'])
const isRoad = n => (n.userData.originalMaterialNames ?? []).some(m => ROAD_MATS.has(m))

// ---------------------------------------------------------------------------
// Category table — fallback only; MESH_TEXTURE_OVERRIDES takes priority
// ---------------------------------------------------------------------------

const CATS = [
  { id: 'walls',      dbg: '#aa00ff', test: ({ materialName }) => materialName === 'Building_Walls' },
  { id: 'roofCap',    dbg: '#ff00cc', test: ({ materialName, meshName }) => materialName === 'Building_Texture_2' || meshName === 'Plane__0' },
  { id: 'concrete',   dbg: '#00ffff', test: ({ materialName }) => materialName === 'Concrete' },
  { id: 'curb',       dbg: '#00ccff', test: ({ materialName }) => materialName === 'Curb' },
  { id: 'wires',      dbg: '#00ff44', test: ({ materialName }) => materialName === 'Wires' || materialName === 'Wires_2' },
  { id: 'railing',    dbg: '#ffff00', test: ({ materialName }) => materialName === 'Railing' || materialName === 'Metal027_2K-JPG' },
  { id: 'metal',      dbg: '#cccccc', test: ({ materialName }) => materialName === 'Metal' || materialName === 'Door_Frame' || materialName === 'wINDOW_bLINDS' },
  { id: 'door',       dbg: '#ff8800', test: ({ materialName }) => materialName.startsWith('Metal_Door') },
  { id: 'pipes',      dbg: '#aaaaff', test: ({ materialName }) => materialName === 'Material002' },
  { id: 'lamppost',   dbg: '#cc8844', test: ({ meshName }) => meshName === 'Placeholder_Lamppost_Metal_0' },
  { id: 'floorStrip', dbg: '#ffaa00', test: ({ materialName }) => ['Material.001','Material.002','Material.003'].includes(materialName) },
  { id: 'darkTrim',   dbg: '#ff66cc', test: ({ materialName }) => ['Material.004','Material.005','Material.006'].includes(materialName) },
]

// Debug solid colors built once at module level
const DBG_BY_ID = Object.fromEntries(
  CATS.map(c => [c.id, new THREE.MeshBasicMaterial({ name: `debug_${c.id}`, color: c.dbg })])
)
const DBG_OVERRIDE = new THREE.MeshBasicMaterial({ name: 'debug_override', color: '#ff00ff' })

function classify(n) {
  const names    = n.userData.originalMaterialNames ?? []
  const meshName = n.userData.originalMeshName ?? ''
  for (const cat of CATS) {
    const matches = names.length > 0
      ? names.some(materialName => cat.test({ materialName, meshName }))
      : cat.test({ materialName: '', meshName })
    if (matches) return cat.id
  }
  return null
}

// ---------------------------------------------------------------------------
// Material builder — clones textures so each material has independent repeat
// ---------------------------------------------------------------------------

function buildMaterial(texKey, texSets) {
  const def = TEXTURE_DEFS[texKey]
  if (!def) return null

  const props = {
    name:            `texture_${texKey}`,
    color:           new THREE.Color(def.color),
    roughness:       def.roughness,
    metalness:       def.metalness ?? 0,
    envMapIntensity: def.envMap ?? 1.0,
  }

  const raw = def.texSet ? texSets[def.texSet] : null
  if (raw) {
    const [ru, rv] = def.repeat
    for (const [k, v] of Object.entries(raw)) {
      if (v?.isTexture) {
        const t = v.clone()
        if (k === 'map') t.colorSpace = THREE.SRGBColorSpace
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(ru, rv)
        t.needsUpdate = true
        props[k] = t
      }
    }
  }

  const m = new THREE.MeshStandardMaterial(props)
  if (props.aoMap)     m.aoMapIntensity = def.aoIntensity ?? 0.8
  if (props.normalMap) m.normalScale.set(0.5, 0.5)
  return m
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AlleyTextures({ scene, meshOverrides = {} }) {
  const { meshDebug, colorAll, uncatDebug } = useControls('AlleyTextures', {
    meshDebug:  { value: false, label: 'Category debug colors' },
    colorAll:   { value: false, label: 'Paint all orange' },
    uncatDebug: { value: false, label: 'Uncategorized debug (hot pink)' },
  }, { collapsed: true })

  // One usePBRTextureSet call per unique texture folder
  const texPlaster    = usePBRTextureSet(`${T}/plaster`,          { color: 'color.jpg', normal: 'normal.jpg', roughness: 'rough.jpg' })
  const texBricks     = usePBRTextureSet(`${T}/bricks`,           { color: 'color.jpg', normal: 'normal.jpg', roughness: 'rough.jpg', ao: 'ao.jpg' })
  const texConcrete   = usePBRTextureSet(`${T}/concrete020`,       { color: 'color.jpg', normal: 'normal.jpg', roughness: 'rough.jpg' })
  const texCurb       = usePBRTextureSet(`${T}/concrete-walk`,     { color: 'color.jpg', normal: 'normal.jpg', roughness: 'rough.jpg' })
  const texRubber     = usePBRTextureSet(`${T}/rubber`,            { color: 'color.jpg', normal: 'normal.jpg', roughness: 'rough.jpg' })
  const texPainted    = usePBRTextureSet(`${T}/painted-metal006`,  { color: 'color.jpg', normal: 'normal.jpg', roughness: 'rough.jpg', metalness: 'metalness.jpg', ao: 'ao.jpg' })
  const texMetalTrim  = usePBRTextureSet(`${T}/metal-trim`,        { color: 'color.jpg', normal: 'normal.jpg', roughness: 'rough.jpg', metalness: 'metalness.jpg' })
  const texCorrugated = usePBRTextureSet(`${T}/corrugated-steel`,  { color: 'color.jpg', normal: 'normal.jpg', roughness: 'rough.jpg', metalness: 'metalness.jpg', ao: 'ao.jpg' })
  const texWood       = usePBRTextureSet(`${T}/wood015`,           { color: 'color.jpg', normal: 'normal.jpg', roughness: 'rough.jpg' })
  const texMetal006   = usePBRTextureSet(`${T}/metal006`,          { color: 'color.jpg', normal: 'normal.jpg', roughness: 'rough.jpg', metalness: 'metalness.jpg' })
  const texMetal025   = usePBRTextureSet(`${T}/metal025`,          { color: 'color.jpg', normal: 'normal.jpg', roughness: 'rough.jpg', metalness: 'metalness.jpg' })
  const texRust       = usePBRTextureSet(`${T}/rust`,              { color: 'color.jpg', normal: 'normal.jpg', roughness: 'rough.jpg', metalness: 'metalness.jpg' })
  const texPMetal014  = usePBRTextureSet(`${T}/painted-metal014`,  { color: 'color.jpg', normal: 'normal.jpg', roughness: 'rough.jpg', metalness: 'metalness.jpg', ao: 'ao.jpg' })
  const texSmear      = usePBRTextureSet(`${T}/smear`,             { color: 'color.jpg', normal: 'normal.jpg', roughness: 'rough.jpg' })

  const texSets = {
    'plaster':          texPlaster,
    'bricks':           texBricks,
    'concrete020':      texConcrete,
    'concrete-walk':    texCurb,
    'rubber':           texRubber,
    'painted-metal006': texPainted,
    'metal-trim':       texMetalTrim,
    'corrugated-steel': texCorrugated,
    'wood015':          texWood,
    'metal006':         texMetal006,
    'metal025':         texMetal025,
    'rust':             texRust,
    'painted-metal014': texPMetal014,
    'smear':            texSmear,
  }

  const registry       = useRef(null)
  const matCacheRef    = useRef({})
  const originals      = useRef(new Map())
  const uncatOriginals = useRef(new Map())

  // Registry — runs once, stamps userData
  useEffect(() => {
    const map = new Map()
    let total = 0
    scene.traverse(n => {
      if (!n.isMesh) return
      total++
      const mats = Array.isArray(n.material) ? n.material : [n.material]
      if (!n.userData.originalMeshName)       n.userData.originalMeshName       = n.name
      if (!n.userData.originalMaterialNames)  n.userData.originalMaterialNames  = mats.map(m => m.name)
      if (n.userData.isEmissive === undefined) n.userData.isEmissive             = mats.some(materialIsActuallyEmissive)
      if (isEmissive(n)) return
      const cat = classify(n)
      if (cat) {
        map.set(n, cat)
        console.log(`[AlleyTextures] "${n.userData.originalMeshName}"  mat="${n.userData.originalMaterialNames.join('|')}"  → ${cat}`)
      }
    })
    registry.current = map
    console.log(`[AlleyTextures] total=${total}  matched=${map.size}`)
  }, [scene])

  // Material cache — rebuild only when textures change (not on every override)
  useEffect(() => {
    const cache = {}
    Object.keys(TEXTURE_DEFS).forEach(key => {
      cache[key] = buildMaterial(key, texSets)
    })
    matCacheRef.current = cache
  }, [texPlaster, texBricks, texConcrete, texCurb, texRubber, texPainted, texMetalTrim, texCorrugated, texWood, texMetal006, texMetal025, texRust, texPMetal014, texSmear]) // eslint-disable-line react-hooks/exhaustive-deps

  // colorAll debug
  useEffect(() => {
    if (colorAll) {
      const orange = new THREE.MeshBasicMaterial({ name: 'debug_orange', color: '#ff4400' })
      let count = 0
      scene.traverse(n => {
        if (!n.isMesh || isEmissive(n)) return
        if (!originals.current.has(n)) originals.current.set(n, n.material)
        n.material = orange
        count++
      })
      console.log(`[AlleyTextures] colorAll: painted ${count} meshes`)
    } else {
      originals.current.forEach((mat, n) => {
        if (!registry.current?.has(n)) n.material = mat
      })
    }
  }, [scene, colorAll])

  // uncatDebug — hot-pink for meshes with no category and no override
  useEffect(() => {
    if (!registry.current) return
    if (uncatDebug && !colorAll) {
      const hotPink = new THREE.MeshBasicMaterial({ name: 'debug_uncat', color: '#ff007f' })
      let count = 0
      scene.traverse(n => {
        if (!n.isMesh || isEmissive(n) || isRoad(n)) return
        const meshName = n.userData.originalMeshName ?? n.name
        if (registry.current.has(n) || (meshOverrides[meshName] && meshOverrides[meshName] !== 'original')) return
        if (!uncatOriginals.current.has(n)) uncatOriginals.current.set(n, n.material)
        n.material = hotPink
        count++
        n.updateWorldMatrix(true, true)
        const box = new THREE.Box3().setFromObject(n)
        const c = new THREE.Vector3(), s = new THREE.Vector3()
        box.getCenter(c); box.getSize(s)
        console.log('[Uncategorized]', {
          mesh:      meshName,
          materials: n.userData.originalMaterialNames ?? [],
          center:    c.toArray().map(v => +v.toFixed(2)),
          size:      s.toArray().map(v => +v.toFixed(2)),
        })
      })
      console.log(`[Uncategorized] painted ${count} meshes`)
    } else {
      uncatOriginals.current.forEach((mat, n) => { n.material = mat })
      uncatOriginals.current.clear()
    }
  }, [scene, uncatDebug, colorAll, meshOverrides])

  // Apply textures — override (exact mesh name) first, then category fallback
  useEffect(() => {
    if (colorAll || !registry.current) return
    const cache = matCacheRef.current

    scene.traverse(n => {
      if (!n.isMesh || isEmissive(n) || isRoad(n)) return
      const meshName = n.userData.originalMeshName ?? n.name

      // 1. Exact mesh override
      const overrideKey = meshOverrides[meshName]
      if (overrideKey && overrideKey !== 'original') {
        n.material = meshDebug
          ? (DBG_OVERRIDE)
          : (cache[overrideKey] ?? n.material)
        return
      }

      // 2. Category fallback
      const catId = registry.current.get(n)
      if (catId) {
        n.material = meshDebug
          ? (DBG_BY_ID[catId] ?? DBG_OVERRIDE)
          : (cache[catId] ?? n.material)
      }
      // 3. No match — leave original material untouched
    })
  }, [scene, colorAll, meshDebug, meshOverrides, matCacheRef]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
