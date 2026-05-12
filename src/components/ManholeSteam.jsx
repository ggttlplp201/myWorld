import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useTexture } from '@react-three/drei'
import { useControls, folder } from 'leva'
import * as THREE from 'three'
import { ROAD_Y } from './RoadOverlay'

const MANHOLE_URL = '/assets/dressing/generic_manhole.glb'
const STEAM_FLIPBOOK_URL = '/assets/vfx/DiscSmoke01_16x4.png'
const MANHOLE_Y = ROAD_Y + 0.13
const HOLE_U_OFFSET = 0.175
const FLIPBOOK_COLS = 16
const FLIPBOOK_ROWS = 4
const FLIPBOOK_FRAMES = FLIPBOOK_COLS * FLIPBOOK_ROWS

const STEAM_VERTEX = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const STEAM_FRAGMENT = `
  uniform sampler2D uMap;
  uniform float uFrame;
  uniform float uOpacity;
  uniform vec3 uTint;
  varying vec2 vUv;

  void main() {
    float cols = 16.0;
    float rows = 4.0;
    float frame = mod(floor(uFrame), cols * rows);
    float col = mod(frame, cols);
    float row = floor(frame / cols);
    vec2 frameUv = vec2((col + vUv.x) / cols, 1.0 - ((row + 1.0 - vUv.y) / rows));
    vec4 tex = texture2D(uMap, frameUv);

    float luma = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    float grayDistance = abs(luma - 0.50);
    float bgKey = smoothstep(0.035, 0.22, grayDistance);
    float edgeFade = smoothstep(0.0, 0.12, vUv.x) *
      smoothstep(0.0, 0.12, vUv.y) *
      smoothstep(0.0, 0.12, 1.0 - vUv.x) *
      smoothstep(0.0, 0.12, 1.0 - vUv.y);
    float alpha = bgKey * edgeFade * uOpacity;

    vec3 smoke = mix(uTint * 0.42, uTint * 1.06, clamp(luma, 0.0, 1.0));
    gl_FragColor = vec4(smoke, alpha);
  }
`

function SteamSprites({ count, height, opacity, drift }) {
  const planes = useRef([])
  const texture = useTexture(STEAM_FLIPBOOK_URL)

  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.needsUpdate = true
  }, [texture])

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const a = i * 2.399963
      const r = 0.015 + (i % 2) * 0.02
      return {
        offset: i / count,
        baseX: Math.cos(a) * r,
        baseZ: Math.sin(a) * r,
        swayA: a,
        swayB: a * 0.73 + 1.7,
        speed: 0.16 + (i % 2) * 0.035,
        size: 1.0,
        stretchX: 0.7,
        stretchY: 1.85,
        frameOffset: (i * 11) % FLIPBOOK_FRAMES,
      }
    })
  }, [count])

  const materials = useMemo(() => (
    particles.map(() => new THREE.ShaderMaterial({
      vertexShader: STEAM_VERTEX,
      fragmentShader: STEAM_FRAGMENT,
      uniforms: {
        uMap: { value: texture },
        uFrame: { value: 0 },
        uOpacity: { value: 0 },
        uTint: { value: new THREE.Color('#d7e0e6') },
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
    }))
  ), [particles, texture])

  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime
    particles.forEach((p, i) => {
      const plane = planes.current[i]
      if (!plane) return

      const life = (p.offset + t * p.speed) % 1
      const curl = Math.sin(t * 0.55 + p.swayA + life * 5.0) * drift * 0.06
      const cross = Math.cos(t * 0.42 + p.swayB + life * 4.0) * drift * 0.05
      const y = 0.36 + height * 0.48 + Math.sin(t * 0.7 + p.swayA) * 0.08
      const scale = p.size
      const alpha = opacity * (0.82 + Math.sin(life * Math.PI) * 0.18)
      const frame = p.frameOffset + life * (FLIPBOOK_FRAMES - 1)

      plane.position.set(p.baseX + curl, y, p.baseZ + cross)
      plane.quaternion.copy(camera.quaternion)
      plane.scale.set(scale * p.stretchX * height * 0.3, scale * p.stretchY * height * 0.42, 1)
      plane.material.uniforms.uFrame.value = frame
      plane.material.uniforms.uOpacity.value = Math.max(0, alpha)
    })
  })

  return (
    <group>
      {particles.map((_, i) => (
        <mesh key={i} ref={(el) => { planes.current[i] = el }} material={materials[i]} renderOrder={65}>
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  )
}

export default function ManholeSteam({ showSteam: showSteamOverride }) {
  const { scene: gltfScene } = useGLTF(MANHOLE_URL)
  const manholeScene = useMemo(() => {
    const clone = gltfScene.clone(true)
    clone.traverse((node) => {
      if (!node.isMesh) return
      node.renderOrder = 58
      node.frustumCulled = false
      const mats = Array.isArray(node.material) ? node.material : [node.material]
      mats.forEach((mat) => {
        mat.depthWrite = false
        mat.depthTest = true
        mat.polygonOffset = true
        mat.polygonOffsetFactor = -8
        mat.polygonOffsetUnits = -8
        mat.side = THREE.DoubleSide
        mat.needsUpdate = true
      })
    })
    return clone
  }, [gltfScene])

  const {
    showManhole,
    showSteam,
    x,
    z,
    radius,
    steamCount,
    steamHeight,
    steamOpacity,
    steamDrift,
  } = useControls({
    'Manhole + Steam': folder({
      showManhole: { value: true, label: 'show manhole' },
      showSteam: { value: true, label: 'show steam' },
      x: { value: 5.15, min: -4.0, max: 6.4, step: 0.01, label: 'pos X' },
      z: { value: 5.18, min: 2.4, max: 7.8, step: 0.01, label: 'pos Z' },
      radius: { value: 0.8, min: 0.2, max: 1.2, step: 0.01 },
      steamCount: { value: 2, min: 0, max: 12, step: 1 },
      steamHeight: { value: 4.9, min: 0.4, max: 8.0, step: 0.05 },
      steamOpacity: { value: 0.52, min: 0.0, max: 0.9, step: 0.01 },
      steamDrift: { value: 0.35, min: 0.0, max: 1.6, step: 0.01 },
    }, { collapsed: true }),
  })

  const manholeScale = radius * 2
  const holeOffset = HOLE_U_OFFSET * manholeScale

  return (
    <group position={[x, MANHOLE_Y, z]} name="manhole-steam">
      {showManhole && (
        <primitive object={manholeScene} scale={manholeScale} position={[0, 0.045, 0]} />
      )}

      {(showSteamOverride ?? showSteam) && steamCount > 0 && (
        <>
          <group position={[-holeOffset, 0, 0]}>
            <SteamSprites
              count={Math.ceil(steamCount / 2)}
              height={steamHeight}
              opacity={steamOpacity}
              drift={steamDrift}
            />
          </group>
          <group position={[holeOffset, 0, 0]}>
            <SteamSprites
              count={Math.floor(steamCount / 2)}
              height={steamHeight}
              opacity={steamOpacity}
              drift={steamDrift}
            />
          </group>
        </>
      )}
    </group>
  )
}

useGLTF.preload(MANHOLE_URL)
useTexture.preload(STEAM_FLIPBOOK_URL)
