/**
 * JSON Export
 *
 * Convert sources to JSON format
 */

import type { Source, Summary } from '@/types';

export interface SourceWithSummary {
  source: Source;
  summary: Summary;
}

export interface ExportData {
  export_date: string;
  version: string;
  total_sources: number;
  sources: Array<{
    id: string;
    title: string;
    content_type: string;
    url: string | null;
    created_at: string;
    updated_at: string;
    original_content: string;
    summary: {
      text: string;
      actions: string[];
      topics: string[];
      word_count: number;
    };
  }>;
}

/**
 * Export sources to JSON format
 */
export function exportToJSON(sources: SourceWithSummary[]): string {
  const exportData: ExportData = {
    export_date: new Date().toISOString(),
    version: '1.0',
    total_sources: sources.length,
    sources: sources.map((item) => ({
      id: item.source.id,
      title: item.source.title,
      content_type: item.source.content_type,
      url: item.source.url,
      created_at: item.source.created_at,
      updated_at: item.source.updated_at,
      original_content: item.source.original_content,
      summary: {
        text: item.summary?.summary_text || '',
        actions: item.summary?.key_actions || [],
        topics: item.summary?.key_topics || [],
        word_count: item.summary?.word_count || 0,
      },
    })),
  };

  return JSON.stringify(exportData, null, 2);
}
