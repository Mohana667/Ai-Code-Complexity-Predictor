import { motion, useReducedMotion } from 'framer-motion'

export default function PageTransition({ children }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.22, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
