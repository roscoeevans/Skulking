import { useGame } from './game/context'
import { Lobby } from './pages/Lobby'
import { GameSelect } from './pages/GameSelect'
import { GameConfig } from './pages/GameConfig'
import { Bidding } from './pages/Bidding'
import { RevealBids } from './pages/RevealBids'
import { Scoring } from './pages/Scoring'
import { Leaderboard } from './pages/Leaderboard'
import { FinalStandings } from './pages/FinalStandings'
import { MidnightProvider } from './midnight/MidnightContext'
import { MsSetup } from './pages/midnight/MsSetup'
import { MsDeal } from './pages/midnight/MsDeal'
import { MsNight } from './pages/midnight/MsNight'
import { MsDiscussion } from './pages/midnight/MsDiscussion'
import { MsVoting } from './pages/midnight/MsVoting'
import { MsResults } from './pages/midnight/MsResults'

function MsPage({ children }: { children: React.ReactNode }) {
  return <MidnightProvider>{children}</MidnightProvider>
}

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
    case 'game_select':
      return <GameSelect />
    case 'config':
      return <GameConfig />
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

    // ── Midnight Society ──
    case 'ms_setup':
      return <MsPage><MsSetup /></MsPage>
    case 'ms_deal':
      return <MsPage><MsDeal /></MsPage>
    case 'ms_night':
      return <MsPage><MsNight /></MsPage>
    case 'ms_discussion':
      return <MsPage><MsDiscussion /></MsPage>
    case 'ms_voting':
      return <MsPage><MsVoting /></MsPage>
    case 'ms_results':
      return <MsPage><MsResults /></MsPage>

    default:
      return <Lobby />
  }
}

export default function App() {
  return <GameRouter />
}
