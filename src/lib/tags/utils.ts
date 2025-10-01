/**
 * Tag Utilities
 *
 * Helper functions for tag operations
 */

/**
 * Normalize tag name (lowercase, trim whitespace)
 */
export function normalizeTagName(tagName: string): string {
  return tagName.toLowerCase().trim();
}

/**
 * Validate tag name
 */
export function isValidTagName(tagName: string): boolean {
  const normalized = normalizeTagName(tagName);

  // Must not be empty
  if (normalized.length === 0) {
    return false;
  }

  // Must not exceed max length
  if (normalized.length > 50) {
    return false;
  }

  // Must not contain invalid characters (< > to prevent XSS)
  if (normalized.includes('<') || normalized.includes('>')) {
    return false;
  }

  return true;
}

/**
 * Filter sources by tags using OR logic (match ANY tag)
 */
export function filterSourcesByTagsOR<T extends { tags?: { tag_name: string }[] }>(
  sources: T[],
  tagNames: string[]
): T[] {
  if (tagNames.length === 0) {
    return sources;
  }

  const normalizedFilterTags = tagNames.map(normalizeTagName);

  return sources.filter((source) => {
    if (!source.tags || source.tags.length === 0) {
      return false;
    }

    return source.tags.some((tag) =>
      normalizedFilterTags.includes(normalizeTagName(tag.tag_name))
    );
  });
}

/**
 * Filter sources by tags using AND logic (match ALL tags)
 */
export function filterSourcesByTagsAND<T extends { tags?: { tag_name: string }[] }>(
  sources: T[],
  tagNames: string[]
): T[] {
  if (tagNames.length === 0) {
    return sources;
  }

  const normalizedFilterTags = tagNames.map(normalizeTagName);

  return sources.filter((source) => {
    if (!source.tags || source.tags.length === 0) {
      return false;
    }

    const sourceTagNames = source.tags.map((tag) => normalizeTagName(tag.tag_name));

    return normalizedFilterTags.every((filterTag) =>
      sourceTagNames.includes(filterTag)
    );
  });
}

/**
 * Get unique tag names from sources
 */
export function getUniqueTagNames<T extends { tags?: { tag_name: string }[] }>(
  sources: T[]
): string[] {
  const tagSet = new Set<string>();

  sources.forEach((source) => {
    if (source.tags) {
      source.tags.forEach((tag) => {
        tagSet.add(normalizeTagName(tag.tag_name));
      });
    }
  });

  return Array.from(tagSet).sort();
}

/**
 * Count sources per tag
 */
export function countSourcesPerTag<T extends { tags?: { tag_name: string }[] }>(
  sources: T[]
): Map<string, number> {
  const counts = new Map<string, number>();

  sources.forEach((source) => {
    if (source.tags) {
      // Track which tags we've seen for this source to avoid double-counting
      const seenTags = new Set<string>();

      source.tags.forEach((tag) => {
        const normalizedTag = normalizeTagName(tag.tag_name);

        if (!seenTags.has(normalizedTag)) {
          seenTags.add(normalizedTag);
          counts.set(normalizedTag, (counts.get(normalizedTag) || 0) + 1);
        }
      });
    }
  });

  return counts;
}
