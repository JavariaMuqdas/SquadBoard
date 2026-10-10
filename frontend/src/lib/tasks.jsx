import { CheckCircle2, Circle, Eye, Flame, Timer } from 'lucide-react'

export const STATUSES = ['todo', 'in_progress', 'review', 'done']

export const statusMeta = {
  todo: { label: 'To do', icon: Circle, dot: 'bg-slate-400', chip: 'bg-slate-100 text-slate-700', bar: 'bg-slate-400', soft: 'bg-slate-50' },
  in_progress: { label: 'In progress', icon: Timer, dot: 'bg-amber-400', chip: 'bg-amber-50 text-amber-700', bar: 'bg-amber-400', soft: 'bg-amber-50/40' },
  review: { label: 'In review', icon: Eye, dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700', bar: 'bg-violet-500', soft: 'bg-violet-50/40' },
  done: { label: 'Done', icon: CheckCircle2, dot: 'bg-mint-500', chip: 'bg-emerald-50 text-emerald-700', bar: 'bg-mint-500', soft: 'bg-emerald-50/40' },
}

export const priorityMeta = {
  low: { label: 'Low', chip: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Medium', chip: 'bg-sky-50 text-sky-700' },
  high: { label: 'High', chip: 'bg-amber-50 text-amber-700' },
  urgent: { label: 'Urgent', chip: 'bg-red-50 text-red-700', icon: Flame },
}

export const EFFORTS = [1, 2, 3, 5, 8]
export const effortHint = { 1: 'Tiny', 2: 'Small', 3: 'Medium', 5: 'Large', 8: 'Huge' }

export function StatusChip({ status, className = '' }) {
  const s = statusMeta[status] ?? statusMeta.todo
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold ${s.chip} ${className}`}>
      <s.icon className="h-3.5 w-3.5" /> {s.label}
    </span>
  )
}

export function PriorityChip({ priority, className = '' }) {
  const p = priorityMeta[priority] ?? priorityMeta.medium
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${p.chip} ${className}`}>
      {p.icon && <p.icon className="h-3 w-3" />} {p.label}
    </span>
  )
}

export function dueInfo(task) {
  if (!task.due_date) return null
  const due = new Date(task.due_date + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const days = Math.round((due - today) / 86400000)
  const label = due.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  if (task.status === 'done') return { label, cls: 'text-ink-500' }
  if (days < 0) return { label: `${label} · ${Math.abs(days)}d late`, cls: 'text-red-600 font-semibold', overdue: true }
  if (days === 0) return { label: 'Due today', cls: 'text-red-600 font-semibold' }
  if (days === 1) return { label: 'Tomorrow', cls: 'text-amber-600 font-semibold' }
  if (days <= 3) return { label: `${label} · ${days}d`, cls: 'text-amber-600 font-semibold' }
  return { label, cls: 'text-ink-500' }
}