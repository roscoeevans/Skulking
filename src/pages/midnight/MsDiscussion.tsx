import { useMidnight } from '../../midnight/MidnightContext'
import { useGame } from '../../game/context'
import { ROLES } from '../../midnight/roles'
import { CountdownTimer } from '../../components/midnight/CountdownTimer'

export function MsDiscussion() {
    const { currentPlayer } = useGame()
    const { msState, startVoting } = useMidnight()

    const isAdmin = currentPlayer?.is_admin ?? false
    const startingRole = msState?.starting_role
    const roleDef = startingRole ? ROLES[startingRole] : null
    const privateResults = msState?.private_results ?? []

    return (
        <div className="page">
            <div className="page-header">
                <h1>☀️ Discussion</h1>
                <p className="subtitle">Talk it out — who's the werewolf?</p>
            </div>

            <div className="content" style={{ justifyContent: 'center', alignItems: 'center', gap: 'var(--space-24)' }}>
                <CountdownTimer
                    endAt={msState?.discussion_end_at}
                    label="Time Remaining"
                />

                {roleDef && (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-16)' }}>
                        <p style={{ font: 'var(--text-footnote)', color: 'rgba(255,255,255,0.5)', marginBottom: 'var(--space-4)' }}>
                            Your starting role
                        </p>
                        <p style={{ font: 'var(--text-headline)' }}>
                            {roleDef.emoji} {roleDef.name}
                        </p>
                        <p style={{ font: 'var(--text-footnote)', color: 'rgba(255,255,255,0.6)', marginTop: 'var(--space-8)', lineHeight: '1.5' }}>
                            {roleDef.discussionTip}
                        </p>
                    </div>
                )}

                {/* Private results reminder */}
                {privateResults.length > 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-16)' }}>
                        <p style={{ font: 'var(--text-footnote)', color: 'rgba(255,255,255,0.5)', marginBottom: 'var(--space-8)' }}>
                            🔒 What you learned
                        </p>
                        {privateResults.map((r, i) => {
                            const result = r as Record<string, unknown>
                            if (result.saw_role) return (
                                <p key={i} style={{ font: 'var(--text-subhead)' }}>
                                    Saw: {ROLES[result.saw_role as string]?.emoji} {ROLES[result.saw_role as string]?.name}
                                </p>
                            )
                            if (result.saw_roles) return (
                                <p key={i} style={{ font: 'var(--text-subhead)' }}>
                                    Center: {(result.saw_roles as string[]).map(r =>
                                        `${ROLES[r]?.emoji} ${ROLES[r]?.name}`).join(', ')}
                                </p>
                            )
                            if (result.new_role) return (
                                <p key={i} style={{ font: 'var(--text-subhead)' }}>
                                    New role: {ROLES[result.new_role as string]?.emoji} {ROLES[result.new_role as string]?.name}
                                </p>
                            )
                            if (result.robbed) return (
                                <p key={i} style={{ font: 'var(--text-subhead)' }}>
                                    Robbed → {ROLES[result.new_role as string]?.emoji} {ROLES[result.new_role as string]?.name}
                                </p>
                            )
                            if (result.swapped) return (
                                <p key={i} style={{ font: 'var(--text-subhead)' }}>
                                    Swapped two players' cards
                                </p>
                            )
                            return null
                        })}
                    </div>
                )}

                <p style={{
                    font: 'var(--text-footnote)',
                    color: 'rgba(255,255,255,0.4)',
                    textAlign: 'center',
                }}>
                    ⚠️ Your role may have been swapped during the night
                </p>
            </div>

            {isAdmin && (
                <div className="actions">
                    <button className="btn-primary" onClick={startVoting}>
                        🗳️ Start Voting
                    </button>
                </div>
            )}
        </div>
    )
}
