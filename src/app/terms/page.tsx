import ChatSidebar from '@/components/ChatSidebar'
import MobileSidebar from '@/components/MobileSidebar'
import { generateMetadata as generateMeta } from '@/lib/metadata'

export const metadata = generateMeta({
  title: 'Terms of Service',
  description: 'Terms of Service for Recall Notebook - Rules and guidelines for using our service',
  keywords: ['terms', 'terms of service', 'legal', 'guidelines'],
  path: '/terms',
})

export default function TermsPage() {
  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--chat-bg-main)' }}>
      <ChatSidebar />
      <MobileSidebar />

      <div className="flex-1 flex flex-col md:ml-64 overflow-y-auto">
        <main className="max-w-4xl mx-auto px-6 py-12 w-full" style={{ color: 'var(--chat-text-secondary)' }}>
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--chat-text-primary)' }}>
            Terms of Service
          </h1>
          <p className="text-sm mb-8">
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--chat-text-primary)' }}>
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using Recall Notebook (&quot;the Service&quot;), you agree to be bound by these Terms of Service
              (&quot;Terms&quot;). If you do not agree to these Terms, do not use the Service. We reserve the right to modify
              these Terms at any time, and your continued use constitutes acceptance of any changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--chat-text-primary)' }}>
              2. Description of Service
            </h2>
            <p className="mb-4">
            Recall Notebook is an AI-powered knowledge management platform that allows you to:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Save and organize content from multiple sources (text, URLs, PDFs)</li>
            <li>Generate AI-powered summaries and insights</li>
            <li>Search your content using semantic search</li>
            <li>Create collections, tags, and organizational structures</li>
            <li>Export and publish your knowledge</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
          <p className="text-gray-700 mb-4">
            To use the Service, you must create an account. You agree to:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Maintain the security of your password and account</li>
            <li>Notify us immediately of any unauthorized access or security breach</li>
            <li>Be responsible for all activities that occur under your account</li>
            <li>Not share your account credentials with others</li>
            <li>Be at least 13 years of age to use the Service</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
          <p className="text-gray-700 mb-4">
            You agree NOT to use the Service to:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Violate any laws or regulations</li>
            <li>Infringe on intellectual property rights of others</li>
            <li>Upload malicious software, viruses, or harmful code</li>
            <li>Harass, abuse, or harm others</li>
            <li>Engage in spamming or unsolicited marketing</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Reverse engineer or copy our software</li>
            <li>Use the Service for any illegal or unauthorized purpose</li>
            <li>Abuse or exploit AI features through excessive automated requests</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Intellectual Property Rights</h2>

          <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">5.1 Your Content</h3>
          <p className="text-gray-700 mb-4">
            You retain all ownership rights to the content you upload to the Service. By uploading content, you grant us a
            limited license to:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Store, process, and display your content as necessary to provide the Service</li>
            <li>Generate AI summaries, insights, and embeddings from your content</li>
            <li>Enable search and retrieval functionality</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">5.2 Our Platform</h3>
          <p className="text-gray-700">
            The Service, including its software, design, text, graphics, and other content (excluding user content),
            is owned by us or our licensors and is protected by copyright, trademark, and other intellectual property laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. AI-Generated Content Disclaimer</h2>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="text-yellow-800 font-semibold">⚠️ Important Notice About AI-Generated Content</p>
          </div>
          <p className="text-gray-700 mb-4">
            The Service uses artificial intelligence to generate summaries, insights, and other content. You acknowledge and agree that:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li><strong>Accuracy:</strong> AI-generated content may contain errors, inaccuracies, or hallucinations</li>
            <li><strong>Verification:</strong> You are responsible for verifying the accuracy of all AI-generated content before use</li>
            <li><strong>Not Professional Advice:</strong> AI-generated content is not professional, legal, medical, or financial advice</li>
            <li><strong>Academic Use:</strong> Verify all facts and citations before using in academic or professional contexts</li>
            <li><strong>No Warranty:</strong> We make no warranties about the accuracy, completeness, or reliability of AI-generated content</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data and Privacy</h2>
          <p className="text-gray-700">
            Your use of the Service is also governed by our <a href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</a>,
            which is incorporated into these Terms by reference. Please review our Privacy Policy to understand our data practices.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Service Availability</h2>
          <p className="text-gray-700 mb-4">
            We strive to provide reliable service, but:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>The Service is provided &quot;as is&quot; and &quot;as available&quot;</li>
            <li>We do not guarantee uninterrupted or error-free operation</li>
            <li>We may suspend or discontinue the Service at any time</li>
            <li>Maintenance and updates may temporarily interrupt service</li>
            <li>Third-party AI services may experience downtime or limitations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Fees and Payment</h2>
          <p className="text-gray-700 mb-4">
            Currently, Recall Notebook is provided free of charge. If we introduce paid features in the future:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>We will provide advance notice of any pricing changes</li>
            <li>You may choose to upgrade to paid tiers voluntarily</li>
            <li>All fees are non-refundable unless otherwise stated</li>
            <li>You are responsible for applicable taxes</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Termination</h2>
          <p className="text-gray-700 mb-4">
            Either party may terminate these Terms at any time:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li><strong>You:</strong> May delete your account and stop using the Service at any time</li>
            <li><strong>Us:</strong> May suspend or terminate your account for violations of these Terms</li>
            <li><strong>Effect:</strong> Upon termination, your right to use the Service ceases, and we may delete your data after 30 days</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Disclaimers and Limitation of Liability</h2>

          <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">11.1 Disclaimers</h3>
          <p className="text-gray-700 mb-4 uppercase">
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
            INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">11.2 Limitation of Liability</h3>
          <p className="text-gray-700 mb-4 uppercase">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
            CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, DATA LOSS, OR BUSINESS INTERRUPTION,
            ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Indemnification</h2>
          <p className="text-gray-700">
            You agree to indemnify and hold us harmless from any claims, damages, liabilities, and expenses
            (including legal fees) arising from your use of the Service, your content, or your violation of these Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Third-Party Services</h2>
          <p className="text-gray-700 mb-4">
            The Service integrates with third-party AI providers (Anthropic Claude, Groq, OpenRouter, OpenAI).
            Your use of these integrated services is subject to their respective terms and policies. We are not
            responsible for the availability, performance, or policies of third-party services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Export Control</h2>
          <p className="text-gray-700">
            You agree to comply with all applicable export and import laws and regulations. You may not use the
            Service if you are located in a country subject to a U.S. government embargo or designated as a
            &quot;terrorist supporting&quot; country.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Dispute Resolution and Governing Law</h2>
          <p className="text-gray-700 mb-4">
            These Terms are governed by the laws of [Your Jurisdiction], without regard to conflict of law principles.
          </p>
          <p className="text-gray-700 mb-4">
            Any disputes arising from these Terms or the Service shall be resolved through:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Good faith negotiation between the parties</li>
            <li>Binding arbitration if negotiation fails (specify arbitration rules)</li>
            <li>Courts of [Your Jurisdiction] as exclusive venue</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Severability</h2>
          <p className="text-gray-700">
            If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions
            shall continue in full force and effect.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">17. Entire Agreement</h2>
          <p className="text-gray-700">
            These Terms, together with our Privacy Policy, constitute the entire agreement between you and us
            regarding the Service and supersede all prior agreements.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">18. Contact Information</h2>
          <p className="text-gray-700 mb-4">
            For questions about these Terms, please contact us:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700"><strong>Email:</strong> <a href="mailto:legal@recallnotebook.com" className="text-indigo-600 hover:underline">legal@recallnotebook.com</a></p>
            <p className="text-gray-700 mt-2"><strong>Address:</strong> [Your Company Address]</p>
          </div>
        </section>

        <div className="border-t border-gray-200 pt-6 mt-8">
          <p className="text-sm text-gray-600">
            By using Recall Notebook, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </div>
      </main>
    </div>
    </div>
  )
}
