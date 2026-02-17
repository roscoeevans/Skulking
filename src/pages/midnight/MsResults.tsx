import { useState } from 'react'
import { useMidnight } from '../../midnight/MidnightContext'
import { useGame } from '../../game/context'
import { supabase } from '../../lib/supabase'
import { ROLES } from '../../midnight/roles'
import { RoleCard } from '../../components/midnight/RoleCard'
import { MsNightActivityResults } from './MsNightActivityResults'
import { NIGHT_ACTIVITY_SESSION_KEY } from './MsNight'
import type { ActivityResult, LifetimeStats } from '../../midnight/useNightActivities'

export function MsResults() {
    const { currentPlayer, players } = useGame()
    const { msState, rematch } = useMidnight()
    const isAdmin = currentPlayer?.is_admin ?? false

    const [showActivities, setShowActivities] = useState(false)

    const winner = msState?.winner ?? ''
    const deaths = msState?.deaths ?? []
    const votes = msState?.votes ?? {}
    const allPositions = msState?.all_positions ?? {}
    const startingRoles = msState?.starting_roles ?? {}
    const nightLog = msState?.night_log ?? []

    const winnerLabel =
        winner === 'village' ? '🏘️ Village Wins!' :
            winner === 'werewolf' ? '🐺 Werewolves Win!' :
                winner === 'tanner' ? '💀 Tanner Wins!' : 'Game Over'

    const winnerColor =
        winner === 'village' ? 'var(--color-sky)' :
            winner === 'werewolf' ? 'var(--color-destructive)' :
                winner === 'tanner' ? 'var(--color-gold)' : 'white'

    // Read activity results from sessionStorage
    let activityData: { results: ActivityResult[]; score: number; lifetimeStats: LifetimeStats } | null = null
    try {
        const raw = sessionStorage.getItem(NIGHT_ACTIVITY_SESSION_KEY)
        if (raw) activityData = JSON.parse(raw)
    } catch { /* ignore */ }

    async function handleRematch() {
        try {
            await rematch()
        } catch (e: unknown) {
            console.error(e instanceof Error ? e.message : 'Rematch failed')
        }
    }

    async function handleDifferentGame() {
        try {
            const { error } = await supabase.rpc('ms_back_to_game_select')
            if (error) throw new Error(error.message)
        } catch (e: unknown) {
            console.error(e instanceof Error ? e.message : 'Failed')
        }
    }

    // Count votes per target
    const voteCounts: Record<string, number> = {}
    Object.values(votes).forEach((targetId) => {
        voteCounts[targetId] = (voteCounts[targetId] ?? 0) + 1
    })

    // ── Night Activity Results page ──
    if (showActivities && activityData) {
        return (
            <MsNightActivityResults
                results={activityData.results}
                score={activityData.score}
                lifetimeStats={activityData.lifetimeStats}
                onClose={() => setShowActivities(false)}
            />
        )
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1 style={{ color: winnerColor }}>{winnerLabel}</h1>
                {deaths.length === 0 && (
                    <p className="subtitle">Nobody died</p>
                )}
                {deaths.length > 0 && (
                    <p className="subtitle">
                        💀 {deaths.map((d) => players.find((p) => p.id === d)?.name ?? d).join(', ')} died
                    </p>
                )}
            </div>

            <div className="content" style={{ gap: 'var(--space-16)' }}>
                {/* Vote Tally */}
                <div className="ms-section">
                    <div className="section-label">Vote Tally</div>
                    <div className="ms-results-list">
                        {players.map((p) => {
                            const votedFor = votes[p.id]
                            const votedForName = votedFor === p.id
                                ? 'No Kill'
                                : players.find((pl) => pl.id === votedFor)?.name ?? '?'
                            const isDead = deaths.includes(p.id)

                            return (
                                <div key={p.id} className={`ms-result-row ${isDead ? 'dead' : ''}`}>
                                    <span className="ms-result-name">
                                        {isDead ? '💀 ' : ''}{p.name}{p.id === currentPlayer?.id ? ' (you)' : ''}
                                    </span>
                                    <span className="ms-result-vote">→ {votedForName}</span>
                                    <span className="ms-result-count">{voteCounts[p.id] ?? 0} votes</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* All Roles Revealed */}
                <div className="ms-section">
                    <div className="section-label">Final Roles</div>
                    <div className="ms-results-board">
                        {/* Player cards */}
                        {players.map((p) => {
                            const pos = `P:${p.id}`
                            const finalRole = allPositions[pos]
                            const startRole = startingRoles[p.id]
                            const changed = finalRole !== startRole

                            return (
                                <div key={p.id} className="ms-results-card-row">
                                    <div className="ms-results-card-info">
                                        <span className="ms-result-player-name">{p.name}{p.id === currentPlayer?.id ? ' (you)' : ''}</span>
                                        {changed && startRole && (
                                            <span className="ms-result-changed">
                                                was {ROLES[startRole]?.emoji} {ROLES[startRole]?.name}
                                            </span>
                                        )}
                                    </div>
                                    <RoleCard role={finalRole} faceUp size="small" />
                                </div>
                            )
                        })}
                        {/* Center cards */}
                        <div className="ms-results-center">
                            <span className="ms-results-center-label">Center:</span>
                            {[0, 1, 2].map((i) => {
                                const role = allPositions[`C:${i}`]
                                return (
                                    <RoleCard key={i} role={role} faceUp size="small" />
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Night Log */}
                {nightLog.length > 0 && (
                    <div className="ms-section">
                        <div className="section-label">Night Recap</div>
                        <div className="ms-night-log">
                            {nightLog.map((entry, i) => (
                                <div key={i} className="ms-log-entry">
                                    <span className="ms-log-step">{entry.step >= 0 ? `Step ${entry.step + 1}` : '★'}</span>
                                    <span className="ms-log-text">{entry.summary}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Night Activities Button */}
                {activityData && activityData.results.length > 0 && (
                    <button
                        className="btn-secondary night-activities-btn"
                        onClick={() => setShowActivities(true)}
                    >
                        🎯 View Night Activities
                    </button>
                )}
            </div>

            {isAdmin && (
                <div className="actions" style={{ gap: 'var(--space-8)' }}>
                    <button className="btn-primary" onClick={handleRematch}>
                        🔄 Play Again
                    </button>
                    <button className="btn-secondary" onClick={handleDifferentGame}>
                        🎮 Play a Different Game
                    </button>
                </div>
            )}
        </div>
    )
}

