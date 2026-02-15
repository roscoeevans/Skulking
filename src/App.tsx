import { useGame } from './game/context'
import { Lobby } from './pages/Lobby'
import { Bidding } from './pages/Bidding'
import { RevealBids } from './pages/RevealBids'
import { Scoring } from './pages/Scoring'
import { Leaderboard } from './pages/Leaderboard'
import { FinalStandings } from './pages/FinalStandings'

function GameRouter() {
  const { game, loading, currentPlayer } = useGame()

  if (loading) {
    return (
      <div className="page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ font: 'var(--text-title-3)', color: 'var(--color-white)' }}>
          Loading<span className="waiting-dots" />
        </p>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ font: 'var(--text-title-3)', color: 'var(--color-white)' }}>
          Could not connect to game server
        </p>
      </div>
    )
  }

  const phase = game.phase

  // Lobby phase — or if game is in progress but player hasn't joined
  if (phase === 'lobby' || (!currentPlayer && phase !== 'finished')) {
    return <Lobby />
  }

  // If player still isn't identified after lobby, show a reconnect view
  if (!currentPlayer) {
    return <FinalStandings />
  }

  switch (phase) {
    case 'bidding':
      return <Bidding />
    case 'reveal_bids':
      return <RevealBids />
    case 'scoring':
      return <Scoring />
    case 'leaderboard':
      return <Leaderboard />
    case 'finished':
      return <FinalStandings />
    default:
      return <Lobby />
  }
}

export default function App() {
  return <GameRouter />
}
