// Japanese audio playback utility.
// IMPORTANT: must be invoked synchronously inside a user-gesture click
// handler, otherwise Chrome's autoplay policy will silently block
// speechSynthesis with no error.
//
// When word.audio_url is provided (R2-hosted mp3), it takes priority;
// browser TTS only acts as fallback when the asset fails to load.

export function speakJa(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ja-JP'
  u.rate = 0.92
  u.pitch = 1.0
  const voices = window.speechSynthesis.getVoices()
  const ja =
    voices.find((v) => v.lang === 'ja-JP') ?? voices.find((v) => v.lang.startsWith('ja'))
  if (ja) u.voice = ja
  window.speechSynthesis.speak(u)
}

let _audio: HTMLAudioElement | null = null

export function playWord(text: string, audioUrl?: string | null) {
  window.speechSynthesis.cancel()
  if (_audio) {
    _audio.pause()
    _audio.onended = null
    _audio.onerror = null
    _audio = null
  }

  if (audioUrl) {
    const a = new Audio(audioUrl)
    _audio = a
    const cleanup = () => {
      if (_audio === a) {
        _audio = null
      }
    }
    a.onended = cleanup
    a.onerror = () => {
      cleanup()
      speakJa(text)
    }
    void a.play().catch(() => {
      cleanup()
      speakJa(text)
    })
    return
  }
  speakJa(text)
}
