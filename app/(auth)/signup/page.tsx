'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

const labelStyle = { color: 'rgba(241,245,249,0.7)', fontSize: '13px', fontWeight: 500 }
const mutedStyle = { color: 'rgba(241,245,249,0.45)' }

export default function SignupPage() {
  const router = useRouter()
  const [authError, setAuthError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setAuthError(null)
    const supabase = createClient()
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setAuthError(error.message)
      return
    }
    if (signUpData.session) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setEmailSent(true)
    }
  }

  if (emailSent) {
    return (
      <div className="text-center py-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: 'rgba(247,98,10,0.15)' }}
        >
          <svg className="w-6 h-6 text-sp-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-sp-text">Check your email</h2>
        <p className="mt-2 text-sm" style={mutedStyle}>
          We sent a confirmation link to your email. Click it to activate your account.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-block text-sm font-medium text-sp-orange hover:opacity-80 transition-opacity"
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="mb-7 text-center">
        <h2 className="text-xl font-semibold text-sp-text">Create your account</h2>
        <p className="text-sm mt-1" style={mutedStyle}>Start coaching smarter today</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="name" className="block mb-1.5" style={labelStyle}>
            Full name
          </label>
          <input
            {...register('name')}
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Coach Johnson"
            className="sp-input"
          />
          {errors.name && (
            <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>
          )}
        </div>

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
          <label htmlFor="password" className="block mb-1.5" style={labelStyle}>
            Password
          </label>
          <input
            {...register('password')}
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            className="sp-input"
          />
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block mb-1.5" style={labelStyle}>
            Confirm password
          </label>
          <input
            {...register('confirmPassword')}
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="sp-input"
          />
          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword.message}</p>
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
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div style={{ borderTop: '1px solid rgba(241,245,249,0.07)', marginTop: '24px', paddingTop: '24px' }}>
        <p className="text-center text-sm" style={mutedStyle}>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-sp-orange hover:opacity-80 transition-opacity">
            Sign in
          </Link>
        </p>
      </div>
    </>
  )
}
