import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import KanaDetailModal from './KanaDetailModal'
import type { KanaCard } from '../../types/kana'

const card: KanaCard = {
  id: 'a',
  roma: 'a',
  hira: 'あ',
  kata: 'ア',
  word_ja: '朝日',
  word_zh: '朝阳',
  group: 'seion',
  row: 'あ行',
}

describe('KanaDetailModal', () => {
  it('renders card details', () => {
    const onClose = vi.fn()
    render(<KanaDetailModal card={card} onClose={onClose} />)
    expect(screen.getByText('a')).toBeInTheDocument()
    expect(screen.getByText('あ')).toBeInTheDocument()
    expect(screen.getByText('ア')).toBeInTheDocument()
    expect(screen.getByText('朝日')).toBeInTheDocument()
    expect(screen.getByText('朝阳')).toBeInTheDocument()
    expect(screen.getByText('关闭')).toBeInTheDocument()
  })

  it('calls onClose when clicking close button', () => {
    const onClose = vi.fn()
    render(<KanaDetailModal card={card} onClose={onClose} />)
    fireEvent.click(screen.getByText('×'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when clicking backdrop', () => {
    const onClose = vi.fn()
    const { container } = render(<KanaDetailModal card={card} onClose={onClose} />)
    // Click the backdrop (outermost div)
    fireEvent.click(container.firstChild!)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('renders practice button when onPractice provided', () => {
    const onClose = vi.fn()
    const onPractice = vi.fn()
    render(
      <KanaDetailModal
        card={card}
        onClose={onClose}
        onPractice={onPractice}
        practiceLabel='练这个'
      />,
    )
    expect(screen.getByText('练这个')).toBeInTheDocument()
    fireEvent.click(screen.getByText('练这个'))
    expect(onPractice).toHaveBeenCalledOnce()
  })

  it('does not render practice button when onPractice omitted', () => {
    const onClose = vi.fn()
    render(<KanaDetailModal card={card} onClose={onClose} />)
    expect(screen.queryByText('去练习')).not.toBeInTheDocument()
  })
})
