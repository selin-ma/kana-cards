import { useState } from 'react'
import { playWord } from '../../../utils/speak/speak'

interface Props {
  text: string
  audioUrl?: string | null
  size?: 'sm' | 'md'
}

export default function AudioButton({ text, audioUrl, size = 'md' }: Props) {
  const [playing, setPlaying] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    if (playing) return
    e.stopPropagation()
    setPlaying(true)
    playWord(text, audioUrl)
    setTimeout(() => setPlaying(false), 600)
  }

  const dim = size === 'sm' ? 'w-8 h-8 text-base' : 'w-11 h-11 text-xl'

  return (
    <button
      type='button'
      onClick={handleClick}
      className={`${dim} rounded-full flex items-center justify-center transition-colors`}
      style={{
        background: playing ? '#7A9E82' : '#EEF4EF',
        color: playing ? '#F8FCF8' : '#5A8870',
        border: '1px solid #D8E4D8',
      }}
      aria-label='播放发音'
    >
      <span
        className='material-symbols-outlined leading-none'
        style={{ fontSize: size === 'sm' ? '18px' : '24px' }}
      >
        brand_awareness
      </span>
    </button>
  )
}
