/**
 * @typedef {Object} Song
 * @property {string} id
 * @property {string} title
 * @property {string} artist
 * @property {string} credits
 * @property {string} [accentColor]
 * @property {string} [spotifyUrl]
 * @property {string} [appleMusicUrl]
 * @property {string} [audioSrc]
 * @property {string} [artworkSrc]
 */

/** @type {Song} */
export const emotionEngine = {
  id: 'emotion-engine',
  title: 'Emotion Engine',
  artist: 'Dazegxd, Kaiyko',
  credits: 'Music by dazegxd and Kaiyko',
  accentColor: '#b66cff',
  spotifyUrl: 'https://open.spotify.com/track/1Yp70JEzA4E4jxy9PRDr30?si=4cd9344ecf78490f',
  audioSrc: '/audio/emotion-engine.mp3',
  artworkSrc: '/images/emotion-engine-artwork.png',
}

/** @type {Song[]} */
export const songs = [emotionEngine]

export const currentSong = emotionEngine
