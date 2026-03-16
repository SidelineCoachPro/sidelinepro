export const PLAYER_COLORS = [
  '#3A86FF', '#F7620A', '#0ECFB0', '#8B5CF6', '#F5B731',
  '#E879F9', '#22C55E', '#38BDF8', '#FB923C', '#A78BFA',
]

export const SKILLS = [
  { key: 'ball_handling', label: 'Ball Handling', short: 'BH', color: '#F7620A' },
  { key: 'shooting',      label: 'Shooting',      short: 'SH', color: '#38BDF8' },
  { key: 'passing',       label: 'Passing',       short: 'PA', color: '#F5B731' },
  { key: 'defense',       label: 'Defense',       short: 'DF', color: '#22C55E' },
  { key: 'athleticism',   label: 'Athleticism',   short: 'AT', color: '#E879F9' },
  { key: 'coachability',  label: 'Coachability',  short: 'CO', color: '#0ECFB0' },
] as const

export type SkillKey = typeof SKILLS[number]['key']

export function calcGrade(avg: number): string {
  if (avg >= 9)   return 'A+'
  if (avg >= 8.5) return 'A'
  if (avg >= 8)   return 'A-'
  if (avg >= 7.5) return 'B+'
  if (avg >= 7)   return 'B'
  if (avg >= 6.5) return 'B-'
  if (avg >= 6)   return 'C+'
  if (avg >= 5.5) return 'C'
  if (avg >= 5)   return 'C-'
  return 'D'
}

export function gradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#22C55E'
  if (grade.startsWith('B')) return '#38BDF8'
  if (grade.startsWith('C')) return '#F5B731'
  return '#EF4444'
}

export function calcAvg(vals: number[]): number {
  return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10
}

export function aiInsight(skills: Record<SkillKey, number>): string {
  const entries = SKILLS.map(s => ({ label: s.label, val: skills[s.key] }))
  const highest = [...entries].sort((a, b) => b.val - a.val)[0]
  const lowest  = [...entries].sort((a, b) => a.val - b.val)[0]
  return `Strong in ${highest.label}. Focus area: ${lowest.label} — suggest extra reps next practice.`
}

export function playerInitials(first: string, last: string | null): string {
  return [first[0], last?.[0]].filter(Boolean).join('').toUpperCase()
}

export function formatEvalDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
