import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AuthGate from './AuthGate'

describe('AuthGate', () => {
  it('renders sign-in form by default', () => {
    const onSignIn = vi.fn()
    const onSignUp = vi.fn()
    render(<AuthGate onSignIn={onSignIn} onSignUp={onSignUp} />)
    expect(screen.getByText('Kana Jump!')).toBeInTheDocument()
    expect(screen.getByText('登录')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('邮箱')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('密码')).toBeInTheDocument()
    expect(screen.getByText('还没有账号？注册')).toBeInTheDocument()
  })

  it('switches to sign-up mode', () => {
    const onSignIn = vi.fn()
    const onSignUp = vi.fn()
    render(<AuthGate onSignIn={onSignIn} onSignUp={onSignUp} />)
    fireEvent.click(screen.getByText('还没有账号？注册'))
    expect(screen.getByText('注册')).toBeInTheDocument()
    expect(screen.getByText('已有账号？登录')).toBeInTheDocument()
  })

  it('calls onSignIn with email and password', async () => {
    const onSignIn = vi.fn().mockResolvedValue(null)
    const onSignUp = vi.fn()
    render(<AuthGate onSignIn={onSignIn} onSignUp={onSignUp} />)

    fireEvent.change(screen.getByPlaceholderText('邮箱'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('密码'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByText('登录'))

    await waitFor(() => {
      expect(onSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('displays error message on sign-in failure', async () => {
    const onSignIn = vi.fn().mockResolvedValue({ message: 'Invalid credentials' })
    const onSignUp = vi.fn()
    render(<AuthGate onSignIn={onSignIn} onSignUp={onSignUp} />)

    fireEvent.change(screen.getByPlaceholderText('邮箱'), {
      target: { value: 'bad@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('密码'), {
      target: { value: 'wrong' },
    })
    fireEvent.click(screen.getByText('登录'))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('shows success message on sign-up', async () => {
    const onSignIn = vi.fn()
    const onSignUp = vi.fn().mockResolvedValue(null)
    render(<AuthGate onSignIn={onSignIn} onSignUp={onSignUp} />)

    fireEvent.click(screen.getByText('还没有账号？注册'))
    fireEvent.change(screen.getByPlaceholderText('邮箱'), {
      target: { value: 'new@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('密码'), {
      target: { value: 'newpass' },
    })
    fireEvent.click(screen.getByText('注册'))

    await waitFor(() => {
      expect(screen.getByText('注册成功，请检查邮箱确认后登录。')).toBeInTheDocument()
    })
  })

  it('disables submit button while loading', async () => {
    const onSignIn = vi.fn().mockImplementation(() => new Promise(() => {})) // never resolves
    const onSignUp = vi.fn()
    render(<AuthGate onSignIn={onSignIn} onSignUp={onSignUp} />)

    fireEvent.change(screen.getByPlaceholderText('邮箱'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('密码'), {
      target: { value: 'pass' },
    })
    fireEvent.click(screen.getByText('登录'))

    await waitFor(() => {
      expect(screen.getByText('请稍候…')).toBeInTheDocument()
    })
  })
})
