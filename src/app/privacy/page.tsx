import ChatSidebar from '@/components/ChatSidebar'
import MobileSidebar from '@/components/MobileSidebar'
import { generateMetadata as generateMeta } from '@/lib/metadata'

export const metadata = generateMeta({
  title: 'Privacy Policy',
  description: 'Privacy Policy for Recall Notebook - How we collect, use, and protect your data',
  keywords: ['privacy', 'data protection', 'GDPR', 'privacy policy'],
  path: '/privacy',
})

export default function PrivacyPage() {
  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--chat-bg-main)' }}>
      <ChatSidebar />
      <MobileSidebar />

      <div className="flex-1 flex flex-col md:ml-64 overflow-y-auto">
        <main className="max-w-4xl mx-auto px-6 py-12 w-full">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--chat-text-primary)' }}>
            Privacy Policy
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--chat-text-secondary)' }}>
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="mb-8" style={{ color: 'var(--chat-text-secondary)' }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--chat-text-primary)' }}>
              1. Information We Collect
            </h2>
            <p className="mb-4">
              We collect information you provide directly to us when using Recall Notebook:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Account information (email address, password)</li>
              <li>Content you save (articles, PDFs, notes, URLs)</li>
              <li>AI-generated summaries and insights from your content</li>
              <li>Tags, collections, and organizational data you create</li>
              <li>Search queries and usage patterns</li>
            </ul>
          </section>

          <section className="mb-8" style={{ color: 'var(--chat-text-secondary)' }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--chat-text-primary)' }}>
              2. How We Use Your Information
            </h2>
            <p className="mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process and store your content securely</li>
              <li>Generate AI-powered summaries and insights</li>
              <li>Enable semantic search across your saved content</li>
              <li>Communicate with you about service updates</li>
              <li>Protect against fraud and abuse</li>
            </ul>
          </section>

          <section className="mb-8" style={{ color: 'var(--chat-text-secondary)' }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--chat-text-primary)' }}>
              3. Data Storage and Security
            </h2>
            <p className="mb-4">
              Your data is stored securely using industry-standard practices:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Database:</strong> Supabase (PostgreSQL) with row-level security (RLS) policies</li>
              <li><strong>Encryption:</strong> Data encrypted at rest and in transit (HTTPS/TLS)</li>
              <li><strong>Isolation:</strong> Your data is completely isolated from other users</li>
              <li><strong>Location:</strong> Data stored in secure data centers</li>
              <li><strong>Backups:</strong> Regular automated backups for data recovery</li>
            </ul>
          </section>

          <section className="mb-8" style={{ color: 'var(--chat-text-secondary)' }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--chat-text-primary)' }}>
              4. AI Processing
            </h2>
            <div className="p-4 rounded-lg mb-4" style={{
              backgroundColor: 'var(--chat-bg-message-ai)',
              borderLeft: '4px solid var(--chat-accent)'
            }}>
              <p className="font-semibold mb-2" style={{ color: 'var(--chat-text-primary)' }}>
                ⚠️ Important: AI Content Processing
              </p>
              <p>
                Your content is processed by third-party AI services to generate summaries and enable search.
                These providers process data transiently and do not retain your information after processing is complete.
              </p>
            </div>
            <p className="mb-4">
              We use the following AI services:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Anthropic Claude:</strong> Complex reasoning, synthesis reports, academic analysis</li>
              <li><strong>Groq:</strong> Fast summarization and simple AI operations</li>
              <li><strong>OpenRouter:</strong> Semantic search and medium complexity tasks</li>
              <li><strong>Google Gemini:</strong> Vector embeddings generation (FREE tier)</li>
              <li><strong>OpenAI:</strong> Vector embeddings fallback when Gemini is rate-limited</li>
            </ul>
          </section>

          <section className="mb-8" style={{ color: 'var(--chat-text-secondary)' }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--chat-text-primary)' }}>
              5. Data Sharing and Disclosure
            </h2>
            <p className="mb-4">
              We do not sell your personal information. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>With your consent:</strong> When you explicitly authorize us to share specific information</li>
              <li><strong>Service providers:</strong> Third-party vendors who assist in providing our services (Supabase, AI providers)</li>
              <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section className="mb-8" style={{ color: 'var(--chat-text-secondary)' }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--chat-text-primary)' }}>
              6. Your Rights (GDPR/CCPA)
            </h2>
            <p className="mb-4">
              You have the following rights regarding your personal data:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of all personal data we hold about you</li>
              <li><strong>Correction:</strong> Request corrections to inaccurate or incomplete data</li>
              <li><strong>Deletion:</strong> Request deletion of your account and all associated data</li>
              <li><strong>Export:</strong> Download your data in machine-readable formats (JSON, CSV)</li>
              <li><strong>Opt-out:</strong> Opt out of marketing communications at any time</li>
              <li><strong>Portability:</strong> Transfer your data to another service</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, please contact us at <a href="mailto:privacy@recallnotebook.com" style={{ color: 'var(--chat-accent)' }} className="hover:underline">privacy@recallnotebook.com</a>
            </p>
          </section>

          <section className="mb-8" style={{ color: 'var(--chat-text-secondary)' }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--chat-text-primary)' }}>
              7. Data Retention
            </h2>
            <p className="mb-4">
              We retain your information for as long as your account is active or as needed to provide services.
              When you delete your account:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your personal data and content are permanently deleted within 30 days</li>
              <li>Backups are purged according to our backup retention policy (90 days)</li>
              <li>Some data may be retained longer if required by law or for legitimate business purposes</li>
            </ul>
          </section>

          <section className="mb-8" style={{ color: 'var(--chat-text-secondary)' }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--chat-text-primary)' }}>
              8. Cookies and Tracking
            </h2>
            <p className="mb-4">
              We use essential cookies to provide our services:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Authentication cookies:</strong> To keep you logged in securely</li>
              <li><strong>Preference cookies:</strong> To remember your settings and preferences</li>
              <li><strong>Security cookies:</strong> To protect against fraud and unauthorized access</li>
            </ul>
            <p className="mt-4">
              We do not use third-party advertising or tracking cookies.
            </p>
          </section>

          <section className="mb-8" style={{ color: 'var(--chat-text-secondary)' }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--chat-text-primary)' }}>
              9. Children&apos;s Privacy
            </h2>
            <p>
              Recall Notebook is not intended for users under 13 years of age. We do not knowingly collect
              personal information from children under 13. If you believe we have collected information from
              a child under 13, please contact us immediately.
            </p>
          </section>

          <section className="mb-8" style={{ color: 'var(--chat-text-secondary)' }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--chat-text-primary)' }}>
              10. International Data Transfers
            </h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence.
              We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy
              and applicable laws.
            </p>
          </section>

          <section className="mb-8" style={{ color: 'var(--chat-text-secondary)' }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--chat-text-primary)' }}>
              11. Changes to This Privacy Policy
            </h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Posting the new Privacy Policy on this page</li>
              <li>Updating the &quot;Last Updated&quot; date</li>
              <li>Sending you an email notification for material changes</li>
            </ul>
          </section>

          <section className="mb-8" style={{ color: 'var(--chat-text-secondary)' }}>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--chat-text-primary)' }}>
              12. Contact Us
            </h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--chat-bg-message-ai)' }}>
              <p><strong>Email:</strong> <a href="mailto:privacy@recallnotebook.com" style={{ color: 'var(--chat-accent)' }} className="hover:underline">privacy@recallnotebook.com</a></p>
            </div>
          </section>

          <div className="border-t pt-6 mt-8" style={{ borderColor: 'var(--chat-border)' }}>
            <p className="text-sm" style={{ color: 'var(--chat-text-secondary)' }}>
              By using Recall Notebook, you acknowledge that you have read and understood this Privacy Policy
              and agree to its terms.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
