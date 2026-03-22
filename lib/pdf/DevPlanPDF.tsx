'use client'

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { baseStyles, PDF_COLORS } from './styles'
import type { DevPlan } from '@/hooks/useDevPlans'
import type { Player } from '@/hooks/usePlayers'
import type { Evaluation } from '@/hooks/useEvaluations'

const SKILLS = [
  { key: 'ball_handling', label: 'Ball Handling', color: PDF_COLORS.orange },
  { key: 'shooting',      label: 'Shooting',      color: PDF_COLORS.sky },
  { key: 'passing',       label: 'Passing',       color: PDF_COLORS.gold },
  { key: 'defense',       label: 'Defense',       color: PDF_COLORS.green },
  { key: 'athleticism',   label: 'Athleticism',   color: '#E879F9' },
  { key: 'coachability',  label: 'Coachability',  color: PDF_COLORS.teal },
] as const

const SKILL_LABEL: Record<string, string> = {
  ball_handling: 'Ball Handling',
  shooting:      'Shooting',
  passing:       'Passing',
  defense:       'Defense',
  athleticism:   'Athleticism',
  coachability:  'Coachability',
}

const SKILL_COLOR: Record<string, string> = {
  ball_handling: PDF_COLORS.orange,
  shooting:      PDF_COLORS.sky,
  passing:       PDF_COLORS.gold,
  defense:       PDF_COLORS.green,
  athleticism:   '#E879F9',
  coachability:  PDF_COLORS.teal,
}

const PLAYER_COLORS = ['#3A86FF', '#F7620A', '#0ECFB0', '#8B5CF6', '#F5B731', '#E879F9', '#22C55E']

function playerInitials(first: string, last: string | null) {
  return `${first[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const s = StyleSheet.create({
  titleName:    { fontSize: 22, fontWeight: 700, color: PDF_COLORS.dark, marginBottom: 3 },
  titleSub:     { fontSize: 10, color: PDF_COLORS.muted, marginBottom: 2 },
  // Player info row
  playerRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar:       { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText:   { fontSize: 9, fontWeight: 700, color: PDF_COLORS.white },
  playerName:   { fontSize: 12, fontWeight: 700, color: PDF_COLORS.dark },
  playerMeta:   { fontSize: 9, color: PDF_COLORS.muted, marginTop: 1 },
  // Focus banner
  focusBanner:  { borderLeftWidth: 4, borderRadius: 4, padding: 10, marginBottom: 16 },
  focusLabel:   { fontSize: 8, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 3 },
  focusValue:   { fontSize: 13, fontWeight: 700 },
  // Score section
  scoreRow:     { flexDirection: 'row', marginBottom: 16 },
  skillsCol:    { flex: 1, marginRight: 16 },
  gradeCol:     { width: 100, alignItems: 'center', backgroundColor: PDF_COLORS.lightbg, borderRadius: 8, padding: 12 },
  skillBarRow:  { marginBottom: 7 },
  skillBarMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  skillName:    { fontSize: 8, color: PDF_COLORS.muted },
  skillScore:   { fontSize: 8, fontWeight: 700 },
  barBg:        { height: 5, backgroundColor: PDF_COLORS.border, borderRadius: 3 },
  barFill:      { height: 5, borderRadius: 3 },
  gradeText:    { fontSize: 42, fontWeight: 700, color: PDF_COLORS.orange, marginBottom: 4 },
  gradeScore:   { fontSize: 11, color: PDF_COLORS.muted, marginBottom: 8 },
  gradeDate:    { fontSize: 8, color: PDF_COLORS.muted, textAlign: 'center' },
  insight:      { fontSize: 8, color: PDF_COLORS.ink, textAlign: 'center', lineHeight: 1.5, marginTop: 6 },
  // Drill card
  drillCard:    { backgroundColor: PDF_COLORS.lightbg, borderRadius: 6, padding: 12, marginBottom: 8 },
  drillHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  numCircle:    { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  numText:      { fontSize: 8, fontWeight: 700, color: PDF_COLORS.white },
  drillName:    { flex: 1, fontSize: 12, fontWeight: 700, color: PDF_COLORS.dark },
  drillDur:     { fontSize: 9, color: PDF_COLORS.muted },
  divider:      { borderBottomWidth: 1, borderBottomColor: PDF_COLORS.border, marginBottom: 8 },
  instructions: { fontSize: 9, color: PDF_COLORS.ink, lineHeight: 1.6, marginBottom: 8 },
  tipBox:       { borderLeftWidth: 3, borderLeftColor: PDF_COLORS.teal, borderRadius: 3, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: PDF_COLORS.teal + '12' },
  tipLabel:     { fontSize: 8, fontWeight: 700, color: PDF_COLORS.teal, marginBottom: 3 },
  tipText:      { fontSize: 9, color: PDF_COLORS.ink, lineHeight: 1.5 },
  // Message to parent
  messageBox:   { borderLeftWidth: 3, borderLeftColor: PDF_COLORS.violet, borderRadius: 3, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: PDF_COLORS.violet + '10' },
  messageText:  { fontSize: 9, color: PDF_COLORS.ink, lineHeight: 1.6 },
  // Equipment
  equipItem:    { flexDirection: 'row', marginBottom: 4 },
  bullet:       { width: 5, height: 5, borderRadius: 3, marginTop: 4, marginRight: 8 },
  equipText:    { fontSize: 9, color: PDF_COLORS.ink },
})

function autoEquipment(plan: DevPlan): string[] {
  const items: string[] = ['A basketball']
  const allText = plan.drills.map(d => d.instructions + ' ' + d.name).join(' ').toLowerCase()
  if (allText.includes('cone') || allText.includes('marker'))  items.push('Cones or markers')
  if (allText.includes('wall'))                                 items.push('An open wall')
  if (allText.includes('partner') || allText.includes('pass')) items.push('A practice partner (optional)')
  items.push('Water bottle')
  return items
}

// ── Document ──────────────────────────────────────────────────────────────────
export default function DevPlanPDF({
  plan,
  player,
  evaluation,
  coachName = '',
  coachAvatarUrl,
  showPhotoInPdfs = true,
  colorIndex = 0,
}: {
  plan:             DevPlan
  player:           Player
  evaluation?:      Evaluation | null
  coachName?:       string
  coachAvatarUrl?:  string
  showPhotoInPdfs?: boolean
  colorIndex?:      number
}) {
  const skillLabel = SKILL_LABEL[plan.focus_skill] ?? plan.focus_skill
  const skillColor = SKILL_COLOR[plan.focus_skill] ?? PDF_COLORS.orange
  const playerColor = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length]
  const playerFullName = `${player.first_name} ${player.last_name ?? ''}`.trim()
  const equipment = autoEquipment(plan)

  // Find weakest skill (for star marker)
  let weakestKey = ''
  if (evaluation) {
    let minScore = Infinity
    for (const sk of SKILLS) {
      const val = (evaluation as unknown as Record<string, number | null>)[sk.key]
      if (val != null && val < minScore) { minScore = val; weakestKey = sk.key }
    }
  }

  return (
    <Document title={`${playerFullName} Development Plan`} author="SidelinePro">
      <Page size="LETTER" style={baseStyles.page}>
        {/* ── Header ──────────────────────────────── */}
        <View style={baseStyles.headerBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {coachAvatarUrl && showPhotoInPdfs ? (
              <Image src={coachAvatarUrl.split('?')[0]} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }} />
            ) : null}
            <View>
              <Text style={baseStyles.logo}>SidelinePro</Text>
              <Text style={baseStyles.logoSub}>sidelinecoachpro.com</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {coachName ? <Text style={{ fontSize: 9, color: PDF_COLORS.muted, marginBottom: 2 }}>Coach {coachName}</Text> : null}
            <Text style={{ fontSize: 9, color: PDF_COLORS.muted }}>Week of {formatDate(plan.created_at)}</Text>
          </View>
        </View>

        {/* ── Title block ─────────────────────────── */}
        <Text style={s.titleName}>{playerFullName}&apos;s Development Plan</Text>
        <Text style={s.titleSub}>Prepared by {coachName ? `Coach ${coachName}` : 'your coach'}</Text>

        {/* Player info row */}
        <View style={s.playerRow}>
          <View style={[s.avatar, { backgroundColor: playerColor }]}>
            <Text style={s.avatarText}>{playerInitials(player.first_name, player.last_name)}</Text>
          </View>
          <View>
            <Text style={s.playerName}>{playerFullName}</Text>
            <Text style={s.playerMeta}>
              {[player.position, player.age ? `Age ${player.age}` : null].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </View>

        {/* ── Focus banner ────────────────────────── */}
        <View style={[s.focusBanner, { borderLeftColor: skillColor, backgroundColor: skillColor + '18' }]}>
          <Text style={[s.focusLabel, { color: skillColor }]}>This Week&apos;s Focus</Text>
          <Text style={[s.focusValue, { color: skillColor }]}>{skillLabel}</Text>
        </View>

        {/* ── Eval scores ─────────────────────────── */}
        {evaluation && (
          <>
            <Text style={baseStyles.sectionTitle}>Evaluation Scores</Text>
            <View style={s.scoreRow}>
              {/* Skill bars */}
              <View style={s.skillsCol}>
                {SKILLS.map(skill => {
                  const score = (evaluation as unknown as Record<string, number | null>)[skill.key]
                  const pct = score != null ? Math.min((score / 10) * 100, 100) : 0
                  const isWeak = skill.key === weakestKey
                  return (
                    <View key={skill.key} style={s.skillBarRow}>
                      <View style={s.skillBarMeta}>
                        <Text style={[s.skillName, isWeak ? { color: skill.color, fontWeight: 700 } : {}]}>
                          {isWeak ? '★ ' : ''}{skill.label}
                        </Text>
                        <Text style={[s.skillScore, { color: skill.color }]}>
                          {score?.toFixed(1) ?? '—'}/10
                        </Text>
                      </View>
                      <View style={s.barBg}>
                        <View style={[s.barFill, { width: `${pct}%`, backgroundColor: skill.color }]} />
                      </View>
                    </View>
                  )
                })}
              </View>

              {/* Grade column */}
              <View style={s.gradeCol}>
                <Text style={s.gradeText}>{evaluation.grade ?? '—'}</Text>
                <Text style={s.gradeScore}>{evaluation.overall_avg?.toFixed(1) ?? '—'} / 10</Text>
                <Text style={s.gradeDate}>Evaluated {formatDate(evaluation.evaluated_at)}</Text>
                {evaluation.notes ? (
                  <Text style={s.insight}>&quot;{evaluation.notes}&quot;</Text>
                ) : null}
              </View>
            </View>
          </>
        )}

        {/* ── Drill plan ──────────────────────────── */}
        <Text style={baseStyles.sectionTitle}>
          At-Home Drill Plan · {plan.duration_mins} min/day
        </Text>

        {plan.drills.map((drill, i) => (
          <View key={drill.id} style={s.drillCard} wrap={false}>
            <View style={s.drillHeader}>
              <View style={[s.numCircle, { backgroundColor: skillColor }]}>
                <Text style={s.numText}>{String(i + 1)}</Text>
              </View>
              <Text style={s.drillName}>{drill.name}</Text>
              <Text style={s.drillDur}>{drill.duration_mins} min</Text>
            </View>

            <View style={s.divider} />

            <Text style={s.instructions}>{drill.instructions}</Text>

            {drill.focus ? (
              <View style={s.tipBox}>
                <Text style={s.tipLabel}>Coach&apos;s Tip</Text>
                <Text style={s.tipText}>{drill.focus}</Text>
              </View>
            ) : null}
          </View>
        ))}

        {/* ── Message to parent ───────────────────── */}
        <Text style={baseStyles.sectionTitle}>Message to Parent</Text>
        <View style={s.messageBox}>
          <Text style={s.messageText}>
            {plan.message_text
              .replace('[Player Name]', playerFullName)
              .replace('[Parent Name]', 'there')}
          </Text>
        </View>

        {/* ── Equipment ───────────────────────────── */}
        <Text style={baseStyles.sectionTitle}>What You&apos;ll Need</Text>
        {equipment.map((item, i) => (
          <View key={i} style={s.equipItem}>
            <View style={[s.bullet, { backgroundColor: skillColor }]} />
            <Text style={s.equipText}>{item}</Text>
          </View>
        ))}

        {/* ── Footer ──────────────────────────────── */}
        <View fixed style={baseStyles.footer}>
          <Text style={baseStyles.footerText}>Generated by SidelinePro · sidelinecoachpro.com</Text>
          <Text style={baseStyles.footerText}>{playerFullName}&apos;s Dev Plan</Text>
          <Text style={baseStyles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
