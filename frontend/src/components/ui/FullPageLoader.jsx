import { motion } from 'framer-motion'

export default function FullPageLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-white" role="status" aria-label="Loading">
      <div className="flex items-end gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-3 rounded-md bg-gradient-to-t from-brand-600 to-violet-500"
            animate={{ height: [12, 32, 12] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </div>
  )
}
