import { useState, useCallback } from 'react'
import { useMidnight } from '../../midnight/MidnightContext'
import { useGame } from '../../game/context'
import { ROLES } from '../../midnight/roles'
import { BoardGrid } from '../../components/midnight/BoardGrid'

export function MsNight() {
    const { currentPlayer, players } = useGame()
    const { msState, submitNightAction, skipNightAction } = useMidnight()

    const isAdmin = currentPlayer?.is_admin ?? false
    const isMyTurn = msState?.is_my_turn ?? false
    const nightRole = msState?.night_role
    const roleDef = nightRole ? ROLES[nightRole] : null
    const startingRole = msState?.starting_role
    const startingDef = startingRole ? ROLES[startingRole] : null
    const nightStep = msState?.night_step ?? 0
    const nightTotal = msState?.night_total ?? 0
    const privateResults = msState?.private_results ?? []
    const werewolfAllies = msState?.werewolf_allies ?? []

    const [selected, setSelected] = useState<string[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [actionResult, setActionResult] = useState<Record<string, unknown> | null>(null)
    const [error, setError] = useState('')

    const handleSelect = useCallback((pos: string) => {
        setSelected((prev) =>
            prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
        )
    }, [])

    // Determine valid targets and action type based on role
    let selectablePositions: string[] = []
    let maxSelect = 1
    let actionType = ''
    let instruction = ''
    // Whether the Seer is doing center or player look
    const [seerMode, setSeerMode] = useState<'player' | 'center'>('player')

    if (isMyTurn && nightRole) {
        if (nightRole === 'werewolf') {
            // Lone wolf: pick 1 center card
            selectablePositions = ['C:0', 'C:1', 'C:2']
            maxSelect = 1
            actionType = 'LOOK_CENTER'
            instruction = 'You are the lone Werewolf. Choose a center card to peek at.'
        } else if (nightRole === 'seer') {
            if (seerMode === 'player') {
                selectablePositions = players
                    .filter((p) => p.id !== currentPlayer?.id)
                    .map((p) => `P:${p.id}`)
                maxSelect = 1
                actionType = 'LOOK_PLAYER'
                instruction = 'Choose one player\'s card to look at.'
            } else {
                selectablePositions = ['C:0', 'C:1', 'C:2']
                maxSelect = 2
                actionType = 'LOOK_CENTER'
                instruction = 'Choose two center cards to look at.'
            }
        } else if (nightRole === 'robber') {
            selectablePositions = players
                .filter((p) => p.id !== currentPlayer?.id)
                .map((p) => `P:${p.id}`)
            maxSelect = 1
            actionType = 'SWAP_WITH_SELF'
            instruction = 'Choose a player to swap cards with. You\'ll see your new role.'
        } else if (nightRole === 'troublemaker') {
            selectablePositions = players
                .filter((p) => p.id !== currentPlayer?.id)
                .map((p) => `P:${p.id}`)
            maxSelect = 2
            actionType = 'SWAP_PLAYERS'
            instruction = 'Choose two players to swap their cards.'
        }
    }

    const canSubmit = selected.length === maxSelect && !submitting && !actionResult

    async function handleSubmit() {
        if (!canSubmit) return
        setSubmitting(true)
        setError('')
        try {
            const result = await submitNightAction(actionType, selected)
            setActionResult(result)
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Action failed')
        }
        setSubmitting(false)
    }

    async function handleSkip() {
        try {
            await skipNightAction()
        } catch (e: unknown) {
            console.error(e instanceof Error ? e.message : 'Skip failed')
        }
    }

    // ── Already acted: show result ──
    if (actionResult) {
        return (
            <div className="page ms-night-page">
                <div className="page-header">
                    <h1>Action Complete</h1>
                    <p className="subtitle">Your action has been recorded</p>
                </div>
                <div className="content" style={{ justifyContent: 'center', alignItems: 'center' }}>
                    {Boolean(actionResult.saw_role) && (
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-24)' }}>
                            <p style={{ font: 'var(--text-footnote)', color: 'rgba(255,255,255,0.6)', marginBottom: 'var(--space-8)' }}>You saw:</p>
                            <p style={{ fontSize: '48px', marginBottom: 'var(--space-8)' }}>
                                {ROLES[actionResult.saw_role as string]?.emoji}
                            </p>
                            <p style={{ font: 'var(--text-title-3)' }}>
                                {ROLES[actionResult.saw_role as string]?.name}
                            </p>
                        </div>
                    )}
                    {Boolean(actionResult.saw_roles) && (
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-24)' }}>
                            <p style={{ font: 'var(--text-footnote)', color: 'rgba(255,255,255,0.6)', marginBottom: 'var(--space-8)' }}>You saw:</p>
                            <div style={{ display: 'flex', gap: 'var(--space-16)', justifyContent: 'center' }}>
                                {(actionResult.saw_roles as string[]).map((r, i) => (
                                    <div key={i} style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '36px' }}>{ROLES[r]?.emoji}</p>
                                        <p style={{ font: 'var(--text-subhead)' }}>{ROLES[r]?.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {Boolean(actionResult.new_role) && (
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-24)' }}>
                            <p style={{ font: 'var(--text-footnote)', color: 'rgba(255,255,255,0.6)', marginBottom: 'var(--space-8)' }}>Your new role:</p>
                            <p style={{ fontSize: '48px', marginBottom: 'var(--space-8)' }}>
                                {ROLES[actionResult.new_role as string]?.emoji}
                            </p>
                            <p style={{ font: 'var(--text-title-3)' }}>
                                {ROLES[actionResult.new_role as string]?.name}
                            </p>
                        </div>
                    )}
                    {Boolean(actionResult.swapped) && (
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-24)' }}>
                            <p style={{ font: 'var(--text-headline)' }}>Cards swapped!</p>
                            <p style={{ font: 'var(--text-footnote)', color: 'rgba(255,255,255,0.6)' }}>
                                You don't know what they had.
                            </p>
                        </div>
                    )}
                    <div className="waiting">
                        <p className="waiting-text">Waiting for others<span className="waiting-dots" /></p>
                    </div>
                </div>
            </div>
        )
    }

    // ── My turn: action UI ──
    if (isMyTurn && nightRole) {
        return (
            <div className="page ms-night-page">
                <div className="page-header">
                    <div className="round-badge">Night · Step {nightStep + 1} of {nightTotal}</div>
                    <h1>{roleDef?.name ?? 'Your Turn'}</h1>
                    <p className="subtitle">{instruction}</p>
                </div>

                <div className="content">
                    {nightRole === 'seer' && (
                        <div className="ms-seer-toggle">
                            <button
                                className={`ms-toggle-btn ${seerMode === 'player' ? 'active' : ''}`}
                                onClick={() => { setSeerMode('player'); setSelected([]) }}
                            >1 Player</button>
                            <button
                                className={`ms-toggle-btn ${seerMode === 'center' ? 'active' : ''}`}
                                onClick={() => { setSeerMode('center'); setSelected([]) }}
                            >2 Center</button>
                        </div>
                    )}

                    <BoardGrid
                        selectablePositions={selectablePositions}
                        selected={selected}
                        onSelect={handleSelect}
                        maxSelect={maxSelect}
                    />

                    {error && (
                        <p style={{ color: 'var(--color-destructive)', font: 'var(--text-footnote)', textAlign: 'center' }}>
                            {error}
                        </p>
                    )}
                </div>

                <div className="actions">
                    <button
                        className="btn-primary"
                        disabled={!canSubmit}
                        onClick={handleSubmit}
                    >
                        {submitting ? 'Submitting…' : 'Confirm'}
                    </button>
                </div>
            </div>
        )
    }

    // ── Not my turn: waiting screen ──
    return (
        <div className="page ms-night-page">
            <div className="page-header">
                <div className="round-badge">Night · Step {nightStep + 1} of {Math.max(nightTotal, 1)}</div>
                <h1>Night</h1>
                <p className="subtitle">Close your eyes…</p>
            </div>

            <div className="content" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div className="ms-night-moon">🌙</div>

                {startingDef && (
                    <p style={{ font: 'var(--text-footnote)', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                        You are the {startingDef.emoji} {startingDef.name}
                    </p>
                )}

                {/* Show werewolf allies if applicable */}
                {werewolfAllies.length > 1 && startingRole === 'werewolf' && (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-16)' }}>
                        <p style={{ font: 'var(--text-subhead)', marginBottom: 'var(--space-8)' }}>🐺 Your pack:</p>
                        {werewolfAllies.map((id) => {
                            const p = players.find((pl) => pl.id === id)
                            return p ? (
                                <p key={id} style={{ font: 'var(--text-headline)' }}>{p.name}</p>
                            ) : null
                        })}
                    </div>
                )}

                {/* Show private results from earlier actions */}
                {privateResults.length > 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-16)' }}>
                        <p style={{ font: 'var(--text-subhead)', color: 'rgba(255,255,255,0.6)' }}>
                            You already acted earlier this night.
                        </p>
                    </div>
                )}

                <div className="waiting">
                    <p className="waiting-text">Night in progress<span className="waiting-dots" /></p>
                </div>

                {isAdmin && (
                    <button className="btn-secondary" onClick={handleSkip} style={{ marginTop: 'var(--space-16)' }}>
                        ⏭ Skip Current Step
                    </button>
                )}
            </div>
        </div>
    )
}
