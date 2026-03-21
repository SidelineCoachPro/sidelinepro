'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import PracticeSubNav from '../../components/PracticeSubNav'
import SplitBuilder from '../SplitBuilder'
import { useCreatePracticePlan } from '@/hooks/usePracticePlans'

function NewPracticeInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')
  const createPlan = useCreatePracticePlan()

  async function handleSave(name: string, date: string | null, items: import('@/hooks/usePracticePlans').PlanDrill[]) {
    const totalMins = items.reduce((s, d) => s + d.durationMins, 0)
    const plan = await createPlan.mutateAsync({
      name: name || 'Practice',
      duration_mins: totalMins || 60,
      drills: items,
      scheduled_date: date ?? null,
    })
    router.push(`/practice/build/${plan.id}`)
  }

  return (
    <div>
      <PracticeSubNav />
      <SplitBuilder
        initialName=""
        initialDate={dateParam}
        initialDrills={[]}
        isSaving={createPlan.isPending}
        savedPlanId={null}
        onSave={handleSave}
        onBack={() => router.push('/practice')}
      />
    </div>
  )
}

export default function NewPracticePage() {
  return (
    <Suspense>
      <NewPracticeInner />
    </Suspense>
  )
}
