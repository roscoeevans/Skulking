import { useState, useEffect } from 'react'

interface CountdownTimerProps {
    endAt: string | null | undefined
    label?: string
    onComplete?: () => void
}

export function CountdownTimer({ endAt, label, onComplete }: CountdownTimerProps) {
    const [remaining, setRemaining] = useState(0)

    useEffect(() => {
        if (!endAt) return

        function tick() {
            const diff = Math.max(0, Math.floor((new Date(endAt!).getTime() - Date.now()) / 1000))
            setRemaining(diff)
            if (diff === 0 && onComplete) {
                onComplete()
            }
        }

        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [endAt, onComplete])

    const minutes = Math.floor(remaining / 60)
    const seconds = remaining % 60
    const display = `${minutes}:${seconds.toString().padStart(2, '0')}`
    const pct = endAt
        ? Math.min(100, (remaining / 600) * 100) // rough visual
        : 0
    const isUrgent = remaining <= 10

    return (
        <div className={`countdown-timer ${isUrgent ? 'urgent' : ''}`}>
            {label && <div className="countdown-label">{label}</div>}
            <div className="countdown-ring">
                <svg viewBox="0 0 100 100" className="countdown-svg">
                    <circle
                        cx="50" cy="50" r="44"
                        fill="none"
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="6"
                    />
                    <circle
                        cx="50" cy="50" r="44"
                        fill="none"
                        stroke={isUrgent ? 'var(--color-destructive)' : 'var(--color-sky)'}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 44}`}
                        strokeDashoffset={`${2 * Math.PI * 44 * (1 - pct / 100)}`}
                        transform="rotate(-90 50 50)"
                        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
                    />
                </svg>
                <span className="countdown-value">{display}</span>
            </div>
        </div>
    )
}
