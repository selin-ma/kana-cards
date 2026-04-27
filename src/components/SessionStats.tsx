interface Props {
  correct: number
  wrong: number
  skipped: number
  remaining: number
}

export default function SessionStats({ correct, wrong, skipped, remaining }: Props) {
  return (
    <div className="flex gap-4 text-xs font-medium">
      <span style={{ color: '#7AAA7A' }}>✓ {correct}</span>
      <span style={{ color: '#C08878' }}>✗ {wrong}</span>
      {skipped > 0 && <span style={{ color: '#B8C4B8' }}>↷ {skipped}</span>}
      <span style={{ color: '#B8C4B8' }}>余 {remaining}</span>
    </div>
  )
}
