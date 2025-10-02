/**
 * Document Chunking Service
 *
 * Intelligently splits documents into semantic chunks for RAG
 */

export interface ChunkConfig {
  maxTokens?: number;
  overlapTokens?: number;
  minChunkSize?: number;
  respectBoundaries?: boolean;
}

export interface DocumentChunk {
  index: number;
  content: string;
  metadata: {
    startChar: number;
    endChar: number;
    tokenCount: number;
    type: 'paragraph' | 'sentence' | 'arbitrary';
    heading?: string;
    pageNumber?: number;
  };
}

const DEFAULT_CONFIG: Required<ChunkConfig> = {
  maxTokens: 500,
  overlapTokens: 50,
  minChunkSize: 100,
  respectBoundaries: true,
};

/**
 * Estimate token count (rough approximation)
 * GPT tokenizer averages ~4 chars per token in English
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Split text at paragraph boundaries
 */
function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * Split text at sentence boundaries
 */
function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Create overlapping chunks with context preservation
 */
export function createChunks(
  text: string,
  config: ChunkConfig = {}
): DocumentChunk[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const chunks: DocumentChunk[] = [];

  if (!text || text.trim().length === 0) {
    return chunks;
  }

  // Strategy 1: Try paragraph-based chunking (most semantic)
  if (cfg.respectBoundaries) {
    const paragraphs = splitIntoParagraphs(text);
    let currentChunk = '';
    let currentTokens = 0;
    let startChar = 0;
    let chunkIndex = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      const paraTokens = estimateTokens(paragraph);

      // If single paragraph exceeds max, split it further
      if (paraTokens > cfg.maxTokens) {
        // Save current chunk if exists
        if (currentChunk.trim().length > 0) {
          chunks.push({
            index: chunkIndex++,
            content: currentChunk.trim(),
            metadata: {
              startChar,
              endChar: startChar + currentChunk.length,
              tokenCount: currentTokens,
              type: 'paragraph',
            },
          });
        }

        // Split large paragraph into sentences
        const sentences = splitIntoSentences(paragraph);
        let sentenceChunk = '';
        let sentenceTokens = 0;
        let sentenceStart = text.indexOf(paragraph, startChar);

        for (const sentence of sentences) {
          const sentTokens = estimateTokens(sentence);

          if (sentenceTokens + sentTokens > cfg.maxTokens && sentenceChunk.trim().length > 0) {
            chunks.push({
              index: chunkIndex++,
              content: sentenceChunk.trim(),
              metadata: {
                startChar: sentenceStart,
                endChar: sentenceStart + sentenceChunk.length,
                tokenCount: sentenceTokens,
                type: 'sentence',
              },
            });

            // Create overlap
            const overlapWords = sentenceChunk.split(/\s+/).slice(-cfg.overlapTokens / 4);
            sentenceChunk = overlapWords.join(' ') + ' ' + sentence;
            sentenceTokens = estimateTokens(sentenceChunk);
            sentenceStart = sentenceStart + sentenceChunk.length - sentence.length;
          } else {
            sentenceChunk += (sentenceChunk ? ' ' : '') + sentence;
            sentenceTokens += sentTokens;
          }
        }

        // Save remaining sentence chunk
        if (sentenceChunk.trim().length > 0) {
          chunks.push({
            index: chunkIndex++,
            content: sentenceChunk.trim(),
            metadata: {
              startChar: sentenceStart,
              endChar: sentenceStart + sentenceChunk.length,
              tokenCount: sentenceTokens,
              type: 'sentence',
            },
          });
        }

        currentChunk = '';
        currentTokens = 0;
        startChar = text.indexOf(paragraph, startChar) + paragraph.length;
        continue;
      }

      // Add paragraph to current chunk if it fits
      if (currentTokens + paraTokens <= cfg.maxTokens) {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        currentTokens += paraTokens;
      } else {
        // Save current chunk
        if (currentChunk.trim().length > 0) {
          chunks.push({
            index: chunkIndex++,
            content: currentChunk.trim(),
            metadata: {
              startChar,
              endChar: startChar + currentChunk.length,
              tokenCount: currentTokens,
              type: 'paragraph',
            },
          });
        }

        // Create overlap from last paragraph
        const lastPara = paragraphs[i - 1];
        const overlapText = lastPara
          ? lastPara.split(/\s+/).slice(-cfg.overlapTokens / 4).join(' ')
          : '';

        currentChunk = overlapText ? overlapText + '\n\n' + paragraph : paragraph;
        currentTokens = estimateTokens(currentChunk);
        startChar = text.indexOf(paragraph, startChar);
      }
    }

    // Save final chunk
    if (currentChunk.trim().length >= cfg.minChunkSize) {
      chunks.push({
        index: chunkIndex++,
        content: currentChunk.trim(),
        metadata: {
          startChar,
          endChar: startChar + currentChunk.length,
          tokenCount: currentTokens,
          type: 'paragraph',
        },
      });
    }
  } else {
    // Strategy 2: Fixed-size chunking with overlap
    const words = text.split(/\s+/);
    const wordsPerChunk = cfg.maxTokens * 0.75; // Approx 3 words per token
    const overlapWords = cfg.overlapTokens * 0.75;

    for (let i = 0; i < words.length; i += wordsPerChunk - overlapWords) {
      const chunkWords = words.slice(i, i + wordsPerChunk);
      const content = chunkWords.join(' ');

      if (content.length >= cfg.minChunkSize) {
        chunks.push({
          index: Math.floor(i / wordsPerChunk),
          content,
          metadata: {
            startChar: text.indexOf(chunkWords[0], i > 0 ? chunks[chunks.length - 1].metadata.endChar : 0),
            endChar: text.indexOf(chunkWords[chunkWords.length - 1]) + chunkWords[chunkWords.length - 1].length,
            tokenCount: estimateTokens(content),
            type: 'arbitrary',
          },
        });
      }
    }
  }

  return chunks;
}

/**
 * Chunk a document with metadata extraction
 */
export function chunkDocument(
  content: string,
  contentType: 'text' | 'url' | 'pdf' | 'note' | 'image',
  config: ChunkConfig = {}
): DocumentChunk[] {
  // For PDFs, try to extract page numbers from content markers
  if (contentType === 'pdf') {
    return chunkPDF(content, config);
  }

  // For other types, standard chunking
  return createChunks(content, config);
}

/**
 * PDF-specific chunking with page extraction
 */
function chunkPDF(content: string, config: ChunkConfig): DocumentChunk[] {
  // Look for page markers like "[Page 1]" or "Page 1" at line starts
  const pagePattern = /(?:^|\n)\s*(?:\[?Page\s+(\d+)\]?)/gi;
  const pages: Array<{ pageNum: number; content: string }> = [];

  let lastIndex = 0;
  let match;
  let currentPageNum = 1;

  while ((match = pagePattern.exec(content)) !== null) {
    if (lastIndex !== match.index) {
      pages.push({
        pageNum: currentPageNum,
        content: content.slice(lastIndex, match.index).trim(),
      });
    }
    currentPageNum = parseInt(match[1], 10);
    lastIndex = match.index + match[0].length;
  }

  // Add final page
  if (lastIndex < content.length) {
    pages.push({
      pageNum: currentPageNum,
      content: content.slice(lastIndex).trim(),
    });
  }

  // If no pages detected, chunk normally
  if (pages.length === 0) {
    return createChunks(content, config);
  }

  // Chunk each page separately
  const allChunks: DocumentChunk[] = [];
  let globalIndex = 0;

  for (const page of pages) {
    const pageChunks = createChunks(page.content, config);

    for (const chunk of pageChunks) {
      allChunks.push({
        ...chunk,
        index: globalIndex++,
        metadata: {
          ...chunk.metadata,
          pageNumber: page.pageNum,
        },
      });
    }
  }

  return allChunks;
}

/**
 * Get optimal chunk configuration based on content type
 */
export function getChunkConfig(
  contentType: 'text' | 'url' | 'pdf' | 'note' | 'image',
  contentLength: number
): ChunkConfig {
  // Short content: don't chunk
  if (contentLength < 1000) {
    return {
      maxTokens: 1000,
      overlapTokens: 0,
      minChunkSize: 0,
      respectBoundaries: true,
    };
  }

  // Medium content: moderate chunks
  if (contentLength < 5000) {
    return {
      maxTokens: 500,
      overlapTokens: 50,
      minChunkSize: 200,
      respectBoundaries: true,
    };
  }

  // Long content: smaller chunks with overlap
  return {
    maxTokens: 400,
    overlapTokens: 50,
    minChunkSize: 150,
    respectBoundaries: true,
  };
}

/**
 * Determine if content should be chunked
 */
export function shouldChunk(
  contentType: 'text' | 'url' | 'pdf' | 'note' | 'image',
  contentLength: number
): boolean {
  // Always chunk PDFs and long URLs
  if (contentType === 'pdf' || contentType === 'url') {
    return contentLength > 500;
  }

  // Chunk text/notes if > 1000 chars
  if (contentType === 'text' || contentType === 'note') {
    return contentLength > 1000;
  }

  // Don't chunk images
  return false;
}
