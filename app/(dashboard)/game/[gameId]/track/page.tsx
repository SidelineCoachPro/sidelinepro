import Link from 'next/link'

export default function TrackPage({ params }: { params: { gameId: string } }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
      <h1 className="text-2xl font-bold text-sp-text">Game Tracker</h1>
      <p style={{ color: 'rgba(241,245,249,0.45)' }}>Coming in Session 5B</p>
      <Link href="/game" className="text-sm font-medium transition-opacity hover:opacity-75" style={{ color: '#F7620A' }}>
        ← Back to Game Day
      </Link>
    </div>
  )
}
