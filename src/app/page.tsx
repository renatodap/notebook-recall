import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <header className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Recall Notebook
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your AI-powered knowledge management system. Ingest content, get instant summaries,
            and search semantically across everything you&apos;ve saved.
          </p>

          <nav className="flex gap-4 justify-center" aria-label="Primary navigation">
            <Link href="/signup">
              <Button size="lg" aria-label="Get started with Recall Notebook">Get Started</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary" aria-label="Sign in to your account">
                Sign In
              </Button>
            </Link>
          </nav>
        </header>

        <section className="mt-20 grid md:grid-cols-3 gap-8" aria-label="Key features">
          <article className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl mb-4" role="img" aria-label="Document icon">📝</div>
            <h3 className="text-lg font-semibold mb-2">Multi-Source Ingestion</h3>
            <p className="text-gray-600">
              Upload text, paste URLs, upload PDFs, or process images with OCR. Quick entry mode auto-detects content type.
            </p>
          </article>

          <article className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl mb-4" role="img" aria-label="Robot icon">🤖</div>
            <h3 className="text-lg font-semibold mb-2">AI Summaries</h3>
            <p className="text-gray-600">
              Get instant, intelligent summaries with key actions and topics extracted automatically.
            </p>
          </article>

          <article className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl mb-4" role="img" aria-label="Search icon">🔍</div>
            <h3 className="text-lg font-semibold mb-2">Smart Search</h3>
            <p className="text-gray-600">
              Find anything with natural language queries. Search semantically across all your notes.
            </p>
          </article>
        </section>
      </main>
    </div>
  )
}
