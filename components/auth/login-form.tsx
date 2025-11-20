'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ForgotPasswordModal } from './forgot-password-modal'

interface LoginFormProps {
  userType: 'dispatcher' | 'driver' | 'carrier' | 'customer' | 'admin'
  redirectPath: string
}

export function LoginForm({ userType, redirectPath }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Clear any stale sessions on mount
  useEffect(() => {
    const clearStaleSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          // If there's a session on login page, clear it
          await supabase.auth.signOut()
        }
      } catch (error) {
        // Silently handle any auth errors on the login page
        console.log('Clearing stale session')
      }
    }
    clearStaleSession()
  }, [supabase])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        // Verify user role matches the login type
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (userError || !userData) {
          setError('User not found')
          await supabase.auth.signOut()
          setLoading(false)
          return
        }

        // Check if role matches
        const roleMap: Record<string, string[]> = {
          dispatcher: ['executive', 'admin', 'billing', 'csr', 'dispatch'],
          driver: ['driver'],
          carrier: ['carrier'],
          customer: ['customer'],
          admin: ['admin', 'executive'],
        }

        if (!roleMap[userType].includes(userData.role)) {
          setError(`Invalid login. Please use the ${userData.role} login.`)
          await supabase.auth.signOut()
          setLoading(false)
          return
        }

        router.push(redirectPath)
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-500/10 border border-red-500 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={loading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>

        <button
          type="button"
          onClick={() => setShowForgotPassword(true)}
          className="text-sm text-gray-400 hover:text-gray-300 w-full text-center"
        >
          Forgot password?
        </button>
      </form>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </>
  )
}

