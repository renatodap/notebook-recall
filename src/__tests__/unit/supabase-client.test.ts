import { createBrowserClient } from '@/lib/supabase/client'
import {
  createServerClient,
  createServerActionClient,
  createRouteHandlerClient,
  createServiceRoleClient,
} from '@/lib/supabase/server'

// Mock @supabase/ssr
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn((url, key, options) => ({
    url,
    key,
    options,
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  })),
  createServerClient: jest.fn((url, key, options) => ({
    url,
    key,
    options,
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  })),
}))

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(() =>
    Promise.resolve({
      get: jest.fn((name: string) => ({ name, value: 'test-cookie-value' })),
      set: jest.fn(),
    })
  ),
}))

describe('Supabase Client Configuration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Browser Client', () => {
    it('creates browser client successfully', () => {
      const client = createBrowserClient()
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
      expect(client.from).toBeDefined()
    })

    it('throws error when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      expect(() => createBrowserClient()).toThrow(
        'Missing NEXT_PUBLIC_SUPABASE_URL environment variable'
      )
    })

    it('throws error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      expect(() => createBrowserClient()).toThrow(
        'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable'
      )
    })

    it('browser client uses correct configuration', () => {
      const client = createBrowserClient() as any
      expect(client.url).toBe('https://test.supabase.co')
      expect(client.key).toBe('test-anon-key')
      expect(client.options).toBeDefined()
      expect(client.options.cookies).toBeDefined()
    })
  })

  describe('Server Client', () => {
    it('creates server client successfully', async () => {
      const client = await createServerClient()
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
      expect(client.from).toBeDefined()
    })

    it('throws error when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      await expect(createServerClient()).rejects.toThrow(
        'Missing NEXT_PUBLIC_SUPABASE_URL environment variable'
      )
    })

    it('throws error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      await expect(createServerClient()).rejects.toThrow(
        'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable'
      )
    })

    it('creates server action client successfully', async () => {
      const client = await createServerActionClient()
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
    })

    it('creates route handler client successfully', async () => {
      const client = await createRouteHandlerClient()
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
    })

    it('server client validates environment variables', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      await expect(createServerClient()).rejects.toThrow()
    })
  })

  describe('Service Role Client', () => {
    it('creates service role client successfully', () => {
      const client = createServiceRoleClient()
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
    })

    it('throws error when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      expect(() => createServiceRoleClient()).toThrow(
        'Missing NEXT_PUBLIC_SUPABASE_URL environment variable'
      )
    })

    it('throws error when SUPABASE_SERVICE_ROLE_KEY is missing', () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY
      expect(() => createServiceRoleClient()).toThrow(
        'Missing SUPABASE_SERVICE_ROLE_KEY environment variable'
      )
    })

    it('service role client uses service key', () => {
      const client = createServiceRoleClient() as any
      expect(client.url).toBe('https://test.supabase.co')
      expect(client.key).toBe('test-service-role-key')
    })
  })
})
