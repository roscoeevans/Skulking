import type { Player } from '../game/types'

interface LootPickerProps {
    players: Player[]
    currentPlayerId: string
    lootPartners: string[]
    onChange: (partners: string[]) => void
}

export function LootPicker({
    players,
    currentPlayerId,
    lootPartners,
    onChange,
}: LootPickerProps) {
    const otherPlayers = players.filter((p) => p.id !== currentPlayerId)
    const allianceCount = lootPartners.length

    function setCount(n: number) {
        if (n === 0) onChange([])
        else if (n === 1) onChange([lootPartners[0] ?? ''])
        else onChange([lootPartners[0] ?? '', lootPartners[1] ?? ''])
    }

    function setPartner(index: number, id: string) {
        const updated = [...lootPartners]
        updated[index] = id
        onChange(updated)
    }

    return (
        <div className="card loot-section">
            <div className="bonus-section-title">Loot Cards</div>
            <p className="loot-hint">
                Did you play a Loot card this round?
            </p>

            <div className="loot-count-picker">
                {[0, 1, 2].map((n) => (
                    <button
                        key={n}
                        className={`loot-count-pill${n === allianceCount ? ' selected' : ''}`}
                        onClick={() => setCount(n)}
                    >
                        {n}
                    </button>
                ))}
            </div>

            {allianceCount > 0 && (
                <div className="loot-partners">
                    {Array.from({ length: allianceCount }, (_, i) => (
                        <div key={i} className="loot-partner-row">
                            <label className="form-label">
                                Alliance {allianceCount > 1 ? i + 1 : ''}
                            </label>
                            <select
                                className="loot-select"
                                value={lootPartners[i] || ''}
                                onChange={(e) => setPartner(i, e.target.value)}
                            >
                                <option value="">Select partner</option>
                                {otherPlayers.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                            <p className="loot-partner-hint">
                                +20 if BOTH hit bid
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
