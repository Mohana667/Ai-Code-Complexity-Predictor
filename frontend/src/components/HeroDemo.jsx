import { useState } from 'react'
import ComplexityGauge from './ComplexityGauge'

const EXAMPLES = [
  {
    label: 'bubble_sort.py',
    code: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(n - i - 1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr`,
    estimate: {
      time_complexity: 'O(n^2)',
      space_complexity: 'O(1)',
      confidence: 0.85,
      risk_level: 'high',
      risk_score: 64,
    },
  },
  {
    label: 'binary_search.py',
    code: `def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1`,
    estimate: {
      time_complexity: 'O(log n)',
      space_complexity: 'O(1)',
      confidence: 0.8,
      risk_level: 'low',
      risk_score: 8,
    },
  },
  {
    label: 'matrix_multiply.c',
    code: `int** multiply(int** a, int** b, int n) {
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)
            for (int k = 0; k < n; k++)
                result[i][j] += a[i][k] * b[k][j];
    return result;
}`,
    estimate: {
      time_complexity: 'O(n^3)',
      space_complexity: 'O(n^2)',
      confidence: 0.7,
      risk_level: 'critical',
      risk_score: 92,
    },
  },
]

export default function HeroDemo() {
  const [active, setActive] = useState(0)
  const example = EXAMPLES[active]

  return (
    <div className="border border-line/10 rounded-lg bg-panel overflow-hidden">
      <div className="flex items-center border-b border-line/10">
        {EXAMPLES.map((ex, i) => (
          <button
            key={ex.label}
            onClick={() => setActive(i)}
            className={`font-mono text-xs px-4 py-2.5 border-r border-line/10 transition-colors ${
              i === active ? 'text-ink bg-raised' : 'text-mute hover:text-ink'
            }`}
          >
            {ex.label}
          </button>
        ))}
      </div>
      <pre className="font-mono text-xs text-ink/90 p-4 overflow-x-auto leading-relaxed min-h-[140px]">
        {example.code}
      </pre>
      <div className="border-t border-line/10">
        <ComplexityGauge estimate={example.estimate} />
      </div>
    </div>
  )
}
