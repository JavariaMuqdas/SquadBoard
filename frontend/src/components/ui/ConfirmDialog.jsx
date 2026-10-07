import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Loader2 } from 'lucide-react'

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger = true, loading, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] grid place-items-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
          <motion.div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl"
          >
            <span className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${danger ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600'}`}>
              <AlertTriangle className="h-7 w-7" />
            </span>
            <h2 id="confirm-title" className="mt-4 font-sans text-lg font-bold text-ink-900">{title}</h2>
            <p className="mt-2 text-sm text-ink-500">{message}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={onCancel} className="btn-ghost h-11">Cancel</button>
              <button onClick={onConfirm} disabled={loading}
                className={`btn h-11 text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'} disabled:opacity-70`}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}