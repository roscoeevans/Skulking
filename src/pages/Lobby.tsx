import { useState } from 'react'
import { useGame } from '../game/context'
import { SwipeableRow } from '../components/SwipeableRow'

export function Lobby() {
  const { players, currentPlayer, joinGame, startGame, removePlayer } = useGame()
  const [name, setName] = useState('')
  const [isRocky, setIsRocky] = useState(false)
  const [isSam, setIsSam] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  const isAdmin = isRocky || isSam
  const effectiveName = isRocky ? 'Rocky' : isSam ? 'Sam' : name.trim()
  const canJoin = effectiveName.length > 0 && !joining

  // Check if an admin already exists in the game
  const adminExists = players.some((p) => p.is_admin)

  async function handleJoin() {
    if (!canJoin) return
    setJoining(true)
    setError('')
    try {
      await joinGame(effectiveName, isAdmin)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to join')
      setJoining(false)
    }
  }

  async function handleStart() {
    try {
      await startGame()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to start')
    }
  }

  async function handleRemovePlayer(playerId: string) {
    try {
      await removePlayer(playerId)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to remove')
    }
  }

  // Already joined — show lobby waiting view
  if (currentPlayer) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Skulking</h1>
          <p className="subtitle">Waiting for players</p>
        </div>

        <div className="content">
          <div className="section-label">
            Players ({players.length})
          </div>
          <div className="player-list">
            {players.map((p) => {
              const isSelf = p.id === currentPlayer.id
              const row = (
                <div className="player-row">
                  <span className="player-name">
                    {p.name}
                    {isSelf ? ' (you)' : ''}
                  </span>
                  {p.is_admin && <span className="admin-badge">Admin</span>}
                </div>
              )

              // Admin can swipe-to-remove other players
              if (currentPlayer.is_admin && !isSelf) {
                return (
                  <SwipeableRow
                    key={p.id}
                    onDelete={() => handleRemovePlayer(p.id)}
                  >
                    {row}
                  </SwipeableRow>
                )
              }

              return <div key={p.id}>{row}</div>
            })}
          </div>
        </div>

        {currentPlayer.is_admin && (
          <div className="actions">
            {error && (
              <p style={{ font: 'var(--text-footnote)', color: 'var(--color-watermelon)', textAlign: 'center' }}>
                {error}
              </p>
            )}
            <button
              className="btn-primary"
              disabled={players.length < 2}
              onClick={handleStart}
            >
              Start Game
            </button>
            {players.length < 2 && (
              <p style={{ font: 'var(--text-footnote)', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
                Need at least 2 players
              </p>
            )}
          </div>
        )}

        {!currentPlayer.is_admin && (
          <div className="actions">
            <div className="waiting">
              <p className="waiting-text">
                Waiting for admin to start<span className="waiting-dots" />
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Not joined — show join form
  return (
    <div className="page">
      <div className="page-header">
        <h1>Skulking</h1>
        <p className="subtitle">Enter the game</p>
      </div>

      <div className="content">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
          <div className="form-group">
            <label className="form-label">Your name</label>
            <input
              className="input"
              type="text"
              placeholder="Enter your name"
              value={isRocky ? 'Rocky' : isSam ? 'Sam' : name}
              onChange={(e) => {
                setName(e.target.value)
                setIsRocky(false)
                setIsSam(false)
              }}
              disabled={isRocky || isSam}
              maxLength={20}
              autoFocus
            />
          </div>

          {!adminExists && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={isRocky}
                  onChange={(e) => {
                    setIsRocky(e.target.checked)
                    if (e.target.checked) setIsSam(false)
                  }}
                />
                <span>I am Rocky</span>
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={isSam}
                  onChange={(e) => {
                    setIsSam(e.target.checked)
                    if (e.target.checked) setIsRocky(false)
                  }}
                />
                <span>I am Sam</span>
              </label>
            </div>
          )}
        </div>

        {players.length > 0 && (
          <>
            <div className="section-label">
              Already here ({players.length})
            </div>
            <div className="player-list">
              {players.map((p) => (
                <div key={p.id} className="player-row">
                  <span className="player-name">{p.name}</span>
                  {p.is_admin && <span className="admin-badge">Admin</span>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="actions">
        {error && (
          <p style={{ font: 'var(--text-footnote)', color: 'var(--color-watermelon)', textAlign: 'center' }}>
            {error}
          </p>
        )}
        <button
          className="btn-primary"
          disabled={!canJoin}
          onClick={handleJoin}
        >
          {joining ? 'Joining...' : 'Join Game'}
        </button>
      </div>
    </div>
  )
}
