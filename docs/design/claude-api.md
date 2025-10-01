# Claude API Integration Design

## Overview
This document outlines the integration with Anthropic's Claude API for content summarization and analysis.

## Requirements
1. Generate concise summaries (2-3 paragraphs)
2. Extract key action items
3. Identify main topics/themes
4. Handle various content lengths (chunking for large content)
5. Retry logic for API failures
6. Structured JSON responses
7. Error handling with user-friendly messages

## Architecture

### API Client Structure
```
src/lib/claude/
├── client.ts          # Claude API client wrapper
├── prompts.ts         # Prompt templates
└── utils.ts           # Helper functions (chunking, etc.)
```

## API Design

### Client (`client.ts`)

```typescript
export interface SummarizationResult {
  summary: string;
  actions: string[];
  topics: string[];
}

export async function summarizeContent(
  content: string,
  contentType: ContentType
): Promise<SummarizationResult>

export async function generateEmbedding(text: string): Promise<number[]>
```

### Prompts (`prompts.ts`)

```typescript
export function getSummarizationPrompt(
  content: string,
  contentType: ContentType
): string

export function getEmbeddingPrompt(text: string): string
```

## Summarization Prompt Design

### Base Prompt Template
```
You are a helpful assistant that analyzes content and provides structured summaries.

Analyze the following {contentType} and provide:

1. A concise summary (2-3 paragraphs maximum) that captures the main ideas and key points
2. Key action items or takeaways (3-5 bullet points)
3. Main topics/themes (3-5 tags, lowercase, comma-separated)

Content:
{content}

Provide your response in the following JSON format:
{
  "summary": "Your concise summary here...",
  "actions": ["Action item 1", "Action item 2", ...],
  "topics": ["topic1", "topic2", ...]
}

Important:
- Keep the summary concise but informative
- Extract actionable items when present
- Topics should be single words or short phrases
- Respond ONLY with valid JSON
```

## Implementation Details

### Claude API Configuration
- Model: `claude-3-5-sonnet-20241022` (latest)
- Max tokens: 2000 (for responses)
- Temperature: 0.3 (for consistent summaries)
- System prompt: Role definition

### Token Management
- Count tokens before sending
- Chunk content if exceeds model context window (200k tokens)
- Implement sliding window for very large documents
- Track token usage for billing

### Chunking Strategy
For content > 150k tokens:
1. Split into semantic chunks (by paragraph/section)
2. Summarize each chunk
3. Combine summaries
4. Generate final meta-summary

### Response Parsing
```typescript
1. Receive Claude response
2. Extract JSON from response
3. Validate structure (summary, actions, topics)
4. Handle malformed JSON gracefully
5. Return structured data
```

### Error Handling

#### API Errors
- 400 Bad Request → Invalid input, retry with modified prompt
- 429 Rate Limit → Exponential backoff, retry
- 500 Server Error → Retry with backoff
- 503 Service Unavailable → Retry with backoff
- Network errors → Retry up to 3 times

#### Error Messages (User-Facing)
- Rate limit: "Service is busy, please try again in a moment"
- API error: "Unable to generate summary, please try again"
- Network error: "Connection issue, please check your internet"
- Invalid content: "Content could not be processed"

### Retry Logic
```typescript
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T>
```

- Exponential backoff: delay = baseDelay * 2^attempt
- Max retries: 3
- Jitter to prevent thundering herd

## Performance Optimization

### Caching
- Cache summaries in database (already done)
- Don't re-summarize unchanged content
- Cache common prompts

### Streaming (Future)
- Use Claude's streaming API for real-time summaries
- Show progressive results to user
- Improve perceived performance

### Batch Processing (Future)
- Batch multiple summarization requests
- Process asynchronously with job queue
- Send progress updates

## Cost Management

### Token Optimization
- Trim unnecessary whitespace
- Remove boilerplate content
- Use concise prompts
- Cache results aggressively

### Monitoring
- Track tokens used per request
- Monitor daily/monthly usage
- Set alerts for high usage
- Implement rate limiting on client side

## Testing Strategy

### Unit Tests
1. Test prompt generation
2. Test chunking logic
3. Test response parsing
4. Test error handling
5. Mock Claude API responses

### Integration Tests
1. Test actual API calls (with test key)
2. Test retry logic with simulated failures
3. Test large content handling
4. Test malformed response handling

### Test Fixtures
```typescript
export const mockSummarizationResponse = {
  summary: "Test summary...",
  actions: ["Test action 1", "Test action 2"],
  topics: ["test", "summary", "mock"]
}

export const mockLargeContent = "..." // > 150k tokens
export const mockMalformedResponse = "Invalid JSON..."
```

## Security Considerations

1. **API Key Protection**
   - Store in environment variables
   - Never expose to client
   - Rotate regularly

2. **Input Validation**
   - Sanitize user content
   - Limit content size
   - Remove potential prompt injections

3. **Output Validation**
   - Validate JSON structure
   - Sanitize topics/actions
   - Remove potentially harmful content

## Future Enhancements
- Multi-modal support (images, audio)
- Custom summarization styles
- Multi-language support
- Sentiment analysis
- Entity extraction
- Question answering over content
