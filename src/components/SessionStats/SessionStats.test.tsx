import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SessionStats from './SessionStats'

describe('SessionStats', () => {
  it('renders correct/wrong/remaining counts', () => {
    render(<SessionStats correct={3} wrong={1} skipped={0} remaining={7} />)
    expect(screen.getByText('✓ 3')).toBeInTheDocument()
    expect(screen.getByText('✗ 1')).toBeInTheDocument()
    expect(screen.getByText('余 7')).toBeInTheDocument()
  })

  it('does not render skipped when zero', () => {
    render(<SessionStats correct={0} wrong={0} skipped={0} remaining={0} />)
    expect(screen.queryByText(/↷/)).not.toBeInTheDocument()
  })

  it('renders skipped count when > 0', () => {
    render(<SessionStats correct={0} wrong={0} skipped={2} remaining={5} />)
    expect(screen.getByText('↷ 2')).toBeInTheDocument()
  })
})
