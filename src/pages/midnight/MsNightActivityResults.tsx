import type { ActivityResult, LifetimeStats } from '../../midnight/useNightActivities'

/* ============================================================
   MsNightActivityResults — Full page showing night activity stats
   Accessed from the results screen. Pure fun, no game impact.
   ============================================================ */

interface Props {
    results: ActivityResult[]
    score: number
    lifetimeStats: LifetimeStats
    onClose: () => void
}

export function MsNightActivityResults({ results, score, lifetimeStats, onClose }: Props) {
    const fastestAnswer = results
        .filter(r => r.chosenIndex >= 0)
        .reduce((min, r) => Math.min(min, r.timeMs), Infinity)
    const fastestFormatted = fastestAnswer === Infinity ? '—' : `${(fastestAnswer / 1000).toFixed(1)}s`

    return (
        <div className="page ms-night-page">
            <div className="page-header">
                <h1>🎯 Night Activities</h1>
                <p className="subtitle">How you passed the time</p>
            </div>

            <div className="content" style={{ gap: 'var(--space-16)' }}>
                {/* Stats summary */}
                <div className="night-results-stats">
                    <div className="night-results-stat-card">
                        <span className="night-results-stat-value">{score}</span>
                        <span className="night-results-stat-label">Correct</span>
                    </div>
                    <div className="night-results-stat-card">
                        <span className="night-results-stat-value">{results.length}</span>
                        <span className="night-results-stat-label">Answered</span>
                    </div>
                    <div className="night-results-stat-card">
                        <span className="night-results-stat-value">{fastestFormatted}</span>
                        <span className="night-results-stat-label">Fastest</span>
                    </div>
                </div>

                {/* Lifetime stats */}
                <div className="night-results-lifetime">
                    <span>🏆 Lifetime: {lifetimeStats.totalCorrect} correct across {lifetimeStats.gamesPlayed} games</span>
                </div>

                {/* Activity list */}
                <div className="ms-section">
                    <div className="section-label">Activity Log</div>
                    <div className="night-results-list">
                        {results.map((r, i) => {
                            const typeEmoji =
                                r.activity.type === 'trivia' ? '🧠' :
                                    r.activity.type === 'poll' ? '📊' :
                                        r.activity.type === 'riddle' ? '🔮' : '⚡'

                            const statusEmoji =
                                r.chosenIndex < 0 ? '⏰' :
                                    r.correct === true ? '✅' :
                                        r.correct === false ? '❌' : '💬'

                            const chosenText = r.chosenIndex >= 0
                                ? r.activity.options[r.chosenIndex]
                                : 'No answer'

                            return (
                                <div key={i} className="night-results-item">
                                    <div className="night-results-item-header">
                                        <span>{typeEmoji} {r.activity.question}</span>
                                        <span>{statusEmoji}</span>
                                    </div>
                                    <div className="night-results-item-detail">
                                        <span>Your answer: {chosenText}</span>
                                        {r.correct !== null && r.activity.answer >= 0 && (
                                            <span className="night-results-correct">
                                                Correct: {r.activity.options[r.activity.answer]}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="actions">
                <button className="btn-secondary" onClick={onClose}>
                    ← Back to Results
                </button>
            </div>
        </div>
    )
}
