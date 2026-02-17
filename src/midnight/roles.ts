/* ============================================================
   Midnight Society — Role Definitions
   ============================================================ */

export type Team = 'village' | 'werewolf' | 'tanner'

export interface RoleDefinition {
    id: string
    name: string
    emoji: string
    team: Team
    nightOrder: number      // 0 = no action
    nightDescription: string
    discussionTip: string
    maxCount: number        // max copies in a game
}

export const ROLES: Record<string, RoleDefinition> = {
    werewolf: {
        id: 'werewolf',
        name: 'Werewolf',
        emoji: '🐺',
        team: 'werewolf',
        nightOrder: 1,
        nightDescription: 'Open your eyes and look for other Werewolves. If you are the only Werewolf, you may look at one center card.',
        discussionTip: 'Blend in. Deflect suspicion. Claim a village role.',
        maxCount: 3,
    },
    seer: {
        id: 'seer',
        name: 'Seer',
        emoji: '🔮',
        team: 'village',
        nightOrder: 2,
        nightDescription: 'Look at one other player\'s card, or two center cards.',
        discussionTip: 'Share what you learned — but be careful, a Werewolf might claim Seer too.',
        maxCount: 1,
    },
    robber: {
        id: 'robber',
        name: 'Robber',
        emoji: '🦝',
        team: 'village',
        nightOrder: 3,
        nightDescription: 'Swap your card with another player\'s card and look at your new role.',
        discussionTip: 'You know your NEW role. If you robbed a Werewolf, you\'re now on their team!',
        maxCount: 1,
    },
    troublemaker: {
        id: 'troublemaker',
        name: 'Troublemaker',
        emoji: '🃏',
        team: 'village',
        nightOrder: 4,
        nightDescription: 'Swap the cards of two OTHER players without looking at them.',
        discussionTip: 'You know who got swapped, but not what they became.',
        maxCount: 1,
    },
    tanner: {
        id: 'tanner',
        name: 'Tanner',
        emoji: '💀',
        team: 'tanner',
        nightOrder: 0,
        nightDescription: 'No night action. Your goal is to get yourself killed during the vote.',
        discussionTip: 'Act suspicious enough to get voted out — but not so obvious that people catch on.',
        maxCount: 1,
    },
    villager: {
        id: 'villager',
        name: 'Villager',
        emoji: '🧑‍🌾',
        team: 'village',
        nightOrder: 0,
        nightDescription: 'No night action. Sleep soundly.',
        discussionTip: 'You have no information — rely on logic and reading people.',
        maxCount: 5,
    },
}

export const NIGHT_ORDER = ['werewolf', 'seer', 'robber', 'troublemaker']

/* ── Presets ── */

export interface Preset {
    name: string
    description: string
    roles: Record<string, number>
}

export function getPreset(name: string, playerCount: number): Record<string, number> {
    const total = playerCount + 3
    const presets: Record<string, (n: number) => Record<string, number>> = {
        beginner: (n) => ({
            werewolf: 2,
            seer: 1,
            robber: 1,
            villager: n - 4,
        }),
        standard: (n) => ({
            werewolf: 2,
            seer: 1,
            robber: 1,
            troublemaker: 1,
            villager: n - 5,
        }),
        chaotic: (n) => ({
            werewolf: 2,
            seer: 1,
            robber: 1,
            troublemaker: 1,
            tanner: 1,
            villager: n - 6,
        }),
    }
    const fn = presets[name]
    if (!fn) return presets.standard(total)
    return fn(total)
}

export const PRESET_LIST: { id: string; name: string; emoji: string; description: string }[] = [
    { id: 'beginner', name: 'Beginner', emoji: '🟢', description: 'Simple — wolves, seer, robber' },
    { id: 'standard', name: 'Standard', emoji: '🟡', description: 'Adds troublemaker for chaos' },
    { id: 'chaotic', name: 'Chaotic', emoji: '🔴', description: 'Adds tanner — trust nobody' },
]
