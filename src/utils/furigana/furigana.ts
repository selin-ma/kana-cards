export interface FuriganaSegment {
  text: string
  reading?: string
}

function isKanji(char: string): boolean {
  const code = char.charCodeAt(0)
  return code >= 0x4e00 && code <= 0x9fff
}

/** Split kana-only segments and kanji blocks, then align readings. */
export function getFurigana(kana: string, kanji: string): FuriganaSegment[] {
  if (!kanji || kanji === kana) return [{ text: kanji || kana }]

  // Split kanji string into alternating kana/kanji blocks
  const blocks: { text: string; isKanji: boolean }[] = []
  let cur: (typeof blocks)[number] | null = null
  for (const char of kanji) {
    const isK = isKanji(char)
    if (cur && cur.isKanji === isK) {
      cur.text += char
    } else {
      cur = { text: char, isKanji: isK }
      blocks.push(cur)
    }
  }

  const segments: FuriganaSegment[] = []
  let remaining = kana

  for (const block of blocks) {
    if (!block.isKanji) {
      segments.push({ text: block.text })
      remaining = remaining.slice(block.text.length)
    } else {
      // Find the next kana block to look up its position in remaining
      const nextKana = blocks.find(
        (b) => b.isKanji === false && blocks.indexOf(b) > blocks.indexOf(block),
      )
      if (nextKana) {
        const idx = remaining.indexOf(nextKana.text)
        if (idx > 0) {
          segments.push({ text: block.text, reading: remaining.slice(0, idx) })
          remaining = remaining.slice(idx)
        } else {
          // Edge case: ambiguous alignment, assign entire remaining
          segments.push({ text: block.text, reading: remaining })
          remaining = ''
        }
      } else {
        // Last block: consume everything left
        segments.push({ text: block.text, reading: remaining })
        remaining = ''
      }
    }
  }

  return segments
}
