import {
  validateEmail,
  validatePassword,
  getPasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from '@/lib/auth/utils'

describe('Auth Utils', () => {
  describe('validateEmail', () => {
    it('validates correct email format', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
      expect(validateEmail('test+tag@example.com')).toBe(true)
    })

    it('rejects invalid email format', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('invalid@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('validates strong password', () => {
      const result = validatePassword('StrongP@ss123')
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('rejects password too short', () => {
      const result = validatePassword('Short1!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Password must be at least 8 characters long'
      )
    })

    it('rejects password without uppercase', () => {
      const result = validatePassword('password123!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter'
      )
    })

    it('rejects password without lowercase', () => {
      const result = validatePassword('PASSWORD123!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Password must contain at least one lowercase letter'
      )
    })

    it('rejects password without number', () => {
      const result = validatePassword('Password!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Password must contain at least one number'
      )
    })

    it('rejects password without special character', () => {
      const result = validatePassword('Password123')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Password must contain at least one special character'
      )
    })

    it('returns multiple errors for weak password', () => {
      const result = validatePassword('weak')
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })
  })

  describe('getPasswordStrength', () => {
    it('returns 0 for empty password', () => {
      expect(getPasswordStrength('')).toBe(0)
    })

    it('returns 1 for very weak password', () => {
      expect(getPasswordStrength('password')).toBe(1)
    })

    it('returns 2 for weak password', () => {
      expect(getPasswordStrength('password123')).toBe(2)
    })

    it('returns 3 for good password', () => {
      expect(getPasswordStrength('Password123')).toBe(3)
    })

    it('returns 4 for strong password', () => {
      expect(getPasswordStrength('StrongP@ss123')).toBe(4)
    })

    it('caps strength at 4', () => {
      expect(getPasswordStrength('VeryStrongP@ssw0rd!')).toBe(4)
    })
  })

  describe('getPasswordStrengthLabel', () => {
    it('returns correct labels', () => {
      expect(getPasswordStrengthLabel(0)).toBe('Weak')
      expect(getPasswordStrengthLabel(1)).toBe('Weak')
      expect(getPasswordStrengthLabel(2)).toBe('Fair')
      expect(getPasswordStrengthLabel(3)).toBe('Good')
      expect(getPasswordStrengthLabel(4)).toBe('Strong')
    })
  })

  describe('getPasswordStrengthColor', () => {
    it('returns correct colors', () => {
      expect(getPasswordStrengthColor(0)).toBe('bg-red-500')
      expect(getPasswordStrengthColor(1)).toBe('bg-red-500')
      expect(getPasswordStrengthColor(2)).toBe('bg-yellow-500')
      expect(getPasswordStrengthColor(3)).toBe('bg-blue-500')
      expect(getPasswordStrengthColor(4)).toBe('bg-green-500')
    })
  })
})
