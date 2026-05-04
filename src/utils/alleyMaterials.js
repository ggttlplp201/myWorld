// ---------------------------------------------------------------------------
// Exact originalMeshName → texture key
// Paste TexturePicker "Copy all" output here to persist assignments.
// ---------------------------------------------------------------------------
export const MESH_TEXTURE_OVERRIDES = {
  "Building_Top_Building_Texture_2_0": "metal025",
  "Shop_Top_Building_Texture_2_0":     "metal025",
  "Storeftront_Roof001_Railing_0":     "metal027",
  "Cube026_Railing_0":                 "metal027",
  "Placeholder_Lamppost_Metal_0":      "woodPole",
  "Cube014_Material004_0":             "rust",
  "Cube014_Metal_0":                   "paintedMetal014",
  "Cube040_Concrete_0":                "smear",
}

// ---------------------------------------------------------------------------
// Texture key definitions
// texSet: key into AlleyTextures' texSets map (null = solid-color only)
// repeat: [u, v] — cloned per material so keys sharing a texSet stay independent
// ---------------------------------------------------------------------------
export const TEXTURE_DEFS = {
  // ── Picker-selectable ─────────────────────────────────────────────────────
  plaster:         { texSet: 'plaster',          repeat: [3, 4], color: '#b8aa9a', roughness: 0.85, metalness: 0,    envMap: 0.35 },
  concrete:        { texSet: 'concrete020',       repeat: [3, 3], color: '#9a9184', roughness: 0.88, metalness: 0,    envMap: 0.35 },
  brick:           { texSet: 'bricks',            repeat: [2, 5], color: '#9a8070', roughness: 0.90, metalness: 0,    envMap: 0.30, aoIntensity: 1.0 },
  darkMetal:       { texSet: null,                repeat: [1, 1], color: '#282828', roughness: 0.70, metalness: 0.80, envMap: 0.80 },
  metalTrim:       { texSet: 'painted-metal006',  repeat: [2, 3], color: '#666666', roughness: 0.48, metalness: 0.75, envMap: 1.1,  aoIntensity: 0.8 },
  rubber:          { texSet: 'rubber',            repeat: [1, 8], color: '#111111', roughness: 0.92, metalness: 0,    envMap: 0.20 },
  corrugatedMetal: { texSet: 'corrugated-steel',  repeat: [2, 3], color: '#707070', roughness: 0.60, metalness: 0.75, envMap: 1.1,  aoIntensity: 0.8 },
  woodPole:        { texSet: 'wood015',           repeat: [1, 8], color: '#3a2a22', roughness: 0.85, metalness: 0,    envMap: 0.20 },

  metal025:        { texSet: 'metal025',          repeat: [2, 2], color: '#888888', roughness: 0.40, metalness: 0.85, envMap: 1.4 },
  metal027:        { texSet: 'metal-trim',        repeat: [2, 3], color: '#606060', roughness: 0.45, metalness: 0.75, envMap: 1.1 },
  rust:            { texSet: 'rust',              repeat: [2, 2], color: '#8a5a3a', roughness: 0.85, metalness: 0.30, envMap: 0.40 },
  paintedMetal014: { texSet: 'painted-metal014',  repeat: [2, 2], color: '#707070', roughness: 0.55, metalness: 0.70, envMap: 1.1,  aoIntensity: 0.8 },
  smear:           { texSet: 'smear',             repeat: [2, 2], color: '#9a9080', roughness: 0.90, metalness: 0,    envMap: 0.30 },

  // ── Internal fallback categories (not shown in picker) ───────────────────
  walls:           { texSet: 'plaster',           repeat: [3, 4], color: '#b8aa9a', roughness: 0.85, metalness: 0,    envMap: 0.35 },
  roofCap:         { texSet: 'bricks',            repeat: [4, 3], color: '#9a8070', roughness: 0.90, metalness: 0,    envMap: 0.30, aoIntensity: 1.0 },
  curb:            { texSet: 'concrete-walk',     repeat: [3, 3], color: '#8a8880', roughness: 0.90, metalness: 0,    envMap: 0.30 },
  wires:           { texSet: 'rubber',            repeat: [1, 8], color: '#111111', roughness: 0.92, metalness: 0,    envMap: 0.20 },
  railing:         { texSet: 'painted-metal006',  repeat: [2, 3], color: '#666666', roughness: 0.48, metalness: 0.75, envMap: 1.1,  aoIntensity: 0.8 },
  metal:           { texSet: 'metal-trim',        repeat: [2, 3], color: '#555555', roughness: 0.55, metalness: 0.65, envMap: 1.0 },
  door:            { texSet: 'corrugated-steel',  repeat: [2, 3], color: '#707070', roughness: 0.60, metalness: 0.75, envMap: 1.1,  aoIntensity: 0.8 },
  pipes:           { texSet: 'metal006',          repeat: [2, 4], color: '#707878', roughness: 0.45, metalness: 0.80, envMap: 1.2 },
  lamppost:        { texSet: 'wood015',           repeat: [2, 6], color: '#8a7060', roughness: 0.80, metalness: 0,    envMap: 0.30 },
  floorStrip:      { texSet: 'metal-trim',        repeat: [2, 3], color: '#505050', roughness: 0.50, metalness: 0.70, envMap: 1.0 },
  darkTrim:        { texSet: 'metal-trim',        repeat: [2, 3], color: '#383838', roughness: 0.55, metalness: 0.60, envMap: 0.9 },
}

// Ordered options shown in TexturePicker dropdown
export const PICKER_KEYS = [
  'original', 'plaster', 'concrete', 'brick',
  'darkMetal', 'metalTrim', 'rubber', 'corrugatedMetal', 'woodPole',
]
