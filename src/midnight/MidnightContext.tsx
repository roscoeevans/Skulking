import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
    type ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'
import { useGame } from '../game/context'
import type { MsMyState, MsGameState } from './types'

/* ============================================================
   Midnight Society Context
   Wraps MS-specific state + actions. Only active when
   game_type === 'midnight_society'.
   ============================================================ */

interface MidnightContextValue {
    msState: MsMyState | null
    gameState: MsGameState | null
    loading: boolean

    // Actions
    setupGame: (roles: string[], config: {
        discussion_seconds?: number
        voting_seconds?: number
        lone_wolf_peek?: boolean
        tie_all_die?: boolean
    }) => Promise<void>
    readyUp: () => Promise<void>
    submitNightAction: (actionType: string, targets: string[]) => Promise<Record<string, unknown>>
    skipNightAction: () => Promise<void>
    startVoting: () => Promise<void>
    submitVote: (targetId: string) => Promise<void>
    endVoting: () => Promise<void>
    rematch: () => Promise<void>
}

const MidnightContext = createContext<MidnightContextValue | null>(null)

export function useMidnight() {
    const ctx = useContext(MidnightContext)
    if (!ctx) throw new Error('useMidnight must be inside MidnightProvider')
    return ctx
}

export function MidnightProvider({ children }: { children: ReactNode }) {
    const { game, currentPlayer } = useGame()
    const [msState, setMsState] = useState<MsMyState | null>(null)
    const [gameState, setGameState] = useState<MsGameState | null>(null)
    const [loading, setLoading] = useState(true)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const lastSeenVersionRef = useRef<number>(-1)

    const playerId = currentPlayer?.id ?? ''

    // ── Fetch my state via secured RPC ──
    const fetchMyState = useCallback(async () => {
        if (!playerId) return
        const { data, error } = await supabase.rpc('ms_get_my_state', {
            p_player_id: playerId,
        })
        if (!error && data) {
            const state = data as MsMyState
            setMsState(state)
            if (state.state_version !== undefined) {
                lastSeenVersionRef.current = state.state_version
            }
        }
        setLoading(false)
    }, [playerId])

    // ── Fetch game state (non-secret) ──
    const fetchGameState = useCallback(async () => {
        const { data } = await supabase
            .from('ms_game_state')
            .select('*')
            .eq('id', 1)
            .single()
        if (data) setGameState(data as MsGameState)
    }, [])

    // ── Subscribe to realtime changes ──
    useEffect(() => {
        if (!playerId || game?.game_type !== 'midnight_society') return

        fetchMyState()
        fetchGameState()

        // Subscribe to ms_game_state changes (night_step, timers, ready_players)
        const stateChannel = supabase
            .channel('ms-game-state')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'ms_game_state',
            }, () => {
                fetchMyState()
                fetchGameState()
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    fetchMyState()
                    fetchGameState()
                }
            })

        // Subscribe to vote changes
        const voteChannel = supabase
            .channel('ms-votes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'ms_votes',
            }, () => {
                fetchMyState()
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    fetchMyState()
                }
            })

        return () => {
            supabase.removeChannel(stateChannel)
            supabase.removeChannel(voteChannel)
            if (pollRef.current) clearInterval(pollRef.current)
        }
    }, [playerId, game?.game_type, game?.phase, fetchMyState, fetchGameState])

    // ── Resync when tab regains visibility (version-gated) ──
    useEffect(() => {
        if (!playerId || game?.game_type !== 'midnight_society') return

        const checkAndResync = async () => {
            // Lightweight version check before full RPC
            const { data } = await supabase
                .from('ms_game_state')
                .select('state_version')
                .eq('id', 1)
                .single()
            if (data && data.state_version > lastSeenVersionRef.current) {
                fetchMyState()
                fetchGameState()
            }
        }

        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                checkAndResync()
            }
        }

        document.addEventListener('visibilitychange', onVisible)
        window.addEventListener('focus', checkAndResync)

        return () => {
            document.removeEventListener('visibilitychange', onVisible)
            window.removeEventListener('focus', checkAndResync)
        }
    }, [playerId, game?.game_type, fetchMyState, fetchGameState])

    // ── Actions ──

    const setupGame = useCallback(async (
        roles: string[],
        config: {
            discussion_seconds?: number
            voting_seconds?: number
            lone_wolf_peek?: boolean
            tie_all_die?: boolean
        }
    ) => {
        const { error } = await supabase.rpc('ms_setup_game', {
            p_role_set: roles,
            p_discussion_seconds: config.discussion_seconds ?? 300,
            p_voting_seconds: config.voting_seconds ?? 30,
            p_lone_wolf_peek: config.lone_wolf_peek ?? true,
            p_tie_all_die: config.tie_all_die ?? true,
        })
        if (error) throw new Error(error.message)
    }, [])

    const readyUp = useCallback(async () => {
        if (!playerId) return
        const { error } = await supabase.rpc('ms_ready_up', {
            p_player_id: playerId,
        })
        if (error) throw new Error(error.message)
    }, [playerId])

    const submitNightAction = useCallback(async (actionType: string, targets: string[]) => {
        if (!playerId) throw new Error('No player')
        const { data, error } = await supabase.rpc('ms_submit_night_action', {
            p_player_id: playerId,
            p_action_type: actionType,
            p_targets: targets,
        })
        if (error) throw new Error(error.message)
        return (data as Record<string, unknown>) ?? {}
    }, [playerId])

    const skipNightAction = useCallback(async () => {
        const { error } = await supabase.rpc('ms_skip_night_action')
        if (error) throw new Error(error.message)
    }, [])

    const startVoting = useCallback(async () => {
        const { error } = await supabase.rpc('ms_start_voting')
        if (error) throw new Error(error.message)
    }, [])

    const submitVote = useCallback(async (targetId: string) => {
        if (!playerId) return
        const { error } = await supabase.rpc('ms_submit_vote', {
            p_player_id: playerId,
            p_target_id: targetId,
        })
        if (error) throw new Error(error.message)
    }, [playerId])

    const endVoting = useCallback(async () => {
        const { error } = await supabase.rpc('ms_end_voting')
        if (error) throw new Error(error.message)
    }, [])

    const rematch = useCallback(async () => {
        const { error } = await supabase.rpc('ms_rematch')
        if (error) throw new Error(error.message)
    }, [])

    return (
        <MidnightContext.Provider
            value={{
                msState,
                gameState,
                loading,
                setupGame,
                readyUp,
                submitNightAction,
                skipNightAction,
                startVoting,
                submitVote,
                endVoting,
                rematch,
            }}
        >
            {children}
        </MidnightContext.Provider>
    )
}
