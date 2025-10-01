import Link from 'next/link'
import { Card, CardBody } from './ui/Card'
import { Source, Summary, Tag } from '@/types'

interface SourceCardProps {
  source: Source & { summary: Summary[]; tags: Tag[] }
  selectable?: boolean
  selected?: boolean
  onSelect?: (sourceId: string, selected: boolean) => void
}

export default function SourceCard({
  source,
  selectable = false,
  selected = false,
  onSelect,
}: SourceCardProps) {
  const summary = source.summary?.[0]
  const contentTypeIcons = {
    text: '📝',
    url: '🔗',
    pdf: '📄',
    note: '📋',
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    if (onSelect) {
      onSelect(source.id, e.target.checked)
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking checkbox
    if ((e.target as HTMLElement).closest('input[type="checkbox"]')) {
      e.preventDefault()
    }
  }

  return (
    <Link href={`/source/${source.id}`} onClick={handleCardClick}>
      <Card hover className="h-full">
        <CardBody>
          <div className="flex items-start gap-3">
            {/* Checkbox for bulk selection */}
            {selectable && (
              <input
                type="checkbox"
                checked={selected}
                onChange={handleCheckboxChange}
                onClick={(e) => e.stopPropagation()}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {contentTypeIcons[source.content_type]}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                    {source.title}
                  </h3>
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                  {new Date(source.created_at).toLocaleDateString()}
                </span>
              </div>

              {summary && (
                <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                  {summary.summary_text}
                </p>
              )}

              {summary && summary.key_topics && summary.key_topics.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {summary.key_topics.slice(0, 3).map((topic, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                    >
                      {topic}
                    </span>
                  ))}
                  {summary.key_topics.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{summary.key_topics.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  )
}
