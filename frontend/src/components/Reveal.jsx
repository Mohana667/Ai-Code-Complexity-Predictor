import { motion, useReducedMotion } from 'framer-motion'
export default function Reveal({ children, delay = 0, y = 16, onScroll = false, className = '' }) {
  const reduce = useReducedMotion()

  const initial = reduce ? { opacity: 0 } : { opacity: 0, y }
  const animate = reduce ? { opacity: 1 } : { opacity: 1, y: 0 }

  const viewportProps = onScroll
    ? { whileInView: animate, initial, viewport: { once: true, margin: '-80px' } }
    : { initial, animate }

  return (
    <motion.div
      {...viewportProps}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
