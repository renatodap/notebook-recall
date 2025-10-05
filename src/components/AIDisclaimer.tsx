export interface AIDisclaimerProps {
  variant?: 'full' | 'compact'
  className?: string
}

/**
 * AI Content Disclaimer Component
 * Required by CLAUDE.md Section 4 (Legal & Compliance)
 * Display on all AI-generated content pages
 */
export default function AIDisclaimer({ variant = 'full', className = '' }: AIDisclaimerProps) {
  if (variant === 'compact') {
    return (
      <div className={`bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm ${className}`}>
        <p className="text-yellow-800 font-medium">
          ⚠️ AI-Generated Content - Verify important facts before use
        </p>
      </div>
    )
  }

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-2xl">⚠️</span>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-semibold text-yellow-800 mb-1">
            AI-Generated Content
          </h3>
          <p className="text-sm text-yellow-700">
            This content was created by artificial intelligence and should be reviewed for accuracy.
            Verify important facts and citations before using in academic or professional contexts.
          </p>
        </div>
      </div>
    </div>
  )
}
