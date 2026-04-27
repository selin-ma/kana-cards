import type { KanaCard } from '../types/kana'

export const ROW_ORDER = [
  // Seion
  'あ行', 'か行', 'さ行', 'た行', 'な行', 'は行', 'ま行', 'や行', 'ら行', 'わ行',
  // Seion youon
  'きゃ行', 'しゃ行', 'ちゃ行', 'にゃ行', 'ひゃ行', 'みゃ行', 'りゃ行',
  // Dakuten
  'が行', 'ざ行', 'だ行', 'ば行',
  // Handakuten
  'ぱ行',
  // Dakuten youon
  'ぎゃ行', 'じゃ行', 'びゃ行',
  // Handakuten youon
  'ぴゃ行',
]

const VOWEL_RANK: Record<string, number> = { a: 0, i: 1, u: 2, e: 3, o: 4 }

function vowelRank(roma: string): number {
  if (roma === 'n') return 5
  return VOWEL_RANK[roma[roma.length - 1]] ?? 99
}

export function sortKana(cards: KanaCard[]): KanaCard[] {
  return [...cards].sort((a, b) => {
    const ra = ROW_ORDER.indexOf(a.row)
    const rb = ROW_ORDER.indexOf(b.row)
    const rowDiff = (ra === -1 ? 999 : ra) - (rb === -1 ? 999 : rb)
    if (rowDiff !== 0) return rowDiff
    return vowelRank(a.roma) - vowelRank(b.roma)
  })
}
