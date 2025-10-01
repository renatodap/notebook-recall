# Tags Filtering Testing Strategy

## Test Coverage Goals
- Unit Tests: ≥90% coverage
- Integration Tests: All API endpoints
- E2E Tests: Complete filtering flow

## Unit Tests

### File: `src/__tests__/unit/tags-utils.test.ts`

#### Tag Normalization

**Test: normalizeTagName() converts to lowercase**
- Action: Call `normalizeTagName("Machine Learning")`
- Assert: Returns "machine learning"

**Test: normalizeTagName() trims whitespace**
- Action: Call `normalizeTagName("  ai  ")`
- Assert: Returns "ai"

**Test: normalizeTagName() handles special characters**
- Action: Call `normalizeTagName("AI/ML & Deep-Learning")`
- Assert: Returns appropriate normalized form

**Test: normalizeTagName() handles empty string**
- Action: Call `normalizeTagName("")`
- Assert: Returns ""

#### Tag Validation

**Test: isValidTagName() accepts valid tags**
- Action: Call `isValidTagName("ai")`
- Assert: Returns true

**Test: isValidTagName() rejects empty tags**
- Action: Call `isValidTagName("")`
- Assert: Returns false

**Test: isValidTagName() rejects too long tags**
- Action: Call `isValidTagName("a".repeat(100))`
- Assert: Returns false

**Test: isValidTagName() rejects invalid characters**
- Action: Call `isValidTagName("tag<script>")`
- Assert: Returns false

#### Tag Logic

**Test: filterSourcesByTagsOR() matches ANY tag**
- Setup: Sources with tags: ["ai", "ml"], ["ai"], ["ethics"]
- Action: Call `filterSourcesByTagsOR(sources, ["ai", "ethics"])`
- Assert: Returns 3 sources (all except ["ml" only])

**Test: filterSourcesByTagsAND() matches ALL tags**
- Setup: Sources with tags: ["ai", "ml"], ["ai"], ["ethics"]
- Action: Call `filterSourcesByTagsAND(sources, ["ai", "ml"])`
- Assert: Returns 1 source (only first one has both)

**Test: filterSourcesByTagsAND() with single tag**
- Setup: Sources with various tags
- Action: Call `filterSourcesByTagsAND(sources, ["ai"])`
- Assert: Returns all sources with "ai" tag

### File: `src/__tests__/unit/useTags-hook.test.ts`

#### Tag Selection

**Test: selectTag() adds tag to selected**
- Setup: Hook with selectedTags = []
- Action: Call `selectTag("ai")`
- Assert: selectedTags = ["ai"]

**Test: selectTag() doesn't duplicate existing tag**
- Setup: Hook with selectedTags = ["ai"]
- Action: Call `selectTag("ai")`
- Assert: selectedTags = ["ai"] (no duplicate)

**Test: deselectTag() removes tag**
- Setup: Hook with selectedTags = ["ai", "ml"]
- Action: Call `deselectTag("ai")`
- Assert: selectedTags = ["ml"]

**Test: clearAll() removes all tags**
- Setup: Hook with selectedTags = ["ai", "ml", "ethics"]
- Action: Call `clearAll()`
- Assert: selectedTags = []

#### Logic Toggle

**Test: setLogic() changes OR to AND**
- Setup: Hook with tagLogic = "OR"
- Action: Call `setLogic("AND")`
- Assert: tagLogic = "AND"

**Test: setLogic() changes AND to OR**
- Setup: Hook with tagLogic = "AND"
- Action: Call `setLogic("OR")`
- Assert: tagLogic = "OR"

#### URL Sync

**Test: hook initializes from URL query params**
- Setup: URL = "/dashboard?tags=ai,ml&tagLogic=AND"
- Action: Initialize useTags hook
- Assert: selectedTags = ["ai", "ml"], tagLogic = "AND"

**Test: hook updates URL when tags change**
- Setup: Hook initialized
- Action: Call `selectTag("ai")`
- Assert: URL updates to include ?tags=ai

## Integration Tests

### File: `src/__tests__/integration/tags-api.test.ts`

#### GET /api/tags

**Test: Returns all user's tags with counts**
- Setup: User has 3 sources with tags: ["ai", "ml"], ["ai"], ["ethics"]
- Action: GET /api/tags
- Assert: Returns [{tag: "ai", count: 2}, {tag: "ml", count: 1}, {tag: "ethics", count: 1}]

**Test: Sorts tags by count descending**
- Setup: Tags with counts: ai=10, ml=5, ethics=2
- Action: GET /api/tags
- Assert: Returns tags in order: ai, ml, ethics

**Test: Only returns current user's tags**
- Setup: User A has tags ["ai"], User B has tags ["ml"]
- Action: User A calls GET /api/tags
- Assert: Returns only ["ai"]

**Test: Returns empty array when no tags**
- Setup: User has no sources
- Action: GET /api/tags
- Assert: Returns {tags: [], total: 0}

**Test: Requires authentication**
- Action: GET /api/tags without auth token
- Assert: Returns 401

#### GET /api/sources (with tag filters)

**Test: Filters by single tag**
- Setup: Sources with tags: ["ai"], ["ml"], ["ai", "ml"]
- Action: GET /api/sources?tags=ai
- Assert: Returns 2 sources (those with "ai")

**Test: Filters by multiple tags (OR logic)**
- Setup: Sources with tags: ["ai"], ["ml"], ["ethics"]
- Action: GET /api/sources?tags=ai,ml&tagLogic=OR
- Assert: Returns 2 sources (ai and ml)

**Test: Filters by multiple tags (AND logic)**
- Setup: Sources with tags: ["ai"], ["ml"], ["ai", "ml"]
- Action: GET /api/sources?tags=ai,ml&tagLogic=AND
- Assert: Returns 1 source (only ["ai", "ml"])

**Test: Combines tag filter with content type filter**
- Setup: Mixed sources
- Action: GET /api/sources?tags=ai&contentType=pdf
- Assert: Returns only PDF sources with "ai" tag

**Test: Combines tag filter with search**
- Setup: Sources with tags and different content
- Action: GET /api/sources?tags=ai&search=neural
- Assert: Returns sources tagged "ai" AND containing "neural"

**Test: Returns empty when no matches**
- Setup: Sources without matching tags
- Action: GET /api/sources?tags=nonexistent
- Assert: Returns {data: [], total: 0}

**Test: Handles URL-encoded tag names**
- Setup: Sources with tag "machine learning"
- Action: GET /api/sources?tags=machine%20learning
- Assert: Returns sources with "machine learning" tag

## E2E Tests

### File: `src/__tests__/e2e/tag-filtering.test.ts`

#### Complete Filtering Flow

**Test: User selects tag and sees filtered results**
- Action: Login, create source with tag "ai"
- Action: Navigate to dashboard
- Action: Click on "ai" tag in filter sidebar
- Assert: Only sources with "ai" tag are displayed
- Assert: URL shows ?tags=ai

**Test: User selects multiple tags (OR)**
- Setup: Sources with tags: ["ai"], ["ml"], ["ethics"]
- Action: Select "ai" tag
- Action: Select "ml" tag
- Assert: See sources with "ai" OR "ml" (2 sources)
- Assert: URL shows ?tags=ai,ml

**Test: User switches to AND logic**
- Setup: Sources with tags: ["ai"], ["ml"], ["ai", "ml"]
- Action: Select "ai" and "ml" tags
- Action: Toggle logic to "AND"
- Assert: See only sources with BOTH tags (1 source)
- Assert: URL shows ?tagLogic=AND

**Test: User clears individual tag**
- Setup: Selected tags: ["ai", "ml"]
- Action: Click × on "ai" tag pill
- Assert: Only "ml" remains selected
- Assert: Results update to show only "ml" sources

**Test: User clears all filters**
- Setup: Selected tags: ["ai", "ml", "ethics"]
- Action: Click "Clear All" button
- Assert: All tags deselected
- Assert: All sources displayed

#### Tag Counts

**Test: Tag counts are accurate**
- Setup: Create 3 sources with "ai" tag, 2 with "ml"
- Action: Load dashboard
- Assert: "ai" shows count (3)
- Assert: "ml" shows count (2)

**Test: Tag counts update after creating source**
- Setup: "ai" tag has count (5)
- Action: Create new source with "ai" tag
- Assert: "ai" count updates to (6)

**Test: Tag counts update after deleting source**
- Setup: "ai" tag has count (5)
- Action: Delete source with "ai" tag
- Assert: "ai" count updates to (4)

#### Combined Filters

**Test: Tag filter + search combination**
- Setup: Sources with "ai" tag and various content
- Action: Select "ai" tag
- Action: Enter "neural" in search box
- Assert: See sources that have "ai" tag AND contain "neural"

**Test: Filter persists across page refresh**
- Action: Select tags ["ai", "ml"]
- Action: Refresh page
- Assert: Tags remain selected
- Assert: Filtered results still shown

#### Mobile Responsive

**Test: Tag filter works on mobile**
- Action: Resize to mobile viewport
- Action: Open tag filter dropdown
- Action: Select tag
- Assert: Results filter correctly
- Assert: Selected tag shown as pill

## Component Tests

### File: `src/__tests__/components/TagFilter.test.tsx`

**Test: Renders available tags**
- Setup: Tags: ["ai" (5), "ml" (3), "ethics" (2)]
- Action: Render <TagFilter />
- Assert: All 3 tags displayed with counts

**Test: Clicking tag selects it**
- Setup: Unselected tag "ai"
- Action: Click on "ai" tag
- Assert: onTagSelect called with "ai"
- Assert: Tag visually marked as selected

**Test: Clicking selected tag deselects it**
- Setup: Selected tag "ai"
- Action: Click on "ai" tag
- Assert: onTagDeselect called with "ai"
- Assert: Tag visually unmarked

**Test: Clear All button clears selections**
- Setup: Selected tags ["ai", "ml"]
- Action: Click "Clear All" button
- Assert: onClearAll called
- Assert: No tags selected

**Test: Logic toggle switches between OR and AND**
- Setup: Logic = "OR"
- Action: Click "AND" radio button
- Assert: onLogicChange called with "AND"
- Assert: "AND" radio selected

### File: `src/__tests__/components/TagPill.test.tsx`

**Test: Renders tag name**
- Action: Render <TagPill tagName="ai" />
- Assert: Displays "ai"

**Test: Shows count when provided**
- Action: Render <TagPill tagName="ai" count={5} />
- Assert: Displays "ai (5)"

**Test: Shows remove button when removable**
- Action: Render <TagPill tagName="ai" removable={true} />
- Assert: × button visible

**Test: Clicking remove button calls onDeselect**
- Setup: <TagPill removable with onDeselect handler />
- Action: Click × button
- Assert: onDeselect called

**Test: Selected variant has different styling**
- Action: Render <TagPill selected={true} />
- Assert: Has selected class/styling

## Mock Data

### Tag Fixtures

```typescript
export const mockTags = [
  { tag_name: 'ai', count: 12, sources: ['1', '2', '3', ...] },
  { tag_name: 'machine learning', count: 8, sources: ['1', '4', ...] },
  { tag_name: 'ethics', count: 5, sources: ['5', '6', ...] },
  { tag_name: 'safety', count: 3, sources: ['7', ...] },
];

export const mockTagsResponse = {
  tags: mockTags,
  total: 4,
};
```

### Source with Tags

```typescript
export const mockSourceWithTags = {
  source: {
    id: '1',
    title: 'AI Safety Research',
    content_type: 'text',
    ...
  },
  summary: { ... },
  tags: [
    { id: 't1', source_id: '1', tag_name: 'ai' },
    { id: 't2', source_id: '1', tag_name: 'safety' },
  ],
};
```

## Test Utilities

### Helper Functions

```typescript
// Create sources with specific tags
export async function createSourcesWithTags(
  authToken: string,
  sourcesWithTags: Array<{ title: string; tags: string[] }>
): Promise<Source[]>

// Assert tag filter state
export function expectTagFilterState(
  selectedTags: string[],
  logic: 'OR' | 'AND'
): void

// Assert sources have all tags (AND)
export function expectSourcesHaveAllTags(
  sources: Source[],
  tags: string[]
): void

// Assert sources have any tags (OR)
export function expectSourcesHaveAnyTags(
  sources: Source[],
  tags: string[]
): void
```

## Coverage Requirements

### Minimum Coverage by File

| File | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
| lib/tags/utils.ts | 95% | 90% | 100% | 95% |
| lib/tags/queries.ts | 85% | 80% | 90% | 85% |
| hooks/useTags.ts | 90% | 85% | 95% | 90% |
| api/tags/route.ts | 80% | 75% | 80% | 80% |
| components/tags/*.tsx | 85% | 80% | 85% | 85% |

### Overall Target
- **Total Coverage: ≥80%** across all tag filtering code
- All user interactions tested
- All API endpoints tested
- All edge cases covered

## Test Execution

### Run All Tests
```bash
npm test -- tag
```

### Run Unit Tests Only
```bash
npm test -- --testPathPattern=unit.*tags
```

### Run Component Tests
```bash
npm test -- --testPathPattern=components.*Tag
```

### Coverage Report
```bash
npm run test:coverage -- --collectCoverageFrom="src/lib/tags/**" --collectCoverageFrom="src/components/tags/**" --collectCoverageFrom="src/hooks/useTags.ts"
```

## Continuous Integration

### Pre-commit Hooks
- Run unit tests for tag utilities
- Check coverage thresholds
- Lint tag components

### CI Pipeline
- Run all tag-related tests
- Generate coverage report
- Fail if coverage <80%
- Visual regression tests for tag components
