import { ROLES } from '../../midnight/roles'

interface RoleCardProps {
    role?: string
    faceUp?: boolean
    size?: 'small' | 'medium' | 'large'
    selected?: boolean
    onClick?: () => void
    label?: string
}

export function RoleCard({
    role,
    faceUp = false,
    size = 'medium',
    selected = false,
    onClick,
    label,
}: RoleCardProps) {
    const def = role ? ROLES[role] : null

    const sizeClass = `role-card--${size}`
    const teamClass = def ? `role-card--${def.team}` : ''

    return (
        <button
            className={`role-card ${sizeClass} ${teamClass} ${faceUp ? 'face-up' : 'face-down'} ${selected ? 'selected' : ''}`}
            onClick={onClick}
            disabled={!onClick}
            type="button"
        >
            <div className="role-card-inner">
                {/* Front */}
                <div className="role-card-front">
                    <span className="role-card-emoji">{def?.emoji ?? '?'}</span>
                    <span className="role-card-name">{def?.name ?? '???'}</span>
                    {def && (
                        <span className={`role-card-team team-${def.team}`}>
                            {def.team === 'village' ? '🏘️ Village' : def.team === 'werewolf' ? '🐺 Werewolf' : '💀 Tanner'}
                        </span>
                    )}
                </div>
                {/* Back */}
                <div className="role-card-back">
                    <span className="role-card-back-icon">🌙</span>
                    {label && <span className="role-card-label">{label}</span>}
                </div>
            </div>
        </button>
    )
}
