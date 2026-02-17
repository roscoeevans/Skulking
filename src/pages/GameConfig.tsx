import { useState } from 'react'
import { useGame } from '../game/context'
import { getGameDefinition } from '../game/definitions'

export function GameConfig() {
    const { game, players, currentPlayer, configureAndStart } = useGame()
    const def = getGameDefinition(game?.game_type ?? 'skulking')
    const [totalRounds, setTotalRounds] = useState(def.defaultRounds)
    const [starting, setStarting] = useState(false)
    const [error, setError] = useState('')

    const isAdmin = currentPlayer?.is_admin ?? false

    async function handleStart() {
        if (starting) return
        setStarting(true)
        setError('')
        try {
            await configureAndStart(totalRounds)
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to start')
            setStarting(false)
        }
    }

    // Non-admin — waiting view
    if (!isAdmin) {
        return (
            <div className="page">
                <div className="page-header">
                    <h1>{def.name} Setup</h1>
                    <p className="subtitle">{players.length} players ready</p>
                </div>
                <div className="content" style={{ justifyContent: 'center' }}>
                    <div className="waiting">
                        <p className="waiting-text">
                            Admin is configuring the game<span className="waiting-dots" />
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    // Admin — config view
    return (
        <div className="page">
            <div className="page-header">
                <h1>{def.name} Setup</h1>
                <p className="subtitle">{players.length} players ready</p>
            </div>

            <div className="content">
                <div className="config-section">
                    <div className="section-label">Rounds</div>
                    <p className="config-hint">
                        Each round adds one more card — Round 1 deals 1 card, Round {totalRounds} deals {totalRounds}.
                    </p>
                    <div className="rounds-picker">
                        {Array.from({ length: def.roundRange[1] - def.roundRange[0] + 1 }, (_, i) => i + def.roundRange[0]).map((n) => (
                            <button
                                key={n}
                                className={`rounds-pill${n === totalRounds ? ' selected' : ''}`}
                                onClick={() => setTotalRounds(n)}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="actions">
                {error && (
                    <p style={{ font: 'var(--text-footnote)', color: 'var(--color-watermelon)', textAlign: 'center' }}>
                        {error}
                    </p>
                )}
                <button
                    className="btn-primary"
                    disabled={starting}
                    onClick={handleStart}
                >
                    {starting ? 'Starting...' : 'Begin Game'}
                </button>
            </div>
        </div>
    )
}
