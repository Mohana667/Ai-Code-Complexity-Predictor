const ROWS = [
  ['lines_of_code', 'Lines'],
  ['loop_count', 'Loops'],
  ['nested_loop_depth', 'Max loop depth'],
  ['function_count', 'Functions'],
  ['conditional_count', 'Branches'],
  ['cyclomatic_complexity', 'Cyclomatic complexity'],
  ['dependency_count', 'Dependencies'],
]

export default function MetricsPanel({ metrics }) {
  return (
    <div className="border border-line/10 rounded-lg divide-y divide-line/10">
      {ROWS.map(([key, label]) => (
        <div key={key} className="flex items-center justify-between px-4 py-2.5">
          <span className="text-sm text-mute">{label}</span>
          <span className="font-mono text-sm text-ink">{metrics[key]}</span>
        </div>
      ))}
      {metrics.recursive_functions?.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-sm text-mute">Recursive</span>
          <span className="font-mono text-sm text-amber">{metrics.recursive_functions.join(', ')}</span>
        </div>
      )}
    </div>
  )
}
