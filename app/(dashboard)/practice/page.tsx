import Link from 'next/link'

const sections = [
  {
    href: '/practice/drills',
    title: 'Drill Library',
    description: '20+ built-in drills across all categories. Search, filter, and save custom drills.',
    color: '#F7620A',
    icon: '🏀',
  },
  {
    href: '/practice/planner',
    title: 'Practice Planner',
    description: 'Build full practice plans with drag-and-drop drill scheduling.',
    color: '#38BDF8',
    icon: '📋',
    soon: true,
  },
  {
    href: '/practice/templates',
    title: 'Plan Templates',
    description: 'Save and reuse your best practice structures.',
    color: '#F5B731',
    icon: '⭐',
    soon: true,
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
        {sections.map(({ href, title, description, color, icon, soon }) => (
          <Link
            key={href}
            href={soon ? '#' : href}
            className={`block rounded-xl p-6 transition-all ${soon ? 'cursor-default' : 'hover:border-opacity-20'}`}
            style={{
              backgroundColor: '#0E1520',
              border: '1px solid rgba(241,245,249,0.07)',
            }}
          >
            <div className="text-2xl mb-3">{icon}</div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-semibold text-sp-text">{title}</h2>
              {soon && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded font-medium"
                  style={{ backgroundColor: 'rgba(241,245,249,0.07)', color: 'rgba(241,245,249,0.4)' }}
                >
                  Soon
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(241,245,249,0.4)' }}>
              {description}
            </p>
            {!soon && (
              <p className="text-xs font-medium mt-3" style={{ color }}>
                Open →
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
