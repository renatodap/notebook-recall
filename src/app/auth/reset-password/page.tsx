import ResetPasswordForm from '@/components/auth/ResetPasswordForm'
import { Card, CardBody } from '@/components/ui/Card'
import { generateMetadata as generateMeta } from '@/lib/metadata'


export const metadata = generateMeta({
  title: 'Reset Password',
  description: 'Create a new password for your Recall Notebook account.',
  keywords: ['reset password', 'new password', 'change password'],
  path: '/auth/reset-password',
  noIndex: true,
})

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Set New Password</h1>
          <p className="mt-2 text-gray-600">
            Choose a strong password for your account
          </p>
        </div>

        <Card>
          <CardBody>
            <ResetPasswordForm />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
