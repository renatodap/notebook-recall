import SignupForm from '@/components/auth/SignupForm'
import { Card, CardBody } from '@/components/ui/Card'
import { generateMetadata as generateMeta } from '@/lib/metadata'


export const metadata = generateMeta({
  title: 'Sign Up',
  description: 'Create your free Recall Notebook account. Start building your AI-powered knowledge base today.',
  keywords: ['sign up', 'register', 'create account', 'get started'],
  path: '/signup',
})

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Recall Notebook</h1>
          <p className="mt-2 text-gray-600">Create your account</p>
        </div>

        <Card>
          <CardBody>
            <SignupForm />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
