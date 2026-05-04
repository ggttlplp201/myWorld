# Asset Credits

## 3D Models (Sketchfab / Poly Haven)

| File | Source | License |
|---|---|---|
| `delorean.glb` | "DeLorean – Time Machine – Low Poly" (Sketchfab) | CC BY 4.0 — verify on download page |
| `alley.glb` | "Cyberpunk Storefront / Alleyway" (Sketchfab) | CC BY 4.0 — verify on download page |
| `neon_sign.glb` | "Neon Open Sign" (Sketchfab) | CC BY 4.0 — verify on download page |
| `pipes.glb` | "Pipes" (Sketchfab) | CC BY 4.0 — verify on download page |

## Textures (Poly Haven)

| Folder | Source | License |
|---|---|---|
| `asphalt/` | "Asphalt 025C" — polyhaven.com | CC0 — free for any use |

## HDRI

| File | Source | License |
|---|---|---|
| `street_lamp.hdr` | "Street Lamp 2K" — polyhaven.com | CC0 — free for any use |

## Skipped for v1 (too heavy or deferred)

- `dumpsters.glb` — 12MB, needs Blender decimation
- `low_poly__plastic_garbage_bags.glb` — 16MB, needs Blender decimation
- `dumpster.glb` — 2.9MB, good for v2
- `air_conditioner_unit_low_poly.glb` — 5.2MB, good for v2 wall detail
- `electrical_boxes.glb` — 4MB, good for v2
- `cables.glb` — 1.1MB, good for v2
- `cyberpunk_animated_japanese_led_neon_sign.glb` — 3.3MB, good for v2

## Blender Optimization Needed

- `dumpsters.glb`: Reduce poly count by ~60%, merge into one object, re-export
- `low_poly__plastic_garbage_bags.glb`: Investigate why 16MB for "low poly" — likely uncompressed textures
