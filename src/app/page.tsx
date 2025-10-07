import Link from 'next/link'
import Button from '@/components/ui/Button'
import { Sparkles } from 'lucide-react'
import { generateMetadata as generateMeta } from '@/lib/metadata'


export const metadata = generateMeta({
  title: 'Recall Notebook',
  description: 'AI-powered knowledge management that works the way you think. Save articles, PDFs, and notes—then search across everything with natural language. Remember everything, find anything instantly.',
  keywords: ['AI knowledge base', 'smart notes', 'digital memory', 'research assistant', 'knowledge graph'],
  path: '/',
})

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero - Minimal & Value-Focused */}
      <main className="mx-auto max-w-4xl px-6 py-20 md:py-32">
        <header className="text-center space-y-6">
          {/* Time-to-Value Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            <span>3 minutes to your first insight</span>
          </div>

          {/* Value Proposition */}
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 tracking-tight max-w-3xl mx-auto leading-tight">
            Remember everything.
            <br />
            Find anything instantly.
          </h1>

          <p className="text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            AI-powered knowledge management that works the way you think.
            Save articles, PDFs, and notes—then search across everything with natural language.
          </p>

          {/* CTA */}
          <nav className="flex gap-4 justify-center pt-4" aria-label="Primary navigation">
            <Link href="/signup">
              <Button
                size="lg"
                className="h-12 px-8 text-base font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm"
                aria-label="Get started with Recall Notebook"
              >
                Start Free
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="secondary"
                className="h-12 px-8 text-base font-semibold bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 rounded-lg transition-colors"
                aria-label="Sign in to your account"
              >
                Sign In
              </Button>
            </Link>
          </nav>

          {/* Trust Signal */}
          <p className="text-sm text-neutral-500 pt-4">
            No credit card required • Free forever
          </p>
        </header>

        {/* How It Works - 3 Steps */}
        <section className="mt-24 md:mt-32" aria-label="How it works">
          <h2 className="text-2xl font-bold text-neutral-900 text-center mb-12">
            From chaos to clarity in 3 steps
          </h2>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <article className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center text-xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">Add Content</h3>
              <p className="text-neutral-600 leading-relaxed">
                Paste a URL, upload a PDF, or write a note. We auto-detect the type and extract what matters.
              </p>
            </article>

            <article className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center text-xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">AI Summarizes</h3>
              <p className="text-neutral-600 leading-relaxed">
                Get instant summaries with key actions and topics. Your knowledge, distilled.
              </p>
            </article>

            <article className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center text-xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">Search Anything</h3>
              <p className="text-neutral-600 leading-relaxed">
                Ask questions in plain English. Find exactly what you need, when you need it.
              </p>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}
