import { useState, useEffect, useRef } from 'react'
import { useMidnight } from '../../midnight/MidnightContext'
import { useGame } from '../../game/context'
import { CountdownTimer } from '../../components/midnight/CountdownTimer'

export function MsVoting() {
    const { currentPlayer, players } = useGame()
    const { msState, submitVote, endVoting } = useMidnight()

    const isAdmin = currentPlayer?.is_admin ?? false
    const serverVote = msState?.my_vote ?? currentPlayer?.id

    // Optimistic local vote — updates instantly on tap
    const [localVote, setLocalVote] = useState(serverVote)

    // Guard: don't let server refetches revert optimistic vote while RPC is in-flight
    const submittingRef = useRef(false)

    // Sync local vote when server confirms — but skip while a submission is pending
    useEffect(() => {
        if (!submittingRef.current) {
            setLocalVote(serverVote)
        }
    }, [serverVote])

    const displayedVote = localVote

    async function handleVote(targetId: string) {
        // Optimistic update — show checkmark immediately
        submittingRef.current = true
        setLocalVote(targetId)
        try {
            await submitVote(targetId)
        } catch (e: unknown) {
            // Revert on failure
            setLocalVote(serverVote)
            console.error(e instanceof Error ? e.message : 'Vote failed')
        } finally {
            submittingRef.current = false
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
                        className={`ms-vote-card ${displayedVote === currentPlayer?.id ? 'voted' : ''}`}
                        onClick={() => handleVote(currentPlayer?.id ?? '')}
                    >
                        <span className="ms-vote-emoji">✋</span>
                        <span className="ms-vote-name">No Kill</span>
                        <span className="ms-vote-hint">(vote for yourself)</span>
                        {displayedVote === currentPlayer?.id && <span className="ms-vote-check">✓</span>}
                    </button>

                    {/* Other players */}
                    {players
                        .filter((p) => p.id !== currentPlayer?.id)
                        .map((p) => (
                            <button
                                key={p.id}
                                className={`ms-vote-card ${displayedVote === p.id ? 'voted' : ''}`}
                                onClick={() => handleVote(p.id)}
                            >
                                <span className="ms-vote-emoji">🎯</span>
                                <span className="ms-vote-name">{p.name}</span>
                                {displayedVote === p.id && <span className="ms-vote-check">✓</span>}
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
