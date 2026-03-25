'use client'

import { useRouter } from 'next/navigation'
import PracticeSubNav from '../../components/PracticeSubNav'
import SplitBuilder from '../SplitBuilder'
import { usePracticePlan, useUpdatePracticePlan, type PlanDrill } from '@/hooks/usePracticePlans'

export default function EditPracticePage({ params }: { params: { planId: string } }) {
  const { planId } = params
  const router = useRouter()
  const { data: plan, isLoading } = usePracticePlan(planId)
  const updatePlan = useUpdatePracticePlan()

  async function handleSave(name: string, date: string | null, items: PlanDrill[]) {
    const totalMins = items.reduce((s, d) => s + d.durationMins, 0)
    await updatePlan.mutateAsync({
      id: planId,
      name: name || 'Practice',
      duration_mins: totalMins || 60,
      drills: items,
      scheduled_date: date ?? null,
    })
  }

  if (isLoading) {
    return (
      <div>
        <PracticeSubNav />
        <div className="flex items-center justify-center py-24">
          <p className="text-sm" style={{ color: 'rgba(241,245,249,0.3)' }}>Loading…</p>
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div>
        <PracticeSubNav />
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <p className="text-sm" style={{ color: 'rgba(241,245,249,0.4)' }}>Plan not found</p>
          <button onClick={() => router.push('/practice')} className="text-sm" style={{ color: '#F7620A' }}>
            ← Back to Practice
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PracticeSubNav />
      <SplitBuilder
        initialName={plan.name}
        initialDate={plan.scheduled_date}
        initialDrills={plan.drills.map(d => ({ ...d, uid: d.uid || crypto.randomUUID() }))}
        isSaving={updatePlan.isPending}
        savedPlanId={planId}
        plan={plan}
        onSave={handleSave}
        onStartRun={() => router.push(`/practice/run?id=${planId}`)}
        onBack={() => router.push('/practice')}
      />
    </div>
  )
}
