import { useGame } from '../game/context'
import { useMemo } from 'react'

export function LootBanner() {
    const { game, players, lootAlliances, currentPlayer, acceptLootAlliance } =
        useGame()
    const round = game?.round_number ?? 0

    const pendingForMe = useMemo(
        () =>
            lootAlliances.filter(
                (a) =>
                    a.partner_id === currentPlayer?.id &&
                    a.round_number === round &&
                    a.status === 'pending'
            ),
        [lootAlliances, currentPlayer, round]
    )

    if (pendingForMe.length === 0) return null

    return (
        <div className="loot-banner-container">
            {pendingForMe.map((alliance) => {
                const initiator = players.find((p) => p.id === alliance.initiator_id)
                return (
                    <div key={alliance.id} className="loot-banner">
                        <div className="loot-banner-text">
                            <span className="loot-banner-icon">🏴</span>
                            <span>
                                <strong>{initiator?.name ?? 'Someone'}</strong> formed a Loot
                                alliance with you
                            </span>
                        </div>
                        <button
                            className="loot-banner-accept"
                            onClick={() => acceptLootAlliance(alliance.id)}
                        >
                            Accept
                        </button>
                    </div>
                )
            })}
        </div>
    )
}
