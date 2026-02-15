import type { Bonuses } from '../game/types'

interface BonusPickerProps {
  bonuses: Bonuses
  onChange: (bonuses: Bonuses) => void
  disabled?: boolean
}

export function BonusPicker({ bonuses, onChange, disabled }: BonusPickerProps) {
  const update = (patch: Partial<Bonuses>) =>
    onChange({ ...bonuses, ...patch })

  return (
    <div className="card bonus-section">
      <div className="bonus-section-title">Bonuses</div>
      {disabled && (
        <p style={{ font: 'var(--text-footnote)', color: 'var(--color-gray-400)' }}>
          Only count if you made your bid
        </p>
      )}

      {/* Black 14 */}
      <div className="bonus-row">
        <label className="checkbox-row" style={{ flex: 1, minHeight: 'auto' }}>
          <input
            type="checkbox"
            checked={bonuses.black14}
            onChange={(e) => update({ black14: e.target.checked })}
          />
          <span className="bonus-label">Black 14</span>
        </label>
        <span className="bonus-value">+20</span>
      </div>

      {/* Color 14s */}
      <div className="bonus-row">
        <span className="bonus-label">Color 14s</span>
        <div className="counter">
          <button
            type="button"
            className="counter-btn"
            disabled={bonuses.color14s <= 0}
            onClick={() => update({ color14s: bonuses.color14s - 1 })}
          >
            -
          </button>
          <span className="counter-value">{bonuses.color14s}</span>
          <button
            type="button"
            className="counter-btn"
            disabled={bonuses.color14s >= 4}
            onClick={() => update({ color14s: bonuses.color14s + 1 })}
          >
            +
          </button>
        </div>
        <span className="bonus-value" style={{ marginLeft: 'var(--space-8)' }}>+10ea</span>
      </div>

      {/* Mermaid defeats Skull King */}
      <div className="bonus-row">
        <label className="checkbox-row" style={{ flex: 1, minHeight: 'auto' }}>
          <input
            type="checkbox"
            checked={bonuses.mermaidDefeatsSkullKing}
            onChange={(e) =>
              update({ mermaidDefeatsSkullKing: e.target.checked })
            }
          />
          <span className="bonus-label">Mermaid defeats Skull King</span>
        </label>
        <span className="bonus-value">+40</span>
      </div>

      {/* Skull King defeats Pirates */}
      <div className="bonus-row">
        <span className="bonus-label">Skull King defeats Pirates</span>
        <div className="counter">
          <button
            type="button"
            className="counter-btn"
            disabled={bonuses.skullKingDefeatsPirates <= 0}
            onClick={() =>
              update({
                skullKingDefeatsPirates: bonuses.skullKingDefeatsPirates - 1,
              })
            }
          >
            -
          </button>
          <span className="counter-value">
            {bonuses.skullKingDefeatsPirates}
          </span>
          <button
            type="button"
            className="counter-btn"
            disabled={bonuses.skullKingDefeatsPirates >= 5}
            onClick={() =>
              update({
                skullKingDefeatsPirates: bonuses.skullKingDefeatsPirates + 1,
              })
            }
          >
            +
          </button>
        </div>
        <span className="bonus-value" style={{ marginLeft: 'var(--space-8)' }}>+30ea</span>
      </div>

      {/* Pirates defeat Mermaids */}
      <div className="bonus-row">
        <span className="bonus-label">Pirates defeat Mermaids</span>
        <div className="counter">
          <button
            type="button"
            className="counter-btn"
            disabled={bonuses.piratesDefeatMermaids <= 0}
            onClick={() =>
              update({
                piratesDefeatMermaids: bonuses.piratesDefeatMermaids - 1,
              })
            }
          >
            -
          </button>
          <span className="counter-value">
            {bonuses.piratesDefeatMermaids}
          </span>
          <button
            type="button"
            className="counter-btn"
            disabled={bonuses.piratesDefeatMermaids >= 2}
            onClick={() =>
              update({
                piratesDefeatMermaids: bonuses.piratesDefeatMermaids + 1,
              })
            }
          >
            +
          </button>
        </div>
        <span className="bonus-value" style={{ marginLeft: 'var(--space-8)' }}>+20ea</span>
      </div>
    </div>
  )
}
