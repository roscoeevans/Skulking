import { useMidnight } from '../../midnight/MidnightContext'
import { useGame } from '../../game/context'
import { ROLES } from '../../midnight/roles'
import { RoleCard } from '../../components/midnight/RoleCard'

export function MsDeal() {
    const { players } = useGame()
    const { msState, readyUp } = useMidnight()

    const startingRole = msState?.starting_role
    const roleDef = startingRole ? ROLES[startingRole] : null
    const isReady = msState?.is_ready ?? false
    const readyCount = msState?.ready_count ?? 0
    const totalPlayers = players.length

    async function handleReady() {
        try {
            await readyUp()
        } catch (e: unknown) {
            console.error(e instanceof Error ? e.message : 'Failed to ready up')
        }
    }

    if (!roleDef || !startingRole) {
        return (
            <div className="page">
                <div className="page-header">
                    <h1>Midnight Society</h1>
                </div>
                <div className="content" style={{ justifyContent: 'center' }}>
                    <div className="waiting">
                        <p className="waiting-text">Dealing cards<span className="waiting-dots" /></p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1>Your Role</h1>
                <p className="subtitle">Look carefully — this may change during the night</p>
            </div>

            <div className="content" style={{ justifyContent: 'center', alignItems: 'center', gap: 'var(--space-24)' }}>
                <div className="ms-deal-reveal">
                    <RoleCard role={startingRole} faceUp size="large" />
                </div>

                <div className="ms-deal-info card">
                    <p style={{ font: 'var(--text-headline)', textAlign: 'center', marginBottom: 'var(--space-8)' }}>
                        {roleDef.name}
                    </p>
                    <p style={{ font: 'var(--text-footnote)', color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: '1.5' }}>
                        {roleDef.nightDescription}
                    </p>
                </div>

                {isReady && (
                    <div className="waiting">
                        <p className="waiting-text">
                            {readyCount} of {totalPlayers} ready<span className="waiting-dots" />
                        </p>
                    </div>
                )}
            </div>

            <div className="actions">
                <button
                    className="btn-primary"
                    disabled={isReady}
                    onClick={handleReady}
                >
                    {isReady ? `✓ Ready (${readyCount}/${totalPlayers})` : "I'm Ready"}
                </button>
            </div>
        </div>
    )
}
