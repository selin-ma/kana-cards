import VocabCard from './Card'
import type { Word, Rating } from '../../types/vocab'
import type { VocabAnswer } from '../../utils/vocabSessionDraft/vocabSessionDraft'

interface Props {
  word: Word
  answered: VocabAnswer | undefined
  currentIndex: number
  total: number
  counts: {
    again: number
    hard: number
    good: number
    easy: number
    skipped: number
  }
  onRate: (rating: Rating) => void
  onSkip: () => void
  onGoBack: () => void
  onGoNext: () => void
  onExit: () => void
}

export default function VocabCardStack({
  word,
  answered,
  currentIndex,
  total,
  counts,
  onRate,
  onSkip,
  onGoBack,
  onGoNext,
  onExit,
}: Props) {
  return (
    <div className='flex flex-col items-center gap-5 w-full max-w-sm'>
      <div className='flex items-center justify-between w-full'>
        <div className='flex items-center gap-3 text-xs'>
          <span style={{ color: '#AA6868' }}>✗ {counts.again}</span>
          <span style={{ color: '#A89060' }}>~ {counts.hard}</span>
          <span style={{ color: '#4A7A50' }}>✓ {counts.good}</span>
          <span style={{ color: '#5A7A9A' }}>★ {counts.easy}</span>
          <span style={{ color: '#B8C4B8' }}>⏭ {counts.skipped}</span>
        </div>
        <button
          onClick={onExit}
          className='text-xs transition-colors'
          style={{ color: '#C0CAC0' }}
        >
          结束练习
        </button>
      </div>

      <div
        className='w-full h-1 rounded-full overflow-hidden'
        style={{ background: '#DDE8DD' }}
      >
        <div
          className='h-full rounded-full transition-all duration-300'
          style={{
            width: `${(currentIndex / total) * 100}%`,
            background: '#7A9E82',
          }}
        />
      </div>

      <p className='text-xs' style={{ color: '#B8C4B8' }}>
        {currentIndex + 1} / {total}
      </p>
      <VocabCard
        key={word.id}
        word={word}
        answered={answered}
        onRate={onRate}
        onSkip={onSkip}
      />

      <div className='flex items-center gap-10 mt-1'>
        <button
          onClick={onGoBack}
          disabled={currentIndex === 0}
          className='text-sm transition-colors disabled:opacity-25 disabled:cursor-not-allowed'
          style={{ color: '#7A9E82' }}
        >
          ← 上一张
        </button>
        <button
          onClick={onGoNext}
          disabled={currentIndex >= total - 1 || answered === undefined}
          className='text-sm transition-colors disabled:opacity-25 disabled:cursor-not-allowed'
          style={{ color: '#7A9E82' }}
        >
          下一张 →
        </button>
      </div>
    </div>
  )
}
