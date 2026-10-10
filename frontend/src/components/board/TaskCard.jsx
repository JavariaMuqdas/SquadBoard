import { CalendarDays, Lock, MessageSquare, Zap } from 'lucide-react'
import { PriorityChip, dueInfo, statusMeta } from '../../lib/tasks'
import UserAvatar from '../ui/UserAvatar'

/** Pure presentational card (used inside the sortable wrapper and the drag overlay). */
export default function TaskCard({ task, mine, locked, dragging, overlay, onOpen }) {
  const due = dueInfo(task)
  const showProgress = task.status === 'in_progress' || task.status === 'review'

  return (
    <article
      onClick={onOpen}
      className={`group relative cursor-pointer rounded-xl border bg-white p-3.5 text-left transition-all duration-200
        ${overlay ? 'rotate-2 scale-105 border-brand-300 shadow-2xl ring-4 ring-brand-500/10' : 'shadow-sm hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md'}
        ${dragging ? 'opacity-40' : ''}
        ${mine ? 'border-l-4 border-l-brand-500' : 'border-slate-200'}
        ${due?.overdue ? 'ring-1 ring-red-200' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <PriorityChip priority={task.priority} />
        <span className="flex items-center gap-1 rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-ink-500" title={`${task.effort} effort points`}>
          <Zap className="h-3 w-3 text-amber-500" /> {task.effort} pt{task.effort > 1 ? 's' : ''}
        </span>
      </div>

      <h3 className={`mt-2.5 text-sm font-semibold leading-snug ${task.status === 'done' ? 'text-ink-500 line-through decoration-ink-300' : 'text-ink-900'}`}>
        {task.title}
      </h3>

      {showProgress && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[10px] font-semibold text-ink-500">
            <span>Progress</span><span>{task.progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full transition-all duration-700 ${statusMeta[task.status].bar}`} style={{ width: `${task.progress}%` }} />
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5 text-[11px]">
          {due && <span className={`flex items-center gap-1 ${due.cls}`}><CalendarDays className="h-3.5 w-3.5" /> {due.label}</span>}
          {task.updates_count > 1 && (
            <span className="flex items-center gap-1 text-ink-500"><MessageSquare className="h-3.5 w-3.5" /> {task.updates_count - 1}</span>
          )}
          {locked && <Lock className="h-3.5 w-3.5 text-ink-300" title="Only the assignee or leader can move this" />}
        </div>
        {task.assignee
          ? <UserAvatar user={task.assignee} size="h-7 w-7" text="text-[10px]" ring="ring-2 ring-white" />
          : <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-dashed border-slate-300 text-[10px] font-bold text-ink-300" title="Unassigned">?</span>}
      </div>
    </article>
  )
}