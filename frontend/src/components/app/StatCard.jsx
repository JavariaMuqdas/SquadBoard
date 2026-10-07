import { useEffect, useRef } from 'react'
import { animate, motion, useInView } from 'framer-motion'

/** Number that counts up when it scrolls into view. */
function CountUp({ value }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView) return
    const controls = animate(0, value, {
      duration: 0.9,
      ease: 'easeOut',
      onUpdate: (v) => { if (ref.current) ref.current.textContent = Math.round(v) },
    })
    return () => controls.stop()
  }, [inView, value])
  return <span ref={ref}>0</span>
}

export default function StatCard({ icon: Icon, label, value, hint, tone, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.45 }}
      whileHover={{ y: -4 }}
      className="card group relative overflow-hidden p-4 sm:p-5"
    >
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-xl transition-opacity group-hover:opacity-25 ${tone.blob}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-ink-500 sm:text-sm">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900 sm:text-3xl"><CountUp value={value ?? 0} /></p>
        </div>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl sm:h-11 sm:w-11 ${tone.icon}`}><Icon className="h-4 w-4 sm:h-5 sm:w-5" /></span>
      </div>
      {hint && <p className="mt-3 hidden text-xs text-ink-500 sm:block">{hint}</p>}
    </motion.div>
  )
}