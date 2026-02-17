import { useGame } from '../game/context'
import { GAME_DEFINITIONS } from '../game/definitions'
import type { GameType } from '../game/types'

export function GameSelect() {
    const { currentPlayer, selectGame } = useGame()
    const isAdmin = currentPlayer?.is_admin ?? false

    const games = Object.values(GAME_DEFINITIONS)

    async function handleSelect(gameType: GameType) {
        try {
            await selectGame(gameType)
        } catch (e: unknown) {
            console.error(e instanceof Error ? e.message : 'Failed to select game')
        }
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1>Game Night</h1>
                <p className="subtitle">
                    {isAdmin ? 'Choose a game to play' : 'Waiting for admin to choose'}
                </p>
            </div>

            <div className="content">
                <div className="game-select-list">
                    {games.map((g) => (
                        <button
                            key={g.id}
                            className={`game-select-card${!g.available ? ' coming-soon' : ''}`}
                            disabled={!isAdmin || !g.available}
                            onClick={() => handleSelect(g.id)}
                        >
                            <span className="game-select-emoji">{g.emoji}</span>
                            <div className="game-select-info">
                                <span className="game-select-name">{g.name}</span>
                                <span className="game-select-desc">{g.description}</span>
                            </div>
                            {!g.available && (
                                <span className="game-select-badge">Coming Soon</span>
                            )}
                            {g.available && isAdmin && (
                                <span className="game-select-arrow">›</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {!isAdmin && (
                <div className="actions">
                    <div className="waiting">
                        <p className="waiting-text">
                            Waiting for admin<span className="waiting-dots" />
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
