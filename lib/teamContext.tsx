'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface TeamContextValue {
  activeTeamId: string | null
  setActiveTeamId: (id: string | null) => void
}

const TeamContext = createContext<TeamContextValue>({
  activeTeamId: null,
  setActiveTeamId: () => {},
})

const STORAGE_KEY = 'sidelinepro_active_team_id'

export function TeamProvider({ children }: { children: ReactNode }) {
  const [activeTeamId, setActiveTeamIdState] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setActiveTeamIdState(stored)
  }, [])

  function setActiveTeamId(id: string | null) {
    setActiveTeamIdState(id)
    if (id) {
      localStorage.setItem(STORAGE_KEY, id)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return (
    <TeamContext.Provider value={{ activeTeamId, setActiveTeamId }}>
      {children}
    </TeamContext.Provider>
  )
}

export function useTeam() {
  return useContext(TeamContext)
}
