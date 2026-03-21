'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTeams, useUpdateTeam, useDeleteTeam, type Team } from '@/hooks/useTeams'
import { useTeam } from '@/lib/teamContext'

const PRESET_EMOJIS = ['🏀', '⚽', '🏈', '⚾', '🏐', '🎾', '🏒', '🥊', '🏆', '🔥', '⭐', '💪', '🦁', '🐯', '🦅', '🐻']
const PRESET_COLORS = ['#F7620A', '#3A86FF', '#0ECFB0', '#8B5CF6', '#F5B731', '#EF4444', '#22C55E', '#E879F9']

function EditTeamForm({
  team,
  onSave,
  onCancel,
}: {
  team: Team
  onSave: () => void
  onCancel: () => void
}) {
  const [name, setName]             = useState(team.name)
  const [emoji, setEmoji]           = useState(team.emoji)
  const [color, setColor]           = useState(team.color)
  const [ageGroup, setAgeGroup]     = useState(team.age_group ?? '')
  const [seasonYear, setSeasonYear] = useState(team.season_year ?? '')
  const [teamType, setTeamType]     = useState(team.team_type)
  const { mutateAsync: updateTeam, isPending } = useUpdateTeam()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await updateTeam({
      id:          team.id,
      name:        name.trim(),
      emoji,
      color,
      age_group:   ageGroup.trim() || null,
      season_year: seasonYear.trim() || null,
      team_type:   teamType,
    })
    onSave()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 pt-4" style={{ borderTop: '1px solid rgba(241,245,249,0.08)' }}>
      {/* Name */}
      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(241,245,249,0.45)' }}>Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full px-3 py-2 rounded-lg text-sm bg-transparent text-sp-text outline-none"
          style={{ border: '1px solid rgba(241,245,249,0.15)' }}
        />
      </div>

      {/* Emoji */}
      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(241,245,249,0.45)' }}>Icon</label>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_EMOJIS.map(e => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className="w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all"
              style={{
                backgroundColor: emoji === e ? 'rgba(247,98,10,0.15)' : 'rgba(241,245,249,0.05)',
                border: emoji === e ? '1px solid rgba(247,98,10,0.4)' : '1px solid rgba(241,245,249,0.08)',
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(241,245,249,0.45)' }}>Color</label>
        <div className="flex gap-2">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-6 h-6 rounded-full flex-shrink-0 transition-all"
              style={{
                backgroundColor: c,
                boxShadow: color === c ? `0 0 0 2px #0E1520, 0 0 0 3.5px ${c}` : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Age + Year */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(241,245,249,0.45)' }}>Age Group</label>
          <input
            value={ageGroup}
            onChange={e => setAgeGroup(e.target.value)}
            placeholder="e.g. U12"
            className="w-full px-3 py-2 rounded-lg text-sm bg-transparent text-sp-text outline-none"
            style={{ border: '1px solid rgba(241,245,249,0.15)' }}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(241,245,249,0.45)' }}>Season Year</label>
          <input
            value={seasonYear}
            onChange={e => setSeasonYear(e.target.value)}
            placeholder="e.g. 2025-26"
            className="w-full px-3 py-2 rounded-lg text-sm bg-transparent text-sp-text outline-none"
            style={{ border: '1px solid rgba(241,245,249,0.15)' }}
          />
        </div>
      </div>

      {/* Type */}
      <div>
        <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(241,245,249,0.45)' }}>Type</label>
        <select
          value={teamType}
          onChange={e => setTeamType(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm text-sp-text outline-none"
          style={{ backgroundColor: '#080C12', border: '1px solid rgba(241,245,249,0.15)' }}
        >
          <option value="rec">Rec</option>
          <option value="aau">AAU</option>
          <option value="school">School</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl text-sm font-medium"
          style={{ backgroundColor: 'rgba(241,245,249,0.05)', color: 'rgba(241,245,249,0.45)' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-40"
          style={{ backgroundColor: color }}
        >
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

export default function TeamsSettingsPage() {
  const { data: teams = [], isLoading } = useTeams()
  const { activeTeamId, setActiveTeamId } = useTeam()
  const { mutateAsync: deleteTeam, isPending: isDeleting } = useDeleteTeam()
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    await deleteTeam(id)
    if (activeTeamId === id) setActiveTeamId(null)
    setDeletingId(null)
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-sp-text">Your Teams</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(241,245,249,0.4)' }}>
            Manage your teams and switch between them in the navigation.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-medium transition-opacity hover:opacity-75"
          style={{ color: 'rgba(241,245,249,0.4)' }}
        >
          ← Back
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="rounded-2xl h-20 animate-pulse" style={{ backgroundColor: '#0E1520' }} />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div
          className="rounded-2xl p-6 text-center"
          style={{ backgroundColor: '#0E1520', border: '1px solid rgba(241,245,249,0.07)' }}
        >
          <p className="text-2xl mb-2">🏀</p>
          <p className="text-base font-semibold text-sp-text mb-1">No teams yet</p>
          <p className="text-sm" style={{ color: 'rgba(241,245,249,0.4)' }}>
            Add your first team using the team switcher in the navigation bar.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map(team => (
            <div
              key={team.id}
              className="rounded-2xl p-4"
              style={{
                backgroundColor: '#0E1520',
                border: '1px solid rgba(241,245,249,0.07)',
                borderLeft: `3px solid ${team.color}`,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Team info */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl flex-shrink-0">{team.emoji}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-base font-bold text-sp-text truncate">{team.name}</p>
                      {activeTeamId === team.id && (
                        <span
                          className="text-xs px-2 py-0.5 rounded font-semibold flex-shrink-0"
                          style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E' }}
                        >
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(241,245,249,0.35)' }}>
                      {team.team_type}
                      {team.age_group ? ` · ${team.age_group}` : ''}
                      {team.season_year ? ` · ${team.season_year}` : ''}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {activeTeamId !== team.id && (
                    <button
                      onClick={() => setActiveTeamId(team.id)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                      style={{ backgroundColor: `${team.color}18`, color: team.color, border: `1px solid ${team.color}30` }}
                    >
                      Switch
                    </button>
                  )}
                  <button
                    onClick={() => setEditingId(editingId === team.id ? null : team.id)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                    style={{ backgroundColor: 'rgba(241,245,249,0.05)', color: 'rgba(241,245,249,0.6)', border: '1px solid rgba(241,245,249,0.1)' }}
                  >
                    {editingId === team.id ? 'Cancel' : 'Edit'}
                  </button>
                  <button
                    onClick={() => setDeletingId(deletingId === team.id ? null : team.id)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                    style={{ backgroundColor: 'rgba(239,68,68,0.07)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.15)' }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Edit form */}
              {editingId === team.id && (
                <EditTeamForm
                  team={team}
                  onSave={() => setEditingId(null)}
                  onCancel={() => setEditingId(null)}
                />
              )}

              {/* Delete confirmation */}
              {deletingId === team.id && (
                <div
                  className="mt-3 p-3 rounded-xl"
                  style={{ backgroundColor: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)' }}
                >
                  <p className="text-sm text-sp-text mb-3">
                    Delete <strong>{team.name}</strong>? Players and practice plans linked to this team will remain but become unassigned.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeletingId(null)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium"
                      style={{ backgroundColor: 'rgba(241,245,249,0.05)', color: 'rgba(241,245,249,0.5)' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(team.id)}
                      disabled={isDeleting}
                      className="flex-1 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-40"
                      style={{ backgroundColor: '#EF4444' }}
                    >
                      {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
