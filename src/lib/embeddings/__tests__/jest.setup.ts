/**
 * Jest setup for embeddings tests
 * Reduces retry delays for faster test execution
 */

// Speed up retry delays for testing
if (process.env.NODE_ENV === 'test') {
  jest.setTimeout(30000) // 30 second global timeout
}
