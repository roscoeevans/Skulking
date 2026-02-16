/* ============================================================
   Game Types
   ============================================================ */

export type Phase =
  | 'lobby'
  | 'config'
  | 'bidding'
  | 'reveal_bids'
  | 'scoring'
  | 'leaderboard'
  | 'finished'

export interface Game {
  id: number
  phase: Phase
  round_number: number
  total_rounds: number
  created_at: string
}

export interface Player {
  id: string
  name: string
  is_admin: boolean
  joined_at: string
}

export interface Bid {
  player_id: string
  round_number: number
  bid: number
}

export interface Bonuses {
  black14: boolean
  color14s: number
  mermaidDefeatsSkullKing: boolean
  skullKingDefeatsPirates: number
  piratesDefeatMermaids: number
}

export interface Result {
  player_id: string
  round_number: number
  tricks_won: number
  bonuses_json: Bonuses
}

export interface Score {
  player_id: string
  round_number: number
  round_points: number
  total_points: number
  has_bonus: boolean
  loot_bonus: number
}

export interface LootAlliance {
  id: number
  initiator_id: string
  partner_id: string
  round_number: number
  status: 'pending' | 'accepted'
}

export const EMPTY_BONUSES: Bonuses = {
  black14: false,
  color14s: 0,
  mermaidDefeatsSkullKing: false,
  skullKingDefeatsPirates: 0,
  piratesDefeatMermaids: 0,
}

export const MAX_PLAYERS = 10

/** localStorage key for persisting player identity */
export const STORAGE_KEY = 'skulking_player'
