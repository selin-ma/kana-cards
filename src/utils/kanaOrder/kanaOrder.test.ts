import { describe, it, expect } from 'vitest'
import { sortKana } from './kanaOrder'
import type { KanaCard } from '../../types/kana'

function card(roma: string, row: string): KanaCard {
  return {
    id: roma,
    roma,
    hira: '',
    kata: '',
    word_ja: '',
    word_zh: '',
    group: 'seion',
    row,
  }
}

describe('kanaOrder', () => {
  it('sorts by ROW_ORDER then vowel rank', () => {
    const cards = [
      card('ki', 'か行'), // vowel i → rank 1
      card('ka', 'か行'), // vowel a → rank 0
      card('a', 'あ行'), // vowel a → rank 0
    ]
    const sorted = sortKana(cards)
    expect(sorted.map((c) => c.roma)).toEqual(['a', 'ka', 'ki'])
  })

  it('places unknown rows at the end', () => {
    const cards = [
      card('unknown2', '未知行'),
      card('a', 'あ行'),
      card('unknown1', '未知行'),
    ]
    const sorted = sortKana(cards)
    expect(sorted.map((c) => c.row)).toEqual(['あ行', '未知行', '未知行'])
  })

  it('n (special vowel) ranks after o (rank 4)', () => {
    const cards = [
      card('n', 'わ行'), // vowelRank('n') = 5
      card('wo', 'わ行'), // vowelRank('wo') = 4 (o)
      card('wa', 'わ行'), // vowelRank('wa') = 0 (a)
    ]
    const sorted = sortKana(cards)
    expect(sorted.map((c) => c.roma)).toEqual(['wa', 'wo', 'n'])
  })

  it('does not mutate the original array', () => {
    const cards = [card('ka', 'か行'), card('a', 'あ行')]
    const copy = [...cards]
    sortKana(cards)
    expect(cards).toEqual(copy)
  })
})
