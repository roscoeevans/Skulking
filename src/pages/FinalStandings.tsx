import { useMemo } from 'react'
import { useGame } from '../game/context'
import { MAX_ROUNDS } from '../game/types'

export function FinalStandings() {
  const { players, scores, currentPlayer, resetGame } = useGame()

  const ranked = useMemo(() => {
    return players
      .map((p) => {
        const finalScore = scores.find(
          (s) => s.player_id === p.id && s.round_number === MAX_ROUNDS
        )
        return {
          player: p,
          totalPoints: finalScore?.total_points ?? 0,
        }
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
  }, [players, scores])

  const isAdmin = currentPlayer?.is_admin ?? false

  return (
    <div className="page">
      <div className="page-header">
        <h1>Final Standings</h1>
        <p className="subtitle">10 rounds complete</p>
      </div>

      <div className="content">
        <div className="scoreboard">
          {ranked.map(({ player, totalPoints }, i) => (
            <div
              key={player.id}
              className="score-row"
              style={
                i === 0
                  ? {
                      background: 'rgba(247, 130, 27, 0.2)',
                      borderColor: 'rgba(247, 130, 27, 0.4)',
                    }
                  : undefined
              }
            >
              <span className="score-rank">
                {i === 0 ? <span className="crown">&#x1F451;</span> : i + 1}
              </span>
              <span className="score-name">{player.name}</span>
              <span className="score-total">{totalPoints}</span>
            </div>
          ))}
        </div>
      </div>

      {isAdmin && (
        <div className="actions">
          <button className="btn-destructive" onClick={resetGame}>
            New Game
          </button>
        </div>
      )}
    </div>
  )
}
