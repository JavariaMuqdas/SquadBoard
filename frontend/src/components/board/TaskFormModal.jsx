import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, ClipboardList, Trash2, X, Zap } from 'lucide-react'
import api, { csrf, parseError } from '../../lib/api'
import { EFFORTS, effortHint, priorityMeta, statusMeta } from '../../lib/tasks'
import { Alert, Field, SubmitButton } from '../auth/FormControls'
import UserAvatar from '../ui/UserAvatar'

const blank = { title: '', description: '', assigned_to: null, priority: 'medium', effort: 2, due_date: '', status: 'todo' }

/** Create (no `task`) or edit (with `task`) a task. Leader & supervisor only. */
export default function TaskFormModal({ open, projectId, task, defaultStatus = 'todo', assignees, onClose, onSaved, onDelete }) {
  const editing = !!task
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const first = useRef(null)

  useEffect(() => {
    if (!open) return
    setErrors({}); setMessage('')
    setForm(editing
      ? { title: task.title, description: task.description || '', assigned_to: task.assignee?.id ?? null, priority: task.priority, effort: task.effort, due_date: task.due_date || '', status: task.status }
      : { ...blank, status: defaultStatus })
    const t = setTimeout(() => first.current?.focus(), 120)
    const esc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => { clearTimeout(t); window.removeEventListener('keydown', esc) }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined })) }

  const submit = async (e) => {
    e.preventDefault()
    if (form.title.trim().length < 3) return setErrors({ title: 'Give the task a title (3+ characters).' })
    setLoading(true); setMessage('')
    try {
      await csrf()
      const payload = { ...form, due_date: form.due_date || null, description: form.description || null }
      if (editing && payload.status === task.status) delete payload.status
      const { data } = editing
        ? await api.put(`/api/tasks/${task.id}`, payload)
        : await api.post(`/api/projects/${projectId}/tasks`, payload)
      onSaved(data.data ?? data, editing)
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
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="task-form-title">
          <motion.div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="relative max-h-[94dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-xl sm:rounded-3xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><ClipboardList className="h-5 w-5" /></span>
                <div>
                  <h2 id="task-form-title" className="font-sans text-lg font-bold text-ink-900">{editing ? 'Edit task' : 'New task'}</h2>
                  {!editing && <p className="text-xs text-ink-500">Goes into <b>{statusMeta[form.status].label}</b></p>}
                </div>
              </div>
              <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-ink-500 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={submit} noValidate className="space-y-5 p-6">
              <Alert tone="error">{message}</Alert>
              <Field ref={first} label="Title" icon={ClipboardList} placeholder="e.g. Design the login screen" maxLength={150}
                value={form.title} onChange={(e) => set('title', e.target.value)} error={errors.title} />

              <div>
                <label htmlFor="task-desc" className="mb-1.5 block text-sm font-semibold text-ink-800">Description <span className="font-normal text-ink-500">(optional)</span></label>
                <textarea id="task-desc" rows={3} maxLength={2000} value={form.description} onChange={(e) => set('description', e.target.value)}
                  placeholder="What needs to be done? What does “finished” look like?"
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-[15px] outline-none transition hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15" />
              </div>

              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-ink-800">Assign to</legend>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => set('assigned_to', null)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${form.assigned_to === null ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-slate-200 text-ink-500 hover:border-slate-300'}`}>
                    <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-dashed border-slate-300 text-[10px]">?</span> Unassigned
                  </button>
                  {assignees.map((a) => (
                    <button key={a.id} type="button" onClick={() => set('assigned_to', a.id)}
                      className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm font-medium transition ${form.assigned_to === a.id ? 'border-brand-500 bg-brand-50 text-brand-800 shadow-sm' : 'border-slate-200 text-ink-700 hover:border-slate-300'}`}>
                      <UserAvatar user={a} size="h-6 w-6" text="text-[9px]" /> {a.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
                {errors.assigned_to && <p className="mt-1.5 text-xs font-medium text-coral-400">{errors.assigned_to}</p>}
              </fieldset>

              <div className="grid gap-5 sm:grid-cols-2">
                <fieldset>
                  <legend className="mb-2 text-sm font-semibold text-ink-800">Priority</legend>
                  <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1">
                    {Object.entries(priorityMeta).map(([k, p]) => (
                      <button key={k} type="button" onClick={() => set('priority', k)}
                        className={`relative rounded-lg py-1.5 text-xs font-semibold transition ${form.priority === k ? 'text-ink-900' : 'text-ink-500 hover:text-ink-800'}`}>
                        {form.priority === k && <motion.span layoutId="prio-pill" className="absolute inset-0 rounded-lg bg-white shadow-sm" />}
                        <span className="relative">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
                <Field label="Due date" icon={CalendarDays} type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} error={errors.due_date} />
              </div>

              <fieldset>
                <legend className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-800">
                  Effort <span className="font-normal text-ink-500">— points, used to split work fairly</span>
                </legend>
                <div className="grid grid-cols-5 gap-2">
                  {EFFORTS.map((pt) => (
                    <button key={pt} type="button" onClick={() => set('effort', pt)}
                      className={`rounded-xl border-2 py-2 text-center transition ${form.effort === pt ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-200'}`}>
                      <span className="flex items-center justify-center gap-1 font-display text-lg font-bold text-ink-900"><Zap className="h-4 w-4 text-amber-500" />{pt}</span>
                      <span className="block text-[10px] font-semibold text-ink-500">{effortHint[pt]}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              {editing && (
                <fieldset>
                  <legend className="mb-2 text-sm font-semibold text-ink-800">Status</legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {Object.entries(statusMeta).map(([k, s]) => (
                      <button key={k} type="button" onClick={() => set('status', k)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border-2 py-2 text-xs font-bold transition ${form.status === k ? `border-transparent ${s.chip} ring-2 ring-current` : 'border-slate-200 text-ink-500 hover:border-slate-300'}`}>
                        <s.icon className="h-3.5 w-3.5" /> {s.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center">
                {editing && onDelete && (
                  <button type="button" onClick={onDelete} className="btn h-12 text-red-600 hover:bg-red-50 sm:mr-auto">
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                )}
                <button type="button" onClick={onClose} className="btn-ghost h-12 sm:w-28">Cancel</button>
                <div className="sm:w-44"><SubmitButton loading={loading}>{editing ? 'Save changes' : 'Create task'}</SubmitButton></div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}