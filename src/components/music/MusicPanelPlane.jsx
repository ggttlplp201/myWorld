/**
 * MusicPanelPlane — a real THREE.js mesh with a canvas-rendered texture.
 * Participates in the depth buffer natively: cars/buildings occlude it
 * exactly like any other geometry. No Drei Html, no CSS z-index tricks.
 *
 * Click the mesh to play/pause the local audio track.
 * Canvas is redrawn every frame so the equalizer animates while playing.
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ── Canvas resolution ─────────────────────────────────────────────────── */
const CW = 512
const CH = 1024

/* ── Equalizer constants ───────────────────────────────────────────────── */
const EQ_N      = 44
const EQ_SPEEDS = Array.from({ length: EQ_N }, (_, i) => 0.9  + (i * 0.13) % 1.2)
const EQ_PHASES = Array.from({ length: EQ_N }, (_, i) => (i * 0.51) % (Math.PI * 2))

function eqColor(t) {
  return `rgb(${Math.round(182 + t * 73)},${Math.round(108 - t * 6)},${Math.round(255 - t * 51)})`
}

/* ── Draw rounded-rect path (ctx.roundRect not universal) ──────────────── */
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y,     x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x,     y + h, r)
  ctx.arcTo(x,     y + h, x,     y,     r)
  ctx.arcTo(x,     y,     x + w, y,     r)
  ctx.closePath()
}

/* ── Gradient divider helper ───────────────────────────────────────────── */
function divider(ctx, W, y) {
  const g = ctx.createLinearGradient(0, 0, W, 0)
  g.addColorStop(0,   'transparent')
  g.addColorStop(0.5, 'rgba(182,108,255,0.38)')
  g.addColorStop(1,   'transparent')
  ctx.fillStyle = g
  ctx.fillRect(0, y, W, 1)
}

/* ── Main draw function ────────────────────────────────────────────────── */
function drawPanel(ctx, W, H, song, t, artImg, isPlaying) {
  const P   = Math.round(W * 0.057)    // horizontal padding (~29px at 512)
  const acc = '#b66cff'

  /* Background */
  ctx.fillStyle = 'rgba(7,3,16,0.98)'
  ctx.fillRect(0, 0, W, H)

  /* Border */
  ctx.strokeStyle = 'rgba(182,108,255,0.45)'
  ctx.lineWidth   = 2
  ctx.strokeRect(1, 1, W - 2, H - 2)

  /* Corner brackets */
  const CS = Math.round(W * 0.05)
  ctx.strokeStyle = 'rgba(182,108,255,0.8)'
  ctx.lineWidth   = 3
  ctx.beginPath()
  ctx.moveTo(W - CS, 1);   ctx.lineTo(W - 1, 1);   ctx.lineTo(W - 1, CS)
  ctx.moveTo(1, H - CS);   ctx.lineTo(1, H - 1);   ctx.lineTo(CS, H - 1)
  ctx.stroke()

  /* Scanlines */
  ctx.fillStyle = 'rgba(0,0,0,0.06)'
  for (let sy = 0; sy < H; sy += 3) ctx.fillRect(0, sy + 2, W, 1)

  /* ── HEADER ─────────────────────────────────────────────────────────── */
  let y = P
  const hFS = Math.round(W * 0.09)   // ~46px

  /* Accent bar */
  ctx.fillStyle  = acc
  ctx.shadowColor = acc
  ctx.shadowBlur  = 10
  ctx.fillRect(P, y, Math.round(W * 0.008), Math.round(hFS * 0.95))
  ctx.shadowBlur  = 0

  /* ALLEY RADIO */
  ctx.fillStyle    = 'rgba(210,175,255,0.95)'
  ctx.font         = `bold ${hFS}px "Courier New",monospace`
  ctx.textBaseline = 'top'
  ctx.textAlign    = 'left'
  ctx.fillText('ALLEY RADIO', P + Math.round(W * 0.022), y)

  /* LIVE SIGNAL pill */
  const pW = Math.round(W * 0.35), pH = Math.round(W * 0.056)
  const pX = W - P - pW,          pY = y + Math.round(hFS * 0.05)
  rrect(ctx, pX, pY, pW, pH, pH / 2)
  ctx.fillStyle   = 'rgba(40,220,110,0.1)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(40,220,110,0.32)'
  ctx.lineWidth   = 1.5
  ctx.stroke()
  /* Blink dot — only pulses when playing */
  ctx.fillStyle = isPlaying
    ? (Math.sin(t * 5.7) > 0 ? '#44ff88' : 'rgba(68,255,136,0.25)')
    : 'rgba(68,255,136,0.25)'
  ctx.beginPath()
  ctx.arc(pX + pH * 0.55, pY + pH / 2, pH * 0.22, 0, Math.PI * 2)
  ctx.fill()
  /* Label */
  ctx.fillStyle    = 'rgba(100,255,160,0.85)'
  ctx.font         = `${Math.round(W * 0.039)}px "Courier New",monospace`
  ctx.textBaseline = 'middle'
  ctx.fillText('LIVE SIGNAL', pX + pH * 1.05, pY + pH / 2)

  /* Metadata row */
  y += Math.round(hFS * 1.15)
  ctx.textBaseline = 'top'
  ctx.font         = `${Math.round(W * 0.034)}px "Courier New",monospace`
  ctx.fillStyle    = 'rgba(68,255,136,0.4)'
  ctx.fillText('DB: ONLINE', P, y)
  ctx.fillStyle    = 'rgba(182,108,255,0.4)'
  ctx.fillText('  │  SIGNAL LOCKED', P + Math.round(W * 0.28), y)

  /* Divider */
  y += Math.round(W * 0.09)
  divider(ctx, W, y)
  y += Math.round(W * 0.055)

  /* ── NOW PLAYING ─────────────────────────────────────────────────────── */
  ctx.fillStyle = 'rgba(182,108,255,0.38)'
  ctx.font      = `${Math.round(W * 0.042)}px "Courier New",monospace`
  ctx.fillText('NOW  PLAYING', P, y)
  y += Math.round(W * 0.088)

  /* Title */
  ctx.shadowColor = acc
  ctx.shadowBlur  = 22
  ctx.fillStyle   = acc
  ctx.font        = `bold ${Math.round(W * 0.155)}px "Courier New",monospace`
  ctx.fillText(song.title || 'emotion engine', P, y)
  ctx.shadowBlur  = 0
  y += Math.round(W * 0.168)

  /* Artist */
  ctx.fillStyle = 'rgba(200,160,255,0.82)'
  ctx.font      = `${Math.round(W * 0.07)}px "Courier New",monospace`
  ctx.fillText(song.artist || '', P, y)
  y += Math.round(W * 0.083)


  /* ── ARTWORK ─────────────────────────────────────────────────────────── */
  const aW = Math.round(W * 0.72)
  const aX = Math.round((W - aW) / 2)
  const aH = aW   // square

  if (artImg?.complete && artImg.naturalWidth > 0) {
    ctx.drawImage(artImg, aX, y, aW, aH)
  } else {
    const ag = ctx.createLinearGradient(aX, y, aX + aW, y + aH)
    ag.addColorStop(0,   'rgba(80,20,140,0.55)')
    ag.addColorStop(0.5, 'rgba(160,70,220,0.25)')
    ag.addColorStop(1,   'rgba(50,10,90,0.65)')
    ctx.fillStyle    = ag
    ctx.fillRect(aX, y, aW, aH)
    ctx.fillStyle    = 'rgba(182,108,255,0.2)'
    ctx.font         = `${Math.round(aW * 0.28)}px serif`
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('♫', aX + aW / 2, y + aH / 2)
    ctx.textAlign    = 'left'
    ctx.textBaseline = 'top'
  }
  ctx.strokeStyle = 'rgba(182,108,255,0.2)'
  ctx.lineWidth   = 1
  ctx.strokeRect(aX, y, aW, aH)
  y += aH + Math.round(W * 0.05)

  /* ── EQUALIZER ───────────────────────────────────────────────────────── */
  ctx.fillStyle = 'rgba(182,108,255,0.38)'
  ctx.font      = `${Math.round(W * 0.042)}px "Courier New",monospace`
  ctx.fillText('EQUALIZER', P, y)
  y += Math.round(W * 0.068)

  const eqAW   = W - P * 2
  const eqMaxH = Math.round(H * 0.075)
  const bW     = (eqAW - (EQ_N - 1)) / EQ_N

  for (let i = 0; i < EQ_N; i++) {
    const tt = i / (EQ_N - 1)
    const bH = isPlaying
      ? Math.max(2, eqMaxH * (0.1 + 0.9 * (0.5 + 0.5 * Math.sin(t * EQ_SPEEDS[i] + EQ_PHASES[i]))))
      : Math.max(2, eqMaxH * 0.1)   // flat idle bars when paused
    ctx.fillStyle = isPlaying ? eqColor(tt) : `rgba(182,108,255,0.25)`
    ctx.fillRect(P + i * (bW + 1), y + eqMaxH - bH, bW, bH)
  }
  y += eqMaxH + Math.round(W * 0.05)

  /* Divider */
  divider(ctx, W, y)
  y += Math.round(W * 0.038)

  /* ── PLAY / PAUSE CTA ────────────────────────────────────────────────── */
  const btnH = Math.max(60, H - y - Math.round(P * 0.6))
  rrect(ctx, P, y, W - P * 2, btnH, 0)
  ctx.fillStyle   = isPlaying ? 'rgba(182,108,255,0.08)' : 'transparent'
  ctx.fill()
  ctx.strokeStyle = isPlaying ? 'rgba(182,108,255,0.85)' : 'rgba(182,108,255,0.55)'
  ctx.lineWidth   = Math.max(1.5, W * 0.004)
  ctx.stroke()

  ctx.fillStyle    = 'rgba(200,160,255,0.9)'
  ctx.font         = `${Math.round(W * 0.062)}px "Courier New",monospace`
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(isPlaying ? '⏸  PAUSE' : '▶  PLAY', W / 2, y + btnH / 2)
  ctx.textAlign    = 'left'
  ctx.textBaseline = 'top'
}

/* ── Component ─────────────────────────────────────────────────────────── */
export default function MusicPanelPlane({ song, planeW = 0.21, planeH = 0.42 }) {
  const meshRef      = useRef()
  const isPlayingRef = useRef(false)

  /* Artwork image — loaded async, canvas picks it up once ready */
  const artImg = useMemo(() => {
    if (!song?.artworkSrc) return null
    const img = new Image()
    img.src   = song.artworkSrc
    return img
  }, [song?.artworkSrc])

  /* Audio element */
  const audio = useMemo(() => {
    if (!song?.audioSrc) return null
    return new Audio(song.audioSrc)
  }, [song?.audioSrc])

  /* Canvas + CanvasTexture — created once, drawn every frame */
  const { canvas, texture } = useMemo(() => {
    const c   = document.createElement('canvas')
    c.width   = CW
    c.height  = CH
    const tex = new THREE.CanvasTexture(c)
    tex.minFilter  = THREE.LinearFilter
    tex.magFilter  = THREE.LinearFilter
    tex.colorSpace = THREE.SRGBColorSpace
    return { canvas: c, texture: tex }
  }, [])

  useEffect(() => {
    if (!audio) return
    const onEnded = () => { isPlayingRef.current = false }
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('ended', onEnded)
      audio.pause()
    }
  }, [audio])

  useEffect(() => () => texture.dispose(), [texture])

  /* Redraw every frame for equalizer animation */
  useFrame(({ clock }) => {
    const ctx = canvas.getContext('2d')
    drawPanel(ctx, CW, CH, song, clock.elapsedTime, artImg, isPlayingRef.current)
    texture.needsUpdate = true
  })

  const handleClick = () => {
    if (!audio) return
    if (isPlayingRef.current) {
      audio.pause()
      isPlayingRef.current = false
    } else {
      audio.play().catch(() => {})
      isPlayingRef.current = true
    }
  }

  return (
    <mesh
      ref={meshRef}
      onClick={handleClick}
      onPointerOver={() => { document.body.style.cursor = 'pointer' }}
      onPointerOut ={() => { document.body.style.cursor = 'auto'    }}
    >
      <planeGeometry args={[planeW, planeH]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthTest
        depthWrite={false}
        opacity={0.95}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
