'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import DevPlanPDF from './DevPlanPDF'
import type { DevPlan } from '@/hooks/useDevPlans'
import type { Player } from '@/hooks/usePlayers'
import type { Evaluation } from '@/hooks/useEvaluations'

export default function DevPlanButton({
  plan,
  player,
  evaluation,
  coachName = '',
  colorIndex = 0,
  className,
  style,
}: {
  plan:        DevPlan
  player:      Player
  evaluation?: Evaluation | null
  coachName?:  string
  colorIndex?: number
  className?:  string
  style?:      React.CSSProperties
}) {
  const playerName = `${player.first_name}_${player.last_name ?? ''}`.replace(/[^a-z0-9_]/gi, '')
  const fileName = `${playerName}_dev_plan.pdf`

  return (
    <PDFDownloadLink
      document={<DevPlanPDF plan={plan} player={player} evaluation={evaluation} coachName={coachName} colorIndex={colorIndex} />}
      fileName={fileName}
      className={className}
      style={style}
    >
      {({ loading }) => loading ? 'Preparing...' : '↓ PDF'}
    </PDFDownloadLink>
  )
}
