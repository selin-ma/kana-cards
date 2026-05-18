import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FilterBar from './FilterBar'
import type { FilterState } from '../../hooks/useCards/useCards'

describe('FilterBar', () => {
  const defaultFilter: FilterState = { groups: new Set(), rows: new Set() }
  const availableRows = ['あ行', 'か行']

  it('renders group tags and 全选 button', () => {
    const onChange = vi.fn()
    render(
      <FilterBar
        filter={defaultFilter}
        availableRows={availableRows}
        onChange={onChange}
      />,
    )
    expect(screen.getByText('全选')).toBeInTheDocument()
    expect(screen.getByText('清音')).toBeInTheDocument()
    expect(screen.getByText('浊音')).toBeInTheDocument()
    expect(screen.getByText('半浊音')).toBeInTheDocument()
    expect(screen.getByText('拗音')).toBeInTheDocument()
  })

  it('renders row tags when availableRows provided', () => {
    const onChange = vi.fn()
    render(
      <FilterBar
        filter={defaultFilter}
        availableRows={availableRows}
        onChange={onChange}
      />,
    )
    expect(screen.getByText('あ行')).toBeInTheDocument()
    expect(screen.getByText('か行')).toBeInTheDocument()
  })

  it('clicking 全选 calls onChange with empty filter', () => {
    const onChange = vi.fn()
    const filter: FilterState = { groups: new Set(['seion']), rows: new Set() }
    render(
      <FilterBar filter={filter} availableRows={availableRows} onChange={onChange} />,
    )
    fireEvent.click(screen.getByText('全选'))
    expect(onChange).toHaveBeenCalledWith({ groups: new Set(), rows: new Set() })
  })

  it('clicking group tag calls onChange with that group', () => {
    const onChange = vi.fn()
    render(
      <FilterBar
        filter={defaultFilter}
        availableRows={availableRows}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByText('清音'))
    expect(onChange).toHaveBeenCalledWith({
      groups: new Set(['seion']),
      rows: new Set(),
    })
  })

  it('clicking row tag calls onChange with that row', () => {
    const onChange = vi.fn()
    render(
      <FilterBar
        filter={defaultFilter}
        availableRows={availableRows}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByText('あ行'))
    expect(onChange).toHaveBeenCalledWith({
      groups: new Set(),
      rows: new Set(['あ行']),
    })
  })

  it('deselects an active row', () => {
    const onChange = vi.fn()
    const filter: FilterState = { groups: new Set(), rows: new Set(['あ行']) }
    render(
      <FilterBar filter={filter} availableRows={availableRows} onChange={onChange} />,
    )
    fireEvent.click(screen.getByText('あ行'))
    expect(onChange).toHaveBeenCalledWith({
      groups: new Set(),
      rows: new Set(),
    })
  })
})
