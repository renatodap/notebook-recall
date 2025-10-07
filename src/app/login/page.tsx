import { Suspense } from 'react'
import LoginForm from '@/components/auth/LoginForm'
import { Card, CardBody } from '@/components/ui/Card'
import { generateMetadata as generateMeta } from '@/lib/metadata'


export const metadata = generateMeta({
  title: 'Sign In',
  description: 'Sign in to your Recall Notebook account. Access your knowledge base and AI-powered tools.',
  keywords: ['login', 'sign in', 'authentication'],
  path: '/login',
})

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Recall Notebook</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        <Card>
          <CardBody>
            <Suspense fallback={<div className="text-center py-4">Loading...</div>}>
              <LoginForm />
            </Suspense>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
