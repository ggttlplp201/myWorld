// 44 bars, each picks one of 7 animation patterns with staggered delays.
// Color interpolates from accent purple (#b66cff) → pink (#ff66cc) left→right.

const PATTERNS = ['ar-eq-1','ar-eq-2','ar-eq-3','ar-eq-4','ar-eq-5','ar-eq-6','ar-eq-7']
const BAR_COUNT = 44

function lerpColor(t) {
  // #b66cff (182,108,255) → #ff66cc (255,102,204)
  const r = Math.round(182 + t * (255 - 182))
  const g = Math.round(108 + t * (102 - 108))
  const b = Math.round(255 + t * (204 - 255))
  return `rgb(${r},${g},${b})`
}

const BARS = Array.from({ length: BAR_COUNT }, (_, i) => {
  const t   = i / (BAR_COUNT - 1)
  const color = lerpColor(t)
  return {
    color,
    anim:  PATTERNS[i % PATTERNS.length],
    dur:   `${0.42 + (i * 0.031) % 0.48}s`,
    delay: `${(i * 0.023) % 0.36}s`,
  }
})

export default function Equalizer({ accent, isPlaying = true }) {
  return (
    <div style={{ padding: '0 24px 20px' }}>
      <div style={{
        fontSize: 13, letterSpacing: '0.3em',
        color: `${accent}50`, marginBottom: 12,
      }}>
        AUDIO SIGNAL
      </div>

      <div className="ar-eq-container">
        {BARS.map((b, i) => (
          <div
            key={i}
            className="ar-eq-bar"
            style={{
              backgroundColor: b.color,
              boxShadow: `0 0 4px ${b.color}88`,
              animationName: b.anim,
              animationDuration: b.dur,
              animationDelay: b.delay,
              animationPlayState: isPlaying ? 'running' : 'paused',
            }}
          />
        ))}
      </div>
    </div>
  )
}
