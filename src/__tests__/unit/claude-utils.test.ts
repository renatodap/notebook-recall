import {
  estimateTokenCount,
  chunkContent,
  retryWithBackoff,
  sanitizeContent,
  validateSummarizationResponse,
} from '@/lib/claude/utils'

describe('Claude Utils', () => {
  describe('estimateTokenCount', () => {
    it('estimates token count correctly', () => {
      const text = 'Hello world'
      const count = estimateTokenCount(text)
      expect(count).toBeGreaterThan(0)
      expect(count).toBeLessThan(text.length)
    })

    it('returns higher count for longer text', () => {
      const short = 'Hello'
      const long = 'Hello world this is a longer text'
      expect(estimateTokenCount(long)).toBeGreaterThan(
        estimateTokenCount(short)
      )
    })
  })

  describe('chunkContent', () => {
    it('returns single chunk for short content', () => {
      const content = 'Short content'
      const chunks = chunkContent(content, 1000)
      expect(chunks).toHaveLength(1)
      expect(chunks[0]).toBe(content)
    })

    it('splits long content into chunks', () => {
      const content = 'A'.repeat(10000)
      const chunks = chunkContent(content, 1000)
      expect(chunks.length).toBeGreaterThan(1)
    })

    it('splits by paragraphs when possible', () => {
      const content = 'Paragraph 1\n\nParagraph 2\n\nParagraph 3'
      const chunks = chunkContent(content, 10)
      expect(chunks.length).toBeGreaterThan(1)
    })

    it('preserves content integrity', () => {
      const content = 'Test content with multiple paragraphs\n\nSecond paragraph'
      const chunks = chunkContent(content, 1000)
      const rejoined = chunks.join(' ')
      expect(rejoined).toContain('Test content')
      expect(rejoined).toContain('Second paragraph')
    })
  })

  describe('retryWithBackoff', () => {
    it('succeeds on first try', async () => {
      const fn = jest.fn().mockResolvedValue('success')
      const result = await retryWithBackoff(fn)
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('retries on failure and succeeds', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success')

      const result = await retryWithBackoff(fn, 3, 10)
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('throws after max retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'))

      await expect(retryWithBackoff(fn, 3, 10)).rejects.toThrow('fail')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('does not retry on 400 error', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('400 Bad Request'))

      await expect(retryWithBackoff(fn, 3, 10)).rejects.toThrow('400')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('does not retry on 401 error', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('401 Unauthorized'))

      await expect(retryWithBackoff(fn, 3, 10)).rejects.toThrow('401')
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('sanitizeContent', () => {
    it('trims whitespace', () => {
      const content = '  Hello world  '
      expect(sanitizeContent(content)).toBe('Hello world')
    })

    it('replaces multiple spaces with single space', () => {
      const content = 'Hello    world'
      expect(sanitizeContent(content)).toBe('Hello world')
    })

    it('truncates very long content', () => {
      const content = 'A'.repeat(600000)
      const sanitized = sanitizeContent(content)
      expect(sanitized.length).toBeLessThan(content.length)
      expect(sanitized.length).toBeLessThanOrEqual(500000)
    })

    it('preserves normal content', () => {
      const content = 'Normal content with normal spacing'
      expect(sanitizeContent(content)).toBe(content)
    })
  })

  describe('validateSummarizationResponse', () => {
    it('validates correct response', () => {
      const response = {
        summary: 'Test summary',
        actions: ['Action 1', 'Action 2'],
        topics: ['topic1', 'topic2'],
      }
      const result = validateSummarizationResponse(response)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('rejects null response', () => {
      const result = validateSummarizationResponse(null)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Response is not an object')
    })

    it('rejects response without summary', () => {
      const response = {
        actions: ['Action 1'],
        topics: ['topic1'],
      }
      const result = validateSummarizationResponse(response)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Missing or invalid summary field')
    })

    it('rejects response with non-string summary', () => {
      const response = {
        summary: 123,
        actions: ['Action 1'],
        topics: ['topic1'],
      }
      const result = validateSummarizationResponse(response)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Missing or invalid summary field')
    })

    it('rejects response without actions array', () => {
      const response = {
        summary: 'Test',
        actions: 'not an array',
        topics: ['topic1'],
      }
      const result = validateSummarizationResponse(response)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Missing or invalid actions field')
    })

    it('rejects response without topics array', () => {
      const response = {
        summary: 'Test',
        actions: ['Action 1'],
        topics: 'not an array',
      }
      const result = validateSummarizationResponse(response)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Missing or invalid topics field')
    })
  })
})
