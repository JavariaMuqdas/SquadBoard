import { motion } from 'framer-motion'
import { BellRing } from 'lucide-react'

export default function EmptyNotifications({ unreadOnly }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="relative h-24 w-24" aria-hidden="true">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-100 to-violet-100" />
        <motion.span className="absolute inset-0 grid place-items-center text-brand-600"
          animate={{ rotate: [0, -12, 10, -6, 0] }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.4 }}>
          <BellRing className="h-10 w-10" />
        </motion.span>
        {['z', 'z', 'z'].map((z, i) => (
          <motion.span key={i} className="absolute font-display font-bold text-violet-400"
            style={{ right: -6 - i * 6, top: 8 - i * 10, fontSize: 12 + i * 3 }}
            animate={{ opacity: [0, 1, 0], y: [4, -6] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5 }}>
            {z}
          </motion.span>
        ))}
      </div>
      <p className="mt-5 font-sans text-base font-bold text-ink-900">{unreadOnly ? 'No unread notifications' : 'You’re all caught up'}</p>
      <p className="mt-1 max-w-[16rem] text-sm text-ink-500">Task assignments, reviews and team updates will appear here.</p>
    </div>
  )
}