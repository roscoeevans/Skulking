/* ============================================================
   Midnight Society — Types
   ============================================================ */

export interface MsGameState {
    role_set: string[]
    night_step: number
    night_order: NightStep[]
    discussion_seconds: number
    voting_seconds: number
    lone_wolf_peek: boolean
    tie_all_die: boolean
    discussion_end_at: string | null
    voting_end_at: string | null
    starting_roles: Record<string, string>
    ready_players: string[]
    deaths: string[]
    winner: string
    state_version: number
}

export interface NightStep {
    step: number
    role: string
    player_id: string
}

/** Shape returned by ms_get_my_state RPC */
export interface MsMyState {
    phase: string
    player_count: number
    ready_count: number
    discussion_seconds: number
    voting_seconds: number
    state_version: number

    // Available from ms_deal onwards
    starting_role?: string
    is_ready?: boolean

    // Night phase
    night_step?: number
    night_total?: number
    is_my_turn?: boolean
    night_role?: string
    private_results?: Record<string, unknown>[]
    werewolf_allies?: string[]

    // Discussion
    discussion_end_at?: string

    // Voting
    voting_end_at?: string
    my_vote?: string

    // Results
    final_role?: string
    all_positions?: Record<string, string>
    starting_roles?: Record<string, string>
    deaths?: string[]
    winner?: string
    votes?: Record<string, string>
    night_log?: NightLogEntry[]
}

export interface NightLogEntry {
    step: number
    action: string
    summary: string
    details: Record<string, unknown>
}
