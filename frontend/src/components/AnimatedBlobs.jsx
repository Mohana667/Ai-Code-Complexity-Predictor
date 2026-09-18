import { motion, useReducedMotion } from 'framer-motion'
export default function AnimatedBlobs() {
  const reduce = useReducedMotion()

  const blobs = [
    { color: 'rgb(var(--c-accent) / 0.18)', size: 420, x: '5%', y: '-10%', dur: 22 },
    { color: 'rgb(var(--c-mint) / 0.14)', size: 360, x: '70%', y: '10%', dur: 26 },
    { color: 'rgb(var(--c-amber) / 0.10)', size: 300, x: '40%', y: '60%', dur: 30 },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            width: b.size, height: b.size, left: b.x, top: b.y,
            background: b.color,
          }}
          animate={
            reduce
              ? {}
              : {
                  x: [0, 30, -20, 0],
                  y: [0, -20, 20, 0],
                }
          }
          transition={{ duration: b.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
