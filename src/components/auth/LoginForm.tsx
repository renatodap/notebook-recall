'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/auth/actions'
import { validateEmail } from '@/lib/auth/utils'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const redirectUrl = searchParams?.get('redirect') || '/dashboard'

  useEffect(() => {
    // Check for success messages
    if (searchParams?.get('reset') === 'success') {
      setSuccessMessage('Password reset successful! Please sign in with your new password.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (!password) {
      setError('Please enter your password')
      return
    }

    setLoading(true)

    try {
      const result = await signIn(email, password)

      if (result.success) {
        router.push(redirectUrl)
        router.refresh()
      } else {
        setError(result.error || 'Failed to sign in')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="email"
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        disabled={loading}
      />

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-xs text-indigo-600 hover:text-indigo-700"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={loading}
        />
      </div>

      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Sign In
      </Button>

      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Sign up
        </Link>
      </p>
    </form>
  )
}
