import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'
import { Card, CardBody } from '@/components/ui/Card'
import { generateMetadata as generateMeta } from '@/lib/metadata'


export const metadata = generateMeta({
  title: 'Forgot Password',
  description: 'Reset your Recall Notebook password. Enter your email to receive password reset instructions.',
  keywords: ['forgot password', 'password reset', 'recover account'],
  path: '/auth/forgot-password',
  noIndex: true,
})

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
          <p className="mt-2 text-gray-600">
            We&apos;ll help you get back into your account
          </p>
        </div>

        <Card>
          <CardBody>
            <ForgotPasswordForm />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
