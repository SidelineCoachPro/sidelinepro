'use client'

import { useState } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import PracticePlanPDF from './PracticePlanPDF'
import type { PracticePlan } from '@/hooks/usePracticePlans'
import { useProfile } from '@/hooks/useProfile'

export default function PracticePlanButton({
  plan,
  coachName = '',
  className,
  style,
}: {
  plan:       PracticePlan
  coachName?: string
  className?: string
  style?:     React.CSSProperties
}) {
  const { data: profile } = useProfile()
  const [requested, setRequested] = useState(false)
  const fileName = `${plan.name.replace(/[^a-z0-9]/gi, '_')}_practice_plan.pdf`
  const resolvedName   = coachName || profile?.displayName || profile?.fullName || ''
  const avatarUrl      = profile?.avatarUrl ?? undefined
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
        <PracticePlanPDF
          plan={plan}
          coachName={resolvedName}
          coachAvatarUrl={avatarUrl}
          showPhotoInPdfs={showPhotoInPdfs}
        />
      }
      fileName={fileName}
      className={className}
      style={style}
    >
      {({ loading, error }) => {
        if (error) { console.error('PracticePlanPDF error:', error); return '⚠ PDF Error' }
        return loading ? 'Preparing...' : '↓ Download'
      }}
    </PDFDownloadLink>
  )
}
