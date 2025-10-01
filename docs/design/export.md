# Export Feature Design

## Overview
Allow users to export their sources and summaries in markdown or JSON format for backup, sharing, and offline access.

## Formats

### Markdown Export
```markdown
# My Sources Export
Exported on: 2025-01-15

## AI Safety Research
**Type:** PDF | **Created:** 2025-01-10

### Summary
Research on AI alignment and safety in ML systems.

### Key Actions
- Review safety protocols
- Implement safeguards

### Topics
#ai #safety #machine-learning

---
```

### JSON Export
```json
{
  "export_date": "2025-01-15T10:30:00Z",
  "sources": [
    {
      "id": "uuid",
      "title": "AI Safety Research",
      "content_type": "pdf",
      "url": "https://...",
      "created_at": "2025-01-10",
      "summary": {
        "text": "Research on...",
        "actions": ["Review safety protocols"],
        "topics": ["ai", "safety"]
      }
    }
  ]
}
```

## API Endpoints

### GET /api/export
Export sources in specified format.

**Query Parameters:**
- `format`: "markdown" | "json" (required)
- `sources`: Comma-separated source IDs (optional, exports all if not provided)

**Response:**
- Content-Type: text/markdown or application/json
- Content-Disposition: attachment; filename="sources_export_{date}.{ext}"

## Implementation

### Files
- `src/lib/export/markdown.ts` - Markdown formatting
- `src/lib/export/json.ts` - JSON formatting
- `src/app/api/export/route.ts` - Export endpoint
- `src/components/ExportButton.tsx` - UI component

### Features
- Export all sources or selected sources
- Include summaries, actions, topics
- Proper file naming with timestamps
- Download trigger in browser
