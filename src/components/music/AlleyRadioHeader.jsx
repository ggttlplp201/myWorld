export default function AlleyRadioHeader({ accent }) {
  return (
    <div style={{ padding: '22px 24px 16px' }}>
      {/* Title row: accent bar + ALLEY RADIO + LIVE SIGNAL pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        {/* Vertical accent bar */}
        <div style={{
          width: 4, height: 32, flexShrink: 0,
          background: accent,
          boxShadow: `0 0 8px ${accent}, 0 0 16px ${accent}66`,
        }} />

        <span style={{
          fontSize: 24, letterSpacing: '0.4em', fontWeight: 'bold',
          color: 'rgba(210, 175, 255, 0.95)',
          textShadow: `0 0 14px ${accent}55`,
          flex: 1,
        }}>
          ALLEY RADIO
        </span>

        {/* LIVE SIGNAL pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'rgba(40, 220, 110, 0.1)',
          border: '1px solid rgba(40, 220, 110, 0.32)',
          borderRadius: 20,
          padding: '5px 13px',
        }}>
          <span className="ar-live-dot" style={{ color: '#44ff88', fontSize: 12 }}>●</span>
          <span style={{ fontSize: 13, letterSpacing: '0.18em', color: 'rgba(100, 255, 160, 0.85)' }}>
            LIVE SIGNAL
          </span>
        </div>
      </div>

      {/* Metadata row */}
      <div style={{
        fontSize: 12, letterSpacing: '0.22em',
        color: `${accent}60`,
        display: 'flex', gap: 8,
      }}>
        <span style={{ color: '#44ff8866' }}>DB: ONLINE</span>
        <span>│</span>
        <span>SIGNAL LOCKED</span>
      </div>
    </div>
  )
}
