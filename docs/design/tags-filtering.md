# Tags Filtering Feature Design

## Overview
Implement tag-based filtering on the dashboard to allow users to quickly find sources by topic categories.

## Current State
- Tags are already being created in the database when sources are added
- Tags table has: id, source_id, tag_name, created_at
- Tags are associated with sources through source_id foreign key
- Dashboard currently shows all sources without filtering capability

## Requirements

### Functional Requirements
1. Display all unique tags available to the user
2. Allow users to select one or multiple tags for filtering
3. Show sources that match ANY of the selected tags (OR logic)
4. Option to switch to AND logic (match ALL selected tags)
5. Show tag count (number of sources per tag)
6. Clear all filters with one click
7. Filter state persists during session
8. Combine tag filters with search queries

### Non-Functional Requirements
1. Tag filter UI loads in <200ms
2. Filter application <300ms
3. Support 1000+ unique tags without performance degradation
4. Intuitive UX with visual feedback

## Architecture

### Component Structure

```
Dashboard
├── TagFilter Component
│   ├── TagList (all available tags with counts)
│   ├── Selected Tags Pills
│   └── Filter Controls (clear, AND/OR toggle)
└── SourceList (filtered results)
```

### Data Flow

```
1. Load Dashboard
   ↓
2. Fetch User's Tags with Counts
   ↓
3. Display Tags with Counts
   ↓
4. User Selects Tags
   ↓
5. Update URL Query Params
   ↓
6. Filter Sources by Selected Tags
   ↓
7. Update SourceList Display
```

## API Design

### New Endpoint: GET /api/tags

Get all unique tags for the authenticated user with source counts.

**Request:**
```
GET /api/tags
```

**Response:**
```json
{
  "tags": [
    {
      "tag_name": "ai",
      "count": 12,
      "sources": ["source-id-1", "source-id-2", ...]
    },
    {
      "tag_name": "machine learning",
      "count": 8,
      "sources": ["source-id-3", ...]
    }
  ],
  "total": 25
}
```

### Enhanced Endpoint: GET /api/sources

Add tag filtering parameters.

**Request:**
```
GET /api/sources?tags=ai,machine%20learning&tagLogic=OR
```

**Query Parameters:**
- `tags` (string, optional): Comma-separated list of tag names
- `tagLogic` (string, optional): "OR" or "AND" logic for multiple tags
- Existing params: `page`, `limit`, `contentType`, `sort`

**Response:**
```json
{
  "data": [...filtered sources...],
  "total": 42,
  "page": 1,
  "limit": 20,
  "hasMore": true,
  "filters": {
    "tags": ["ai", "machine learning"],
    "tagLogic": "OR"
  }
}
```

## Database Queries

### Get Tags with Counts

```sql
SELECT
  tag_name,
  COUNT(DISTINCT source_id) as count,
  ARRAY_AGG(source_id) as sources
FROM tags
WHERE source_id IN (
  SELECT id FROM sources WHERE user_id = $1
)
GROUP BY tag_name
ORDER BY count DESC, tag_name ASC;
```

### Filter Sources by Tags (OR Logic)

```sql
SELECT DISTINCT s.*
FROM sources s
INNER JOIN tags t ON s.id = t.source_id
WHERE s.user_id = $1
  AND t.tag_name IN ('ai', 'machine learning')
ORDER BY s.created_at DESC;
```

### Filter Sources by Tags (AND Logic)

```sql
SELECT s.*
FROM sources s
WHERE s.user_id = $1
  AND (
    SELECT COUNT(DISTINCT t.tag_name)
    FROM tags t
    WHERE t.source_id = s.id
      AND t.tag_name IN ('ai', 'machine learning')
  ) = 2  -- Number of tags to match
ORDER BY s.created_at DESC;
```

## UI Components

### TagFilter Component

**Props:**
- `availableTags`: Tag[] - All tags with counts
- `selectedTags`: string[] - Currently selected tags
- `onTagSelect`: (tag: string) => void
- `onTagDeselect`: (tag: string) => void
- `onClearAll`: () => void
- `tagLogic`: "OR" | "AND"
- `onLogicChange`: (logic: "OR" | "AND") => void

**Visual Design:**
```
╔══════════════════════════════════════╗
║ Filter by Tags                       ║
╟──────────────────────────────────────╢
║ Selected: [ai ×] [ml ×]  Clear All   ║
║ Logic: ● OR  ○ AND                   ║
╟──────────────────────────────────────╢
║ Available Tags:                      ║
║ □ ai (12)                            ║
║ ☑ machine learning (8)               ║
║ □ ethics (5)                         ║
║ □ safety (3)                         ║
║ ... show more                        ║
╚══════════════════════════════════════╝
```

### TagPill Component

**Props:**
- `tagName`: string
- `count?`: number
- `selected`: boolean
- `onSelect?`: () => void
- `onDeselect?`: () => void
- `removable`: boolean

**Variants:**
- Default: Gray background, clickable
- Selected: Blue background, white text
- With count: Shows count badge
- Removable: Shows × button

## Implementation Files

```
src/lib/tags/
├── utils.ts              # Tag normalization, validation
└── queries.ts            # Database query helpers

src/app/api/tags/
└── route.ts              # GET /api/tags endpoint

src/components/tags/
├── TagFilter.tsx         # Main filtering component
├── TagPill.tsx           # Individual tag display
├── TagList.tsx           # List of all tags
└── SelectedTags.tsx      # Selected tags display

src/hooks/
└── useTags.ts            # Custom hook for tag state

src/__tests__/unit/
└── tags.test.ts          # Tag utility tests

src/__tests__/integration/
└── tags-api.test.ts      # API endpoint tests

src/__tests__/e2e/
└── tag-filtering.test.ts # End-to-end filtering tests
```

## User Experience

### Dashboard Integration

1. **Initial Load:**
   - Show all sources (no filters applied)
   - Load tag counts in background
   - Display tag filter sidebar/panel

2. **Selecting a Tag:**
   - Click on tag name or checkbox
   - Immediately filter sources
   - Tag moves to "Selected" section
   - URL updates with ?tags=... query param

3. **Multiple Tags:**
   - Default: OR logic (show sources with ANY selected tag)
   - Toggle to AND logic (show sources with ALL selected tags)
   - Clear visual indication of which logic is active

4. **Clearing Filters:**
   - Click × on individual tag pill to remove
   - "Clear All" button to remove all filters
   - Clicking active filter again to toggle off

5. **Combining with Search:**
   - Tags + search work together
   - Search filters within tag-filtered results
   - Clear indication when multiple filters active

### Mobile Responsive

- Collapse tag filter into dropdown on mobile
- "Filter" button opens tag selection modal
- Selected tags shown as pills above source list
- Swipe to remove selected tags

## State Management

### URL Query Params

```
/dashboard?tags=ai,ml&tagLogic=OR&search=neural
```

- `tags`: Comma-separated tag names
- `tagLogic`: "OR" or "AND"
- `search`: Search query (if combined with search)

### Local State (useTags hook)

```typescript
interface TagState {
  selectedTags: string[];
  tagLogic: 'OR' | 'AND';
  availableTags: TagWithCount[];
  isLoading: boolean;
}

const useTags = () => {
  const [state, setState] = useState<TagState>({
    selectedTags: [],
    tagLogic: 'OR',
    availableTags: [],
    isLoading: false,
  });

  const selectTag = (tag: string) => { ... };
  const deselectTag = (tag: string) => { ... };
  const clearAll = () => { ... };
  const setLogic = (logic: 'OR' | 'AND') => { ... };

  return { ...state, selectTag, deselectTag, clearAll, setLogic };
};
```

## Performance Optimization

### Tag Caching

- Cache available tags for 5 minutes
- Only refetch when sources are created/deleted
- Use SWR or React Query for automatic revalidation

### Query Optimization

- Index on tags.tag_name for faster lookups
- Limit tag list to top 50 most used tags
- "Show More" pagination for remaining tags

### UI Performance

- Virtualize tag list if > 100 tags
- Debounce filter application (100ms)
- Optimistic UI updates

## Error Handling

### No Tags Available

```
┌─────────────────────────────────┐
│  No tags yet                    │
│  Tags will appear here once you │
│  add sources with topics        │
└─────────────────────────────────┘
```

### No Results for Filter

```
┌─────────────────────────────────┐
│  No sources found               │
│  No sources match the selected  │
│  tags: [ai ×] [ethics ×]        │
│                                 │
│  [Clear Filters]                │
└─────────────────────────────────┘
```

### API Errors

- Show error message
- Keep existing UI state
- Retry button for failed tag loads

## Accessibility

- Keyboard navigation through tags (Tab, Enter, Space)
- Screen reader announcements for filter changes
- ARIA labels for all interactive elements
- Focus management when opening/closing filter panel

## Testing Strategy

### Unit Tests

- Tag normalization (lowercase, trim)
- Tag validation
- AND/OR logic correctness
- State management in useTags hook

### Integration Tests

- GET /api/tags returns correct data
- GET /api/sources with tag filters
- Tag counts accuracy
- Combined filters (tags + search)

### E2E Tests

- Select single tag → see filtered results
- Select multiple tags (OR) → see combined results
- Switch to AND logic → see narrower results
- Clear filters → see all sources
- Tag filter + search combination

## Migration Plan

### Phase 1: Backend API
- Implement GET /api/tags endpoint
- Enhance GET /api/sources with tag filtering
- Test with existing data

### Phase 2: UI Components
- Build TagFilter, TagPill components
- Integrate into dashboard
- Add URL query param support

### Phase 3: Polish
- Add animations/transitions
- Mobile responsive design
- Performance optimization

## Success Metrics

- **Usability**: Users can find sources 50% faster with tags
- **Performance**: Tag filter UI loads in <200ms
- **Adoption**: >70% of users use tag filtering feature
- **Accuracy**: 100% accurate filtering results
- **Coverage**: ≥80% test coverage

## Future Enhancements

- Tag auto-suggestions while creating sources
- Tag hierarchies (parent/child relationships)
- Tag colors for visual categorization
- Tag management (rename, merge, delete tags)
- Saved filter presets
- Tag cloud visualization
