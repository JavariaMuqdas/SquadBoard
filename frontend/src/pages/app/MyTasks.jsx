import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CalendarClock, CheckCircle2, ChevronDown, ClipboardCheck, Coffee, ListChecks, RotateCw, Zap } from 'lucide-react'
import api, { parseError } from '../../lib/api'
import { colorOf } from '../../lib/projectColors'
import { PriorityChip, StatusChip, dueInfo, statusMeta } from '../../lib/tasks'
import Seo from '../../components/ui/Seo'

const filters = [
  { id: 'open', label: 'Open' },
  { id: 'todo', label: 'To do' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'review', label: 'In review' },
  { id: 'done', label: 'Done' },
]

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }
const daysUntil = (date) => Math.round((new Date(date + 'T00:00:00') - startOfToday()) / 86400000)

/** Splits open tasks into Overdue / Today / This week / Later / No due date. */
function groupTasks(tasks) {
  const groups = [
    { id: 'overdue', label: 'Overdue', icon: AlertTriangle, cls: 'text-red-600', items: [] },
    { id: 'today', label: 'Due today', icon: CalendarClock, cls: 'text-amber-600', items: [] },
    { id: 'week', label: 'Next 7 days', icon: CalendarClock, cls: 'text-brand-600', items: [] },
    { id: 'later', label: 'Later', icon: CalendarClock, cls: 'text-ink-500', items: [] },
    { id: 'none', label: 'No due date', icon: CalendarClock, cls: 'text-ink-500', items: [] },
    { id: 'done', label: 'Completed', icon: CheckCircle2, cls: 'text-emerald-600', items: [] },
  ]
  const by = Object.fromEntries(groups.map((g) => [g.id, g]))
  tasks.forEach((t) => {
    if (t.status === 'done') return by.done.items.push(t)
    if (!t.due_date) return by.none.items.push(t)
    const d = daysUntil(t.due_date)
    if (d < 0) by.overdue.items.push(t)
    else if (d === 0) by.today.items.push(t)
    else if (d <= 7) by.week.items.push(t)
    else by.later.items.push(t)
  })
  return groups.filter((g) => g.items.length)
}

function TaskRow({ task, index }) {
  const c = colorOf(task.project?.color)
  const due = dueInfo(task)
  const meta = statusMeta[task.status]
  return (
    <motion.li layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ delay: Math.min(index, 8) * 0.03 }}>
      <Link to={`/app/projects/${task.project_id}?tab=board&task=${task.id}`}
        className="group flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`} />
          <div className="min-w-0">
            <p className={`font-semibold group-hover:text-brand-700 ${task.status === 'done' ? 'text-ink-500 line-through' : 'text-ink-900'}`}>{task.title}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500">
              <span className={`h-2 w-2 rounded-sm bg-gradient-to-r ${c.band}`} /> {task.project?.name}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-5 sm:pl-0">
          <PriorityChip priority={task.priority} />
          <span className="flex items-center gap-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-ink-700" title="Effort points"><Zap className="h-3 w-3" />{task.effort}</span>
          {task.status !== 'done' && (
            <span className="flex w-24 items-center gap-2" title={`${task.progress}% done`}>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500" style={{ width: `${task.progress}%` }} /></span>
              <span className="text-[11px] font-bold text-ink-700">{task.progress}%</span>
            </span>
          )}
          <StatusChip status={task.status} />
          {due && <span className={`w-28 text-right text-xs ${due.cls}`}>{due.label}</span>}
        </div>
      </Link>
    </motion.li>
  )
}

function Group({ group, startOpen = true }) {
  const [open, setOpen] = useState(startOpen)
  return (
    <section className="card overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="flex w-full items-center gap-2 border-b border-slate-100 px-5 py-3.5 text-left">
        <group.icon className={`h-4 w-4 ${group.cls}`} />
        <h2 className={`font-sans text-sm font-bold ${group.cls}`}>{group.label}</h2>
        <span className="rounded-md bg-slate-100 px-1.5 text-xs font-bold text-ink-700">{group.items.length}</span>
        <ChevronDown className={`ml-auto h-4 w-4 text-ink-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="divide-y divide-slate-100 overflow-hidden">
            {group.items.map((t, i) => <TaskRow key={t.id} task={t} index={i} />)}
          </motion.ul>
        )}
      </AnimatePresence>
    </section>
  )
}

export default function MyTasks() {
  const [tasks, setTasks] = useState([])
  const [counts, setCounts] = useState(null)
  const [filter, setFilter] = useState('open')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/my-tasks')
      setTasks(data.data); setCounts(data.counts); setError('')
    } catch (err) {
      setError(parseError(err).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const shown = useMemo(() => tasks.filter((t) => (filter === 'open' ? t.status !== 'done' : t.status === filter)), [tasks, filter])
  const groups = useMemo(() => groupTasks(shown), [shown])
  const openCount = counts ? counts.all - counts.done : 0
  const pointsOpen = tasks.filter((t) => t.status !== 'done').reduce((s, t) => s + t.effort, 0)

  const summary = counts && [
    { label: 'Open tasks', value: openCount, icon: ListChecks, cls: 'bg-brand-50 text-brand-600' },
    { label: 'Overdue', value: counts.overdue, icon: AlertTriangle, cls: counts.overdue ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-ink-500' },
    { label: 'Waiting for review', value: counts.review, icon: ClipboardCheck, cls: 'bg-violet-50 text-violet-600' },
    { label: 'Effort points open', value: pointsOpen, icon: Zap, cls: 'bg-amber-50 text-amber-600' },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Seo title="My tasks — SquadBoard" description="Everything assigned to you." path="/app/my-tasks" />

      <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-ink-900">My tasks</h1>
        <p className="mt-1 text-ink-500">Everything assigned to you, across all your projects.</p>
      </motion.header>

      {summary && (
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {summary.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card flex items-center gap-3 p-4">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${s.cls}`}><s.icon className="h-5 w-5" /></span>
              <div><p className="font-display text-2xl font-bold text-ink-900">{s.value}</p><p className="text-xs text-ink-500">{s.label}</p></div>
            </motion.div>
          ))}
        </section>
      )}

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-1 rounded-xl bg-slate-100 p-1 sm:inline-flex">
          {filters.map((f) => {
            const n = !counts ? null : f.id === 'open' ? openCount : counts[f.id]
            return (
              <button key={f.id} onClick={() => setFilter(f.id)} className="relative rounded-lg px-4 py-2 text-sm font-semibold">
                {filter === f.id && <motion.span layoutId="mytasks-filter" className="absolute inset-0 rounded-lg bg-white shadow-sm" />}
                <span className={`relative ${filter === f.id ? 'text-brand-700' : 'text-ink-500'}`}>{f.label}</span>
                {n != null && <span className="relative ml-1.5 text-xs text-ink-300">{n}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {error ? (
        <div className="card flex flex-col items-center p-10 text-center">
          <p className="font-semibold text-ink-900">Couldn’t load your tasks</p>
          <p className="mt-1 text-sm text-ink-500">{error}</p>
          <button onClick={load} className="btn-primary mt-5"><RotateCw className="h-4 w-4" /> Try again</button>
        </div>
      ) : loading ? (
        <div className="space-y-4">{[0, 1].map((i) => <div key={i} className="card h-40 animate-pulse bg-slate-50" />)}</div>
      ) : groups.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="card flex flex-col items-center px-6 py-16 text-center">
          <div className="relative">
            <motion.span animate={{ rotate: [0, -6, 6, 0] }} transition={{ duration: 4, repeat: Infinity }}
              className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-emerald-100 to-brand-100 text-emerald-600">
              {filter === 'open' ? <Coffee className="h-10 w-10" /> : <ListChecks className="h-10 w-10" />}
            </motion.span>
            <motion.span className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-amber-400" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity }} />
          </div>
          <h2 className="mt-5 text-xl font-bold text-ink-900">{filter === 'open' ? 'You’re all caught up' : `Nothing ${filters.find((f) => f.id === filter).label.toLowerCase()}`}</h2>
          <p className="mt-2 max-w-sm text-sm text-ink-500">
            {filter === 'open' ? 'No open tasks are assigned to you right now. New assignments will show up here and in your notifications.' : 'Try another filter.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => <Group key={`${filter}-${g.id}`} group={g} startOpen={g.id !== 'done' || filter === 'done'} />)}
        </div>
      )}
    </div>
  )
}