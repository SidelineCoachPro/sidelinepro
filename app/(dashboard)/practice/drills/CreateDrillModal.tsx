'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateCustomDrill } from '@/hooks/useCustomDrills'
import { CATEGORY_LABELS } from '@/data/drills'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  category: z.enum(['ballhandling', 'shooting', 'passing', 'defense', 'conditioning', 'team']),
  duration_mins: z.number().min(1).max(120),
  players_needed: z.string(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'All levels']),
  description: z.string().min(10, 'Description is required'),
  setup: z.string().optional(),
  instructions: z.string().optional(),
  cues: z.string().optional(),
  progression: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const labelStyle = { color: 'rgba(241,245,249,0.6)', fontSize: '13px', fontWeight: 500 }

interface Props {
  onClose: () => void
}

export default function CreateDrillModal({ onClose }: Props) {
  const { mutateAsync, isPending } = useCreateCustomDrill()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      duration_mins: 10,
      players_needed: 'Full team',
      level: 'Intermediate',
    },
  })

  const onSubmit = async (data: FormData) => {
    const cuesArray = data.cues
      ? data.cues
          .split('\n')
          .map(c => c.trim())
          .filter(Boolean)
      : []

    await mutateAsync({
      name: data.name,
      category: data.category,
      duration_mins: data.duration_mins,
      players_needed: data.players_needed,
      level: data.level,
      description: data.description,
      setup: data.setup || null,
      instructions: data.instructions || null,
      cues: cuesArray,
      progression: data.progression || null,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: '#0E1520',
          border: '1px solid rgba(241,245,249,0.07)',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(241,245,249,0.07)' }}
        >
          <h2 className="text-base font-semibold text-sp-text">New Custom Drill</h2>
          <button
            onClick={onClose}
            className="text-lg leading-none hover:opacity-60 transition-opacity"
            style={{ color: 'rgba(241,245,249,0.4)' }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block mb-1.5" style={labelStyle}>Drill Name *</label>
            <input {...register('name')} className="sp-input" placeholder="e.g. 1-on-1 Wing Attack" />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
          </div>

          {/* Category + Level */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5" style={labelStyle}>Category *</label>
              <select {...register('category')} className="sp-input">
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val} style={{ backgroundColor: '#0E1520' }}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1.5" style={labelStyle}>Level *</label>
              <select {...register('level')} className="sp-input">
                {['Beginner', 'Intermediate', 'Advanced', 'All levels'].map(l => (
                  <option key={l} value={l} style={{ backgroundColor: '#0E1520' }}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration + Players */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5" style={labelStyle}>Duration (mins) *</label>
              <input {...register('duration_mins', { valueAsNumber: true })} type="number" min={1} max={120} className="sp-input" />
              {errors.duration_mins && <p className="mt-1 text-xs text-red-400">{errors.duration_mins.message}</p>}
            </div>
            <div>
              <label className="block mb-1.5" style={labelStyle}>Players Needed</label>
              <input {...register('players_needed')} className="sp-input" placeholder="Full team" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1.5" style={labelStyle}>Description *</label>
            <textarea
              {...register('description')}
              className="sp-input"
              rows={3}
              placeholder="What is this drill and what does it teach?"
              style={{ resize: 'vertical' }}
            />
            {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>}
          </div>

          {/* Setup */}
          <div>
            <label className="block mb-1.5" style={labelStyle}>Setup</label>
            <textarea
              {...register('setup')}
              className="sp-input"
              rows={2}
              placeholder="Equipment, court markings, player positions..."
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block mb-1.5" style={labelStyle}>Instructions</label>
            <textarea
              {...register('instructions')}
              className="sp-input"
              rows={3}
              placeholder="Step-by-step how to run the drill..."
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Cues */}
          <div>
            <label className="block mb-1.5" style={labelStyle}>
              Coaching Cues <span style={{ color: 'rgba(241,245,249,0.3)', fontWeight: 400 }}>(one per line)</span>
            </label>
            <textarea
              {...register('cues')}
              className="sp-input"
              rows={3}
              placeholder={'Eyes up, not on the ball\nStay low through the move\nAttack the basket'}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Progression */}
          <div>
            <label className="block mb-1.5" style={labelStyle}>Progression</label>
            <textarea
              {...register('progression')}
              className="sp-input"
              rows={2}
              placeholder="How to make this drill harder..."
              style={{ resize: 'vertical' }}
            />
          </div>
        </form>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(241,245,249,0.07)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{ color: 'rgba(241,245,249,0.5)' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-drill-form"
            disabled={isPending}
            onClick={handleSubmit(onSubmit)}
            className="px-5 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 transition-opacity"
            style={{ backgroundColor: '#F7620A', color: '#fff' }}
          >
            {isPending ? 'Saving...' : 'Save Drill'}
          </button>
        </div>
      </div>
    </div>
  )
}
