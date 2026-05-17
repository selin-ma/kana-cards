import { describe, it, expect, vi, beforeEach } from 'vitest'
import { playWord, speakJa } from './speak'

beforeEach(() => {
  // Stub SpeechSynthesisUtterance constructor
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    vi.fn().mockImplementation(function (this: any, text: string) {
      this.text = text
      this.lang = ''
      this.rate = 1
      this.pitch = 1
      this.voice = null
    }),
  )

  vi.stubGlobal('window', {
    speechSynthesis: {
      cancel: vi.fn(),
      getVoices: vi.fn().mockReturnValue([]),
      speak: vi.fn(),
    },
  })

  // Audio as a real constructor
  vi.stubGlobal(
    'Audio',
    vi.fn().mockImplementation(function (this: any, url: string) {
      this.src = url
      this.play = vi.fn().mockResolvedValue(undefined)
      this.pause = vi.fn()
    }),
  )
})

describe('speakJa', () => {
  it('does nothing when speechSynthesis is unavailable', () => {
    vi.stubGlobal('window', {})
    expect(() => speakJa('こんにちは')).not.toThrow()
  })

  it('cancels previous utterance and speaks new text', () => {
    speakJa('こんにちは')
    const synth = (window as any).speechSynthesis
    expect(synth.cancel).toHaveBeenCalledOnce()
    expect(synth.speak).toHaveBeenCalledOnce()
  })

  it('sets Japanese locale and rate', () => {
    speakJa('さようなら')
    const call = (window.speechSynthesis.speak as any).mock.calls[0][0]
    expect(call.lang).toBe('ja-JP')
    expect(call.rate).toBe(0.92)
  })
})

describe('playWord', () => {
  it('falls back to speakJa when no audioUrl', () => {
    playWord('こんにちは')
    expect(window.speechSynthesis.speak).toHaveBeenCalledOnce()
  })

  it('creates Audio element when audioUrl provided', () => {
    playWord('こんにちは', 'https://example.com/audio.mp3')
    expect(Audio).toHaveBeenCalledWith('https://example.com/audio.mp3')
  })

  it('cancels previous audio when called again', () => {
    playWord('hello', 'https://example.com/a.mp3')
    playWord('world', 'https://example.com/b.mp3')
    // First audio element should have been paused by the second call
    const firstAudio = (Audio as any).mock.results[0]?.value
    expect(firstAudio?.pause).toHaveBeenCalledOnce()
  })
})
