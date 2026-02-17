import { useState, useEffect, useRef } from 'react'
import type { NightActivity as NightActivityType } from '../../midnight/nightActivities'

/* ============================================================
   NightActivity — renders a single micro-activity card.
   Designed to occupy the same surface area as role action UI.
   ============================================================ */

interface Props {
    activity: NightActivityType
    onAnswer: (chosenIndex: number) => void
    answered: boolean
    transitioning: boolean
    score: number
}

export function NightActivity({ activity, onAnswer, answered, transitioning, score }: Props) {
    const [timeLeft, setTimeLeft] = useState(activity.timeLimit)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Reset timer when activity changes
    useEffect(() => {
        setTimeLeft(activity.timeLimit)

        intervalRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0.1) {
                    if (intervalRef.current) clearInterval(intervalRef.current)
                    return 0
                }
                return prev - 0.1
            })
        }, 100)

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [activity])

    // Stop timer when answered
    useEffect(() => {
        if (answered && intervalRef.current) {
            clearInterval(intervalRef.current)
        }
    }, [answered])

    const progress = Math.max(0, timeLeft / activity.timeLimit)

    const typeLabel =
        activity.type === 'trivia' ? '🧠 Trivia' :
            activity.type === 'poll' ? '📊 Poll' :
                activity.type === 'riddle' ? '🔮 Riddle' :
                    '⚡ Quick Fire'

    const typeColor =
        activity.type === 'trivia' ? 'var(--color-sky)' :
            activity.type === 'poll' ? 'var(--color-amber)' :
                activity.type === 'riddle' ? '#c084fc' :
                    'var(--color-green)'

    return (
        <div className={`night-activity-card ${transitioning ? 'fading-out' : 'fading-in'}`}>
            <div className="night-activity-type" style={{ color: typeColor }}>
                {typeLabel}
            </div>

            <p className="night-activity-question">{activity.question}</p>

            <div className="night-activity-options">
                {activity.options.map((opt, i) => {
                    let optClass = 'night-activity-option'
                    if (answered) {
                        if (activity.answer >= 0 && i === activity.answer) {
                            optClass += ' correct'
                        } else if (answered && i !== activity.answer) {
                            optClass += ' dimmed'
                        }
                    }

                    return (
                        <button
                            key={i}
                            className={optClass}
                            onClick={() => onAnswer(i)}
                            disabled={answered}
                        >
                            {opt}
                        </button>
                    )
                })}
            </div>

            <div className="night-activity-progress-bar">
                <div
                    className="night-activity-progress-fill"
                    style={{
                        width: `${progress * 100}%`,
                        backgroundColor: progress < 0.25 ? 'var(--color-destructive)' : typeColor,
                    }}
                />
            </div>

            <div className="night-activity-footer">
                <span className="night-activity-fun-label">Just for fun 🌙</span>
                <span className="night-activity-score">Score: {score}</span>
            </div>
        </div>
    )
}
