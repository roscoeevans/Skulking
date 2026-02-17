import { useMemo } from 'react'
import { useGame } from '../game/context'
import { getGameDefinition } from '../game/definitions'
import { LootBanner } from '../components/LootBanner'

export function Leaderboard() {
  const { game, players, scores, currentPlayer, nextRound } = useGame()
  const round = game?.round_number ?? 1
  const totalRounds = game?.total_rounds ?? 10
  const def = getGameDefinition(game?.game_type ?? 'skulking')

  const ranked = useMemo(() => {
    return players
      .map((p) => {
        const score = scores.find(
          (s) => s.player_id === p.id && s.round_number === round
        )
        return {
          player: p,
          roundPoints: score?.round_points ?? 0,
          totalPoints: score?.total_points ?? 0,
          hasBonus: score?.has_bonus ?? false,
          lootBonus: score?.loot_bonus ?? 0,
        }
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
  }, [players, scores, round])

  const isAdmin = currentPlayer?.is_admin ?? false
  const isFinalRound = round >= totalRounds

  return (
    <div className="page">
      <div className="page-header">
        <div className="round-badge">Round {round} complete</div>
        <h1>Leaderboard</h1>
      </div>

      <div className="content">
        {def.hasAlliances && <LootBanner />}
        <div className="scoreboard">
          {ranked.map(({ player, roundPoints, totalPoints, hasBonus, lootBonus }, i) => (
            <div
              key={player.id}
              className={`score-row${hasBonus ? ' has-bonus' : ''}`}
            >
              <span className="score-rank">{i + 1}</span>
              {hasBonus && <span className="score-bonus-icon">&#9733;</span>}
              <span className="score-name">{player.name}</span>
              <span
                className={`score-points ${roundPoints >= 0 ? 'points-positive' : 'points-negative'
                  }`}
              >
                {roundPoints >= 0 ? '+' : ''}
                {roundPoints}
              </span>
              {lootBonus > 0 && (
                <span className="loot-chip">🪙+{lootBonus}</span>
              )}
              <span className="score-total">{totalPoints}</span>
            </div>
          ))}
        </div>
      </div>

      {isAdmin && (
        <div className="actions">
          <button className="btn-primary" onClick={nextRound}>
            {isFinalRound ? 'Final Standings' : 'Next Round'}
          </button>
        </div>
      )}

      {!isAdmin && (
        <div className="actions">
          <div className="waiting">
            <p className="waiting-text">
              Waiting for admin<span className="waiting-dots" />
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
