export default function AppleMusicLink({ url, accent }) {
  const href = url || '#'
  const isReal = Boolean(url)

  return (
    <a
      className="ar-apple-btn"
      href={href}
      target={isReal ? '_blank' : undefined}
      rel="noopener noreferrer"
      onClick={!isReal ? e => e.preventDefault() : undefined}
      style={{ '--accent': accent }}
    >
      {/* Apple Music note icon (unicode) */}
      <span style={{ fontSize: 10, lineHeight: 1 }}>♫</span>
      <span>LISTEN ON APPLE MUSIC</span>
      <span style={{ opacity: 0.6 }}>›</span>
    </a>
  )
}
