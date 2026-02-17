import { useState, useCallback, useEffect, useRef } from 'react'
import { useMidnight } from '../../midnight/MidnightContext'
import { useGame } from '../../game/context'
import { ROLES } from '../../midnight/roles'
import { BoardGrid } from '../../components/midnight/BoardGrid'
import { NightActivity } from '../../components/midnight/NightActivity'
import { useNightActivities } from '../../midnight/useNightActivities'

/* ============================================================
   MsNight — Night phase page with activity layer.

   Design principles:
   - Everyone is ALWAYS interacting (activities or role action)
   - Same-surface swap: activity card morphs into role action
   - No "Waiting for others", no step counters, no progress
   - Activities loop infinitely with random delays
   - Brief toast after action, then back to activities
   ============================================================ */

// Time before role action submit button unlocks (ms)
const ROLE_ACTION_LOCK_MS = 1500
// Toast duration for non-reveal actions (ms)
const TOAST_DURATION_MS = 8000

type NightView = 'activity' | 'role-action' | 'toast'

export const NIGHT_ACTIVITY_SESSION_KEY = 'ms_night_activity_session'

export function MsNight() {
    const { currentPlayer, players } = useGame()
    const { msState, submitNightAction } = useMidnight()
    const nightActivities = useNightActivities()

    // Persist activity results to sessionStorage so MsResults can read them
    useEffect(() => {
        return () => {
            try {
                sessionStorage.setItem(NIGHT_ACTIVITY_SESSION_KEY, JSON.stringify({
                    results: nightActivities.results,
                    score: nightActivities.score,
                    lifetimeStats: nightActivities.lifetimeStats,
                }))
            } catch { /* ignore */ }
        }
    })

    const isMyTurn = msState?.is_my_turn ?? false
    const nightRole = msState?.night_role
    const roleDef = nightRole ? ROLES[nightRole] : null
    const startingRole = msState?.starting_role
    const startingDef = startingRole ? ROLES[startingRole] : null
    const werewolfAllies = msState?.werewolf_allies ?? []

    const [view, setView] = useState<NightView>('activity')
    const [selected, setSelected] = useState<string[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [actionResult, setActionResult] = useState<Record<string, unknown> | null>(null)
    const [error, setError] = useState('')
    const [submitLocked, setSubmitLocked] = useState(true)
    const [hasActed, setHasActed] = useState(false)

    const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const prevIsMyTurnRef = useRef(false)

    // Seer mode toggle
    const [seerMode, setSeerMode] = useState<'player' | 'center'>('player')

    // ── Detect turn start → swap to role action ──
    useEffect(() => {
        if (isMyTurn && !prevIsMyTurnRef.current && !hasActed) {
            // My turn just started
            setView('role-action')
            setSelected([])
            setActionResult(null)
            setError('')
            setSubmitLocked(true)

            // Unlock submit after minimum duration
            lockTimerRef.current = setTimeout(() => {
                setSubmitLocked(false)
            }, ROLE_ACTION_LOCK_MS)
        }
        prevIsMyTurnRef.current = isMyTurn
    }, [isMyTurn, hasActed])

    // Cleanup timers
    useEffect(() => {
        return () => {
            if (lockTimerRef.current) clearTimeout(lockTimerRef.current)
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
        }
    }, [])

    // ── Selection ──
    const handleSelect = useCallback((pos: string) => {
        setSelected((prev) =>
            prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
        )
    }, [])

    // ── Role action config ──
    let selectablePositions: string[] = []
    let maxSelect = 1
    let actionType = ''
    let instruction = ''

    if (view === 'role-action' && nightRole) {
        if (nightRole === 'werewolf') {
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

    const canSubmit = selected.length === maxSelect && !submitting && !submitLocked

    // Does this action reveal info the player needs to see?
    const isRevealAction = (result: Record<string, unknown>) =>
        Boolean(result.saw_role) || Boolean(result.saw_roles) || Boolean(result.new_role)

    async function handleSubmit() {
        if (!canSubmit) return
        setSubmitting(true)
        setError('')
        try {
            const result = await submitNightAction(actionType, selected)
            setActionResult(result)
            setHasActed(true)

            // Show toast — auto-dismiss for non-reveal actions,
            // stay visible for reveals so the player can actually read them
            setView('toast')
            if (!isRevealAction(result)) {
                toastTimerRef.current = setTimeout(() => {
                    setView('activity')
                }, TOAST_DURATION_MS)
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Action failed')
        }
        setSubmitting(false)
    }

    function dismissToast() {
        setView('activity')
    }

    // ── Render ──
    return (
        <div className="page ms-night-page">
            {/* Header — thematic, no step counter */}
            <div className="page-header">
                <h1>🌙 The Midnight Society gathers…</h1>
                <p className="subtitle">Pass the time until dawn.</p>
            </div>

            <div className="content night-surface-container">
                {/* ── TOAST: brief action confirmation ── */}
                {view === 'toast' && (
                    <div className="night-surface night-toast-surface fading-in">
                        <div className="night-toast-content">
                            <div className="night-toast-check">✓</div>
                            <p className="night-toast-text">Action recorded</p>

                            {/* Reveal: single role (werewolf peek / seer peek) */}
                            {actionResult && Boolean(actionResult.saw_role) && (
                                <div className="night-toast-reveal">
                                    <span className="night-toast-reveal-emoji">
                                        {ROLES[actionResult.saw_role as string]?.emoji}
                                    </span>
                                    <span className="night-toast-reveal-name">
                                        {ROLES[actionResult.saw_role as string]?.name}
                                    </span>
                                </div>
                            )}
                            {/* Reveal: two center cards (seer 2-center) */}
                            {actionResult && Boolean(actionResult.saw_roles) && (
                                <div className="night-toast-reveal-multi">
                                    {(actionResult.saw_roles as string[]).map((r, i) => (
                                        <div key={i} className="night-toast-reveal">
                                            <span className="night-toast-reveal-emoji">
                                                {ROLES[r]?.emoji}
                                            </span>
                                            <span className="night-toast-reveal-name">
                                                {ROLES[r]?.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {/* Reveal: robber's new role */}
                            {actionResult && Boolean(actionResult.new_role) && (
                                <div className="night-toast-reveal">
                                    <p className="night-toast-reveal-label">You are now</p>
                                    <span className="night-toast-reveal-emoji">
                                        {ROLES[actionResult.new_role as string]?.emoji}
                                    </span>
                                    <span className="night-toast-reveal-name">
                                        {ROLES[actionResult.new_role as string]?.name}
                                    </span>
                                </div>
                            )}
                            {/* Non-reveal: troublemaker swap */}
                            {actionResult && Boolean(actionResult.swapped) && (
                                <div className="night-toast-detail">
                                    <span>Cards swapped!</span>
                                </div>
                            )}

                            {/* Dismiss button for reveal actions */}
                            {actionResult && isRevealAction(actionResult) && (
                                <button
                                    className="btn-secondary night-toast-dismiss"
                                    onClick={dismissToast}
                                >
                                    Got it
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ── ROLE ACTION: same-surface swap ── */}
                {view === 'role-action' && nightRole && (
                    <div className="night-surface night-role-surface fading-in">
                        <div className="night-role-header">
                            <span className="night-role-emoji">{roleDef?.emoji}</span>
                            <span className="night-role-name">{roleDef?.name}</span>
                        </div>

                        <p className="night-role-instruction">{instruction}</p>

                        {/* Werewolf allies info */}
                        {nightRole === 'werewolf' && werewolfAllies.length > 1 && (
                            <div className="night-role-allies">
                                <span>🐺 Your pack: </span>
                                {werewolfAllies.map((id) => {
                                    const p = players.find((pl) => pl.id === id)
                                    return p ? <span key={id} className="night-ally-name">{p.name}</span> : null
                                })}
                            </div>
                        )}

                        {/* Seer toggle */}
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
                            <p className="night-role-error">{error}</p>
                        )}

                        <button
                            className="btn-primary night-role-submit"
                            disabled={!canSubmit}
                            onClick={handleSubmit}
                        >
                            {submitting ? 'Submitting…' : submitLocked ? 'Preparing…' : 'Confirm'}
                        </button>
                    </div>
                )}

                {/* ── ACTIVITIES: default layer ── */}
                {view === 'activity' && (
                    <div className="night-surface fading-in">
                        {/* Inline role reminders (non-disruptive) */}
                        {startingDef && (
                            <div className="night-role-reminder">
                                {startingDef.emoji} {startingDef.name}
                                {hasActed && ' · Done'}
                            </div>
                        )}

                        <NightActivity
                            activity={nightActivities.currentActivity}
                            onAnswer={nightActivities.onAnswer}
                            answered={nightActivities.answered}
                            transitioning={nightActivities.transitioning}
                            score={nightActivities.score}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
