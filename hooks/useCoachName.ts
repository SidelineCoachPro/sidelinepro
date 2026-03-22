import { useProfile } from './useProfile'

export function useCoachName(): string {
  const { data: profile } = useProfile()
  if (!profile) return ''
  return (
    profile.displayName ??
    profile.fullName?.split(' ')[0] ??
    profile.email.split('@')[0] ??
    ''
  )
}
