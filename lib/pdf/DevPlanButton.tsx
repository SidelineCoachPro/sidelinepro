'use client'

import { useState } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import DevPlanPDF from './DevPlanPDF'
import type { DevPlan } from '@/hooks/useDevPlans'
import type { Player } from '@/hooks/usePlayers'
import type { Evaluation } from '@/hooks/useEvaluations'
import { useProfile } from '@/hooks/useProfile'

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
  const { data: profile } = useProfile()
  const [requested, setRequested] = useState(false)
  const playerName = `${player.first_name}_${player.last_name ?? ''}`.replace(/[^a-z0-9_]/gi, '')
  const fileName = `${playerName}_dev_plan.pdf`
  const resolvedName    = coachName || profile?.displayName || profile?.fullName || ''
  const avatarUrl       = profile?.avatarUrl ?? undefined
  const showPhotoInPdfs = profile?.showPhotoInPdfs ?? true

  if (!requested) {
    return (
      <button className={className} style={style} onClick={() => setRequested(true)}>
        ↓ PDF
      </button>
    )
  }

  return (
    <PDFDownloadLink
      document={
        <DevPlanPDF
          plan={plan}
          player={player}
          evaluation={evaluation}
          coachName={resolvedName}
          coachAvatarUrl={avatarUrl}
          showPhotoInPdfs={showPhotoInPdfs}
          colorIndex={colorIndex}
        />
      }
      fileName={fileName}
      className={className}
      style={style}
    >
      {({ loading, error }) => {
        if (error) { console.error('DevPlanPDF error:', error); return '⚠ PDF Error' }
        return loading ? 'Preparing...' : '↓ Download'
      }}
    </PDFDownloadLink>
  )
}
