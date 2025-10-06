'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, FileText, Search, CheckCircle, Loader2 } from 'lucide-react'

type OnboardingStep = 'welcome' | 'seeding' | 'search' | 'success'

export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>('welcome')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('What are good productivity habits?')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const router = useRouter()

  // Step 1: Welcome
  const handleStart = async () => {
    setStep('seeding')
    setIsLoading(true)
    setError(null)

    try {
      // Call demo seeding API
      const response = await fetch('/api/onboarding/seed-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to seed demo data')
      }

      // Wait a moment to show progress
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setIsLoading(false)
      setStep('search')
    } catch (err) {
      console.error('Seeding error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsLoading(false)
    }
  }

  // Step 3: Search
  const handleSearch = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Perform semantic search on demo data
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          mode: 'semantic',
          limit: 2,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      setSearchResults(data.results || [])

      // Mark first search as completed
      await fetch('/api/quick-wins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ winId: 'first_search' }),
      })

      setIsLoading(false)
      setStep('success')
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : 'Search failed')
      setIsLoading(false)
    }
  }

  // Skip onboarding
  const handleSkip = () => {
    router.push('/dashboard')
  }

  // Step 4: Complete
  const handleComplete = () => {
    router.push('/add')
  }

  const handleExploreDemoData = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            {['welcome', 'seeding', 'search', 'success'].map((s, index) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                  ['welcome', 'seeding', 'search', 'success'].indexOf(step) >= index
                    ? 'bg-primary-600'
                    : 'bg-neutral-200'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-neutral-600">
            Step {['welcome', 'seeding', 'search', 'success'].indexOf(step) + 1} of 4
          </p>
        </div>

        {/* Welcome Step */}
        {step === 'welcome' && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center space-y-6">
            <div className="flex justify-center">
              <Sparkles className="h-16 w-16 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900">
              Welcome to Recall Notebook
            </h1>
            <p className="text-lg text-neutral-600">
              You&apos;re <span className="font-semibold text-primary-600">3 minutes away</span> from
              your first AI-powered insight.
            </p>

            <div className="bg-neutral-50 rounded-lg p-6 text-left space-y-3">
              <h3 className="font-semibold text-neutral-900">Here&apos;s what we&apos;ll do:</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold">
                    1
                  </div>
                  <p className="text-neutral-700">Add sample knowledge to explore</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold">
                    2
                  </div>
                  <p className="text-neutral-700">Try your first search</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold">
                    3
                  </div>
                  <p className="text-neutral-700">See AI at work</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center pt-4">
              <button
                onClick={handleStart}
                className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg shadow-sm"
              >
                Let&apos;s Go →
              </button>
              <button
                onClick={handleSkip}
                className="px-8 py-3 bg-white text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
              >
                Skip Tutorial
              </button>
            </div>
          </div>
        )}

        {/* Seeding Step */}
        {step === 'seeding' && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center space-y-6">
            <div className="flex justify-center">
              <FileText className="h-16 w-16 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">
              Setting up your knowledge base...
            </h2>
            <p className="text-neutral-600">We&apos;re adding 3 sample articles:</p>

            <div className="space-y-3 text-left max-w-md mx-auto">
              <div className="flex items-center gap-3 bg-success-50 border border-success-200 rounded-lg p-3">
                <CheckCircle className="h-5 w-5 text-success-700 flex-shrink-0" />
                <span className="text-neutral-700">&quot;Introduction to AI&quot; (Technology)</span>
              </div>
              <div className="flex items-center gap-3 bg-success-50 border border-success-200 rounded-lg p-3">
                <CheckCircle className="h-5 w-5 text-success-700 flex-shrink-0" />
                <span className="text-neutral-700">
                  &quot;Productivity Habits&quot; (Self-Improvement)
                </span>
              </div>
              <div className="flex items-center gap-3 bg-success-50 border border-success-200 rounded-lg p-3">
                <CheckCircle className="h-5 w-5 text-success-700 flex-shrink-0" />
                <span className="text-neutral-700">&quot;Climate Change Overview&quot; (Science)</span>
              </div>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-primary-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing...</span>
              </div>
            )}

            {error && (
              <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                <p className="text-error-700">{error}</p>
                <button
                  onClick={handleStart}
                  className="mt-3 px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            <p className="text-sm text-neutral-500">
              Each comes with an AI summary so you can search immediately.
            </p>
          </div>
        )}

        {/* Search Step */}
        {step === 'search' && (
          <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
            <div className="flex justify-center">
              <Search className="h-16 w-16 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 text-center">
              Try your first search
            </h2>
            <p className="text-neutral-600 text-center">Ask a question in plain English:</p>

            <div className="space-y-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                placeholder="What are good productivity habits?"
              />

              <button
                onClick={handleSearch}
                disabled={isLoading || !searchQuery.trim()}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Search'
                )}
              </button>
            </div>

            <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-neutral-700">💡 Suggested searches:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'How does AI work?',
                  'Climate change impacts',
                  'Time management tips',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setSearchQuery(suggestion)}
                    className="px-3 py-1.5 bg-white border border-neutral-300 rounded-full text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                <p className="text-error-700">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-success-700" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-neutral-900">🎉 You did it!</h2>
            <p className="text-lg text-neutral-600">
              You just experienced AI-powered search. Here&apos;s what happened:
            </p>

            <div className="bg-neutral-50 rounded-lg p-6 text-left space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success-700 flex-shrink-0" />
                <p className="text-neutral-700">
                  Found {searchResults.length} source{searchResults.length !== 1 ? 's' : ''}{' '}
                  matching your question
                </p>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success-700 flex-shrink-0" />
                <p className="text-neutral-700">AI summarized key points</p>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success-700 flex-shrink-0" />
                <p className="text-neutral-700">All in &lt; 3 seconds</p>
              </div>
            </div>

            <p className="text-neutral-600">Ready to add your own content?</p>

            <div className="flex gap-4 justify-center pt-4">
              <button
                onClick={handleComplete}
                className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg shadow-sm"
              >
                Add My First Source
              </button>
              <button
                onClick={handleExploreDemoData}
                className="px-8 py-3 bg-white text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
              >
                Explore Demo Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
