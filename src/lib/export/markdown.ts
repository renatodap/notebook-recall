/**
 * Markdown Export
 *
 * Convert sources to markdown format
 */

import type { Source, Summary } from '@/types';

export interface SourceWithSummary {
  source: Source;
  summary: Summary;
}

/**
 * Export sources to markdown format
 */
export function exportToMarkdown(sources: SourceWithSummary[]): string {
  const exportDate = new Date().toISOString().split('T')[0];

  let markdown = `# My Sources Export\n\n`;
  markdown += `Exported on: ${exportDate}\n`;
  markdown += `Total sources: ${sources.length}\n\n`;
  markdown += `---\n\n`;

  sources.forEach((item, index) => {
    const { source, summary } = item;

    // Title and metadata
    markdown += `## ${index + 1}. ${source.title}\n\n`;
    markdown += `**Type:** ${source.content_type}`;
    markdown += ` | **Created:** ${new Date(source.created_at).toLocaleDateString()}\n\n`;

    if (source.url) {
      markdown += `**URL:** ${source.url}\n\n`;
    }

    // Summary
    if (summary) {
      markdown += `### Summary\n\n`;
      markdown += `${summary.summary_text}\n\n`;

      // Key Actions
      if (summary.key_actions && summary.key_actions.length > 0) {
        markdown += `### Key Actions\n\n`;
        summary.key_actions.forEach((action) => {
          markdown += `- ${action}\n`;
        });
        markdown += `\n`;
      }

      // Topics
      if (summary.key_topics && summary.key_topics.length > 0) {
        markdown += `### Topics\n\n`;
        markdown += summary.key_topics.map((topic) => `#${topic.replace(/\s+/g, '-')}`).join(' ');
        markdown += `\n\n`;
      }
    }

    // Original content excerpt
    if (source.original_content) {
      const excerpt = source.original_content.substring(0, 500);
      markdown += `### Original Content\n\n`;
      markdown += `${excerpt}${source.original_content.length > 500 ? '...' : ''}\n\n`;
    }

    markdown += `---\n\n`;
  });

  return markdown;
}
