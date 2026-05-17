import { describe, it, expect } from 'vitest'
import { getFurigana } from './furigana'

describe('furigana', () => {
  it('returns kana-only when kanji equals kana', () => {
    const result = getFurigana('ひらがな', 'ひらがな')
    expect(result).toEqual([{ text: 'ひらがな' }])
  })

  it('returns kana text when kanji is empty', () => {
    const result = getFurigana('ひらがな', '')
    expect(result).toEqual([{ text: 'ひらがな' }])
  })

  it('splits simple kanji + okurigana', () => {
    const result = getFurigana('たべる', '食べる')
    expect(result).toEqual([{ text: '食', reading: 'た' }, { text: 'べる' }])
  })

  it('handles all-kanji word (no okurigana)', () => {
    const result = getFurigana('にほんご', '日本語')
    expect(result).toEqual([{ text: '日本語', reading: 'にほんご' }])
  })

  it('handles multiple kanji blocks separated by kana', () => {
    const result = getFurigana('きょうはてんきです', '今日は天気です')
    expect(result).toEqual([
      { text: '今日', reading: 'きょう' },
      { text: 'は' },
      { text: '天気', reading: 'てんき' },
      { text: 'です' },
    ])
  })

  it('handles ambiguous alignment (kanji char not found in remaining)', () => {
    // When the next kana block cannot be matched in remaining,
    // the entire remaining string is assigned as the reading.
    const result = getFurigana('かう', '買う')
    expect(result).toEqual([{ text: '買', reading: 'か' }, { text: 'う' }])
  })
})
