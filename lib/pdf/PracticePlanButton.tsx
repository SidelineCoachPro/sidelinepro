'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import PracticePlanPDF from './PracticePlanPDF'
import type { PracticePlan } from '@/hooks/usePracticePlans'

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
  const fileName = `${plan.name.replace(/[^a-z0-9]/gi, '_')}_practice_plan.pdf`

  return (
    <PDFDownloadLink
      document={<PracticePlanPDF plan={plan} coachName={coachName} />}
      fileName={fileName}
      className={className}
      style={style}
    >
      {({ loading, error }) => {
        if (error) return '⚠ PDF Error'
        return loading ? 'Preparing...' : '↓ PDF'
      }}
    </PDFDownloadLink>
  )
}
