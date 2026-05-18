import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AudioButton from './AudioButton'

// mock playWord
vi.mock('../../../utils/speak/speak', () => ({
  playWord: vi.fn(),
}))

describe('AudioButton', () => {
  it('renders with aria-label', () => {
    render(<AudioButton text='あ' />)
    expect(screen.getByLabelText('播放发音')).toBeInTheDocument()
  })

  it('renders sm size', () => {
    const { container } = render(<AudioButton text='あ' size='sm' />)
    const btn = container.querySelector('button')
    expect(btn!.className).toContain('w-8')
  })

  it('renders md size by default', () => {
    const { container } = render(<AudioButton text='あ' />)
    const btn = container.querySelector('button')
    expect(btn!.className).toContain('w-11')
  })
})
