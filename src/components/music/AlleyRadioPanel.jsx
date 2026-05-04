import { useEffect, useRef, useState } from 'react'
import './music-panel.css'
import { emotionEngine }  from '../../data/songs'
import Scanlines          from './Scanlines'
import GlitchEffect       from './GlitchEffect'
import AlleyRadioHeader   from './AlleyRadioHeader'
import NowPlaying         from './NowPlaying'
import Equalizer          from './Equalizer'
import SpotifyLink        from './SpotifyLink'

export default function AlleyRadioPanel() {
  const song      = emotionEngine
  const accent    = song.accentColor ?? '#b66cff'
  const audioRef  = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (!song.audioSrc) return
    const audio = new Audio(song.audioSrc)
    audioRef.current = audio

    audio.addEventListener('play',  () => setIsPlaying(true))
    audio.addEventListener('pause', () => setIsPlaying(false))
    audio.addEventListener('ended', () => setIsPlaying(false))

    // Attempt autoplay; on block, retry on first user interaction
    audio.play().catch(() => {
      const tryPlay = () => audio.play().catch(() => {})
      document.addEventListener('click',   tryPlay, { once: true })
      document.addEventListener('keydown', tryPlay, { once: true })
    })

    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [song.audioSrc])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.paused ? audio.play().catch(() => {}) : audio.pause()
  }

  return (
    <div className="ar-panel">
      <Scanlines />

      <GlitchEffect>
        <AlleyRadioHeader accent={accent} />
      </GlitchEffect>

      <hr className="ar-divider" />

      <NowPlaying
        song={song}
        accent={accent}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
      />

      <Equalizer accent={accent} isPlaying={isPlaying} />

      <hr className="ar-divider" />

      <SpotifyLink url={song.spotifyUrl} />
    </div>
  )
}
