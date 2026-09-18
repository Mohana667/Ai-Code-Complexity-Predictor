const RISK_VAR = {
  low: 'var(--c-mint)',
  moderate: 'var(--c-amber)',
  high: 'var(--c-red)',
  critical: 'var(--c-red)',
}

export default function ComplexityGauge({ estimate }) {
  const colorVar = RISK_VAR[estimate.risk_level] || 'var(--c-mute)'
  const color = `rgb(${colorVar})`
  const pct = Math.min(100, Math.max(0, estimate.risk_score))
  const circumference = 2 * Math.PI * 54

  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgb(var(--c-raised))" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (pct / 100) * circumference}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-semibold" style={{ color }}>
            {estimate.time_complexity}
          </span>
          <span className="text-xs text-mute mt-1">{estimate.risk_level} risk</span>
        </div>
      </div>
      <div className="mt-4 text-sm text-mute font-mono">
        space: <span className="text-ink">{estimate.space_complexity}</span>
        <span className="mx-2">·</span>
        confidence: <span className="text-ink">{Math.round(estimate.confidence * 100)}%</span>
      </div>
    </div>
  )
}
