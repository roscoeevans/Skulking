import { useState, useMemo } from 'react'
import { useGame } from '../game/context'
import { NumberPicker } from '../components/NumberPicker'
import { BonusPicker } from '../components/BonusPicker'
import { LootPicker } from '../components/LootPicker'
import { LootBanner } from '../components/LootBanner'
import { ConfirmModal } from '../components/ConfirmModal'
import { EMPTY_BONUSES } from '../game/types'
import type { Bonuses } from '../game/types'

export function Scoring() {
  const { game, currentPlayer, players, bids, results, submitResult } =
    useGame()
  const [tricks, setTricks] = useState<number | null>(null)
  const [bonuses, setBonuses] = useState<Bonuses>({ ...EMPTY_BONUSES })
  const [lootPartners, setLootPartners] = useState<string[]>([])
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const round = game?.round_number ?? 1

  const myBid = useMemo(
    () =>
      bids.find(
        (b) =>
          b.player_id === currentPlayer?.id && b.round_number === round
      ),
    [bids, currentPlayer, round]
  )

  const myResult = useMemo(
    () =>
      results.find(
        (r) =>
          r.player_id === currentPlayer?.id && r.round_number === round
      ),
    [results, currentPlayer, round]
  )

  const resultsInCount = useMemo(
    () => results.filter((r) => r.round_number === round).length,
    [results, round]
  )

  async function handleConfirm() {
    if (tricks === null || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const validLoot = lootPartners.filter((p) => p !== '')
      await submitResult(tricks, bonuses, validLoot)
      setShowConfirm(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  // Already submitted
  if (myResult) {
    return (
      <div className="page">
        <div className="page-header">
          <div className="round-badge">Round {round} &middot; {round} cards</div>
          <h1>Score Locked</h1>
          <p className="subtitle">
            Bid {myBid?.bid ?? '?'} &middot; Won {myResult.tricks_won}
          </p>
        </div>
        <div className="content" style={{ justifyContent: 'center' }}>
          <LootBanner />
          <div className="waiting">
            <p className="waiting-text">
              Waiting for others<span className="waiting-dots" />
            </p>
            <p style={{ font: 'var(--text-footnote)', color: 'rgba(255,255,255,0.5)', marginTop: 'var(--space-8)' }}>
              {resultsInCount} of {players.length} scores in
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="round-badge">Round {round} &middot; {round} cards</div>
        <h1>Your Score</h1>
        <p className="subtitle">You bid: {myBid?.bid ?? '?'}</p>
      </div>

      <div className="content">
        <div className="section-label">How many tricks did you win?</div>
        <NumberPicker
          min={0}
          max={round}
          value={tricks}
          onChange={setTricks}
        />

        <div style={{ marginTop: 'var(--space-16)' }}>
          <BonusPicker
            bonuses={bonuses}
            onChange={setBonuses}
            disabled={myBid?.bid === 0}
          />
        </div>

        <div style={{ marginTop: 'var(--space-16)' }}>
          <LootPicker
            players={players}
            currentPlayerId={currentPlayer?.id ?? ''}
            lootPartners={lootPartners}
            onChange={setLootPartners}
          />
        </div>
      </div>

      <div className="actions">
        {error && (
          <p style={{ font: 'var(--text-footnote)', color: 'var(--color-watermelon)', textAlign: 'center' }}>
            {error}
          </p>
        )}
        <button
          className="btn-primary"
          disabled={tricks === null}
          onClick={() => setShowConfirm(true)}
        >
          Confirm Score
        </button>
      </div>

      {showConfirm && (
        <ConfirmModal
          title="Lock your score?"
          message={`${tricks} trick${tricks === 1 ? '' : 's'} won${lootPartners.filter(p => p !== '').length > 0 ? ` · ${lootPartners.filter(p => p !== '').length} Loot alliance${lootPartners.filter(p => p !== '').length > 1 ? 's' : ''}` : ''}. This cannot be changed.`}
          confirmLabel="Lock Score"
          cancelLabel="Go Back"
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
