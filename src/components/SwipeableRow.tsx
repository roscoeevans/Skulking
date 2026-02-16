import { useRef, useState, type ReactNode } from 'react'

interface SwipeableRowProps {
    children: ReactNode
    onDelete: () => void
    disabled?: boolean
}

export function SwipeableRow({ children, onDelete, disabled }: SwipeableRowProps) {
    const rowRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const startX = useRef(0)
    const currentX = useRef(0)
    const [offset, setOffset] = useState(0)
    const [showDelete, setShowDelete] = useState(false)
    const [removing, setRemoving] = useState(false)
    const swiping = useRef(false)

    const THRESHOLD = 70

    function handleTouchStart(e: React.TouchEvent) {
        if (disabled || removing) return
        startX.current = e.touches[0].clientX
        swiping.current = true
    }

    function handleTouchMove(e: React.TouchEvent) {
        if (!swiping.current || disabled || removing) return
        currentX.current = e.touches[0].clientX
        const dx = startX.current - currentX.current
        const clamped = Math.max(0, Math.min(dx, 100))
        setOffset(clamped)
    }

    function handleTouchEnd() {
        if (!swiping.current || disabled || removing) return
        swiping.current = false
        if (offset >= THRESHOLD) {
            setShowDelete(true)
            setOffset(80)
        } else {
            setShowDelete(false)
            setOffset(0)
        }
    }

    function handleMouseDown(e: React.MouseEvent) {
        if (disabled || removing) return
        startX.current = e.clientX
        swiping.current = true
        const handleMove = (ev: MouseEvent) => {
            currentX.current = ev.clientX
            const dx = startX.current - currentX.current
            const clamped = Math.max(0, Math.min(dx, 100))
            setOffset(clamped)
        }
        const handleUp = () => {
            swiping.current = false
            if (offset >= THRESHOLD) {
                setShowDelete(true)
                setOffset(80)
            } else {
                setShowDelete(false)
                setOffset(0)
            }
            window.removeEventListener('mousemove', handleMove)
            window.removeEventListener('mouseup', handleUp)
        }
        window.addEventListener('mousemove', handleMove)
        window.addEventListener('mouseup', handleUp)
    }

    function handleReset() {
        if (removing) return
        setShowDelete(false)
        setOffset(0)
    }

    function handleRemove() {
        if (removing) return
        setRemoving(true)
        // Animate the row out, then call onDelete
        if (containerRef.current) {
            containerRef.current.style.transition = 'all 0.3s ease'
            containerRef.current.style.maxHeight = containerRef.current.scrollHeight + 'px'
            // Force reflow
            containerRef.current.offsetHeight
            containerRef.current.style.maxHeight = '0px'
            containerRef.current.style.opacity = '0'
            containerRef.current.style.marginBottom = '-8px'
        }
        setTimeout(() => {
            onDelete()
        }, 300)
    }

    return (
        <div
            ref={containerRef}
            className={`swipeable-container${offset > 0 || showDelete ? ' swiping' : ''}${removing ? ' removing' : ''}`}
            style={{ overflow: 'hidden' }}
        >
            <div className="swipeable-delete-bg">
                <button
                    className="swipeable-delete-btn"
                    onClick={handleRemove}
                    style={{ opacity: showDelete ? 1 : offset / THRESHOLD }}
                >
                    Remove
                </button>
            </div>
            <div
                ref={rowRef}
                className="swipeable-content"
                style={{ transform: `translateX(-${offset}px)`, transition: swiping.current ? 'none' : 'transform 0.25s ease' }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onClick={showDelete ? handleReset : undefined}
            >
                {children}
            </div>
        </div>
    )
}
