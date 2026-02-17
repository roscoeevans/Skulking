import { useMidnight } from '../../midnight/MidnightContext'
import { useGame } from '../../game/context'
import { CountdownTimer } from '../../components/midnight/CountdownTimer'

export function MsVoting() {
    const { currentPlayer, players } = useGame()
    const { msState, submitVote, endVoting } = useMidnight()

    const isAdmin = currentPlayer?.is_admin ?? false
    const myVote = msState?.my_vote ?? currentPlayer?.id

    async function handleVote(targetId: string) {
        try {
            await submitVote(targetId)
        } catch (e: unknown) {
            console.error(e instanceof Error ? e.message : 'Vote failed')
        }
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1>🗳️ Vote</h1>
                <p className="subtitle">Who do you think is the werewolf?</p>
            </div>

            <div className="content" style={{ gap: 'var(--space-16)' }}>
                <CountdownTimer
                    endAt={msState?.voting_end_at}
                    label="Voting Ends"
                />

                <div className="ms-vote-grid">
                    {/* Self-vote option */}
                    <button
                        className={`ms-vote-card ${myVote === currentPlayer?.id ? 'voted' : ''}`}
                        onClick={() => handleVote(currentPlayer?.id ?? '')}
                    >
                        <span className="ms-vote-emoji">✋</span>
                        <span className="ms-vote-name">No Kill</span>
                        <span className="ms-vote-hint">(vote for yourself)</span>
                        {myVote === currentPlayer?.id && <span className="ms-vote-check">✓</span>}
                    </button>

                    {/* Other players */}
                    {players
                        .filter((p) => p.id !== currentPlayer?.id)
                        .map((p) => (
                            <button
                                key={p.id}
                                className={`ms-vote-card ${myVote === p.id ? 'voted' : ''}`}
                                onClick={() => handleVote(p.id)}
                            >
                                <span className="ms-vote-emoji">🎯</span>
                                <span className="ms-vote-name">{p.name}</span>
                                {myVote === p.id && <span className="ms-vote-check">✓</span>}
                            </button>
                        ))}
                </div>
            </div>

            {isAdmin && (
                <div className="actions">
                    <button className="btn-primary" onClick={endVoting}>
                        🔍 Reveal Results
                    </button>
                </div>
            )}
        </div>
    )
}
