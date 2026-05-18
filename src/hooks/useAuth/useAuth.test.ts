import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}))
const mockSignInWithPassword = vi.fn()
const mockSignOut = vi.fn()
const mockSignUp = vi.fn()

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
    },
  },
}))

import { useAuth } from './useAuth'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useAuth', () => {
  it('starts in loading state with no user', () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })
    const { result } = renderHook(() => useAuth())
    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBeNull()
  })

  it('sets user when session exists', async () => {
    const fakeUser = { id: 'u1', email: 'test@example.com' }
    mockGetSession.mockResolvedValue({
      data: { session: { user: fakeUser } },
    })
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user).toEqual(fakeUser)
  })

  it('signIn returns error on failure', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const authError = { message: 'Invalid credentials' }
    mockSignInWithPassword.mockResolvedValue({ error: authError })

    let error: unknown
    await act(async () => {
      error = await result.current.signIn('bad@example.com', 'wrong')
    })
    expect(error).toBe(authError)
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'bad@example.com',
      password: 'wrong',
    })
  })

  it('signOut clears user', async () => {
    const fakeUser = { id: 'u1', email: 'test@example.com' }
    mockGetSession.mockResolvedValue({
      data: { session: { user: fakeUser } },
    })
    mockSignOut.mockResolvedValue(undefined)
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user).toEqual(fakeUser)

    await act(async () => {
      await result.current.signOut()
    })
    expect(mockSignOut).toHaveBeenCalledOnce()
  })
})
