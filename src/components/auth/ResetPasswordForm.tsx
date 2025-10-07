'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updatePassword } from '@/lib/auth/actions'
import {
  validatePassword,
  getPasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from '@/lib/auth/utils'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const passwordStrength = getPasswordStrength(password)
  const strengthLabel = getPasswordStrengthLabel(passwordStrength)
  const strengthColor = getPasswordStrengthColor(passwordStrength)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      setError(passwordValidation.errors[0])
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const result = await updatePassword(password)

      if (result.success) {
        // Redirect to login with success message
        router.push('/login?reset=success')
      } else {
        setError(result.error || 'Failed to reset password')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <p className="text-sm text-gray-600">
          Choose a strong password for your account.
        </p>
      </div>

      <div>
        <Input
          type="password"
          label="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={loading}
        />
        {password && (
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${strengthColor}`}
                  style={{ width: `${(passwordStrength / 4) * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-600">{strengthLabel}</span>
            </div>
          </div>
        )}
      </div>

      <Input
        type="password"
        label="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="••••••••"
        required
        disabled={loading}
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Reset Password
      </Button>
    </form>
  )
}
