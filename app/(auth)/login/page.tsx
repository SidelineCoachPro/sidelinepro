'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormData = z.infer<typeof schema>

const labelStyle = { color: 'rgba(241,245,249,0.7)', fontSize: '13px', fontWeight: 500 }
const mutedStyle = { color: 'rgba(241,245,249,0.45)' }

export default function LoginPage() {
  const router = useRouter()
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setAuthError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setAuthError(error.message)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <>
      <div className="mb-7 text-center">
        <h2 className="text-xl font-semibold text-sp-text">Welcome back</h2>
        <p className="text-sm mt-1" style={mutedStyle}>Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="email" className="block mb-1.5" style={labelStyle}>
            Email
          </label>
          <input
            {...register('email')}
            id="email"
            type="email"
            autoComplete="email"
            placeholder="coach@example.com"
            className="sp-input"
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" style={labelStyle}>Password</label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-sp-orange hover:opacity-80 transition-opacity"
            >
              Forgot password?
            </Link>
          </div>
          <input
            {...register('password')}
            id="password"
            type="password"
            autoComplete="current-password"
            className="sp-input"
          />
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
          )}
        </div>

        {authError && (
          <div
            className="rounded-lg p-3 text-sm text-red-400"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            {authError}
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className="sp-btn">
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="mt-1 pt-6" style={{ borderTop: '1px solid rgba(241,245,249,0.07)', marginTop: '24px' }}>
        <p className="text-center text-sm" style={mutedStyle}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-sp-orange hover:opacity-80 transition-opacity">
            Sign up free
          </Link>
        </p>
      </div>
    </>
  )
}
