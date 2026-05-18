import { describe, it, expect, vi } from 'vitest'

// Mock @supabase/supabase-js so we can verify createClient is called
// correctly when env vars are present (Vite loads them from .env).
const mockCreateClient = vi.fn(() => ({ mock: 'supabase-client' }))
vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

describe('supabase client setup', () => {
  it('creates Supabase client when env vars are present', async () => {
    const mod = await import('./supabase')

    expect(mod.isSupabaseConfigured).toBe(true)
    expect(mockCreateClient).toHaveBeenCalled()
    // First arg should be the Supabase URL
    const url = mockCreateClient.mock.calls[0][0]
    expect(url).toContain('.supabase.co')
  })

  it('exports a supabase object', async () => {
    const mod = await import('./supabase')
    expect(mod.supabase).toEqual({ mock: 'supabase-client' })
  })
})
