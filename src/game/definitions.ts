import type { GameType } from './types'

/* ============================================================
   Game Definitions — registry of supported games
   ============================================================ */

export interface GameDefinition {
    id: GameType
    name: string
    emoji: string
    description: string
    maxPlayers: number
    roundRange: [min: number, max: number]
    defaultRounds: number
    cardsPerRound: (round: number) => number
    hasBonuses: boolean
    hasAlliances: boolean
    available: boolean
}

export const GAME_DEFINITIONS: Record<GameType, GameDefinition> = {
    skulking: {
        id: 'skulking',
        name: 'Skull King',
        emoji: '🏴‍☠️',
        description: 'A pirate trick-taking game with bonuses, mermaids, and loot',
        maxPlayers: 10,
        roundRange: [1, 10],
        defaultRounds: 10,
        cardsPerRound: (round) => round,
        hasBonuses: true,
        hasAlliances: true,
        available: true,
    },
    midnight_society: {
        id: 'midnight_society',
        name: 'Midnight Society',
        emoji: '🌙',
        description: 'One Night Werewolf — social deduction in a single night',
        maxPlayers: 10,
        roundRange: [1, 1],
        defaultRounds: 1,
        cardsPerRound: () => 0,
        hasBonuses: false,
        hasAlliances: false,
        available: true,
    },
}

export function getGameDefinition(gameType: GameType): GameDefinition {
    return GAME_DEFINITIONS[gameType]
}
