import { useState } from 'react'

export default function NowPlaying({ song, accent, isPlaying, onTogglePlay }) {
  const [imgError, setImgError] = useState(false)
  const showImg = Boolean(song.artworkSrc) && !imgError

  return (
    <div>
      <div style={{ padding: '20px 24px 0' }}>
        {/* Section label */}
        <div style={{
          fontSize: 13, letterSpacing: '0.38em',
          color: `${accent}55`,
          marginBottom: 14,
        }}>
          NOW PLAYING
        </div>

        {/* Title */}
        <div style={{
          fontSize: 46, fontWeight: 'bold', letterSpacing: '0.02em',
          lineHeight: 1.05,
          color: accent,
          textShadow: `0 0 18px ${accent}cc, 0 0 36px ${accent}66`,
          marginBottom: 10,
        }}>
          {song.title}
        </div>

        {/* Artist */}
        <div style={{
          fontSize: 20, letterSpacing: '0.14em',
          color: 'rgba(200, 160, 255, 0.82)',
          marginBottom: 6,
        }}>
          {song.artist}
        </div>

        {/* Credits */}
        <div style={{
          fontSize: 13, letterSpacing: '0.12em',
          color: 'rgba(150, 110, 200, 0.48)',
          marginBottom: 20,
        }}>
          {song.credits}
        </div>
      </div>

      {/* Artwork — centred, with play/pause overlay */}
      <div className="ar-artwork-wrap">
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {showImg ? (
            <img
              src={song.artworkSrc}
              alt={song.title}
              className="ar-artwork-img"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="ar-artwork-placeholder">♫</div>
          )}

          {/* Play/pause overlay — centered on artwork */}
          <button
            onClick={onTogglePlay}
            className="ar-play-overlay"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <span className="ar-play-overlay-pause">❚❚</span>
            ) : (
              <span
                className="ar-play-overlay-play"
                style={{ textShadow: `0 0 14px ${accent}, 0 0 28px ${accent}99` }}
              >
                ▶
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
