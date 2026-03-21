import Link from 'next/link'

const sections = [
  {
    href: '/practice/season',
    title: 'Season Plan Builder',
    description: 'Map out your entire season — phases, weekly focus rotation, character themes, and auto-generated practice plans.',
    color: '#F7620A',
    icon: '📅',
  },
  {
    href: '/practice/planner',
    title: 'Practice Planner',
    description: 'Build full practice plans with AI generation or drag-and-drop scheduling.',
    color: '#38BDF8',
    icon: '📋',
  },
  {
    href: '/practice/drills',
    title: 'Drill Library',
    description: '20+ built-in drills across all categories. Search, filter, and save custom drills.',
    color: '#F7620A',
    icon: '🏀',
  },
  {
    href: '/practice/games',
    title: 'Practice Games',
    description: '14 competitive games that build skills through fun. End practice on a high note.',
    color: '#EF4444',
    icon: '🎮',
  },
]

export default function PracticePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-sp-text">Practice</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(241,245,249,0.45)' }}>
          Build and manage your practice plans
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map(({ href, title, description, color, icon }) => (
          <Link
            key={href}
            href={href}
            className="block rounded-xl p-6 transition-all hover:border-opacity-20"
            style={{
              backgroundColor: '#0E1520',
              border: '1px solid rgba(241,245,249,0.07)',
            }}
          >
            <div className="text-2xl mb-3">{icon}</div>
            <h2 className="text-base font-semibold text-sp-text mb-1">{title}</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(241,245,249,0.4)' }}>
              {description}
            </p>
            <p className="text-xs font-medium mt-3" style={{ color }}>
              Open →
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
