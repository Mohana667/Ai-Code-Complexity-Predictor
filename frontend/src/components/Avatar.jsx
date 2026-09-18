const GRADIENTS = [
  ['#5B8DEF', '#3DDC97'],
  ['#F5A623', '#E5484D'],
  ['#3DDC97', '#5B8DEF'],
  ['#E5484D', '#5B8DEF'],
]

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function Avatar({ name, seed = 0, size = 44 }) {
  const [from, to] = GRADIENTS[seed % GRADIENTS.length]
  const id = `avatar-grad-${seed}`
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className="shrink-0">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <circle cx="22" cy="22" r="22" fill={`url(#${id})`} />
      <text x="22" y="27" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="15" fontWeight="700" fill="#0D1117">
        {initials(name)}
      </text>
    </svg>
  )
}
