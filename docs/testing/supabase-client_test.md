# Supabase Client Testing Strategy

## Test Scope
This document outlines the testing approach for Supabase client configuration and initialization.

## Test Files
- `src/__tests__/unit/supabase-client.test.ts`

## Unit Tests

### Browser Client Tests
1. **Test: Creates browser client successfully**
   - Setup: Mock environment variables
   - Action: Call `createBrowserClient()`
   - Assert: Returns valid Supabase client instance
   - Assert: Client has expected methods (auth, from, etc.)

2. **Test: Throws error when NEXT_PUBLIC_SUPABASE_URL is missing**
   - Setup: Remove NEXT_PUBLIC_SUPABASE_URL from env
   - Action: Call `createBrowserClient()`
   - Assert: Throws error with descriptive message

3. **Test: Throws error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing**
   - Setup: Remove NEXT_PUBLIC_SUPABASE_ANON_KEY from env
   - Action: Call `createBrowserClient()`
   - Assert: Throws error with descriptive message

4. **Test: Browser client uses correct configuration**
   - Setup: Set specific env vars
   - Action: Create client
   - Assert: Client initialized with correct URL and key

### Server Client Tests
1. **Test: Creates server client successfully**
   - Setup: Mock cookies and headers
   - Action: Call `createServerClient()`
   - Assert: Returns valid Supabase client instance

2. **Test: Server client reads cookies correctly**
   - Setup: Mock cookies in headers
   - Action: Create server client
   - Assert: Client can access session from cookies

3. **Test: Creates server action client successfully**
   - Setup: Mock cookie functions
   - Action: Call `createServerActionClient()`
   - Assert: Returns valid client with cookie mutation support

4. **Test: Creates route handler client successfully**
   - Setup: Mock request/response
   - Action: Call `createRouteHandlerClient()`
   - Assert: Returns valid client for API routes

5. **Test: Server client validates environment variables**
   - Setup: Remove required env vars
   - Action: Attempt to create server client
   - Assert: Throws appropriate error

### Middleware Client Tests
1. **Test: Creates middleware client successfully**
   - Setup: Create mock NextRequest
   - Action: Call `createMiddlewareClient(request)`
   - Assert: Returns both client and response
   - Assert: Response has proper cookie headers

2. **Test: Middleware client handles authentication**
   - Setup: Mock authenticated request
   - Action: Create middleware client and check session
   - Assert: Client returns valid session

3. **Test: Middleware client handles unauthenticated requests**
   - Setup: Mock unauthenticated request
   - Action: Create middleware client and check session
   - Assert: Client returns null session

## Test Utilities

### Mocks
```typescript
// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(),
    getUser: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  })),
};

// Mock environment
export function mockEnv(vars: Record<string, string>) {
  Object.keys(vars).forEach(key => {
    process.env[key] = vars[key];
  });
}

// Mock cookies
export function mockCookies(cookies: Record<string, string>) {
  return new Map(Object.entries(cookies));
}
```

## Integration Tests
(Covered in API route tests)
- Test actual database operations
- Test authentication flows
- Test cookie persistence across requests

## Coverage Goals
- Line coverage: ≥80%
- Branch coverage: ≥80%
- Function coverage: 100%

## Test Execution
```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Edge Cases to Test
1. Invalid Supabase URL format
2. Expired or invalid API keys
3. Network failures during client creation
4. Concurrent client creation
5. Cookie parsing errors
6. Missing required headers

## Performance Tests
- Measure client creation time
- Test connection pooling efficiency
- Verify no memory leaks with multiple client instances

## Security Tests
- Verify service role key never exposed to client
- Test RLS policy enforcement
- Validate cookie security settings (httpOnly, secure, sameSite)
