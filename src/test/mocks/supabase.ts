import { vi } from 'vitest'
import type { Mock } from 'vitest'

/**
 * Build a chainable Supabase query mock.
 *
 * Each call to .from('table') returns a fresh chain where you can:
 *   .select(...) → .eq(...) | .order(...) | .single() | .maybeSingle() | .limit() | ...
 *   → .then(resolve)  (returns { data, error })
 *
 * Default: { data: [], error: null } for every query.
 * Override via `__setMockData` on the returned client.
 */
export function createMockSupabaseClient() {
  const mockUser = { id: 'test-user-id', email: 'test@example.com' }

  type QueryResult = { data: unknown; error: unknown | null; count?: number | null }

  // Store override maps per table name
  const tableOverrides = new Map<string, QueryResult>()

  function makeQueryBuilder() {
    let result: QueryResult = { data: [], error: null }
    let hasOverride = false

    const chain: Record<string, Mock> = {
      select: vi.fn(function (this: unknown, ..._args: unknown[]) {
        return chain
      }) as Mock,
      eq: vi.fn(function (this: unknown, ..._args: unknown[]) {
        return chain
      }) as Mock,
      in: vi.fn(function (this: unknown, ..._args: unknown[]) {
        return chain
      }) as Mock,
      order: vi.fn(function (this: unknown, ..._args: unknown[]) {
        return chain
      }) as Mock,
      limit: vi.fn(function (this: unknown, ..._args: unknown[]) {
        return chain
      }) as Mock,
      single: vi.fn(function (this: unknown, ..._args: unknown[]) {
        // single() returns the first element or throws-like behavior
        const d = Array.isArray(result.data) ? (result.data[0] ?? null) : result.data
        return Promise.resolve({ data: d, error: result.error })
      }) as Mock,
      maybeSingle: vi.fn(function (this: unknown, ..._args: unknown[]) {
        const d = Array.isArray(result.data) ? (result.data[0] ?? null) : result.data
        return Promise.resolve({ data: d, error: result.error })
      }) as Mock,
      then: vi.fn(function (this: unknown, resolve: (v: QueryResult) => void) {
        return Promise.resolve(resolve(result))
      }) as Mock,
      insert: vi.fn(function (this: unknown, ..._args: unknown[]) {
        return { select: () => chain, ...chain }
      }) as Mock,
      delete: vi.fn(function (this: unknown, ..._args: unknown[]) {
        return chain
      }) as Mock,
      upsert: vi.fn(function (this: unknown, ..._args: unknown[]) {
        return chain
      }) as Mock,
      gte: vi.fn(function (this: unknown, ..._args: unknown[]) {
        return chain
      }) as Mock,
      lte: vi.fn(function (this: unknown, ..._args: unknown[]) {
        return chain
      }) as Mock,
    }

    // Wrap .then to respect override lookups when table name is known
    chain.then = vi.fn((resolve: (v: QueryResult) => void) => {
      if (hasOverride) return Promise.resolve(resolve(result))
      return Promise.resolve(resolve(result))
    }) as Mock

    return chain as unknown as ReturnType<typeof makeQueryBuilder> & {
      __tableName?: string
    }
  }

  const client = {
    from: vi.fn((tableName: string) => {
      const builder = makeQueryBuilder()
      // Check if there's an override for this table
      if (tableOverrides.has(tableName)) {
        const override = tableOverrides.get(tableName)!
        // Patch the builder's methods to return override
        Object.defineProperty(builder, 'then', {
          value: vi.fn((resolve: (v: QueryResult) => void) =>
            Promise.resolve(resolve(override)),
          ),
        })
      }
      return builder
    }) as Mock,
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: mockUser }, error: null })),
    },
    // Test helper: override query results for a specific table
    __setMockData(table: string, data: unknown, error: unknown = null) {
      tableOverrides.set(table, { data, error })
    },
    __setUser(user: { id: string; email?: string } | null) {
      if (user) {
        Object.assign(mockUser, user)
        client.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      } else {
        client.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
      }
    },
    __clearOverrides() {
      tableOverrides.clear()
    },
    __setAuthError(error: unknown) {
      client.auth.getUser.mockResolvedValue({ data: { user: null }, error })
    },
  }

  return client
}

export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>
