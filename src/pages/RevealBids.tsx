import { useMemo } from 'react'
import { useGame } from '../game/context'

export function RevealBids() {
  const { game, players, bids, scores, currentPlayer, advanceToScoring } =
    useGame()
  const round = game?.round_number ?? 1

  const roundBids = useMemo(
    () =>
      players.map((p) => {
        const bid = bids.find(
          (b) => b.player_id === p.id && b.round_number === round
        )
        return { player: p, bid: bid?.bid ?? 0 }
      }),
    [players, bids, round]
  )

  // Current leaderboard (from previous rounds)
  const leaderboard = useMemo(() => {
    if (round <= 1) return []
    return players
      .map((p) => {
        const score = scores.find(
          (s) => s.player_id === p.id && s.round_number === round - 1
        )
        return { player: p, total: score?.total_points ?? 0 }
      })
      .sort((a, b) => b.total - a.total)
  }, [players, scores, round])

  const isAdmin = currentPlayer?.is_admin ?? false

  return (
    <div className="page">
      <div className="page-header">
        <div className="round-badge">Round {round} &middot; {round} cards</div>
        <h1>All Bids</h1>
        <p className="subtitle">Play your hands. Admin advances when done.</p>
      </div>

      <div className="content">
        <div className="bid-table">
          {roundBids.map(({ player, bid }) => (
            <div key={player.id} className="bid-row">
              <span className="bid-name">{player.name}</span>
              <span className="bid-value">{bid}</span>
            </div>
          ))}
        </div>

        {leaderboard.length > 0 && (
          <>
            <div className="section-label" style={{ marginTop: 'var(--space-16)' }}>
              Current Standings
            </div>
            <div className="scoreboard">
              {leaderboard.map(({ player, total }, i) => (
                <div key={player.id} className="score-row">
                  <span className="score-rank">{i + 1}</span>
                  <span className="score-name">{player.name}</span>
                  <span className="score-total">{total}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {isAdmin && (
        <div className="actions">
          <button className="btn-warm" onClick={advanceToScoring}>
            Start Scoring
          </button>
        </div>
      )}
    </div>
  )
}
