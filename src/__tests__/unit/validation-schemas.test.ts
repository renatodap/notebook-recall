/**
 * Unit tests for Zod validation schemas
 *
 * CLAUDE.MD COMPLIANCE:
 * - ✅ Validates all input schemas
 * - ✅ Coverage target: 100%
 * - ✅ Tests happy path and error cases
 */

import { describe, it, expect } from '@jest/globals'
import { quickWinsPostSchema, searchRequestSchema, createSourceSchema } from '@/lib/validation/schemas'

describe('Validation Schemas', () => {
  describe('quickWinsPostSchema', () => {
    describe('Valid inputs', () => {
      it('should accept valid quick win ID: onboarding_started', () => {
        const result = quickWinsPostSchema.safeParse({ winId: 'onboarding_started' })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.winId).toBe('onboarding_started')
        }
      })

      it('should accept valid quick win ID: first_source', () => {
        const result = quickWinsPostSchema.safeParse({ winId: 'first_source' })
        expect(result.success).toBe(true)
      })

      it('should accept valid quick win ID: first_search', () => {
        const result = quickWinsPostSchema.safeParse({ winId: 'first_search' })
        expect(result.success).toBe(true)
      })

      it('should accept valid quick win ID: five_sources', () => {
        const result = quickWinsPostSchema.safeParse({ winId: 'five_sources' })
        expect(result.success).toBe(true)
      })

      it('should accept valid quick win ID: first_synthesis', () => {
        const result = quickWinsPostSchema.safeParse({ winId: 'first_synthesis' })
        expect(result.success).toBe(true)
      })

      it('should accept valid quick win ID: first_collection', () => {
        const result = quickWinsPostSchema.safeParse({ winId: 'first_collection' })
        expect(result.success).toBe(true)
      })
    })

    describe('Invalid inputs', () => {
      it('should reject invalid quick win ID', () => {
        const result = quickWinsPostSchema.safeParse({ winId: 'invalid_win' })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Invalid win ID')
        }
      })

      it('should reject empty winId', () => {
        const result = quickWinsPostSchema.safeParse({ winId: '' })
        expect(result.success).toBe(false)
      })

      it('should reject missing winId', () => {
        const result = quickWinsPostSchema.safeParse({})
        expect(result.success).toBe(false)
      })

      it('should reject winId with wrong type', () => {
        const result = quickWinsPostSchema.safeParse({ winId: 123 })
        expect(result.success).toBe(false)
      })

      it('should reject winId with SQL injection attempt', () => {
        const result = quickWinsPostSchema.safeParse({ winId: "'; DROP TABLE users; --" })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('searchRequestSchema', () => {
    describe('Valid inputs', () => {
      it('should accept valid search request with all fields', () => {
        const result = searchRequestSchema.safeParse({
          query: 'test query',
          mode: 'semantic',
          limit: 10,
          threshold: 0.7,
        })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.query).toBe('test query')
          expect(result.data.mode).toBe('semantic')
          expect(result.data.limit).toBe(10)
          expect(result.data.threshold).toBe(0.7)
        }
      })

      it('should accept minimal search request (query only)', () => {
        const result = searchRequestSchema.safeParse({ query: 'test' })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.mode).toBe('semantic') // default
          expect(result.data.limit).toBe(10) // default
          expect(result.data.threshold).toBe(0.7) // default
        }
      })

      it('should accept keyword search mode', () => {
        const result = searchRequestSchema.safeParse({ query: 'test', mode: 'keyword' })
        expect(result.success).toBe(true)
      })

      it('should accept hybrid search mode', () => {
        const result = searchRequestSchema.safeParse({ query: 'test', mode: 'hybrid' })
        expect(result.success).toBe(true)
      })

      it('should accept valid threshold range (0 to 1)', () => {
        expect(searchRequestSchema.safeParse({ query: 'test', threshold: 0 }).success).toBe(true)
        expect(searchRequestSchema.safeParse({ query: 'test', threshold: 0.5 }).success).toBe(true)
        expect(searchRequestSchema.safeParse({ query: 'test', threshold: 1 }).success).toBe(true)
      })

      it('should accept valid limit range (1 to 100)', () => {
        expect(searchRequestSchema.safeParse({ query: 'test', limit: 1 }).success).toBe(true)
        expect(searchRequestSchema.safeParse({ query: 'test', limit: 50 }).success).toBe(true)
        expect(searchRequestSchema.safeParse({ query: 'test', limit: 100 }).success).toBe(true)
      })
    })

    describe('Invalid inputs', () => {
      it('should reject empty query', () => {
        const result = searchRequestSchema.safeParse({ query: '' })
        expect(result.success).toBe(false)
      })

      it('should reject missing query', () => {
        const result = searchRequestSchema.safeParse({})
        expect(result.success).toBe(false)
      })

      it('should reject query longer than 1000 characters', () => {
        const result = searchRequestSchema.safeParse({ query: 'a'.repeat(1001) })
        expect(result.success).toBe(false)
      })

      it('should reject invalid search mode', () => {
        const result = searchRequestSchema.safeParse({ query: 'test', mode: 'invalid' })
        expect(result.success).toBe(false)
      })

      it('should reject limit of 0', () => {
        const result = searchRequestSchema.safeParse({ query: 'test', limit: 0 })
        expect(result.success).toBe(false)
      })

      it('should reject limit greater than 100', () => {
        const result = searchRequestSchema.safeParse({ query: 'test', limit: 101 })
        expect(result.success).toBe(false)
      })

      it('should reject negative limit', () => {
        const result = searchRequestSchema.safeParse({ query: 'test', limit: -1 })
        expect(result.success).toBe(false)
      })

      it('should reject threshold less than 0', () => {
        const result = searchRequestSchema.safeParse({ query: 'test', threshold: -0.1 })
        expect(result.success).toBe(false)
      })

      it('should reject threshold greater than 1', () => {
        const result = searchRequestSchema.safeParse({ query: 'test', threshold: 1.1 })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('createSourceSchema', () => {
    const validSource = {
      title: 'Test Source',
      content_type: 'text' as const,
      original_content: 'This is test content',
      summary_text: 'This is a test summary with enough text',
      key_actions: ['Action 1', 'Action 2'],
      key_topics: ['topic1', 'topic2'],
      word_count: 100,
    }

    describe('Valid inputs', () => {
      it('should accept valid source with all fields', () => {
        const result = createSourceSchema.safeParse(validSource)
        expect(result.success).toBe(true)
      })

      it('should accept source with URL', () => {
        const result = createSourceSchema.safeParse({
          ...validSource,
          url: 'https://example.com',
        })
        expect(result.success).toBe(true)
      })

      it('should accept all content types', () => {
        const contentTypes = ['text', 'url', 'pdf', 'note', 'image']
        contentTypes.forEach((type) => {
          const result = createSourceSchema.safeParse({
            ...validSource,
            content_type: type,
          })
          expect(result.success).toBe(true)
        })
      })
    })

    describe('Invalid inputs', () => {
      it('should reject empty title', () => {
        const result = createSourceSchema.safeParse({
          ...validSource,
          title: '',
        })
        expect(result.success).toBe(false)
      })

      it('should reject title longer than 500 characters', () => {
        const result = createSourceSchema.safeParse({
          ...validSource,
          title: 'a'.repeat(501),
        })
        expect(result.success).toBe(false)
      })

      it('should reject invalid content type', () => {
        const result = createSourceSchema.safeParse({
          ...validSource,
          content_type: 'invalid',
        })
        expect(result.success).toBe(false)
      })

      it('should reject empty content', () => {
        const result = createSourceSchema.safeParse({
          ...validSource,
          original_content: '',
        })
        expect(result.success).toBe(false)
      })

      it('should reject summary shorter than 10 characters', () => {
        const result = createSourceSchema.safeParse({
          ...validSource,
          summary_text: 'Too short',
        })
        expect(result.success).toBe(false)
      })

      it('should reject summary longer than 5000 characters', () => {
        const result = createSourceSchema.safeParse({
          ...validSource,
          summary_text: 'a'.repeat(5001),
        })
        expect(result.success).toBe(false)
      })

      it('should reject more than 20 key actions', () => {
        const result = createSourceSchema.safeParse({
          ...validSource,
          key_actions: Array(21).fill('action'),
        })
        expect(result.success).toBe(false)
      })

      it('should reject more than 50 key topics', () => {
        const result = createSourceSchema.safeParse({
          ...validSource,
          key_topics: Array(51).fill('topic'),
        })
        expect(result.success).toBe(false)
      })

      it('should reject negative word count', () => {
        const result = createSourceSchema.safeParse({
          ...validSource,
          word_count: -1,
        })
        expect(result.success).toBe(false)
      })

      it('should reject invalid URL format', () => {
        const result = createSourceSchema.safeParse({
          ...validSource,
          url: 'not-a-url',
        })
        expect(result.success).toBe(false)
      })
    })
  })
})
