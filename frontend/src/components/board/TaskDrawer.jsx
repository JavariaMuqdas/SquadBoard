import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight, CalendarDays, Check, CheckCircle2, CircleDot, ExternalLink, Link2, Loader2, MessageSquareText, Pencil,
  Play, PlusCircle, RotateCcw, Send, Sparkles, Timer, UserCheck, X, Zap,
} from 'lucide-react'
import api, { csrf, parseError } from '../../lib/api'
import { PriorityChip, StatusChip, dueInfo, statusMeta } from '../../lib/tasks'
import { timeAgo, formatDate } from '../../lib/time'
import UserAvatar from '../ui/UserAvatar'

const activityText = {
  created: () => 'created this task',
  assigned: () => 'changed the assignee',
  edited: () => 'edited the task details',
  status: (u) => <>moved it to <b>{statusMeta[u.new_status]?.label}</b></>,
  submitted: () => <>submitted it <b>for review</b></>,
  approved: () => <><b className="text-emerald-700">approved</b> it as done</>,
  returned: () => <><b className="text-amber-700">requested changes</b></>,
  progress: (u) => <>updated progress to <b>{u.progress}%</b></>,
  note: (u) => (u.progress != null ? <>posted an update · <b>{u.progress}%</b></> : 'commented'),
}
const activityIcon = {
  created: PlusCircle, assigned: UserCheck, edited: Pencil, status: ArrowRight, submitted: Send,
  approved: CheckCircle2, returned: RotateCcw, progress: Timer, note: MessageSquareText,
}

export default function TaskDrawer({ taskId, permissions, onClose, onChanged, onEdit }) {
  const [task, setTask] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [note, setNote] = useState('')
  const [proof, setProof] = useState('')
  const [progress, setProgress] = useState(0)
  const [showProof, setShowProof] = useState(false)
  const [returning, setReturning] = useState(false)
  const [returnNote, setReturnNote] = useState('')

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/tasks/${taskId}`)
      setTask(data.data)
      setProgress(data.data.progress)
      setError('')
    } catch (err) {
      setError(parseError(err).message)
    }
  }, [taskId])

  useEffect(() => {
    if (!taskId) return
    setTask(null); setNote(''); setProof(''); setShowProof(false); setReturning(false); setReturnNote('')
    load()
    const esc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [taskId, load, onClose])

  const manager = permissions?.manage_tasks
  const mine = task?.assignee?.id === permissions?.user_id
  const canWork = manager || mine
  const due = task && dueInfo(task)

  const run = async (key, fn) => {
    setBusy(key); setError('')
    try {
      await csrf()
      await fn()
      await load()
      onChanged?.()
    } catch (err) {
      setError(parseError(err).message)
    } finally {
      setBusy('')
    }
  }

  const move = (status, extra = {}) => run(status, () => api.patch(`/api/tasks/${task.id}/move`, { status, ...extra }))

  const postUpdate = (e) => {
    e.preventDefault()
    const changedProgress = progress !== task.progress
    if (!note.trim() && !changedProgress) return setError('Write a note or move the progress slider.')
    run('update', async () => {
      await api.post(`/api/tasks/${task.id}/updates`, {
        note: note.trim() || null,
        progress: changedProgress ? progress : null,
        proof_url: proof.trim() || null,
      })
      setNote(''); setProof(''); setShowProof(false)
    })
  }

  /* Primary actions depend on role + status */
  const actions = []
  if (task && canWork) {
    if (task.status === 'todo') actions.push({ key: 'in_progress', label: 'Start task', icon: Play, onClick: () => move('in_progress'), cls: 'btn-primary' })
    if (task.status === 'in_progress') actions.push({ key: 'review', label: manager && !mine ? 'Move to review' : 'Submit for review', icon: Send, onClick: () => move('review'), cls: 'btn-primary' })
    if (task.status === 'review' && manager) {
      actions.push({ key: 'done', label: 'Approve', icon: Check, onClick: () => move('done'), cls: 'btn bg-mint-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20' })
      actions.push({ key: 'return', label: 'Request changes', icon: RotateCcw, onClick: () => setReturning(true), cls: 'btn-ghost' })
    }
    if (task.status === 'review' && !manager) actions.push({ key: 'in_progress', label: 'Withdraw', icon: RotateCcw, onClick: () => move('in_progress'), cls: 'btn-ghost' })
    if (task.status === 'done' && manager) actions.push({ key: 'in_progress', label: 'Reopen', icon: RotateCcw, onClick: () => move('in_progress'), cls: 'btn-ghost' })
    if (task.status !== 'done' && task.status !== 'review' && manager) actions.push({ key: 'done', label: 'Mark done', icon: CheckCircle2, onClick: () => move('done'), cls: 'btn-ghost' })
  }

  return (
    <AnimatePresence>
      {taskId && (
        <div className="fixed inset-0 z-[65]" role="dialog" aria-modal="true" aria-label="Task details">
          <motion.div className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 34 }}
            className="absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl sm:max-w-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              {task ? <div className="flex flex-wrap items-center gap-2"><StatusChip status={task.status} /><PriorityChip priority={task.priority} /></div> : <span />}
              <div className="flex items-center gap-1">
                {task && manager && (
                  <button onClick={() => onEdit(task)} className="grid h-9 w-9 place-items-center rounded-xl text-ink-500 hover:bg-slate-100 hover:text-ink-900" aria-label="Edit task">
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-ink-500 hover:bg-slate-100 hover:text-ink-900" aria-label="Close"><X className="h-5 w-5" /></button>
              </div>
            </div>

            {!task ? (
              <div className="grid flex-1 place-items-center">
                {error ? <p className="px-6 text-center text-sm text-red-600">{error}</p> : <Loader2 className="h-8 w-8 animate-spin text-brand-600" />}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-6 px-5 py-6 sm:px-6">
                  <div>
                    <h2 className="text-xl font-bold leading-snug text-ink-900 sm:text-2xl">{task.title}</h2>
                    {task.description && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-700">{task.description}</p>}
                  </div>

                  {/* Meta */}
                  <dl className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Assignee</dt>
                      <dd className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-ink-900">
                        {task.assignee ? <><UserAvatar user={task.assignee} size="h-6 w-6" text="text-[9px]" /> <span className="truncate">{task.assignee.name}{mine && ' (you)'}</span></> : <span className="text-ink-500">Unassigned</span>}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Due date</dt>
                      <dd className={`mt-1.5 flex items-center gap-1.5 text-sm font-semibold ${due?.cls || 'text-ink-500'}`}>
                        <CalendarDays className="h-4 w-4" /> {task.due_date ? formatDate(task.due_date, { weekday: 'short', day: 'numeric', month: 'short' }) : 'No due date'}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Effort</dt>
                      <dd className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-ink-900"><Zap className="h-4 w-4 text-amber-500" /> {task.effort} points</dd>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Progress</dt>
                      <dd className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                            <motion.div className={`h-full rounded-full ${statusMeta[task.status].bar}`} initial={{ width: 0 }} animate={{ width: `${task.progress}%` }} transition={{ duration: 0.8 }} />
                          </div>
                          <span className="text-sm font-bold text-ink-900">{task.progress}%</span>
                        </div>
                      </dd>
                    </div>
                  </dl>

                  {/* Actions */}
                  {(actions.length > 0 || error) && (
                    <div className="space-y-3">
                      <AnimatePresence>
                        {error && (
                          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</motion.p>
                        )}
                      </AnimatePresence>
                      {task.status === 'review' && !manager && mine && (
                        <p className="flex items-center gap-2 rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-800">
                          <Sparkles className="h-4 w-4 shrink-0" /> Submitted. Your leader or supervisor will approve it.
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {actions.map((a) => (
                          <button key={a.key + a.label} onClick={a.onClick} disabled={!!busy} className={`${a.cls} !py-2.5 disabled:opacity-60`}>
                            {busy === a.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <a.icon className="h-4 w-4" />} {a.label}
                          </button>
                        ))}
                      </div>
                      <AnimatePresence>
                        {returning && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                              <label htmlFor="return-note" className="text-xs font-semibold text-amber-900">What needs to change?</label>
                              <textarea id="return-note" rows={2} value={returnNote} onChange={(e) => setReturnNote(e.target.value)} maxLength={500}
                                placeholder="e.g. Please add tests for the register endpoint."
                                className="w-full resize-none rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-amber-400/20" />
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setReturning(false)} className="btn-ghost !py-2 text-xs">Cancel</button>
                                <button onClick={() => move('in_progress', { note: returnNote.trim() || null }).then(() => setReturning(false))}
                                  className="btn !py-2 bg-amber-500 text-xs text-white hover:bg-amber-600">Send back</button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Post update */}
                  {canWork && (
                    <form onSubmit={postUpdate} className="rounded-2xl border border-slate-200 p-4">
                      <p className="flex items-center gap-2 text-sm font-bold text-ink-900"><MessageSquareText className="h-4 w-4 text-brand-600" /> {mine ? 'Post a progress update' : 'Add a comment'}</p>
                      {(mine || manager) && task.status !== 'done' && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs font-semibold text-ink-500">
                            <label htmlFor="progress-range">Progress</label>
                            <span className="rounded-md bg-brand-50 px-2 py-0.5 font-bold text-brand-700">{progress}%</span>
                          </div>
                          <input id="progress-range" type="range" min="0" max="100" step="5" value={progress} onChange={(e) => setProgress(Number(e.target.value))}
                            className="mt-2 w-full accent-brand-600" />
                        </div>
                      )}
                      <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000}
                        placeholder={mine ? 'What did you finish? Any blockers?' : 'Leave feedback for the assignee…'}
                        className="mt-3 w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15" />
                      <AnimatePresence>
                        {showProof && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="relative mt-2">
                              <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                              <input type="url" value={proof} onChange={(e) => setProof(e.target.value)} placeholder="https://github.com/… or Google Drive link"
                                className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15" />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="mt-3 flex items-center justify-between">
                        <button type="button" onClick={() => setShowProof((s) => !s)} className="flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-brand-700">
                          <Link2 className="h-3.5 w-3.5" /> {showProof ? 'Remove link' : 'Attach proof link'}
                        </button>
                        <button type="submit" disabled={!!busy} className="btn-primary !py-2 text-sm disabled:opacity-60">
                          {busy === 'update' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Post
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Timeline */}
                  <section>
                    <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-ink-500">Activity</h3>
                    <ol className="relative space-y-5 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-slate-200">
                      {task.updates.map((u, i) => {
                        const Icon = activityIcon[u.type] ?? CircleDot
                        return (
                          <motion.li key={u.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }} className="relative flex gap-3">
                            <span className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full ring-4 ring-white ${u.type === 'approved' ? 'bg-emerald-100 text-emerald-600' : u.type === 'returned' ? 'bg-amber-100 text-amber-600' : u.type === 'submitted' ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-ink-500'}`}>
                              <Icon className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1 pt-1">
                              <p className="text-sm text-ink-700"><b className="text-ink-900">{u.user.name}</b> {(activityText[u.type] ?? (() => u.type))(u)}</p>
                              <p className="text-[11px] text-ink-500">{timeAgo(u.created_at)}</p>
                              {u.note && <p className="mt-2 whitespace-pre-line rounded-xl rounded-tl-sm bg-slate-50 px-3.5 py-2.5 text-sm text-ink-800">{u.note}</p>}
                              {u.proof_url && (
                                <a href={u.proof_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-brand-100 bg-brand-50/60 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">
                                  <ExternalLink className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{u.proof_url}</span>
                                </a>
                              )}
                            </div>
                          </motion.li>
                        )
                      })}
                    </ol>
                  </section>
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}