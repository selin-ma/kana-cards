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
    voices.find((v) => v.lang === 'ja-JP') ??
    voices.find((v) => v.lang.startsWith('ja'))
  if (ja) u.voice = ja
  window.speechSynthesis.speak(u)
}

export function playWord(text: string, audioUrl?: string | null) {
  if (audioUrl) {
    const a = new Audio(audioUrl)
    void a.play().catch(() => speakJa(text))
    return
  }
  speakJa(text)
}
