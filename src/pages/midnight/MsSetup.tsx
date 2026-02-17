import { useState, useMemo } from 'react'
import { useMidnight } from '../../midnight/MidnightContext'
import { useGame } from '../../game/context'
import { ROLES, getPreset, PRESET_LIST } from '../../midnight/roles'

export function MsSetup() {
    const { players, currentPlayer } = useGame()
    const { setupGame } = useMidnight()
    const isAdmin = currentPlayer?.is_admin ?? false

    const totalNeeded = players.length + 3
    const [roleCounts, setRoleCounts] = useState<Record<string, number>>(() =>
        getPreset('standard', players.length)
    )
    const [discussionMin, setDiscussionMin] = useState(5)
    const [votingSec, setVotingSec] = useState(30)
    const [loneWolfPeek, setLoneWolfPeek] = useState(true)
    const [tieAllDie, setTieAllDie] = useState(true)
    const [starting, setStarting] = useState(false)
    const [error, setError] = useState('')

    const totalSelected = useMemo(
        () => Object.values(roleCounts).reduce((s, n) => s + n, 0),
        [roleCounts]
    )

    const isValid = totalSelected === totalNeeded
        && (roleCounts.werewolf ?? 0) >= 1

    function applyPreset(presetId: string) {
        setRoleCounts(getPreset(presetId, players.length))
    }

    function adjustRole(roleId: string, delta: number) {
        setRoleCounts((prev) => {
            const current = prev[roleId] ?? 0
            const max = ROLES[roleId].maxCount
            const next = Math.max(0, Math.min(max, current + delta))
            const result = { ...prev, [roleId]: next }
            // Remove zero entries (except werewolf)
            if (result[roleId] === 0 && roleId !== 'werewolf') {
                delete result[roleId]
            }
            return result
        })
    }

    async function handleDeal() {
        if (starting || !isValid) return
        setStarting(true)
        setError('')
        try {
            // Build flat role array from counts
            const roles: string[] = []
            for (const [roleId, count] of Object.entries(roleCounts)) {
                for (let i = 0; i < count; i++) roles.push(roleId)
            }
            await setupGame(roles, {
                discussion_seconds: discussionMin * 60,
                voting_seconds: votingSec,
                lone_wolf_peek: loneWolfPeek,
                tie_all_die: tieAllDie,
            })
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Setup failed')
            setStarting(false)
        }
    }

    if (!isAdmin) {
        return (
            <div className="page">
                <div className="page-header">
                    <h1>Midnight Society</h1>
                    <p className="subtitle">Admin is setting up the game…</p>
                </div>
                <div className="content" style={{ justifyContent: 'center' }}>
                    <div className="waiting">
                        <p className="waiting-text">
                            Waiting for setup<span className="waiting-dots" />
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1>Midnight Society</h1>
                <p className="subtitle">{players.length} players · {totalNeeded} cards needed</p>
            </div>

            <div className="content">
                {/* Presets */}
                <div className="ms-section">
                    <div className="section-label">Quick Setup</div>
                    <div className="ms-presets">
                        {PRESET_LIST.map((p) => (
                            <button key={p.id} className="ms-preset-btn" onClick={() => applyPreset(p.id)}>
                                <span>{p.emoji}</span>
                                <span>{p.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Role Pool */}
                <div className="ms-section">
                    <div className="section-label">
                        Roles
                        <span className={`ms-counter-badge ${isValid ? 'valid' : 'invalid'}`}>
                            {totalSelected} / {totalNeeded}
                        </span>
                    </div>
                    <div className="ms-role-list">
                        {Object.values(ROLES).map((role) => (
                            <div key={role.id} className="ms-role-row">
                                <span className="ms-role-emoji">{role.emoji}</span>
                                <div className="ms-role-info">
                                    <span className="ms-role-name">{role.name}</span>
                                    <span className={`ms-role-team team-${role.team}`}>
                                        {role.team}
                                    </span>
                                </div>
                                <div className="ms-role-stepper">
                                    <button
                                        className="counter-btn"
                                        disabled={(roleCounts[role.id] ?? 0) <= 0}
                                        onClick={() => adjustRole(role.id, -1)}
                                    >−</button>
                                    <span className="counter-value">{roleCounts[role.id] ?? 0}</span>
                                    <button
                                        className="counter-btn"
                                        disabled={(roleCounts[role.id] ?? 0) >= role.maxCount}
                                        onClick={() => adjustRole(role.id, 1)}
                                    >+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timers */}
                <div className="ms-section">
                    <div className="section-label">Timers</div>
                    <div className="ms-timer-row">
                        <span>Discussion</span>
                        <div className="ms-role-stepper">
                            <button className="counter-btn" disabled={discussionMin <= 1}
                                onClick={() => setDiscussionMin((v) => v - 1)}>−</button>
                            <span className="counter-value">{discussionMin}m</span>
                            <button className="counter-btn" disabled={discussionMin >= 10}
                                onClick={() => setDiscussionMin((v) => v + 1)}>+</button>
                        </div>
                    </div>
                    <div className="ms-timer-row">
                        <span>Voting</span>
                        <div className="ms-role-stepper">
                            <button className="counter-btn" disabled={votingSec <= 15}
                                onClick={() => setVotingSec((v) => v - 15)}>−</button>
                            <span className="counter-value">{votingSec}s</span>
                            <button className="counter-btn" disabled={votingSec >= 120}
                                onClick={() => setVotingSec((v) => v + 15)}>+</button>
                        </div>
                    </div>
                </div>

                {/* Rules */}
                <div className="ms-section">
                    <div className="section-label">Rules</div>
                    <label className="checkbox-row">
                        <input type="checkbox" checked={loneWolfPeek}
                            onChange={(e) => setLoneWolfPeek(e.target.checked)} />
                        Lone werewolf peeks at center
                    </label>
                    <label className="checkbox-row">
                        <input type="checkbox" checked={tieAllDie}
                            onChange={(e) => setTieAllDie(e.target.checked)} />
                        Tied players all die
                    </label>
                </div>

                {error && (
                    <p style={{ color: 'var(--color-destructive)', font: 'var(--text-footnote)', textAlign: 'center' }}>
                        {error}
                    </p>
                )}
            </div>

            <div className="actions">
                <button
                    className="btn-primary"
                    disabled={!isValid || starting}
                    onClick={handleDeal}
                >
                    {starting ? 'Dealing…' : '🃏 Deal Cards'}
                </button>
                {!isValid && (
                    <p style={{ font: 'var(--text-footnote)', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
                        {totalSelected < totalNeeded
                            ? `Add ${totalNeeded - totalSelected} more role${totalNeeded - totalSelected > 1 ? 's' : ''}`
                            : `Remove ${totalSelected - totalNeeded} role${totalSelected - totalNeeded > 1 ? 's' : ''}`}
                    </p>
                )}
            </div>
        </div>
    )
}
