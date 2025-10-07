// Mock environment variables FIRST (before any imports)
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'
process.env.GROQ_API_KEY = 'test-groq-key'
process.env.OPENROUTER_API_KEY = 'test-openrouter-key'
process.env.OPENAI_API_KEY = 'test-openai-key'

// Note: @testing-library/jest-dom removed - not needed for Node environment tests
// Only include it in component tests that use jsdom environment
