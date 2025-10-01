import LoginForm from '@/components/auth/LoginForm'
import { Card, CardBody } from '@/components/ui/Card'

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
            <LoginForm />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
