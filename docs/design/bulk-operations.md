# Bulk Operations Feature Design

## Overview
Enable users to perform actions on multiple sources simultaneously for efficient management.

## Operations

### 1. Bulk Delete
Delete multiple sources at once.

### 2. Bulk Tag
Add tags to multiple sources simultaneously.

### 3. Bulk Export
Export selected sources (already implemented via export feature).

## API Endpoints

### POST /api/bulk/delete
Delete multiple sources.

**Request:**
```json
{
  "source_ids": ["id1", "id2", "id3"]
}
```

**Response:**
```json
{
  "deleted": 3,
  "failed": 0,
  "errors": []
}
```

### POST /api/bulk/tag
Add tags to multiple sources.

**Request:**
```json
{
  "source_ids": ["id1", "id2"],
  "tags": ["important", "review"]
}
```

**Response:**
```json
{
  "updated": 2,
  "tags_added": 4,
  "failed": 0
}
```

## UI Features

- Checkbox selection on source cards
- "Select All" option
- Bulk action toolbar appears when sources selected
- Confirm dialogs for destructive actions
- Progress indicators for long operations

## Implementation

### Files
- `src/app/api/bulk/delete/route.ts` - Bulk delete endpoint
- `src/app/api/bulk/tag/route.ts` - Bulk tag endpoint
- `src/components/BulkActions.tsx` - Bulk action UI component
- `src/hooks/useBulkSelection.ts` - Selection state management
