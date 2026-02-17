import { RoleCard } from './RoleCard'
import { useGame } from '../../game/context'

interface BoardGridProps {
    /** Which positions are tappable */
    selectablePositions?: string[]
    /** Currently selected positions */
    selected?: string[]
    /** Callback when a position is tapped */
    onSelect?: (position: string) => void
    /** Positions to reveal (show face-up) */
    revealedPositions?: Record<string, string>
    /** Max selectable */
    maxSelect?: number
}

export function BoardGrid({
    selectablePositions = [],
    selected = [],
    onSelect,
    revealedPositions = {},
    maxSelect = 1,
}: BoardGridProps) {
    const { players } = useGame()

    function handleTap(position: string) {
        if (!onSelect || !selectablePositions.includes(position)) return
        if (selected.includes(position)) {
            // deselect
            onSelect(position)
        } else if (selected.length < maxSelect) {
            onSelect(position)
        }
    }

    return (
        <div className="board-grid">
            {/* Center cards */}
            <div className="board-grid-label">Center Cards</div>
            <div className="board-grid-center">
                {[0, 1, 2].map((i) => {
                    const pos = `C:${i}`
                    const isRevealed = pos in revealedPositions
                    return (
                        <RoleCard
                            key={pos}
                            role={isRevealed ? revealedPositions[pos] : undefined}
                            faceUp={isRevealed}
                            size="small"
                            selected={selected.includes(pos)}
                            onClick={selectablePositions.includes(pos) ? () => handleTap(pos) : undefined}
                            label={`Card ${i + 1}`}
                        />
                    )
                })}
            </div>

            {/* Player cards */}
            <div className="board-grid-label">Player Cards</div>
            <div className="board-grid-players">
                {players.map((p) => {
                    const pos = `P:${p.id}`
                    const isRevealed = pos in revealedPositions
                    return (
                        <RoleCard
                            key={pos}
                            role={isRevealed ? revealedPositions[pos] : undefined}
                            faceUp={isRevealed}
                            size="small"
                            selected={selected.includes(pos)}
                            onClick={selectablePositions.includes(pos) ? () => handleTap(pos) : undefined}
                            label={p.name}
                        />
                    )
                })}
            </div>
        </div>
    )
}
