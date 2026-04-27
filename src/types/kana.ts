export interface KanaCard {
  id: string
  roma: string
  hira: string
  kata: string
  word_ja: string
  word_zh: string
  group: 'seion' | 'dakuten' | 'handakuten' | 'youon'
  row: string
}

export interface CardMeta {
  version: string
  total: number
  groups: Record<KanaCard['group'], { label: string; count: number }>
}

export interface KanaData {
  meta: CardMeta
  cards: KanaCard[]
}
