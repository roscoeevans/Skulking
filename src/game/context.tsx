import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'
import type { Game, Player, Bid, Result, Score, Bonuses } from './types'
import { STORAGE_KEY } from './types'

/* ============================================================
   Game Context — single source of truth + realtime sync
   ============================================================ */

interface GameContextValue {
  game: Game | null
  players: Player[]
  bids: Bid[]
  results: Result[]
  scores: Score[]
  currentPlayer: Player | null
  loading: boolean
  // Actions
  joinGame: (name: string, isAdmin: boolean) => Promise<void>
  submitBid: (bid: number) => Promise<void>
  submitResult: (tricks: number, bonuses: Bonuses) => Promise<void>
  startGame: () => Promise<void>
  advanceToScoring: () => Promise<void>
  nextRound: () => Promise<void>
  resetGame: () => Promise<void>
  restartSamePlayers: () => Promise<void>
  configureAndStart: (totalRounds: number) => Promise<void>
}

const GameContext = createContext<GameContextValue | null>(null)

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [bids, setBids] = useState<Bid[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [scores, setScores] = useState<Score[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)

  // ── Fetch all state ──
  const fetchAll = useCallback(async () => {
    const [gRes, pRes, bRes, rRes, sRes] = await Promise.all([
      supabase.from('game').select('*').eq('id', 1).single(),
      supabase.from('players').select('*').order('joined_at'),
      supabase.from('bids').select('*'),
      supabase.from('results').select('*'),
      supabase.from('scores').select('*'),
    ])
    if (gRes.data) setGame(gRes.data as Game)
    if (pRes.data) setPlayers(pRes.data as Player[])
    if (bRes.data) setBids(bRes.data as Bid[])
    if (rRes.data) setResults(rRes.data as Result[])
    if (sRes.data) setScores(sRes.data as Score[])
    return { game: gRes.data as Game | null, players: pRes.data as Player[] | null }
  }, [])

  // ── Restore player from localStorage ──
  const restorePlayer = useCallback(async (playersList: Player[] | null) => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored || !playersList) return
    try {
      const { playerId } = JSON.parse(stored)
      const found = playersList.find((p) => p.id === playerId)
      if (found) {
        setCurrentPlayer(found)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // ── Init ──
  useEffect(() => {
    async function init() {
      // Cleanup stale games (>24h)
      await supabase.rpc('cleanup_stale_game')
      const data = await fetchAll()
      await restorePlayer(data.players)
      setLoading(false)
    }
    init()
  }, [fetchAll, restorePlayer])

  // ── Realtime subscriptions ──
  useEffect(() => {
    const channel = supabase
      .channel('skulking-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game' },
        () => {
          supabase
            .from('game')
            .select('*')
            .eq('id', 1)
            .single()
            .then(({ data }) => {
              if (data) setGame(data as Game)
            })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players' },
        () => {
          supabase
            .from('players')
            .select('*')
            .order('joined_at')
            .then(({ data }) => {
              if (data) {
                setPlayers(data as Player[])
                // If current player was removed (game reset), clear identity
                const stored = localStorage.getItem(STORAGE_KEY)
                if (stored) {
                  try {
                    const { playerId } = JSON.parse(stored)
                    const stillExists = (data as Player[]).find(
                      (p) => p.id === playerId
                    )
                    if (!stillExists) {
                      setCurrentPlayer(null)
                      localStorage.removeItem(STORAGE_KEY)
                    }
                  } catch {
                    /* noop */
                  }
                }
              }
            })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bids' },
        () => {
          supabase
            .from('bids')
            .select('*')
            .then(({ data }) => {
              if (data) setBids(data as Bid[])
            })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'results' },
        () => {
          supabase
            .from('results')
            .select('*')
            .then(({ data }) => {
              if (data) setResults(data as Result[])
            })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scores' },
        () => {
          supabase
            .from('scores')
            .select('*')
            .then(({ data }) => {
              if (data) setScores(data as Score[])
            })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // ── Actions ──
  const joinGame = useCallback(
    async (name: string, isAdmin: boolean) => {
      const { data, error } = await supabase.rpc('join_game', {
        p_name: name,
        p_is_admin: isAdmin,
      })
      if (error) throw new Error(error.message)
      const playerId = data as string
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ playerId }))
      // Fetch player record
      const { data: player } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single()
      if (player) setCurrentPlayer(player as Player)
    },
    []
  )

  const submitBid = useCallback(
    async (bid: number) => {
      if (!currentPlayer || !game) return
      const { error } = await supabase.rpc('submit_bid', {
        p_player_id: currentPlayer.id,
        p_round: game.round_number,
        p_bid: bid,
      })
      if (error) throw new Error(error.message)
    },
    [currentPlayer, game]
  )

  const submitResult = useCallback(
    async (tricks: number, bonuses: Bonuses) => {
      if (!currentPlayer || !game) return
      const { error } = await supabase.rpc('submit_result', {
        p_player_id: currentPlayer.id,
        p_round: game.round_number,
        p_tricks: tricks,
        p_bonuses: bonuses,
      })
      if (error) throw new Error(error.message)
    },
    [currentPlayer, game]
  )

  const startGame = useCallback(async () => {
    const { error } = await supabase.rpc('start_game')
    if (error) throw new Error(error.message)
  }, [])

  const advanceToScoring = useCallback(async () => {
    const { error } = await supabase.rpc('advance_to_scoring')
    if (error) throw new Error(error.message)
  }, [])

  const nextRound = useCallback(async () => {
    const { error } = await supabase.rpc('next_round')
    if (error) throw new Error(error.message)
  }, [])

  const resetGame = useCallback(async () => {
    const { error } = await supabase.rpc('reset_game')
    if (error) throw new Error(error.message)
    setCurrentPlayer(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const restartSamePlayers = useCallback(async () => {
    const { error } = await supabase.rpc('restart_same_players')
    if (error) throw new Error(error.message)
  }, [])

  const configureAndStart = useCallback(async (totalRounds: number) => {
    const { error } = await supabase.rpc('configure_and_start', {
      p_total_rounds: totalRounds,
    })
    if (error) throw new Error(error.message)
  }, [])

  return (
    <GameContext.Provider
      value={{
        game,
        players,
        bids,
        results,
        scores,
        currentPlayer,
        loading,
        joinGame,
        submitBid,
        submitResult,
        startGame,
        advanceToScoring,
        nextRound,
        resetGame,
        restartSamePlayers,
        configureAndStart,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}
