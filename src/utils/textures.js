import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Load a PBR texture set from a base path.
 * files: { color, normal, roughness, ao, metalness } — include only what exists.
 * Returns an object whose keys match MeshStandardMaterial property names
 * so it can be spread directly: new THREE.MeshStandardMaterial({...textures}).
 */
export function usePBRTextureSet(basePath, files) {
  const paths = {}
  if (files.color)     paths.map          = `${basePath}/${files.color}`
  if (files.normal)    paths.normalMap    = `${basePath}/${files.normal}`
  if (files.roughness) paths.roughnessMap = `${basePath}/${files.roughness}`
  if (files.ao)        paths.aoMap        = `${basePath}/${files.ao}`
  if (files.metalness) paths.metalnessMap = `${basePath}/${files.metalness}`
  return useTexture(paths)
}

/**
 * Set RepeatWrapping + repeat on every texture in a set.
 * Call inside useEffect after useTexture resolves.
 * Also sets correct colorSpace: sRGB for albedo, linear for everything else.
 */
export function applyRepeat(textureSet, rx, ry) {
  if (textureSet.map) textureSet.map.colorSpace = THREE.SRGBColorSpace
  Object.values(textureSet).forEach(t => {
    if (!t?.isTexture) return
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(rx, ry)
    t.needsUpdate = true
  })
}
