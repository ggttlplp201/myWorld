import { useState, useEffect } from 'react'

const CYCLE_MS = 4000

export default function LyricsFeed({ lyrics, accent }) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const t = setInterval(
      () => setActive(i => (i + 1) % lyrics.length),
      CYCLE_MS
    )
    return () => clearInterval(t)
  }, [lyrics.length])

  return (
    <div>
      <div style={{ fontSize: 7, letterSpacing: '0.22em', color: 'rgba(180,230,255,0.3)', marginBottom: 6 }}>
        LYRIC FEED ▸
      </div>

      {/* Feed container with top/bottom fade masks */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Top fade */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 12,
          background: 'linear-gradient(to bottom, rgba(2,4,22,0.9), transparent)',
          zIndex: 1, pointerEvents: 'none',
        }} />

        {/* Lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '4px 0' }}>
          {lyrics.map((line, i) => {
            const isActive = i === active
            return (
              <div
                key={i}
                className={isActive ? 'ar-lyric-active' : undefined}
                style={{
                  fontSize: 8,
                  letterSpacing: '0.12em',
                  lineHeight: 1.5,
                  paddingLeft: 10,
                  position: 'relative',
                  color: isActive ? accent : 'rgba(180,230,255,0.28)',
                  textShadow: isActive ? `0 0 10px ${accent}66` : 'none',
                  transition: isActive ? 'none' : 'color 0.4s, text-shadow 0.4s',
                }}
              >
                {/* Active marker */}
                <span style={{
                  position: 'absolute', left: 0,
                  color: isActive ? accent : 'transparent',
                  transition: 'color 0.3s',
                }}>▶</span>
                {line}
              </div>
            )
          })}
        </div>

        {/* Bottom fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 12,
          background: 'linear-gradient(to top, rgba(2,4,22,0.9), transparent)',
          zIndex: 1, pointerEvents: 'none',
        }} />
      </div>
    </div>
  )
}
