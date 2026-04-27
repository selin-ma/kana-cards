import Card from './Card'
import SessionStats from './SessionStats'
import type { KanaCard } from '../types/kana'
import type { CardAnswer } from '../hooks/useSession'

interface Props {
  card: KanaCard
  answered: CardAnswer | undefined
  currentIndex: number
  total: number
  correct: number
  wrong: number
  skipped: number
  remaining: number
  onAnswer: (remembered: boolean) => void
  onSkip: () => void
  onGoBack: () => void
  onGoNext: () => void
  onChangeFilter: () => void
}

export default function CardStack({
  card, answered, currentIndex, total,
  correct, wrong, skipped, remaining,
  onAnswer, onSkip, onGoBack, onGoNext, onChangeFilter,
}: Props) {
  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-sm">
      <div className="flex items-center justify-between w-full">
        <SessionStats correct={correct} wrong={wrong} skipped={skipped} remaining={remaining} />
        <button
          onClick={onChangeFilter}
          className="text-xs transition-colors"
          style={{ color: '#C0CAC0' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#7A9E82')}
          onMouseLeave={e => (e.currentTarget.style.color = '#C0CAC0')}
        >
          结束练习
        </button>
      </div>

      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: '#DDE8DD' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${(currentIndex / total) * 100}%`, background: '#7A9E82' }}
        />
      </div>

      <p className="text-xs" style={{ color: '#B8C4B8' }}>{currentIndex + 1} / {total}</p>

      <Card key={card.id} card={card} answered={answered} onAnswer={onAnswer} onSkip={onSkip} />

      <div className="flex items-center gap-10 mt-1">
        <button
          onClick={onGoBack}
          disabled={currentIndex === 0}
          className="text-sm transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          style={{ color: '#7A9E82' }}
          onMouseEnter={e => { if (currentIndex > 0) e.currentTarget.style.color = '#628070' }}
          onMouseLeave={e => (e.currentTarget.style.color = '#7A9E82')}
        >
          ← 上一张
        </button>
        <button
          onClick={onGoNext}
          disabled={currentIndex >= total - 1 || answered === undefined}
          className="text-sm transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          style={{ color: '#7A9E82' }}
          onMouseEnter={e => { if (currentIndex < total - 1 && answered !== undefined) e.currentTarget.style.color = '#628070' }}
          onMouseLeave={e => (e.currentTarget.style.color = '#7A9E82')}
        >
          下一张 →
        </button>
      </div>
    </div>
  )
}
