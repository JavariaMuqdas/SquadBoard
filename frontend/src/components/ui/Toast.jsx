import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, X } from 'lucide-react'

/** <Toast toast={{ tone: 'success' | 'error', text }} onClose={() => setToast(null)} /> */
export default function Toast({ toast, onClose, duration = 5000 }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [toast, onClose, duration])

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.text}
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
          className="fixed inset-x-4 bottom-6 z-[90] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink-900 px-5 py-4 text-sm text-white shadow-2xl"
          role="status"
        >
          {toast.tone === 'error'
            ? <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
            : <CheckCircle2 className="h-5 w-5 shrink-0 text-mint-400" />}
          <p className="flex-1">{toast.text}</p>
          <button onClick={onClose} aria-label="Dismiss"><X className="h-4 w-4 text-ink-300" /></button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}