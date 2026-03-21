'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/practice',        label: 'Overview',    exact: true },
  { href: '/practice/drills', label: 'Drill Library' },
  { href: '/practice/games',  label: 'Games' },
  { href: '/practice/plays',  label: 'Plays' },
  { href: '/whiteboard',      label: 'Whiteboard' },
  { href: '/practice/season', label: 'Season Plan' },
]

export default function PracticeSubNav() {
  const path = usePathname()
  return (
    <div
      className="flex flex-wrap gap-1 mb-6 p-1 rounded-xl w-fit"
      style={{ backgroundColor: 'rgba(241,245,249,0.04)', border: '1px solid rgba(241,245,249,0.07)' }}
    >
      {TABS.map(t => {
        const active = t.exact
          ? path === t.href
          : path === t.href || path.startsWith(t.href + '/')
        return (
          <Link
            key={t.href}
            href={t.href}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: active ? '#F7620A' : 'transparent',
              color: active ? '#fff' : 'rgba(241,245,249,0.45)',
            }}
          >
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
