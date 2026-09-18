export default function SuggestionsList({ estimate }) {
  return (
    <div>
      <p className="text-sm text-ink leading-relaxed mb-4">{estimate.explanation}</p>
      {estimate.hotspots?.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-mute mb-2">Hotspots</p>
          <div className="flex flex-wrap gap-2">
            {estimate.hotspots.map((h) => (
              <span key={h} className="font-mono text-xs px-2 py-1 rounded bg-red/10 text-red border border-red/20">
                {h}
              </span>
            ))}
          </div>
        </div>
      )}
      <p className="text-sm text-mute mb-2">Suggestions</p>
      <ul className="space-y-2">
        {estimate.optimization_suggestions.map((s, i) => (
          <li key={i} className="text-sm text-ink flex gap-2">
            <span className="text-accent mt-0.5">›</span>
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
