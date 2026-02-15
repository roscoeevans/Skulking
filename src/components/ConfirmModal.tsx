interface ConfirmModalProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Go Back',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
          <h2 style={{ font: 'var(--text-title-2)', color: 'var(--color-gray-900)' }}>{title}</h2>
          <p style={{ font: 'var(--text-body)', color: 'var(--color-gray-600)' }}>{message}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)', paddingTop: 'var(--space-8)' }}>
            <button className="btn-primary" onClick={onConfirm}>
              {confirmLabel}
            </button>
            <button className="btn-secondary" onClick={onCancel}>
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
