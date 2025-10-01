# Supabase Client Configuration Design

## Overview
This document outlines the design for Supabase client configuration in the Recall Notebook application. The client will be used for authentication, database operations, and real-time subscriptions.

## Requirements
1. Support both client-side and server-side Supabase clients
2. Use @supabase/ssr for Next.js App Router compatibility
3. Implement proper cookie handling for authentication
4. Provide type-safe database operations
5. Support environment-based configuration

## Architecture

### Client Types
1. **Browser Client**: Used in client components and pages
2. **Server Client**: Used in Server Components and API routes
3. **Middleware Client**: Used in Next.js middleware for auth checks

### Configuration
- Environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`: Public Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anon key for client-side
  - `SUPABASE_SERVICE_ROLE_KEY`: Service role key for server-side admin operations

### File Structure
```
src/lib/supabase/
  ├── client.ts       # Browser client creation
  ├── server.ts       # Server client creation
  └── middleware.ts   # Middleware client creation
```

## API Design

### Browser Client (`client.ts`)
```typescript
export function createBrowserClient(): SupabaseClient<Database>
```
- Creates a Supabase client for use in client components
- Handles cookie-based session management
- Returns typed client with Database schema

### Server Client (`server.ts`)
```typescript
export function createServerClient(): SupabaseClient<Database>
```
- Creates a Supabase client for Server Components
- Reads cookies from Next.js headers
- Returns typed client with Database schema

```typescript
export function createServerActionClient(): SupabaseClient<Database>
```
- Creates a Supabase client for Server Actions
- Handles cookie mutations
- Returns typed client

```typescript
export function createRouteHandlerClient(): SupabaseClient<Database>
```
- Creates a Supabase client for Route Handlers (API routes)
- Handles cookie operations in API context
- Returns typed client

### Middleware Client (`middleware.ts`)
```typescript
export function createMiddlewareClient(request: NextRequest): {
  supabase: SupabaseClient<Database>,
  response: NextResponse
}
```
- Creates a Supabase client for middleware
- Returns both client and response for cookie handling
- Used for authentication checks

## Database Types
- Generate TypeScript types from Supabase schema
- Store in `src/types/database.ts`
- Import and use throughout application

## Error Handling
- All client creation functions should validate environment variables
- Throw descriptive errors if configuration is missing
- Log errors appropriately (client vs server)

## Testing Strategy
- Mock Supabase clients in tests
- Test client creation with various configurations
- Verify proper cookie handling
- Test error scenarios (missing env vars, invalid config)

## Security Considerations
1. Never expose service role key to client
2. Use Row Level Security (RLS) for all tables
3. Validate all user inputs before database operations
4. Use anon key for client-side operations only

## Performance
- Client instances should be created once per request/render
- Avoid creating multiple clients unnecessarily
- Use connection pooling on server-side
- Implement proper caching strategies

## Future Enhancements
- Add connection retry logic
- Implement connection pooling optimization
- Add performance monitoring
- Support for multiple Supabase projects (multi-tenancy)
