'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { baseStyles, PDF_COLORS } from './styles'
import type { PracticePlan, PlanDrill } from '@/hooks/usePracticePlans'
import { drills as staticDrills } from '@/data/drills'
import { practiceGames } from '@/data/practiceGames'

// ── Character theme content ──────────────────────────────────────────────────
const THEME_CONTENT: Record<string, { opener: string; closer: string }> = {
  Effort: {
    opener: "Today we push past comfortable. Effort is the great equalizer — it's the one thing you have 100% control over. Leave nothing on the floor.",
    closer: 'What\'s one thing you did today that required real effort? How did pushing through feel?',
  },
  Teamwork: {
    opener: "We're better together. Every drill today has a teammate depending on you. Bring your best self for them, not just for yourself.",
    closer: 'Share something a teammate did today that made the team better. How can we build on that?',
  },
  Resilience: {
    opener: "You will make mistakes today. That's not failure — that's learning. Our goal is to bounce back faster every time we get knocked down.",
    closer: 'What mistake did you make today? What did you learn from it?',
  },
  Leadership: {
    opener: "Leaders don't wait to be picked — they lead from where they are. Look for one moment today to lift someone else up.",
    closer: 'What\'s one leadership moment you had today, on or off the court?',
  },
  Respect: {
    opener: "Respect starts with yourself. Respect your teammates, coaches, and the game. Let's show what that looks like in every single rep.",
    closer: 'How did you show respect today? How did it affect the people around you?',
  },
  Discipline: {
    opener: "Discipline is doing the right thing when no one is watching. Let's bring that mindset to every rep, every sprint, every mistake.",
    closer: 'What habit or routine are you building this week? How does discipline help you get there?',
  },
}

const FOCUS_COLOR: Record<string, string> = {
  'Ball Handling': PDF_COLORS.orange,
  'Shooting':      PDF_COLORS.sky,
  'Passing':       PDF_COLORS.gold,
  'Defense':       PDF_COLORS.green,
  'Conditioning':  '#E879F9',
  'Team Play':     PDF_COLORS.violet,
}

const s = StyleSheet.create({
  // Title block
  planName:    { fontSize: 24, fontWeight: 700, color: PDF_COLORS.dark, marginBottom: 4 },
  planMeta:    { fontSize: 11, color: PDF_COLORS.muted, marginBottom: 8 },
  themeBadge:  { fontSize: 10, color: PDF_COLORS.orange, fontWeight: 700 },
  // Focus pills
  pillRow:     { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  pill:        { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6, marginBottom: 4 },
  pillText:    { fontSize: 9, fontWeight: 700 },
  // Stats row
  statsRow:    { flexDirection: 'row', marginBottom: 20 },
  statCell:    { flex: 1, alignItems: 'center', padding: 10, backgroundColor: PDF_COLORS.lightbg, borderRadius: 6 },
  statValue:   { fontSize: 16, fontWeight: 700, color: PDF_COLORS.orange, marginBottom: 3 },
  statLabel:   { fontSize: 8, color: PDF_COLORS.muted },
  // Drill card
  drillCard:   { backgroundColor: PDF_COLORS.lightbg, borderRadius: 6, padding: 12, marginBottom: 10 },
  drillHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  numCircle:   { width: 22, height: 22, borderRadius: 11, backgroundColor: PDF_COLORS.orange, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  numText:     { fontSize: 9, fontWeight: 700, color: PDF_COLORS.white },
  drillName:   { flex: 1, fontSize: 13, fontWeight: 700, color: PDF_COLORS.dark },
  drillMins:   { fontSize: 10, fontWeight: 700, color: PDF_COLORS.orange },
  divider:     { borderBottomWidth: 1, borderBottomColor: PDF_COLORS.border, marginBottom: 8 },
  categoryTag: { fontSize: 8, fontWeight: 700, marginBottom: 6 },
  bodyText:    { fontSize: 9, color: PDF_COLORS.ink, lineHeight: 1.5, marginBottom: 8 },
  cueRow:      { flexDirection: 'row', marginBottom: 4 },
  cueDot:      { width: 5, height: 5, borderRadius: 3, backgroundColor: PDF_COLORS.orange, marginTop: 4, marginRight: 7 },
  cueText:     { flex: 1, fontSize: 9, color: PDF_COLORS.ink, lineHeight: 1.5 },
  // Notes lines
  notesLine:   { borderBottomWidth: 0.5, borderBottomColor: PDF_COLORS.border, height: 22, marginBottom: 4 },
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

interface DrillDetail {
  description?: string
  setup?: string
  cues: string[]
  category?: string
}

function getDrillDetail(drill: PlanDrill): DrillDetail {
  if (drill.drillId.startsWith('game-')) {
    const game = practiceGames.find(g => g.id === drill.drillId.replace('game-', ''))
    return {
      description: game?.howToPlay,
      setup: game?.setup,
      cues: game?.coachingTips ?? [],
      category: game?.category,
    }
  }
  const d = staticDrills.find(d => d.id === drill.drillId)
  return {
    description: d?.description,
    setup: d?.setup,
    cues: d?.cues ?? [],
    category: d?.category,
  }
}

// ── Document ─────────────────────────────────────────────────────────────────
export default function PracticePlanPDF({
  plan,
  coachName = '',
}: {
  plan: PracticePlan
  coachName?: string
}) {
  const totalMins = plan.drills.reduce((s, d) => s + d.durationMins, 0)
  const theme = plan.character_theme ?? ''
  const themeContent = THEME_CONTENT[theme]

  return (
    <Document title={plan.name} author="SidelinePro">
      <Page size="LETTER" style={baseStyles.page}>
        {/* ── Header ─────────────────────────────── */}
        <View style={baseStyles.headerBar}>
          <View>
            <Text style={baseStyles.logo}>SidelinePro</Text>
            <Text style={baseStyles.logoSub}>sidelinecoachpro.com</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {coachName ? <Text style={{ fontSize: 9, color: PDF_COLORS.muted, marginBottom: 2 }}>{coachName}</Text> : null}
            <Text style={{ fontSize: 9, color: PDF_COLORS.muted }}>{formatDate(plan.created_at)}</Text>
          </View>
        </View>

        {/* ── Title block ─────────────────────────── */}
        <Text style={s.planName}>{plan.name}</Text>
        <Text style={s.planMeta}>
          {[plan.age_group, `${totalMins} min`, `${plan.drills.length} drills`].filter(Boolean).join(' · ')}
        </Text>
        {theme ? <Text style={s.themeBadge}>⚡ Theme: {theme}</Text> : null}

        {/* Focus pills */}
        {(plan.focus_areas ?? []).length > 0 && (
          <View style={s.pillRow}>
            {(plan.focus_areas ?? []).map((area, i) => {
              const color = FOCUS_COLOR[area] ?? PDF_COLORS.muted
              return (
                <View key={i} style={[s.pill, { backgroundColor: color + '20' }]}>
                  <Text style={[s.pillText, { color }]}>{area}</Text>
                </View>
              )
            })}
          </View>
        )}

        {/* ── Stats row ───────────────────────────── */}
        <View style={s.statsRow}>
          {[
            { value: `${totalMins} min`, label: 'Duration' },
            { value: String(plan.drills.length),  label: 'Drills' },
            { value: plan.age_group ?? '—',        label: 'Age Group' },
            { value: theme || '—',                 label: 'Theme' },
          ].map((stat, i) => (
            <View key={i} style={[s.statCell, i < 3 ? { marginRight: 6 } : {}]}>
              <Text style={s.statValue}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Opening talk ────────────────────────── */}
        {themeContent && (
          <>
            <Text style={baseStyles.sectionTitle}>Opening Talk</Text>
            <View style={baseStyles.orangeCard}>
              <Text style={{ fontSize: 9, color: PDF_COLORS.ink, lineHeight: 1.6 }}>{themeContent.opener}</Text>
            </View>
          </>
        )}

        {/* ── Drills ──────────────────────────────── */}
        <Text style={baseStyles.sectionTitle}>Drill Plan</Text>
        {plan.drills.map((drill, i) => {
          const detail = getDrillDetail(drill)
          return (
            <View key={drill.uid} style={s.drillCard} wrap={false}>
              {/* Header row */}
              <View style={s.drillHeader}>
                <View style={s.numCircle}>
                  <Text style={s.numText}>{String(i + 1)}</Text>
                </View>
                <Text style={s.drillName}>{drill.name}</Text>
                <Text style={s.drillMins}>{drill.durationMins} min</Text>
              </View>

              <View style={s.divider} />

              {/* Category */}
              <Text style={[s.categoryTag, { color: drill.categoryColor }]}>
                {drill.category.charAt(0).toUpperCase() + drill.category.slice(1)}
              </Text>

              {/* Coach notes (custom) */}
              {drill.notes ? (
                <Text style={[s.bodyText, { fontStyle: 'italic', color: PDF_COLORS.muted }]}>
                  Note: {drill.notes}
                </Text>
              ) : null}

              {/* Description */}
              {detail.description ? (
                <Text style={s.bodyText}>{detail.description}</Text>
              ) : null}

              {/* Setup */}
              {detail.setup ? (
                <>
                  <Text style={{ fontSize: 8, fontWeight: 700, color: PDF_COLORS.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    Setup
                  </Text>
                  <Text style={[s.bodyText, { marginBottom: 6 }]}>{detail.setup}</Text>
                </>
              ) : null}

              {/* Cues */}
              {detail.cues.length > 0 ? (
                <>
                  <Text style={{ fontSize: 8, fontWeight: 700, color: PDF_COLORS.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    Coaching Cues
                  </Text>
                  {detail.cues.map((cue, ci) => (
                    <View key={ci} style={s.cueRow}>
                      <View style={s.cueDot} />
                      <Text style={s.cueText}>{cue}</Text>
                    </View>
                  ))}
                </>
              ) : null}
            </View>
          )
        })}

        {/* ── Closing ─────────────────────────────── */}
        {themeContent ? (
          <>
            <Text style={baseStyles.sectionTitle}>Closing Reflection</Text>
            <View style={baseStyles.orangeCard}>
              <Text style={{ fontSize: 9, color: PDF_COLORS.ink, lineHeight: 1.6, fontStyle: 'italic' }}>
                {themeContent.closer}
              </Text>
            </View>
          </>
        ) : (
          <>
            <Text style={baseStyles.sectionTitle}>Coach Notes</Text>
            {[1, 2, 3, 4].map(i => <View key={i} style={s.notesLine} />)}
          </>
        )}

        {/* ── Footer (every page) ─────────────────── */}
        <View fixed style={baseStyles.footer}>
          <Text style={baseStyles.footerText}>Generated by SidelinePro · sidelinecoachpro.com</Text>
          <Text style={baseStyles.footerText}>{plan.name}</Text>
          <Text style={baseStyles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
