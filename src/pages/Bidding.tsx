import { useState, useMemo } from 'react'
import { useGame } from '../game/context'
import { getGameDefinition } from '../game/definitions'
import { NumberPicker } from '../components/NumberPicker'
import { ConfirmModal } from '../components/ConfirmModal'

export function Bidding() {
  const { game, currentPlayer, players, bids, submitBid } = useGame()
  const [selectedBid, setSelectedBid] = useState<number | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const round = game?.round_number ?? 1
  const def = getGameDefinition(game?.game_type ?? 'skulking')
  const cards = def.cardsPerRound(round)

  // Has this player already bid this round?
  const myBid = useMemo(
    () =>
      bids.find(
        (b) =>
          b.player_id === currentPlayer?.id && b.round_number === round
      ),
    [bids, currentPlayer, round]
  )

  const bidsInCount = useMemo(
    () => bids.filter((b) => b.round_number === round).length,
    [bids, round]
  )

  async function handleConfirm() {
    if (selectedBid === null || submitting) return
    setSubmitting(true)
    setError('')
    try {
      await submitBid(selectedBid)
      setShowConfirm(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit bid')
    } finally {
      setSubmitting(false)
    }
  }

  // Already bid — waiting state
  if (myBid) {
    return (
      <div className="page">
        <div className="page-header">
          <div className="round-badge">Round {round} &middot; {cards} cards</div>
          <h1>Bid Locked</h1>
          <p className="subtitle">You bid {myBid.bid}</p>
        </div>
        <div className="content" style={{ justifyContent: 'center' }}>
          <div className="waiting">
            <p className="waiting-text">
              Waiting for others<span className="waiting-dots" />
            </p>
            <p style={{ font: 'var(--text-footnote)', color: 'rgba(255,255,255,0.5)', marginTop: 'var(--space-8)' }}>
              {bidsInCount} of {players.length} bids in
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="round-badge">Round {round} &middot; {cards} cards</div>
        <h1>Your Bid</h1>
        <p className="subtitle">How many tricks will you win?</p>
      </div>

      <div className="content" style={{ justifyContent: 'center' }}>
        <NumberPicker
          min={0}
          max={cards}
          value={selectedBid}
          onChange={setSelectedBid}
        />
      </div>

      <div className="actions">
        {error && (
          <p style={{ font: 'var(--text-footnote)', color: 'var(--color-watermelon)', textAlign: 'center' }}>
            {error}
          </p>
        )}
        <button
          className="btn-primary"
          disabled={selectedBid === null}
          onClick={() => setShowConfirm(true)}
        >
          Confirm Bid
        </button>
      </div>

      {showConfirm && (
        <ConfirmModal
          title="Lock your bid?"
          message={`You're bidding ${selectedBid} trick${selectedBid === 1 ? '' : 's'} this round. This cannot be changed.`}
          confirmLabel="Lock Bid"
          cancelLabel="Go Back"
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
