'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Barlow_Condensed } from 'next/font/google'
import { signOut } from '@/app/actions/auth'

const barlow = Barlow_Condensed({ subsets: ['latin'], weight: '900' })

const navLinks = [
  { href: '/practice', label: 'Practice' },
  { href: '/players', label: 'Players' },
  { href: '/game', label: 'Game Day' },
  { href: '/comms', label: 'Communications' },
]

export default function NavBar({ email }: { email: string }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        backgroundColor: 'rgba(8,12,18,0.90)',
        borderBottom: '1px solid rgba(241,245,249,0.07)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            href="/dashboard"
            className={`text-[26px] text-sp-orange tracking-wide ${barlow.className}`}
          >
            SidelinePro
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium transition-colors hover:text-sp-text"
                style={{
                  color: pathname.startsWith(href)
                    ? '#F7620A'
                    : 'rgba(241,245,249,0.45)',
                }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* User + sign out */}
          <div className="hidden md:flex items-center gap-4">
            <span className="text-xs" style={{ color: 'rgba(241,245,249,0.35)' }}>
              {email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm font-medium text-sp-orange hover:opacity-75 transition-opacity"
              >
                Sign out
              </button>
            </form>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 rounded"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ color: 'rgba(241,245,249,0.6)' }}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden px-4 pt-2 pb-4 space-y-1"
          style={{ borderTop: '1px solid rgba(241,245,249,0.07)' }}
        >
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 text-sm font-medium"
              style={{
                color: pathname.startsWith(href)
                  ? '#F7620A'
                  : 'rgba(241,245,249,0.45)',
              }}
            >
              {label}
            </Link>
          ))}
          <div
            className="pt-3 mt-2"
            style={{ borderTop: '1px solid rgba(241,245,249,0.07)' }}
          >
            <p className="text-xs mb-3" style={{ color: 'rgba(241,245,249,0.3)' }}>
              {email}
            </p>
            <form action={signOut}>
              <button type="submit" className="text-sm font-medium text-sp-orange">
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </nav>
  )
}
