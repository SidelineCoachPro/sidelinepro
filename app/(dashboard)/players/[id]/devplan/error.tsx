'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function DevPlanError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dev plan error:', error)
  }, [error])

  return (
    <div style={{ minHeight: '100vh', background: '#0E1520', color: '#F1F5F9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
      <p style={{ fontSize: 18, fontWeight: 600 }}>Something went wrong</p>
      <p style={{ fontSize: 13, color: 'rgba(241,245,249,0.5)', fontFamily: 'monospace', maxWidth: 500, textAlign: 'center' }}>
        {error.message || 'An unexpected error occurred'}
      </p>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button
          onClick={reset}
          style={{ padding: '8px 16px', borderRadius: 8, background: '#F7620A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none' }}
        >
          Try Again
        </button>
        <Link
          href="/players"
          style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(241,245,249,0.15)', color: 'rgba(241,245,249,0.6)', fontSize: 13 }}
        >
          ← Players
        </Link>
      </div>
    </div>
  )
}
