'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Barlow_Condensed } from 'next/font/google'
import { signOut } from '@/app/actions/auth'
import { useTeam } from '@/lib/teamContext'
import { useTeams, useCreateTeam, type Team } from '@/hooks/useTeams'
import { useProfile } from '@/hooks/useProfile'

const barlow = Barlow_Condensed({ subsets: ['latin'], weight: '900' })

const navLinks = [
  { href: '/practice', label: 'Practice', icon: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )},
  { href: '/players',  label: 'Players', icon: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )},
  { href: '/calendar', label: 'Calendar', icon: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )},
  { href: '/game',     label: 'Game Day', icon: (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.5 2 4 5 4 9s-1.5 7-4 9M12 3c-2.5 2-4 5-4 9s1.5 7 4 9M3 12h18"/>
    </svg>
  )},
  { href: '/whiteboard', label: 'Whiteboard', icon: (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <rect x="3" y="3" width="18" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 10l3 3 4-4"/>
    </svg>
  )},
  { href: '/comms',    label: 'Comms', icon: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )},
]

const PRESET_EMOJIS = ['🏀', '⚽', '🏈', '⚾', '🏐', '🎾', '🏒', '🥊', '🏆', '🔥', '⭐', '💪', '🦁', '🐯', '🦅', '🐻']
const PRESET_COLORS = ['#F7620A', '#3A86FF', '#0ECFB0', '#8B5CF6', '#F5B731', '#EF4444', '#22C55E', '#E879F9']

// ── Add Team Modal ────────────────────────────────────────────────────────────

function AddTeamModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: (team: Team) => void
}) {
  const [name, setName]           = useState('')
  const [emoji, setEmoji]         = useState('🏀')
  const [color, setColor]         = useState('#F7620A')
  const [ageGroup, setAgeGroup]   = useState('')
  const [seasonYear, setSeasonYear] = useState('')
  const [teamType, setTeamType]   = useState('rec')
  const { mutateAsync: createTeam, isPending } = useCreateTeam()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const team = await createTeam({
      name: name.trim(),
      emoji,
      color,
      age_group:   ageGroup.trim() || null,
      season_year: seasonYear.trim() || null,
      team_type:   teamType,
    })
    onSuccess(team)
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.12)' }}
      >
        <h2 className="text-lg font-bold text-sp-text mb-5">Add Team</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(241,245,249,0.45)' }}>
              Team Name *
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Riverside Rams"
              required
              className="w-full px-3 py-2 rounded-lg text-sm bg-transparent text-sp-text outline-none"
              style={{ border: '1px solid rgba(241,245,249,0.15)' }}
            />
          </div>

          {/* Emoji */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(241,245,249,0.45)' }}>
              Icon
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_EMOJIS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className="w-9 h-9 rounded-lg text-base flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: emoji === e ? 'rgba(247,98,10,0.15)' : 'rgba(241,245,249,0.05)',
                    border: emoji === e ? '1px solid rgba(247,98,10,0.4)' : '1px solid rgba(241,245,249,0.08)',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(241,245,249,0.45)' }}>
              Color
            </label>
            <div className="flex gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full flex-shrink-0 transition-all"
                  style={{
                    backgroundColor: c,
                    boxShadow: color === c ? `0 0 0 2px #0E1520, 0 0 0 4px ${c}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Age Group + Season Year */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(241,245,249,0.45)' }}>
                Age Group
              </label>
              <input
                value={ageGroup}
                onChange={e => setAgeGroup(e.target.value)}
                placeholder="e.g. U12"
                className="w-full px-3 py-2 rounded-lg text-sm bg-transparent text-sp-text outline-none"
                style={{ border: '1px solid rgba(241,245,249,0.15)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(241,245,249,0.45)' }}>
                Season Year
              </label>
              <input
                value={seasonYear}
                onChange={e => setSeasonYear(e.target.value)}
                placeholder="e.g. 2025-26"
                className="w-full px-3 py-2 rounded-lg text-sm bg-transparent text-sp-text outline-none"
                style={{ border: '1px solid rgba(241,245,249,0.15)' }}
              />
            </div>
          </div>

          {/* Team Type */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(241,245,249,0.45)' }}>
              Type
            </label>
            <select
              value={teamType}
              onChange={e => setTeamType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-sp-text outline-none"
              style={{ backgroundColor: '#080C12', border: '1px solid rgba(241,245,249,0.15)' }}
            >
              <option value="rec">Rec</option>
              <option value="aau">AAU</option>
              <option value="school">School</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: 'rgba(241,245,249,0.05)', color: 'rgba(241,245,249,0.5)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-40"
              style={{ backgroundColor: color }}
            >
              {isPending ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main NavBar ───────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#3A86FF','#F7620A','#0ECFB0','#8B5CF6','#F5B731','#E879F9','#22C55E','#EF4444']
function avatarColor(id: string) {
  let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function nameInitials(name: string | null, email: string) {
  if (name?.trim()) { const p = name.trim().split(' '); return (p[0][0] + (p[1]?.[0] ?? '')).toUpperCase() }
  return email[0]?.toUpperCase() ?? '?'
}

export default function NavBar({ email }: { email: string }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen]             = useState(false)
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [addModalOpen, setAddModalOpen]         = useState(false)
  const dropdownRef     = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  const { activeTeamId, setActiveTeamId } = useTeam()
  const { data: teams = [] }              = useTeams()
  const activeTeam = teams.find(t => t.id === activeTeamId) ?? null
  const { data: profile }                 = useProfile()

  // Reset stale team selection (team was deleted)
  useEffect(() => {
    if (activeTeamId && teams.length > 0 && !teams.find(t => t.id === activeTeamId)) {
      setActiveTeamId(null)
    }
  }, [teams, activeTeamId, setActiveTeamId])

  // Close dropdowns on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setTeamDropdownOpen(false)
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) setUserDropdownOpen(false)
    }
    if (teamDropdownOpen || userDropdownOpen) document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [teamDropdownOpen, userDropdownOpen])

  function selectTeam(id: string | null) {
    setActiveTeamId(id)
    setTeamDropdownOpen(false)
  }

  return (
    <>
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
          <div className="flex items-center h-16 gap-3">

            {/* Logo */}
            <Link
              href="/dashboard"
              className={`text-[26px] text-sp-orange tracking-wide flex-shrink-0 ${barlow.className}`}
            >
              SidelinePro
            </Link>

            {/* Team Switcher (desktop) */}
            <div className="hidden md:block relative flex-shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setTeamDropdownOpen(!teamDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: 'rgba(241,245,249,0.04)',
                  border: '1px solid rgba(241,245,249,0.09)',
                }}
              >
                <span className="text-base leading-none">{activeTeam?.emoji ?? '📋'}</span>
                <span
                  className="max-w-[120px] truncate"
                  style={{ color: activeTeam ? activeTeam.color : 'rgba(241,245,249,0.45)' }}
                >
                  {activeTeam?.name ?? 'All Teams'}
                </span>
                <svg
                  className="w-3 h-3 flex-shrink-0"
                  style={{ color: 'rgba(241,245,249,0.3)' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {teamDropdownOpen && (
                <div
                  className="absolute top-full left-0 mt-1 w-56 rounded-xl overflow-hidden z-50"
                  style={{
                    backgroundColor: '#0E1520',
                    border: '1px solid rgba(241,245,249,0.1)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  }}
                >
                  {/* All Teams */}
                  <button
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors hover:bg-white/5"
                    onClick={() => selectTeam(null)}
                    style={{ color: !activeTeam ? 'rgba(241,245,249,0.9)' : 'rgba(241,245,249,0.45)' }}
                  >
                    <span className="text-base leading-none">📋</span>
                    <span className="flex-1">All Teams</span>
                    {!activeTeam && <span style={{ color: '#22C55E', fontSize: 11 }}>✓</span>}
                  </button>

                  {/* Team list */}
                  {teams.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(241,245,249,0.06)' }}>
                      {teams.map(team => (
                        <button
                          key={team.id}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors hover:bg-white/5"
                          onClick={() => selectTeam(team.id)}
                        >
                          <span className="text-base leading-none flex-shrink-0">{team.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p
                              className="truncate font-medium"
                              style={{ color: activeTeamId === team.id ? team.color : 'rgba(241,245,249,0.8)' }}
                            >
                              {team.name}
                            </p>
                            {(team.age_group || team.season_year) && (
                              <p className="text-xs truncate" style={{ color: 'rgba(241,245,249,0.3)' }}>
                                {[team.age_group, team.season_year].filter(Boolean).join(' · ')}
                              </p>
                            )}
                          </div>
                          {activeTeamId === team.id && (
                            <span className="flex-shrink-0" style={{ color: '#22C55E', fontSize: 11 }}>✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ borderTop: '1px solid rgba(241,245,249,0.06)' }}>
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors hover:bg-white/5"
                      onClick={() => { setTeamDropdownOpen(false); setAddModalOpen(true) }}
                      style={{ color: '#F7620A' }}
                    >
                      <span>+</span> Add Team
                    </button>
                    <Link
                      href="/settings/teams"
                      onClick={() => setTeamDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-white/5"
                      style={{ color: 'rgba(241,245,249,0.35)' }}
                    >
                      Manage Teams →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1 flex-1">
              {navLinks.map(({ href, label, icon }) => {
                const active = pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      color: active ? '#F7620A' : 'rgba(241,245,249,0.45)',
                      backgroundColor: active ? 'rgba(247,98,10,0.08)' : 'transparent',
                    }}
                  >
                    {icon}
                    {label}
                  </Link>
                )
              })}
            </div>

            {/* User avatar dropdown */}
            <div className="hidden md:block relative flex-shrink-0" ref={userDropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors"
                style={{ backgroundColor: 'rgba(241,245,249,0.04)', border: '1px solid rgba(241,245,249,0.09)' }}
              >
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="rounded-full object-cover flex-shrink-0" style={{ width: 28, height: 28 }} />
                ) : (
                  <div
                    className="rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ width: 28, height: 28, backgroundColor: avatarColor(profile?.id ?? email) }}
                  >
                    {nameInitials(profile?.displayName ?? profile?.fullName ?? null, email)}
                  </div>
                )}
                <span className="text-sm font-medium max-w-[110px] truncate" style={{ color: 'rgba(241,245,249,0.7)' }}>
                  {profile?.displayName ?? profile?.fullName ?? email.split('@')[0]}
                </span>
                <svg className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(241,245,249,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute top-full right-0 mt-1 w-56 rounded-xl overflow-hidden z-50"
                  style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
                >
                  {/* Identity */}
                  <div className="px-3 py-3" style={{ borderBottom: '1px solid rgba(241,245,249,0.06)' }}>
                    <p className="text-sm font-semibold text-sp-text truncate">{profile?.displayName ?? profile?.fullName ?? email.split('@')[0]}</p>
                    <p className="text-xs truncate" style={{ color: 'rgba(241,245,249,0.35)' }}>{email}</p>
                  </div>
                  {/* Links */}
                  <div style={{ borderBottom: '1px solid rgba(241,245,249,0.06)' }}>
                    <Link href="/settings/profile" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-white/5" style={{ color: 'rgba(241,245,249,0.7)' }}>
                      👤 Profile Settings
                    </Link>
                    <Link href="/settings/teams" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-white/5" style={{ color: 'rgba(241,245,249,0.7)' }}>
                      🏀 Manage Teams
                    </Link>
                    <Link href="/settings/profile#pdf" onClick={() => setUserDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-white/5" style={{ color: 'rgba(241,245,249,0.7)' }}>
                      📄 PDF Settings
                    </Link>
                  </div>
                  {/* Sign out */}
                  <form action={signOut}>
                    <button type="submit" className="w-full text-left flex items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-white/5" style={{ color: '#F7620A' }}>
                      Sign Out
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <div className="flex-1 md:hidden" />
            <button
              className="md:hidden p-1.5 rounded flex-shrink-0"
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
            {/* Team switcher */}
            <div className="pb-3 mb-1" style={{ borderBottom: '1px solid rgba(241,245,249,0.07)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(241,245,249,0.3)' }}>
                Team
              </p>
              <button
                className="w-full flex items-center gap-2 py-2 text-sm text-left"
                onClick={() => { selectTeam(null); setMobileOpen(false) }}
                style={{ color: !activeTeam ? 'rgba(241,245,249,0.9)' : 'rgba(241,245,249,0.45)' }}
              >
                <span>📋</span>
                <span className="flex-1">All Teams</span>
                {!activeTeam && <span style={{ color: '#22C55E', fontSize: 11 }}>✓</span>}
              </button>
              {teams.map(team => (
                <button
                  key={team.id}
                  className="w-full flex items-center gap-2 py-2 text-sm text-left"
                  onClick={() => { selectTeam(team.id); setMobileOpen(false) }}
                >
                  <span>{team.emoji}</span>
                  <span
                    className="flex-1 truncate"
                    style={{ color: activeTeamId === team.id ? team.color : 'rgba(241,245,249,0.7)' }}
                  >
                    {team.name}
                  </span>
                  {activeTeamId === team.id && <span style={{ color: '#22C55E', fontSize: 11 }}>✓</span>}
                </button>
              ))}
              <button
                className="w-full flex items-center gap-2 py-2 text-sm text-left mt-1"
                onClick={() => { setMobileOpen(false); setAddModalOpen(true) }}
                style={{ color: '#F7620A' }}
              >
                + Add Team
              </button>
            </div>

            {/* Nav links */}
            {navLinks.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 py-2.5 text-sm font-medium"
                style={{
                  color: pathname.startsWith(href)
                    ? '#F7620A'
                    : 'rgba(241,245,249,0.45)',
                }}
              >
                {icon}
                {label}
              </Link>
            ))}

            <div className="pt-3 mt-2" style={{ borderTop: '1px solid rgba(241,245,249,0.07)' }}>
              <div className="flex items-center gap-2 mb-3">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="rounded-full object-cover" style={{ width: 28, height: 28 }} />
                ) : (
                  <div className="rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ width: 28, height: 28, backgroundColor: avatarColor(profile?.id ?? email) }}>
                    {nameInitials(profile?.displayName ?? profile?.fullName ?? null, email)}
                  </div>
                )}
                <p className="text-xs truncate" style={{ color: 'rgba(241,245,249,0.4)' }}>{email}</p>
              </div>
              <Link href="/settings/profile" onClick={() => setMobileOpen(false)} className="block text-sm mb-2" style={{ color: 'rgba(241,245,249,0.5)' }}>
                Profile Settings
              </Link>
              <form action={signOut}>
                <button type="submit" className="text-sm font-medium text-sp-orange">Sign out</button>
              </form>
            </div>
          </div>
        )}
      </nav>

      {/* Add Team Modal */}
      {addModalOpen && (
        <AddTeamModal
          onClose={() => setAddModalOpen(false)}
          onSuccess={(team) => {
            setActiveTeamId(team.id)
            setAddModalOpen(false)
          }}
        />
      )}
    </>
  )
}
