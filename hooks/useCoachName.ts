import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useCoachName() {
  const [name, setName] = useState('')
  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata
      setName(meta?.full_name ?? meta?.name ?? data.user?.email?.split('@')[0] ?? '')
    })
  }, [])
  return name
}
