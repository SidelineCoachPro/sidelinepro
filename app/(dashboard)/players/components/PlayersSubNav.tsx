'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/players', label: 'Overview' },
  { href: '/players/roster', label: 'Roster' },
]

export default function PlayersSubNav() {
  const pathname = usePathname()

  return (
    <div
      className="flex gap-1 mb-6 p-1 rounded-xl"
      style={{ backgroundColor: 'rgba(241,245,249,0.04)', border: '1px solid rgba(241,245,249,0.07)' }}
    >
      {tabs.map(({ href, label }) => {
        const isActive = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 text-center text-sm font-semibold py-2 rounded-lg transition-all"
            style={{
              backgroundColor: isActive ? '#F7620A' : 'transparent',
              color: isActive ? '#fff' : 'rgba(241,245,249,0.45)',
            }}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
