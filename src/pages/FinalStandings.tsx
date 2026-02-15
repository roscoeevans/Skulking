import { useMemo } from 'react'
import { useGame } from '../game/context'

/* ── Color palette for the chart lines ── */
const PLAYER_COLORS = [
  '#5AC8FA', // sky
  '#F7821B', // amber
  '#E8497E', // rose
  '#34D399', // emerald
  '#A78BFA', // violet
  '#FBBF24', // gold
  '#FB7185', // pink
  '#38BDF8', // light blue
  '#F472B6', // hot pink
  '#4ADE80', // green
]

export function FinalStandings() {
  const {
    game,
    players,
    scores,
    bids,
    results,
    currentPlayer,
    resetGame,
    restartSamePlayers,
  } = useGame()

  const isAdmin = currentPlayer?.is_admin ?? false
  const totalRounds = game?.total_rounds ?? 10

  /* ── Final Rankings ── */
  const ranked = useMemo(() => {
    return players
      .map((p) => {
        const finalScore = scores.find(
          (s) => s.player_id === p.id && s.round_number === totalRounds
        )
        return {
          player: p,
          totalPoints: finalScore?.total_points ?? 0,
        }
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
  }, [players, scores])

  /* ── Chart Data (cumulative points per round per player) ── */
  const chartData = useMemo(() => {
    const roundNumbers = Array.from({ length: totalRounds }, (_, i) => i + 1)

    const series = players.map((p, idx) => {
      const points = roundNumbers.map((r) => {
        const s = scores.find(
          (sc) => sc.player_id === p.id && sc.round_number === r
        )
        return s?.total_points ?? 0
      })
      return { name: p.name, color: PLAYER_COLORS[idx % PLAYER_COLORS.length], points }
    })

    const allPoints = series.flatMap((s) => s.points)
    const minY = Math.min(0, ...allPoints)
    const maxY = Math.max(0, ...allPoints)

    return { roundNumbers, series, minY, maxY }
  }, [players, scores])

  /* ── Awards ── */
  const awards = useMemo(() => {
    if (scores.length === 0) return []

    const playerMap = new Map(players.map((p) => [p.id, p.name]))

    // Best Round
    const bestRound = [...scores].sort(
      (a, b) => b.round_points - a.round_points
    )[0]

    // Worst Round
    const worstRound = [...scores].sort(
      (a, b) => a.round_points - b.round_points
    )[0]

    // Sharpshooter (most exact bids)
    const exactCounts = new Map<string, number>()
    for (const b of bids) {
      const r = results.find(
        (res) =>
          res.player_id === b.player_id && res.round_number === b.round_number
      )
      if (r && r.tricks_won === b.bid) {
        exactCounts.set(b.player_id, (exactCounts.get(b.player_id) ?? 0) + 1)
      }
    }
    const sharpshooter = [...exactCounts.entries()].sort(
      (a, b) => b[1] - a[1]
    )[0]

    // Plunderer (most total tricks)
    const trickCounts = new Map<string, number>()
    for (const r of results) {
      trickCounts.set(r.player_id, (trickCounts.get(r.player_id) ?? 0) + r.tricks_won)
    }
    const plunderer = [...trickCounts.entries()].sort(
      (a, b) => b[1] - a[1]
    )[0]

    return [
      bestRound && {
        emoji: '🔥',
        title: 'Best Round',
        name: playerMap.get(bestRound.player_id) ?? '?',
        stat: `+${bestRound.round_points} in Round ${bestRound.round_number}`,
      },
      worstRound && {
        emoji: '💀',
        title: 'Worst Round',
        name: playerMap.get(worstRound.player_id) ?? '?',
        stat: `${worstRound.round_points} in Round ${worstRound.round_number}`,
      },
      sharpshooter && {
        emoji: '🎯',
        title: 'Sharpshooter',
        name: playerMap.get(sharpshooter[0]) ?? '?',
        stat: `${sharpshooter[1]} of ${totalRounds} exact bids`,
      },
      plunderer && {
        emoji: '🏴‍☠️',
        title: 'Plunderer',
        name: playerMap.get(plunderer[0]) ?? '?',
        stat: `${plunderer[1]} total tricks`,
      },
    ].filter(Boolean) as Array<{
      emoji: string
      title: string
      name: string
      stat: string
    }>
  }, [scores, bids, results, players])

  /* ── SVG Chart Renderer ── */
  const renderChart = () => {
    const { roundNumbers, series, minY, maxY } = chartData
    const W = 360
    const H = 200
    const PAD = { top: 16, right: 16, bottom: 28, left: 40 }
    const plotW = W - PAD.left - PAD.right
    const plotH = H - PAD.top - PAD.bottom
    const range = maxY - minY || 1

    const xScale = (r: number) =>
      PAD.left + ((r - 1) / (totalRounds - 1)) * plotW
    const yScale = (v: number) =>
      PAD.top + plotH - ((v - minY) / range) * plotH

    // Zero line Y
    const zeroY = yScale(0)

    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        <line
          x1={PAD.left} y1={zeroY} x2={W - PAD.right} y2={zeroY}
          stroke="rgba(255,255,255,0.2)" strokeWidth="1"
        />
        {/* Y axis labels */}
        <text x={PAD.left - 6} y={PAD.top + 4} className="chart-label" textAnchor="end">
          {maxY}
        </text>
        <text x={PAD.left - 6} y={zeroY + 4} className="chart-label" textAnchor="end">
          0
        </text>
        {minY < 0 && (
          <text
            x={PAD.left - 6} y={PAD.top + plotH + 4}
            className="chart-label" textAnchor="end"
          >
            {minY}
          </text>
        )}
        {/* X axis labels */}
        {roundNumbers.map((r) => (
          <text
            key={r} x={xScale(r)} y={H - 6}
            className="chart-label" textAnchor="middle"
          >
            {r}
          </text>
        ))}
        {/* Lines */}
        {series.map((s) => (
          <polyline
            key={s.name}
            fill="none"
            stroke={s.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={s.points
              .map((pt, i) => `${xScale(i + 1)},${yScale(pt)}`)
              .join(' ')}
          />
        ))}
        {/* Dots on final round */}
        {series.map((s) => (
          <circle
            key={`dot-${s.name}`}
            cx={xScale(totalRounds)}
            cy={yScale(s.points[totalRounds - 1])}
            r="4"
            fill={s.color}
          />
        ))}
      </svg>
    )
  }

  return (
    <div className="page final-page">
      {/* ── Winner + Rankings ── */}
      <div className="page-header">
        <h1>Final Standings</h1>
        <p className="subtitle">{totalRounds} rounds complete</p>
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

        {/* ── Score Journey Chart ── */}
        <div className="section-label">Score Journey</div>
        <div className="card chart-container">
          {renderChart()}
          <div className="chart-legend">
            {chartData.series.map((s) => (
              <div key={s.name} className="chart-legend-item">
                <span
                  className="chart-legend-dot"
                  style={{ background: s.color }}
                />
                <span>{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Awards ── */}
        <div className="section-label">Awards</div>
        <div className="awards-grid">
          {awards.map((a) => (
            <div key={a.title} className="award-card card">
              <span className="award-emoji">{a.emoji}</span>
              <span className="award-title">{a.title}</span>
              <span className="award-name">{a.name}</span>
              <span className="award-stat">{a.stat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Admin Controls ── */}
      {isAdmin && (
        <div className="actions admin-controls">
          <button className="btn-warm" onClick={restartSamePlayers}>
            Play Again
          </button>
          <button className="btn-destructive" onClick={resetGame}>
            New Game
          </button>
        </div>
      )}
    </div>
  )
}
