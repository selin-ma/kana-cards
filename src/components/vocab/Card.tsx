import { useState, useEffect } from 'react'
import type { Word, Rating } from '../../types/vocab'
import { RATING } from '../../types/vocab'
import type { VocabAnswer } from '../../utils/vocabSessionDraft/vocabSessionDraft'
import AudioButton from './AudioButton/AudioButton'
import { playWord } from '../../utils/speak/speak'
import { getFurigana } from '../../utils/furigana/furigana'

interface Props {
  word: Word
  answered: VocabAnswer | undefined
  onRate: (rating: Rating) => void
  onSkip: () => void
}

export default function VocabCard({ word, answered, onRate, onSkip }: Props) {
  const [flipped, setFlipped] = useState(answered !== undefined)

  // Reset flip when word changes (next card)
  useEffect(() => {
    setFlipped(answered !== undefined)
  }, [word.id, answered])

  const statusLabel =
    answered === RATING.Again
      ? '没记住'
      : answered === RATING.Hard
        ? '有点难'
        : answered === RATING.Good
          ? '记住了'
          : answered === RATING.Easy
            ? '很简单'
            : answered === 'skipped'
              ? '已跳过'
              : ''

  const statusColor =
    answered === RATING.Again
      ? '#C08878'
      : answered === RATING.Hard
        ? '#C0A878'
        : answered === RATING.Good
          ? '#7AAA7A'
          : answered === RATING.Easy
            ? '#7A9EAA'
            : answered === 'skipped'
              ? '#B8C4B8'
              : '#B8C4B8'

  // Japanese text to speak: prefer kana for pronunciation accuracy
  const speakText = word.kana.replace(/[～〜]/g, '')

  // One-way flip: only front→back. Synchronous play in the click
  // handler satisfies Chrome's autoplay policy.
  const handleFlip = () => {
    if (flipped) return
    setFlipped(true)
    playWord(speakText, word.audio_url)
  }

  return (
    <div className='flex flex-col items-center gap-5'>
      <div
        className='card-flip cursor-pointer select-none w-[300px] h-[260px]'
        onClick={handleFlip}
      >
        <div className={`card-inner ${flipped ? 'flipped' : ''}`}>
          {/* Front: kana */}
          <div
            className='card-front flex flex-col items-center justify-center gap-3 rounded-2xl px-6'
            style={{
              background: '#FEFCF8',
              border: '1px solid #E4E8E0',
              boxShadow: '0 4px 24px 0 rgba(80,110,85,0.06)',
            }}
          >
            <span
              className='text-4xl font-light tracking-wider text-center break-all leading-snug'
              style={{ color: '#3A4A3C' }}
            >
              {word.kana}
            </span>
            <div className='flex items-center gap-3'>
              {word.pitch_accent !== null && (
                <span className='text-xs' style={{ color: '#A8B4A8' }}>
                  声调 {word.pitch_accent}
                </span>
              )}
              <AudioButton text={speakText} audioUrl={word.audio_url} size='sm' />
            </div>
            {answered !== undefined && (
              <span className='text-xs mt-0.5' style={{ color: statusColor }}>
                已答 · {statusLabel}
              </span>
            )}
          </div>

          {/* Back: kanji + reading + meaning + pos + notes + audio */}
          <div
            className='card-back relative flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-5'
            style={{
              background: '#F8FAF8',
              border: '1px solid #E0E8E0',
              boxShadow: '0 4px 24px 0 rgba(80,110,85,0.06)',
            }}
          >
            {word.pos && word.pos.length > 0 && (
              <div className='flex items-center gap-2 self-end'>
                {word.pos.map((p) => (
                  <span key={p} className='text-[10px]' style={{ color: '#B0C0B0' }}>
                    {p}
                  </span>
                ))}
              </div>
            )}

            <div className='flex items-end gap-3'>
              <span
                className='text-2xl font-light leading-tight'
                style={{ color: word.kanji ? '#5A8870' : '#3A4A3C' }}
              >
                {word.kanji
                  ? getFurigana(word.kana, word.kanji).map((seg, i) =>
                      seg.reading ? (
                        <ruby key={i}>
                          {seg.text}
                          <rt
                            className='text-xs font-normal'
                            style={{ color: '#A8B4A8' }}
                          >
                            {seg.reading}
                          </rt>
                        </ruby>
                      ) : (
                        <span key={i}>{seg.text}</span>
                      ),
                    )
                  : word.kana}
              </span>
              <AudioButton text={speakText} audioUrl={word.audio_url} size='sm' />
            </div>

            <p
              className='text-sm text-center leading-relaxed'
              style={{ color: '#3A4A3C' }}
            >
              <span style={{ color: '#B0C0B0' }}>释义：</span>
              {word.meaning_zh}
            </p>

            {word.notes && (
              <p
                className='text-[10px] text-center leading-relaxed'
                style={{ color: '#9AAA9A' }}
              >
                {word.notes}
              </p>
            )}
          </div>
        </div>
      </div>

      {!flipped && (
        <p className='text-xs' style={{ color: '#C0CAC0' }}>
          点击翻卡查看答案
        </p>
      )}

      {flipped && answered === undefined && (
        <div className='flex flex-col items-center gap-2'>
          <button
            onClick={onSkip}
            className='text-xs transition-colors'
            style={{ color: '#B8C4B8' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#7A9E82')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#B8C4B8')}
          >
            跳过本张
          </button>
          <div className='flex gap-2'>
            <button
              onClick={() => onRate(RATING.Again)}
              className='px-3 py-2 rounded-xl text-xs font-medium transition-colors'
              style={{ background: '#F5EDEC', color: '#AA6868' }}
            >
              没记住
            </button>
            <button
              onClick={() => onRate(RATING.Hard)}
              className='px-3 py-2 rounded-xl text-xs font-medium transition-colors'
              style={{ background: '#F5F0E4', color: '#A89060' }}
            >
              有点难
            </button>
            <button
              onClick={() => onRate(RATING.Good)}
              className='px-3 py-2 rounded-xl text-xs font-medium transition-colors'
              style={{ background: '#E8F2EA', color: '#4A7A50' }}
            >
              记住了
            </button>
            <button
              onClick={() => onRate(RATING.Easy)}
              className='px-3 py-2 rounded-xl text-xs font-medium transition-colors'
              style={{ background: '#E4EEF2', color: '#5A7A9A' }}
            >
              很简单
            </button>
          </div>
        </div>
      )}

      {flipped && answered !== undefined && <div className='h-10' />}
    </div>
  )
}
