'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateCustomGame } from '@/hooks/useCustomGames'
import { GAME_CATEGORY_LABELS } from '@/data/practiceGames'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  category: z.enum(['ballhandling', 'shooting', 'competitive', 'defense', 'warmup', 'team']),
  duration_mins: z.number().min(1).max(120),
  players_min: z.number().min(2).max(50),
  players_max: z.number().min(2).max(50),
  energy_level: z.enum(['Low', 'Medium', 'High', 'Very High']),
  skill_focus: z.string().optional(),
  description: z.string().min(10, 'Description is required'),
  setup: z.string().optional(),
  how_to_play: z.string().optional(),
  coaching_tips: z.string().optional(),
  variations: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const labelStyle = { color: 'rgba(241,245,249,0.6)', fontSize: '13px', fontWeight: 500 }

interface Props { onClose: () => void }

export default function CreateGameModal({ onClose }: Props) {
  const { mutateAsync, isPending } = useCreateCustomGame()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      duration_mins: 10,
      players_min: 4,
      players_max: 16,
      energy_level: 'High',
      category: 'competitive',
    },
  })

  const onSubmit = async (data: FormData) => {
    const toLines = (s?: string) => s ? s.split('\n').map(l => l.trim()).filter(Boolean) : []
    await mutateAsync({
      name: data.name,
      category: data.category,
      duration_mins: data.duration_mins,
      players_min: data.players_min,
      players_max: data.players_max,
      energy_level: data.energy_level,
      skill_focus: toLines(data.skill_focus),
      description: data.description,
      setup: data.setup || null,
      how_to_play: data.how_to_play || null,
      coaching_tips: toLines(data.coaching_tips),
      variations: toLines(data.variations),
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
          <h2 className="text-base font-semibold text-sp-text">New Custom Game</h2>
          <button onClick={onClose} className="text-lg leading-none hover:opacity-60 transition-opacity" style={{ color: 'rgba(241,245,249,0.4)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div>
            <label className="block mb-1.5" style={labelStyle}>Game Name *</label>
            <input {...register('name')} className="sp-input" placeholder="e.g. 3-on-3 King of the Court" />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5" style={labelStyle}>Category *</label>
              <select {...register('category')} className="sp-input">
                {Object.entries(GAME_CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val} style={{ backgroundColor: '#0E1520' }}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1.5" style={labelStyle}>Energy Level *</label>
              <select {...register('energy_level')} className="sp-input">
                {['Low', 'Medium', 'High', 'Very High'].map(l => (
                  <option key={l} value={l} style={{ backgroundColor: '#0E1520' }}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block mb-1.5" style={labelStyle}>Duration (min) *</label>
              <input {...register('duration_mins', { valueAsNumber: true })} type="number" min={1} max={120} className="sp-input" />
            </div>
            <div>
              <label className="block mb-1.5" style={labelStyle}>Min Players</label>
              <input {...register('players_min', { valueAsNumber: true })} type="number" min={2} max={50} className="sp-input" />
            </div>
            <div>
              <label className="block mb-1.5" style={labelStyle}>Max Players</label>
              <input {...register('players_max', { valueAsNumber: true })} type="number" min={2} max={50} className="sp-input" />
            </div>
          </div>

          <div>
            <label className="block mb-1.5" style={labelStyle}>
              Skill Focus <span style={{ color: 'rgba(241,245,249,0.3)', fontWeight: 400 }}>(one per line)</span>
            </label>
            <textarea {...register('skill_focus')} className="sp-input" rows={2} placeholder={'Ball Handling\nCompetition'} style={{ resize: 'vertical' }} />
          </div>

          <div>
            <label className="block mb-1.5" style={labelStyle}>Description *</label>
            <textarea {...register('description')} className="sp-input" rows={3} placeholder="What is this game and what does it teach?" style={{ resize: 'vertical' }} />
            {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>}
          </div>

          <div>
            <label className="block mb-1.5" style={labelStyle}>Setup</label>
            <textarea {...register('setup')} className="sp-input" rows={2} placeholder="Court area, equipment, starting positions..." style={{ resize: 'vertical' }} />
          </div>

          <div>
            <label className="block mb-1.5" style={labelStyle}>How to Play</label>
            <textarea {...register('how_to_play')} className="sp-input" rows={3} placeholder="Rules and how the game works..." style={{ resize: 'vertical' }} />
          </div>

          <div>
            <label className="block mb-1.5" style={labelStyle}>
              Coaching Tips <span style={{ color: 'rgba(241,245,249,0.3)', fontWeight: 400 }}>(one per line)</span>
            </label>
            <textarea {...register('coaching_tips')} className="sp-input" rows={3} placeholder={'Shrink the area as players are eliminated\nRequire weak-hand dribbling'} style={{ resize: 'vertical' }} />
          </div>

          <div>
            <label className="block mb-1.5" style={labelStyle}>
              Variations <span style={{ color: 'rgba(241,245,249,0.3)', fontWeight: 400 }}>(one per line, optional)</span>
            </label>
            <textarea {...register('variations')} className="sp-input" rows={2} placeholder="Two-ball version..." style={{ resize: 'vertical' }} />
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
            style={{ backgroundColor: '#0ECFB0', color: '#0A1019' }}
          >
            {isPending ? 'Saving...' : 'Save Game'}
          </button>
        </div>
      </div>
    </div>
  )
}
