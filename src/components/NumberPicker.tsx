interface NumberPickerProps {
  min?: number
  max: number
  value: number | null
  onChange: (n: number) => void
}

export function NumberPicker({ min = 0, max, value, onChange }: NumberPickerProps) {
  const numbers: number[] = []
  for (let i = min; i <= max; i++) numbers.push(i)

  return (
    <div className="number-picker">
      {numbers.map((n) => (
        <button
          key={n}
          type="button"
          className={`number-picker-btn${value === n ? ' selected' : ''}`}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
    </div>
  )
}
