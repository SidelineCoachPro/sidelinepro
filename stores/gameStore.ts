import { create } from 'zustand'

export const QUARTER_SECONDS = 480 // 8:00

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export type GameEvent = {
  id: string
  type: 'score' | 'sub' | 'foul'
  quarter: number
  clockSeconds: number
  timeStr: string
  // score
  team?: 'us' | 'them'
  points?: 1 | 2 | 3
  // sub
  outPlayerId?: string
  inPlayerId?: string
  // foul
  foulPlayerId?: string
  foulNumber?: number
  description: string
}

function makeId() {
  return Math.random().toString(36).slice(2, 9)
}

interface GameState {
  gameId: string | null
  ourScore: number
  opponentScore: number
  currentQuarter: 1 | 2 | 3 | 4
  clockSeconds: number
  clockRunning: boolean
  activeLineup: (string | null)[]
  gameLog: GameEvent[]
  playerFouls: Record<string, number>
  isEnded: boolean
}

interface GameActions {
  initGame: (gameId: string, lineup: (string | null)[]) => void
  addScore: (team: 'us' | 'them', points: 1 | 2 | 3) => void
  undoLastScore: () => void
  nextQuarter: () => void
  toggleClock: () => void
  tickClock: () => void
  substitutePlayers: (outId: string, inId: string) => void
  addFoul: (playerId: string) => void
  removeFoul: (playerId: string) => void
  undoEvent: (eventId: string) => void
  endGame: () => void
}

export const useGameStore = create<GameState & GameActions>()((set, get) => ({
  gameId: null,
  ourScore: 0,
  opponentScore: 0,
  currentQuarter: 1,
  clockSeconds: QUARTER_SECONDS,
  clockRunning: false,
  activeLineup: Array(5).fill(null),
  gameLog: [],
  playerFouls: {},
  isEnded: false,

  initGame: (gameId, lineup) => set({
    gameId,
    ourScore: 0,
    opponentScore: 0,
    currentQuarter: 1,
    clockSeconds: QUARTER_SECONDS,
    clockRunning: false,
    activeLineup: lineup,
    gameLog: [],
    playerFouls: {},
    isEnded: false,
  }),

  addScore: (team, points) => set(state => {
    const timeStr = formatClock(state.clockSeconds)
    const event: GameEvent = {
      id: makeId(),
      type: 'score',
      quarter: state.currentQuarter,
      clockSeconds: state.clockSeconds,
      timeStr,
      team,
      points,
      description: `Q${state.currentQuarter} ${timeStr} — ${team === 'us' ? 'Your team' : 'Opponent'} +${points}`,
    }
    return {
      ourScore: team === 'us' ? state.ourScore + points : state.ourScore,
      opponentScore: team === 'them' ? state.opponentScore + points : state.opponentScore,
      gameLog: [...state.gameLog, event],
    }
  }),

  undoLastScore: () => set(state => {
    const lastIdx = [...state.gameLog].map((e, i) => ({ e, i })).reverse().find(({ e }) => e.type === 'score')
    if (!lastIdx) return state
    const ev = lastIdx.e
    return {
      ourScore: ev.team === 'us' ? Math.max(0, state.ourScore - (ev.points ?? 0)) : state.ourScore,
      opponentScore: ev.team === 'them' ? Math.max(0, state.opponentScore - (ev.points ?? 0)) : state.opponentScore,
      gameLog: state.gameLog.filter((_, i) => i !== lastIdx.i),
    }
  }),

  nextQuarter: () => set(state => {
    if (state.currentQuarter >= 4) return state
    return {
      currentQuarter: (state.currentQuarter + 1) as 1 | 2 | 3 | 4,
      clockSeconds: QUARTER_SECONDS,
      clockRunning: false,
    }
  }),

  toggleClock: () => set(state => ({ clockRunning: !state.clockRunning })),

  tickClock: () => set(state => {
    if (!state.clockRunning) return state
    if (state.clockSeconds <= 0) return { clockRunning: false }
    return { clockSeconds: state.clockSeconds - 1 }
  }),

  substitutePlayers: (outId, inId) => set(state => {
    const newLineup = [...state.activeLineup]
    const idx = newLineup.indexOf(outId)
    if (idx !== -1) newLineup[idx] = inId
    const timeStr = formatClock(state.clockSeconds)
    const event: GameEvent = {
      id: makeId(),
      type: 'sub',
      quarter: state.currentQuarter,
      clockSeconds: state.clockSeconds,
      timeStr,
      outPlayerId: outId,
      inPlayerId: inId,
      description: `Q${state.currentQuarter} ${timeStr} — Substitution`,
    }
    return { activeLineup: newLineup, gameLog: [...state.gameLog, event] }
  }),

  addFoul: (playerId) => set(state => {
    const current = state.playerFouls[playerId] ?? 0
    if (current >= 5) return state
    const newCount = current + 1
    const timeStr = formatClock(state.clockSeconds)
    const event: GameEvent = {
      id: makeId(),
      type: 'foul',
      quarter: state.currentQuarter,
      clockSeconds: state.clockSeconds,
      timeStr,
      foulPlayerId: playerId,
      foulNumber: newCount,
      description: `Q${state.currentQuarter} ${timeStr} — Foul #${newCount}`,
    }
    return {
      playerFouls: { ...state.playerFouls, [playerId]: newCount },
      gameLog: [...state.gameLog, event],
    }
  }),

  removeFoul: (playerId) => set(state => {
    const current = state.playerFouls[playerId] ?? 0
    if (current <= 0) return state
    return { playerFouls: { ...state.playerFouls, [playerId]: current - 1 } }
  }),

  undoEvent: (eventId) => set(state => {
    const ev = state.gameLog.find(e => e.id === eventId)
    if (!ev) return state
    const newLog = state.gameLog.filter(e => e.id !== eventId)
    if (ev.type === 'score' && ev.team && ev.points) {
      return {
        gameLog: newLog,
        ourScore: ev.team === 'us' ? Math.max(0, state.ourScore - ev.points) : state.ourScore,
        opponentScore: ev.team === 'them' ? Math.max(0, state.opponentScore - ev.points) : state.opponentScore,
      }
    }
    if (ev.type === 'sub' && ev.outPlayerId && ev.inPlayerId) {
      const newLineup = [...state.activeLineup]
      const idx = newLineup.indexOf(ev.inPlayerId)
      if (idx !== -1) newLineup[idx] = ev.outPlayerId
      return { gameLog: newLog, activeLineup: newLineup }
    }
    if (ev.type === 'foul' && ev.foulPlayerId) {
      const current = state.playerFouls[ev.foulPlayerId] ?? 0
      return { gameLog: newLog, playerFouls: { ...state.playerFouls, [ev.foulPlayerId]: Math.max(0, current - 1) } }
    }
    return { gameLog: newLog }
  }),

  endGame: () => set({ isEnded: true, clockRunning: false }),
}))
