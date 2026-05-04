// Text-only icon — no SVG (SVG elements crash R3F when not inside Html)
function SpotifyIcon() {
  return <span style={{ fontSize: 15, lineHeight: 1 }}>▶</span>
}

export default function SpotifyLink({ url }) {
  const href   = url || '#'
  const isReal = Boolean(url)

  return (
    <div style={{ padding: '0 24px 26px' }}>
      <a
        className="ar-spotify-btn"
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={!isReal ? e => e.preventDefault() : undefined}
      >
        <SpotifyIcon />
        <span>PLAY ON SPOTIFY</span>
        <span style={{ opacity: 0.5, fontSize: 16 }}>›</span>
      </a>
    </div>
  )
}
