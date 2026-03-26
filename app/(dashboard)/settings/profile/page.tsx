'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import { useProfile, useUpdateProfile, useUploadAvatar, useDeleteAvatar } from '@/hooks/useProfile'
import { useAIUsage } from '@/hooks/useAIUsage'
import { processAvatar } from '@/lib/imageUtils'

/* ── helpers ─────────────────────────────────────────────────────────────── */
const AVATAR_COLORS = ['#3A86FF','#F7620A','#0ECFB0','#8B5CF6','#F5B731','#E879F9','#22C55E','#EF4444']
function avatarColor(id: string) {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function nameInitials(name: string | null, email: string) {
  if (name?.trim()) {
    const p = name.trim().split(' ')
    return (p[0][0] + (p[1]?.[0] ?? '')).toUpperCase()
  }
  return email[0]?.toUpperCase() ?? '?'
}

/* ── SectionCard ─────────────────────────────────────────────────────────── */
function SectionCard({ title, accent, children }: { title: string; accent?: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-6 mb-6"
      style={{
        backgroundColor: '#0E1520',
        border: '1px solid rgba(241,245,249,0.07)',
        borderLeft: accent ? `3px solid ${accent}` : undefined,
      }}
    >
      <h2 className="text-base font-bold text-sp-text mb-5">{title}</h2>
      {children}
    </div>
  )
}

/* ── Toast ───────────────────────────────────────────────────────────────── */
function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t) }, [onDone])
  return (
    <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl" style={{ backgroundColor: '#22C55E', color: '#fff' }}>
      {msg}
    </div>
  )
}

/* ── main page ───────────────────────────────────────────────────────────── */
export default function ProfileSettingsPage() {
  const router = useRouter()
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const uploadAvatar  = useUploadAvatar()
  const deleteAvatar  = useDeleteAvatar()
  const { data: aiUsage } = useAIUsage()

  // Photo state
  const fileInputRef   = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview]       = useState<{ file: File; url: string } | null>(null)
  const [removeConfirm, setRemoveConfirm] = useState(false)

  // Form state
  const [displayName, setDisplayName] = useState('')
  const [fullName, setFullName]       = useState('')
  const [bio, setBio]                 = useState('')
  const [dirty, setDirty]             = useState(false)

  // PDF toggle
  const [showInPdf, setShowInPdf] = useState(true)

  // Toast
  const [toast, setToast] = useState('')

  // Sync form when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? '')
      setFullName(profile.fullName ?? '')
      setBio(profile.bio ?? '')
      setShowInPdf(profile.showPhotoInPdfs)
    }
  }, [profile])

  async function handleFileSelect(file: File) {
    try {
      const processed = await processAvatar(file)
      const url = URL.createObjectURL(processed)
      setPreview({ file: processed, url })
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Could not process image')
    }
  }

  async function handleSavePhoto() {
    if (!preview) return
    try {
      await uploadAvatar.mutateAsync(preview.file)
      URL.revokeObjectURL(preview.url)
      setPreview(null)
      setToast('Profile photo updated')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : JSON.stringify(e)
      alert('Upload failed: ' + msg)
    }
  }

  function cancelPreview() {
    if (preview) URL.revokeObjectURL(preview.url)
    setPreview(null)
  }

  async function handleRemovePhoto() {
    await deleteAvatar.mutateAsync()
    setRemoveConfirm(false)
    setToast('Profile photo removed')
  }

  async function handleSaveProfile() {
    await updateProfile.mutateAsync({ displayName: displayName || null, fullName: fullName || null, bio: bio || null })
    setDirty(false)
    setToast('Profile saved')
  }

  async function handlePdfToggle(val: boolean) {
    setShowInPdf(val)
    await updateProfile.mutateAsync({ showPhotoInPdfs: val })
    setToast(val ? 'Photo will appear in PDFs' : 'Photo hidden from PDFs')
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <p className="text-sm" style={{ color: 'rgba(241,245,249,0.3)' }}>Loading…</p>
      </div>
    )
  }

  const initials   = nameInitials(profile?.displayName ?? profile?.fullName ?? null, profile?.email ?? '')
  const accentColor = avatarColor(profile?.id ?? '')
  const avatarSrc  = preview?.url ?? profile?.avatarUrl ?? null

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.back()} className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'rgba(241,245,249,0.4)' }}>
          ←
        </button>
        <span className="text-sm font-bold text-sp-text">Profile Settings</span>
      </div>

      {/* ── 1. Photo ─────────────────────────────────────────────── */}
      <SectionCard title="📷 Profile Photo">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Profile"
                className="rounded-full object-cover"
                style={{ width: 96, height: 96, border: `2px solid ${accentColor}30` }}
              />
            ) : (
              <div
                className="rounded-full flex items-center justify-center text-2xl font-bold text-white"
                style={{ width: 96, height: 96, backgroundColor: accentColor }}
              >
                {initials}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex-1">
            {preview ? (
              /* Preview confirmation */
              <div>
                <p className="text-xs mb-3" style={{ color: 'rgba(241,245,249,0.5)' }}>
                  Preview — center-cropped to square
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleSavePhoto}
                    disabled={uploadAvatar.isPending}
                    className="px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 transition-opacity hover:opacity-85"
                    style={{ backgroundColor: '#F7620A', color: '#fff' }}
                  >
                    {uploadAvatar.isPending ? 'Saving…' : 'Save Photo'}
                  </button>
                  <button
                    onClick={cancelPreview}
                    className="px-4 py-2 text-sm rounded-lg transition-opacity hover:opacity-70"
                    style={{ backgroundColor: 'rgba(241,245,249,0.06)', color: 'rgba(241,245,249,0.5)' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-sm rounded-lg transition-all hover:opacity-80"
                    style={{ backgroundColor: 'rgba(241,245,249,0.08)', color: 'rgba(241,245,249,0.7)', border: '1px solid rgba(241,245,249,0.1)' }}
                  >
                    📁 Upload Photo
                  </button>
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-4 py-2 text-sm rounded-lg transition-all hover:opacity-80"
                    style={{ backgroundColor: 'rgba(241,245,249,0.08)', color: 'rgba(241,245,249,0.7)', border: '1px solid rgba(241,245,249,0.1)' }}
                  >
                    📷 Take Photo
                  </button>
                </div>
                <p className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>
                  JPG, PNG or WebP · max 5 MB · auto-cropped to square
                </p>
                {profile?.avatarUrl && !removeConfirm && (
                  <button
                    onClick={() => setRemoveConfirm(true)}
                    className="text-xs hover:opacity-70 transition-opacity"
                    style={{ color: '#EF4444' }}
                  >
                    🗑 Remove Photo
                  </button>
                )}
                {removeConfirm && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'rgba(241,245,249,0.5)' }}>Remove your profile photo?</span>
                    <button
                      onClick={handleRemovePhoto}
                      disabled={deleteAvatar.isPending}
                      className="text-xs px-2.5 py-1 rounded font-semibold disabled:opacity-50"
                      style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
                    >
                      Remove
                    </button>
                    <button onClick={() => setRemoveConfirm(false)} className="text-xs" style={{ color: 'rgba(241,245,249,0.35)' }}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) { handleFileSelect(f); e.target.value = '' } }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) { handleFileSelect(f); e.target.value = '' } }}
        />
      </SectionCard>

      {/* ── 2. Profile Info ──────────────────────────────────────── */}
      <SectionCard title="👤 Profile Info">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(241,245,249,0.45)' }}>
              Display Name
            </label>
            <input
              value={displayName}
              onChange={e => { setDisplayName(e.target.value); setDirty(true) }}
              placeholder="e.g. Coach Brian"
              className="w-full sp-input"
            />
            <p className="text-xs mt-1" style={{ color: 'rgba(241,245,249,0.3)' }}>
              Used in PDFs, parent messages, and the nav bar
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(241,245,249,0.45)' }}>
              Full Name
            </label>
            <input
              value={fullName}
              onChange={e => { setFullName(e.target.value); setDirty(true) }}
              placeholder="e.g. Brian Johnson"
              className="w-full sp-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(241,245,249,0.45)' }}>
              Email
            </label>
            <input
              value={profile?.email ?? ''}
              readOnly
              className="w-full sp-input"
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(241,245,249,0.45)' }}>
              Bio <span style={{ color: 'rgba(241,245,249,0.3)', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              value={bio}
              onChange={e => { if (e.target.value.length <= 200) { setBio(e.target.value); setDirty(true) } }}
              placeholder='e.g. "Head coach, Lincoln Rec U12"'
              rows={3}
              className="w-full sp-input"
              style={{ resize: 'vertical' }}
            />
            <p className="text-xs mt-1 text-right" style={{ color: bio.length > 180 ? '#F5B731' : 'rgba(241,245,249,0.3)' }}>
              {bio.length} / 200
            </p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSaveProfile}
              disabled={updateProfile.isPending || !dirty}
              className="px-5 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 transition-opacity hover:opacity-85"
              style={{ backgroundColor: '#F7620A', color: '#fff' }}
            >
              {updateProfile.isPending ? 'Saving…' : 'Save Changes'}
            </button>
            {dirty && (
              <span className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>Unsaved changes</span>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── 3. PDF Settings ─────────────────────────────────────── */}
      <SectionCard title="📄 PDF Export Settings" accent="#0ECFB0">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-sm font-semibold text-sp-text mb-1">Include my photo in PDFs</p>
            <p className="text-xs" style={{ color: 'rgba(241,245,249,0.4)' }}>
              Your profile photo appears in the header of practice plan and development plan PDFs.
            </p>
          </div>
          {/* Toggle */}
          <button
            onClick={() => handlePdfToggle(!showInPdf)}
            className="flex-shrink-0 relative w-12 h-6 rounded-full transition-colors"
            style={{ backgroundColor: showInPdf ? '#0ECFB0' : 'rgba(241,245,249,0.15)' }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
              style={{ transform: showInPdf ? 'translateX(26px)' : 'translateX(2px)' }}
            />
          </button>
        </div>

        {/* Mini PDF header preview */}
        <div
          className="rounded-lg p-3"
          style={{ backgroundColor: '#F8F9FA', border: '1px solid #E2E8F0' }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: '#64748B' }}>Preview</p>
          <div className="flex items-center justify-between px-2 py-2 rounded" style={{ backgroundColor: '#fff', border: '1px solid #E2E8F0' }}>
            <div className="flex items-center gap-2">
              {showInPdf && avatarSrc ? (
                <img src={avatarSrc} alt="" className="rounded-full object-cover flex-shrink-0" style={{ width: 32, height: 32 }} />
              ) : showInPdf && !avatarSrc ? (
                <div className="rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ width: 32, height: 32, backgroundColor: accentColor }}>
                  {initials}
                </div>
              ) : null}
              <div>
                <p className="text-xs font-bold" style={{ color: '#F7620A' }}>SidelinePro</p>
                <p className="text-xs" style={{ color: '#94A3B8', fontSize: 9 }}>sidelinecoachpro.com</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: '#64748B', fontSize: 9 }}>{profile?.displayName ?? profile?.fullName ?? 'Coach'}</p>
              <p className="text-xs" style={{ color: '#94A3B8', fontSize: 9 }}>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
          {!avatarSrc && showInPdf && (
            <p className="text-xs mt-2" style={{ color: '#94A3B8' }}>Upload a profile photo above to see it here</p>
          )}
        </div>
      </SectionCard>

      {/* ── 4. AI Usage ─────────────────────────────────────────── */}
      <SectionCard title="🤖 AI Usage" accent="#3A86FF">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'rgba(58,134,255,0.06)', border: '1px solid rgba(58,134,255,0.2)' }}>
              <p className="text-3xl font-bold" style={{ color: '#3A86FF' }}>{aiUsage?.thisMonth ?? 0}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(241,245,249,0.4)' }}>This Month</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'rgba(241,245,249,0.04)', border: '1px solid rgba(241,245,249,0.08)' }}>
              <p className="text-3xl font-bold text-sp-text">{aiUsage?.total ?? 0}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(241,245,249,0.4)' }}>Total Calls</p>
            </div>
          </div>

          {aiUsage && Object.keys(aiUsage.byFeature).length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(241,245,249,0.3)' }}>By Feature</p>
              <div className="space-y-1.5">
                {Object.entries(aiUsage.byFeature)
                  .sort((a, b) => b[1] - a[1])
                  .map(([feature, count]) => {
                    const label = ({
                      practice: 'Practice Builder',
                      devplan: 'Dev Plan',
                      suggest: 'Drill Suggestions',
                      weekly_arc: 'Weekly Arc',
                      assessment: 'Mid-Season Assessment',
                      eval_insights: 'Eval Insights',
                    }[feature] ?? feature)
                    return (
                      <div key={feature} className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'rgba(241,245,249,0.55)' }}>{label}</span>
                        <span className="text-xs font-semibold" style={{ color: '#3A86FF' }}>{count}</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {(!aiUsage || aiUsage.total === 0) && (
            <p className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>
              No AI features used yet. Try the AI Practice Builder or Dev Plan generator!
            </p>
          )}
        </div>
      </SectionCard>

      {/* ── 5. Account ──────────────────────────────────────────── */}
      <SectionCard title="⚙️ Account Settings">
        <div className="space-y-3">
          <div>
            <a href="/forgot-password" className="text-sm hover:opacity-70 transition-opacity" style={{ color: '#3A86FF' }}>
              Change password →
            </a>
          </div>
          <div style={{ borderTop: '1px solid rgba(241,245,249,0.07)', paddingTop: 12 }}>
            <form action={signOut}>
              <button type="submit" className="text-sm hover:opacity-70 transition-opacity" style={{ color: '#F7620A' }}>
                Sign out of all devices
              </button>
            </form>
          </div>
          <div style={{ borderTop: '1px solid rgba(241,245,249,0.07)', paddingTop: 12 }}>
            <p className="text-xs" style={{ color: 'rgba(241,245,249,0.3)' }}>
              To delete your account, contact{' '}
              <span style={{ color: 'rgba(241,245,249,0.5)' }}>support@sidelinecoachpro.com</span>
            </p>
          </div>
        </div>
      </SectionCard>

      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
    </div>
  )
}
