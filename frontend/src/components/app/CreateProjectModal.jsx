import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, CalendarDays, Check, FolderKanban, X } from 'lucide-react'
import api, { csrf, parseError } from '../../lib/api'
import { projectColors } from '../../lib/projectColors'
import { Alert, Field, SubmitButton } from '../auth/FormControls'

const empty = { name: '', course: '', description: '', deadline: '', color: 'indigo' }
const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10)

export default function CreateProjectModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const firstInput = useRef(null)

  useEffect(() => {
    if (!open) return
    setForm(empty); setErrors({}); setMessage('')
    const t = setTimeout(() => firstInput.current?.focus(), 150)
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (form.name.trim().length < 3) return setErrors({ name: 'Give your project a name (3+ characters).' })
    setLoading(true); setErrors({}); setMessage('')
    try {
      await csrf()
      const { data } = await api.post('/api/projects', { ...form, deadline: form.deadline || null })
      onCreated(data.data ?? data)
    } catch (err) {
      const p = parseError(err)
      setErrors(p.fields)
      if (!Object.keys(p.fields).length) setMessage(p.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="cp-title">
          <motion.div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 60, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl"
          >
            {/* Header with live colour preview */}
            <div className={`relative bg-gradient-to-r ${projectColors[form.color].band} px-6 pb-6 pt-6 text-white transition-colors duration-300`}>
              <div className="bg-grid absolute inset-0 opacity-30" />
              <button onClick={onClose} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl bg-white/15 transition hover:bg-white/25" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
              <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white/20"><FolderKanban className="h-6 w-6" /></span>
              <h2 id="cp-title" className="relative mt-4 text-2xl font-bold">New project</h2>
              <p className="relative mt-1 text-sm text-white/80">You’ll be the team leader. Invite your team right after.</p>
            </div>

            <form onSubmit={submit} noValidate className="space-y-5 p-6">
              <Alert tone="error">{message}</Alert>
              <Field ref={firstInput} label="Project name" icon={FolderKanban} placeholder="e.g. Smart Attendance System"
                value={form.name} onChange={set('name')} error={errors.name} maxLength={100} />
              <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
                <Field label="Course (optional)" icon={BookOpen} placeholder="e.g. FYP, SRE"
                  value={form.course} onChange={set('course')} error={errors.course} maxLength={100} />
                <Field label="Deadline" icon={CalendarDays} type="date" min={tomorrow()}
                  value={form.deadline} onChange={set('deadline')} error={errors.deadline} />
              </div>
              <div>
                <label htmlFor="cp-desc" className="mb-1.5 block text-sm font-semibold text-ink-800">Description <span className="font-normal text-ink-500">(optional)</span></label>
                <textarea id="cp-desc" rows={3} maxLength={500} value={form.description} onChange={set('description')}
                  placeholder="What is this project about?"
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-[15px] outline-none transition hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15" />
                <p className="mt-1 text-right text-xs text-ink-500">{form.description.length}/500</p>
              </div>
              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-ink-800">Color</legend>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(projectColors).map(([name, c]) => (
                    <button key={name} type="button" onClick={() => setForm((f) => ({ ...f, color: name }))}
                      aria-label={name} aria-pressed={form.color === name}
                      className={`grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br ${c.band} transition-transform hover:scale-110 ${form.color === name ? `ring-2 ring-offset-2 ${c.ring}` : ''}`}>
                      {form.color === name && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                <button type="button" onClick={onClose} className="btn-ghost h-12 sm:w-32">Cancel</button>
                <SubmitButton loading={loading}>Create project</SubmitButton>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}