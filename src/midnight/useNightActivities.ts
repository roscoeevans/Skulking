import { useState, useCallback, useEffect, useRef } from 'react'
import { shuffleActivities, type NightActivity } from './nightActivities'

/* ============================================================
   useNightActivities — manages the activity layer during night
   Activities auto-advance with random delays.
   Loops infinitely. Never stops.
   ============================================================ */

const LS_KEY = 'ms_night_activity_stats'

export interface ActivityResult {
    activity: NightActivity
    chosenIndex: number
    correct: boolean | null  // null for polls
    timeMs: number
}

export interface LifetimeStats {
    totalCorrect: number
    totalAnswered: number
    gamesPlayed: number
}

function loadLifetimeStats(): LifetimeStats {
    try {
        const raw = localStorage.getItem(LS_KEY)
        if (raw) return JSON.parse(raw)
    } catch { /* ignore */ }
    return { totalCorrect: 0, totalAnswered: 0, gamesPlayed: 0 }
}

function saveLifetimeStats(stats: LifetimeStats) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(stats))
    } catch { /* ignore */ }
}

/** Random delay between activities (0.5–1.5s) */
function randomDelay(): number {
    return 500 + Math.random() * 1000
}

export function useNightActivities() {
    const [queue] = useState(() => shuffleActivities())
    const [index, setIndex] = useState(0)
    const [score, setScore] = useState(0)
    const [results, setResults] = useState<ActivityResult[]>([])
    const [lifetimeStats, setLifetimeStats] = useState<LifetimeStats>(loadLifetimeStats)
    const [answered, setAnswered] = useState(false)
    const [transitioning, setTransitioning] = useState(false)

    const activityStartRef = useRef(Date.now())
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Current activity (wraps around)
    const currentActivity = queue[index % queue.length]

    // Reset start time when activity changes
    useEffect(() => {
        activityStartRef.current = Date.now()
        setAnswered(false)
    }, [index])

    // Auto-advance on timeout
    useEffect(() => {
        if (answered) return

        timerRef.current = setTimeout(() => {
            // Time expired — record as no answer and advance
            setResults(prev => [...prev, {
                activity: currentActivity,
                chosenIndex: -1,
                correct: null,
                timeMs: currentActivity.timeLimit * 1000,
            }])
            advanceWithDelay()
        }, currentActivity.timeLimit * 1000)

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [index, answered])

    // Cleanup on unmount
    useEffect(() => {
        // Bump gamesPlayed on mount
        setLifetimeStats(prev => {
            const updated = { ...prev, gamesPlayed: prev.gamesPlayed + 1 }
            saveLifetimeStats(updated)
            return updated
        })

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
            if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current)
        }
    }, [])

    function advanceWithDelay() {
        setAnswered(true)
        setTransitioning(true)

        // Random delay before next activity (0.5–1.5s)
        autoAdvanceRef.current = setTimeout(() => {
            setIndex(prev => prev + 1)
            setTransitioning(false)
        }, randomDelay())
    }

    const onAnswer = useCallback((chosenIndex: number) => {
        if (answered) return

        // Clear timeout
        if (timerRef.current) clearTimeout(timerRef.current)

        const timeMs = Date.now() - activityStartRef.current
        const isTrivia = currentActivity.type === 'trivia' || currentActivity.type === 'riddle' || currentActivity.type === 'reaction'
        const correct = isTrivia ? chosenIndex === currentActivity.answer : null

        if (correct) {
            setScore(prev => prev + 1)
            setLifetimeStats(prev => {
                const updated = { ...prev, totalCorrect: prev.totalCorrect + 1, totalAnswered: prev.totalAnswered + 1 }
                saveLifetimeStats(updated)
                return updated
            })
        } else {
            setLifetimeStats(prev => {
                const updated = { ...prev, totalAnswered: prev.totalAnswered + 1 }
                saveLifetimeStats(updated)
                return updated
            })
        }

        setResults(prev => [...prev, {
            activity: currentActivity,
            chosenIndex,
            correct,
            timeMs,
        }])

        advanceWithDelay()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [answered, currentActivity])

    return {
        currentActivity,
        onAnswer,
        score,
        results,
        lifetimeStats,
        answered,
        transitioning,
    }
}
