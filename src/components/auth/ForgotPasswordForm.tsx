'use client'

import { useState } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '@/lib/auth/actions'
import { validateEmail } from '@/lib/auth/utils'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)

    try {
      const result = await requestPasswordReset(email)

      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || 'Failed to send reset email')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-medium text-green-900 mb-2">
            Check Your Email
          </h3>
          <p className="text-sm text-green-700 mb-4">
            We&apos;ve sent password reset instructions to <strong>{email}</strong>.
            Please check your inbox and follow the link to reset your password.
          </p>
          <p className="text-xs text-green-600">
            Didn&apos;t receive the email? Check your spam folder or try again in a few minutes.
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <p className="text-sm text-gray-600">
          Enter your email address and we&apos;ll send you instructions to reset your password.
        </p>
      </div>

      <Input
        type="email"
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        disabled={loading}
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Send Reset Link
      </Button>

      <p className="text-center text-sm text-gray-600">
        Remember your password?{' '}
        <Link
          href="/login"
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Sign in
        </Link>
      </p>
    </form>
  )
}
