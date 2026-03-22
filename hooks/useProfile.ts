import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface CoachProfile {
  id: string
  email: string
  fullName: string | null
  displayName: string | null
  avatarUrl: string | null
  showPhotoInPdfs: boolean
  bio: string | null
}

const supabase = createClient()

async function getAuthUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export function useProfile() {
  return useQuery({
    queryKey: ['coach_profile'],
    queryFn: async (): Promise<CoachProfile | null> => {
      const user = await getAuthUser()
      if (!user) return null

      const { data } = await supabase
        .from('coaches')
        .select('full_name, display_name, avatar_url, show_photo_in_pdfs, bio')
        .eq('id', user.id)
        .maybeSingle()

      return {
        id: user.id,
        email: user.email ?? '',
        fullName: data?.full_name ?? null,
        displayName: data?.display_name ?? null,
        avatarUrl: data?.avatar_url ?? null,
        showPhotoInPdfs: data?.show_photo_in_pdfs ?? true,
        bio: data?.bio ?? null,
      }
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (updates: {
      fullName?: string | null
      displayName?: string | null
      bio?: string | null
      showPhotoInPdfs?: boolean
    }) => {
      const user = await getAuthUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('coaches')
        .upsert({
          id: user.id,
          email: user.email ?? '',
          full_name: updates.fullName,
          display_name: updates.displayName,
          bio: updates.bio,
          show_photo_in_pdfs: updates.showPhotoInPdfs,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coach_profile'] }),
  })
}

export function useUploadAvatar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (processedFile: File) => {
      const user = await getAuthUser()
      if (!user) throw new Error('Not authenticated')

      const path = `${user.id}/avatar.jpg`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, processedFile, { upsert: true, contentType: 'image/jpeg' })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = `${publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase
        .from('coaches')
        .upsert({ id: user.id, email: user.email ?? '', avatar_url: url, updated_at: new Date().toISOString() }, { onConflict: 'id' })
      if (updateError) throw updateError

      return url
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coach_profile'] }),
  })
}

export function useDeleteAvatar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const user = await getAuthUser()
      if (!user) throw new Error('Not authenticated')
      await supabase.storage.from('avatars').remove([`${user.id}/avatar.jpg`])
      const { error } = await supabase
        .from('coaches')
        .upsert({ id: user.id, email: user.email ?? '', avatar_url: null, updated_at: new Date().toISOString() }, { onConflict: 'id' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coach_profile'] }),
  })
}
