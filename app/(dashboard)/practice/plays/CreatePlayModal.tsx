'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateCustomPlay } from '@/hooks/useCustomPlays'
import { PLAY_CATEGORY_LABELS, PLAY_DIFFICULTY_LABELS } from '@/data/plays'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  category: z.enum(['halfcourt', 'inbounds', 'defense', 'special', 'transition', 'timeout']),
  difficulty: z.enum(['beg', 'int', 'adv']),
  type: z.string().min(1, 'Type is required'),
  description: z.string().min(10, 'Description is required'),
  teaching_keys: z.string().optional(),
  steps: z.string().optional(),
  suggested_duration_mins: z.number().min(1).max(60),
})

type FormData = z.infer<typeof schema>

const labelStyle = { color: 'rgba(241,245,249,0.6)', fontSize: '13px', fontWeight: 500 }

interface Props { onClose: () => void }

export default function CreatePlayModal({ onClose }: Props) {
  const { mutateAsync, isPending } = useCreateCustomPlay()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'halfcourt',
      difficulty: 'int',
      type: 'Custom',
      suggested_duration_mins: 12,
    },
  })

  const onSubmit = async (data: FormData) => {
    const toLines = (s?: string) => s ? s.split('\n').map(l => l.trim()).filter(Boolean) : []
    await mutateAsync({
      name: data.name,
      category: data.category,
      difficulty: data.difficulty,
      type: data.type,
      description: data.description,
      teaching_keys: toLines(data.teaching_keys),
      steps: toLines(data.steps),
      suggested_duration_mins: data.suggested_duration_mins,
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
        style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)', maxHeight: '90vh' }}
      >
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(241,245,249,0.07)' }}>
          <h2 className="text-base font-semibold text-sp-text">New Custom Play</h2>
          <button onClick={onClose} className="text-lg leading-none hover:opacity-60 transition-opacity" style={{ color: 'rgba(241,245,249,0.4)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div>
            <label className="block mb-1.5" style={labelStyle}>Play Name *</label>
            <input {...register('name')} className="sp-input" placeholder="e.g. Horns Set" />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5" style={labelStyle}>Category *</label>
              <select {...register('category')} className="sp-input">
                {Object.entries(PLAY_CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val} style={{ backgroundColor: '#0E1520' }}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1.5" style={labelStyle}>Difficulty *</label>
              <select {...register('difficulty')} className="sp-input">
                {Object.entries(PLAY_DIFFICULTY_LABELS).map(([val, label]) => (
                  <option key={val} value={val} style={{ backgroundColor: '#0E1520' }}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5" style={labelStyle}>Play Type *</label>
              <input {...register('type')} className="sp-input" placeholder="e.g. Set Play, BLOB, Zone Action" />
              {errors.type && <p className="mt-1 text-xs text-red-400">{errors.type.message}</p>}
            </div>
            <div>
              <label className="block mb-1.5" style={labelStyle}>Duration (min) *</label>
              <input {...register('suggested_duration_mins', { valueAsNumber: true })} type="number" min={1} max={60} className="sp-input" />
            </div>
          </div>

          <div>
            <label className="block mb-1.5" style={labelStyle}>Description *</label>
            <textarea {...register('description')} className="sp-input" rows={3} placeholder="What is this play and when do you use it?" style={{ resize: 'vertical' }} />
            {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>}
          </div>

          <div>
            <label className="block mb-1.5" style={labelStyle}>
              Play Steps <span style={{ color: 'rgba(241,245,249,0.3)', fontWeight: 400 }}>(one per line)</span>
            </label>
            <textarea
              {...register('steps')}
              className="sp-input"
              rows={4}
              placeholder={'1 passes to 4 at the elbow\n4 sets a ball screen for 2\n2 reads the screen and attacks'}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div>
            <label className="block mb-1.5" style={labelStyle}>
              Teaching Keys <span style={{ color: 'rgba(241,245,249,0.3)', fontWeight: 400 }}>(one per line)</span>
            </label>
            <textarea
              {...register('teaching_keys')}
              className="sp-input"
              rows={3}
              placeholder={'Set a hard screen before cutting\nRead the defender — shoot or drive'}
              style={{ resize: 'vertical' }}
            />
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(241,245,249,0.07)' }}>
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg" style={{ color: 'rgba(241,245,249,0.5)' }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isPending}
            className="px-5 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 transition-opacity hover:opacity-85"
            style={{ backgroundColor: '#3A86FF', color: '#fff' }}
          >
            {isPending ? 'Saving...' : 'Save Play'}
          </button>
        </div>
      </div>
    </div>
  )
}
