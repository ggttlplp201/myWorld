import { useRef } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import PortfolioWindow from './PortfolioWindow'

const APPS = [
  { id: 'about',    label: 'ABOUT',    icon: '◈', color: '#00ffcc' },
  { id: 'projects', label: 'PROJECTS', icon: '⊞', color: '#ff0077' },
  { id: 'resume',   label: 'RESUME',   icon: '▤', color: '#ffcc00' },
  { id: 'contact',  label: 'CONTACT',  icon: '◉', color: '#aa44ff' },
]

export default function HologramUI({ activeWindow, setActiveWindow, onClose }) {
  const panelRef = useRef(null)
  const flickerT = useRef(0)

  useFrame((_, dt) => {
    flickerT.current += dt
    if (flickerT.current > 0.15 + Math.random() * 0.3) {
      flickerT.current = 0
      if (panelRef.current && Math.random() > 0.88) {
        panelRef.current.style.opacity = (0.7 + Math.random() * 0.28).toFixed(2)
        setTimeout(() => { if (panelRef.current) panelRef.current.style.opacity = '1' }, 60)
      }
    }
  })

  return (
    <Html
      position={[0, 3.5, 9]}
      center
      distanceFactor={4}
      zIndexRange={[200, 0]}
    >
      <div ref={panelRef} style={panel}>
        <div style={scanlines} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#00ffcc', fontSize: 11, letterSpacing: '0.3em' }}>LEON MENG</span>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, letterSpacing: '0.15em' }}>SYS · ONLINE</span>
          <button style={closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#00ffcc66,transparent)', marginBottom: 10 }} />

        {activeWindow
          ? <PortfolioWindow id={activeWindow} onBack={() => setActiveWindow(null)} />
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {APPS.map(a => <AppIcon key={a.id} app={a} onClick={() => setActiveWindow(a.id)} />)}
            </div>
          )
        }

        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)', margin: '10px 0 4px' }} />
        <p style={{ fontSize: 9, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
          UCI · CS · 2028 &nbsp;|&nbsp; SOFTWARE + FASHION
        </p>
      </div>
    </Html>
  )
}

function AppIcon({ app, onClick }) {
  return (
    <div
      onClick={e => { e.stopPropagation(); onClick() }}
      onMouseEnter={e => {
        e.currentTarget.style.background = app.color + '22'
        e.currentTarget.style.borderColor = app.color
        e.currentTarget.style.boxShadow   = `0 0 14px ${app.color}55`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background  = 'rgba(0,0,0,0.45)'
        e.currentTarget.style.borderColor = app.color + '44'
        e.currentTarget.style.boxShadow   = 'none'
      }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '14px 6px',
        background: 'rgba(0,0,0,0.45)',
        border: `1px solid ${app.color}44`,
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: 22, color: app.color, textShadow: `0 0 10px ${app.color}`, lineHeight: 1 }}>{app.icon}</span>
      <span style={{ fontSize: 8, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.7)', marginTop: 5 }}>{app.label}</span>
    </div>
  )
}

/* styles */
const panel = {
  width: 400,
  background: 'rgba(2,8,20,0.9)',
  border: '1px solid rgba(0,255,204,0.35)',
  boxShadow: '0 0 0 1px rgba(0,255,204,0.1), 0 0 40px rgba(0,255,204,0.12), inset 0 0 50px rgba(0,255,204,0.03)',
  padding: '14px 16px 12px',
  fontFamily: 'Courier New, monospace',
  position: 'relative', overflow: 'hidden',
  userSelect: 'none',
}
const scanlines = {
  position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none',
  background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.1) 3px,rgba(0,0,0,0.1) 4px)',
}
const closeBtn = {
  background: 'transparent', border: '1px solid rgba(255,0,80,0.4)',
  color: 'rgba(255,0,80,0.6)', cursor: 'pointer', padding: '2px 8px',
  fontSize: 10, fontFamily: 'Courier New, monospace', letterSpacing: '0.1em',
}
