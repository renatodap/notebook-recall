# Authentication System Design

## Overview
This document outlines the authentication system for Recall Notebook using Supabase Auth with Next.js App Router.

## Requirements
1. Email/password authentication
2. Secure session management with cookies
3. Protected routes (redirect to login if unauthenticated)
4. Sign up, sign in, sign out flows
5. Middleware for auth checks
6. Client and server-side auth state management

## Architecture

### Authentication Flow

#### Sign Up
1. User enters email and password
2. Client validates input (email format, password strength)
3. Client calls Supabase Auth signUp
4. Supabase sends confirmation email
5. User confirms email
6. Session created automatically
7. Redirect to dashboard

#### Sign In
1. User enters email and password
2. Client validates input
3. Client calls Supabase Auth signInWithPassword
4. Supabase validates credentials
5. Session created and stored in cookies
6. Redirect to dashboard

#### Sign Out
1. User clicks sign out
2. Client calls Supabase Auth signOut
3. Session cleared from cookies
4. Redirect to home/login page

### Session Management
- Sessions stored in HTTP-only cookies
- Automatic session refresh
- Session validation in middleware
- Server-side session access in Server Components

## File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (protected)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── search/
│   │   │   └── page.tsx
│   │   └── source/
│   │       └── [id]/
│   │           └── page.tsx
│   └── auth/
│       ├── callback/
│       │   └── route.ts
│       └── signout/
│           └── route.ts
├── lib/
│   └── auth/
│       ├── actions.ts       # Server actions for auth
│       └── utils.ts         # Auth helper functions
├── middleware.ts            # Auth middleware
└── components/
    └── auth/
        ├── LoginForm.tsx
        ├── SignupForm.tsx
        └── AuthProvider.tsx (optional)
```

## API Design

### Server Actions (`lib/auth/actions.ts`)

```typescript
export async function signUp(email: string, password: string): Promise<{
  success: boolean;
  error?: string;
}>

export async function signIn(email: string, password: string): Promise<{
  success: boolean;
  error?: string;
}>

export async function signOut(): Promise<void>

export async function getSession(): Promise<Session | null>

export async function getUser(): Promise<User | null>
```

### Auth Utils (`lib/auth/utils.ts`)

```typescript
export function validateEmail(email: string): boolean
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
}
export function isAuthenticated(): Promise<boolean>
```

### Middleware (`middleware.ts`)

```typescript
export async function middleware(request: NextRequest): Promise<NextResponse>

// Protected routes
const protectedRoutes = ['/dashboard', '/search', '/source']

// Public routes
const publicRoutes = ['/', '/login', '/signup']
```

## Components

### LoginForm.tsx
- Email input with validation
- Password input
- Submit button with loading state
- Error message display
- Link to signup page
- "Forgot password" link (future)

### SignupForm.tsx
- Email input with validation
- Password input with strength indicator
- Confirm password input
- Submit button with loading state
- Error message display
- Link to login page
- Terms of service checkbox

## Route Protection

### Middleware Strategy
1. Check if route requires authentication
2. Get session from Supabase client
3. If protected route and no session → redirect to /login
4. If auth route (login/signup) and has session → redirect to /dashboard
5. Otherwise, allow request to proceed

### Server Component Protection
```typescript
export default async function ProtectedPage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Page content
}
```

## Error Handling

### Common Auth Errors
- Invalid email format
- Password too weak
- Email already registered
- Invalid credentials
- Email not confirmed
- Network errors
- Rate limiting

### Error Messages
- User-friendly messages (no technical jargon)
- Specific enough to guide user
- Secure (don't reveal if email exists)

## Security Considerations

1. **Password Requirements:**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one number
   - At least one special character

2. **Session Security:**
   - HTTP-only cookies
   - Secure flag in production
   - SameSite=Lax
   - Automatic expiration

3. **Rate Limiting:**
   - Supabase built-in rate limiting
   - Consider additional client-side throttling

4. **CSRF Protection:**
   - Next.js automatic CSRF protection
   - Supabase PKCE flow

## Testing Strategy

### Unit Tests
- Validate email function
- Validate password function
- Auth action error handling

### Integration Tests
- Complete sign up flow
- Complete sign in flow
- Sign out flow
- Session persistence
- Redirect logic

### E2E Tests (Future)
- User journey: signup → confirm → login → dashboard
- Protected route access without auth
- Session expiration handling

## User Experience

### Loading States
- Button disabled during submission
- Loading spinner on button
- Form fields disabled during submission

### Success States
- Immediate redirect after successful auth
- Welcome message (optional)
- Smooth transition to dashboard

### Error States
- Clear error messages
- Field-specific errors highlighted
- Non-intrusive error display

## Future Enhancements
- OAuth providers (Google, GitHub)
- Two-factor authentication
- Password reset flow
- Email change flow
- Account deletion
- Session management UI (view all sessions)
- Remember me functionality
- Magic link authentication
