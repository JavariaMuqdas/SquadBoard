import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, closestCorners, useDroppable, useSensor, useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ClipboardList, Info, Lock, Plus, Search, User, X, Zap } from 'lucide-react'
import api, { csrf, parseError } from '../../lib/api'
import { STATUSES, statusMeta } from '../../lib/tasks'
import UserAvatar from '../ui/UserAvatar'
import ConfirmDialog from '../ui/ConfirmDialog'
import TaskCard from './TaskCard'
import TaskDrawer from './TaskDrawer'
import TaskFormModal from './TaskFormModal'

const colId = (s) => `col:${s}`
const isCol = (id) => typeof id === 'string' && id.startsWith('col:')

function SortableTask({ task, canDrag, mine, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, disabled: !canDrag })
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners}
      className={canDrag ? 'touch-manipulation select-none' : 'select-none'}>
      <TaskCard task={task} mine={mine} locked={!canDrag} dragging={isDragging} onOpen={onOpen} />
    </li>
  )
}

function Column({ status, ids, tasks, permissions, dragging, onOpen, onAdd, canDragTask }) {
  const meta = statusMeta[status]
  const { setNodeRef, isOver } = useDroppable({ id: colId(status) })
  const points = ids.reduce((sum, id) => sum + (tasks[id]?.effort ?? 0), 0)
  const lockedForMe = dragging && !permissions.manage_tasks && status === 'done'

  return (
    <section className={`relative flex w-[82vw] shrink-0 snap-start flex-col rounded-2xl border border-slate-200/70 sm:w-80 xl:w-auto ${meta.soft}`} aria-label={meta.label}>
      <header className="flex items-center justify-between px-4 pb-2 pt-4">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
          <h3 className="text-sm font-bold text-ink-900">{meta.label}</h3>
          <span className="rounded-md bg-white px-1.5 text-xs font-bold text-ink-500 shadow-sm">{ids.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="flex items-center gap-0.5 text-[11px] font-semibold text-ink-500" title="Effort points in this column"><Zap className="h-3 w-3" />{points}</span>
          {permissions.manage_tasks && (
            <button onClick={() => onAdd(status)} className="grid h-7 w-7 place-items-center rounded-lg text-ink-500 transition hover:bg-white hover:text-brand-600" aria-label={`Add task to ${meta.label}`}>
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      <SortableContext id={colId(status)} items={ids} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className={`flex min-h-[140px] flex-1 flex-col gap-2.5 rounded-b-2xl p-3 pt-1 transition-colors ${isOver && !lockedForMe ? 'bg-brand-50/70' : ''}`}>
          {ids.map((id) => tasks[id] && (
            <SortableTask key={id} task={tasks[id]} canDrag={canDragTask(tasks[id])} mine={tasks[id].assignee?.id === permissions.user_id} onOpen={() => onOpen(id)} />
          ))}
          {ids.length === 0 && (
            <li className={`grid flex-1 place-items-center rounded-xl border-2 border-dashed py-8 text-center text-xs font-medium transition ${isOver ? 'border-brand-300 text-brand-600' : 'border-slate-200 text-ink-300'}`}>
              {dragging ? 'Drop here' : 'No tasks'}
            </li>
          )}
        </ul>
      </SortableContext>

      <AnimatePresence>
        {lockedForMe && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 grid place-items-center rounded-2xl bg-white/80 p-6 text-center backdrop-blur-[1px]">
            <div>
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-ink-500"><Lock className="h-5 w-5" /></span>
              <p className="mt-2 text-sm font-bold text-ink-900">Leader approves</p>
              <p className="text-xs text-ink-500">Drop it in “In review” instead</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function EmptyBoard({ manager, onAdd }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="relative mb-6 grid w-64 grid-cols-3 gap-2" aria-hidden="true">
        {[2, 1, 0].map((n, c) => (
          <div key={c} className="space-y-2 rounded-xl bg-slate-50 p-2">
            <div className={`h-1.5 w-8 rounded-full ${['bg-slate-300', 'bg-amber-400', 'bg-mint-500'][c]}`} />
            {Array.from({ length: n + 1 }).map((_, i) => (
              <motion.div key={i} className="h-8 rounded-lg border-2 border-dashed border-brand-200 bg-white"
                animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, delay: c * 0.3 + i * 0.2 }} />
            ))}
          </div>
        ))}
        <motion.span className="absolute -right-4 -top-4 grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-glow"
          animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}>
          <ClipboardList className="h-5 w-5" />
        </motion.span>
      </div>
      <h3 className="text-xl font-bold text-ink-900">{manager ? 'Plan the work' : 'No tasks yet'}</h3>
      <p className="mt-2 max-w-md text-sm text-ink-500">
        {manager
          ? 'Break the project into tasks, give each one an owner, effort points and a due date. Everyone sees the same board.'
          : 'Your team leader hasn’t added tasks yet. You’ll get a notification when something is assigned to you.'}
      </p>
      {manager && <button onClick={() => onAdd('todo')} className="btn-primary mt-6"><Plus className="h-4 w-4" /> Create the first task</button>}
    </div>
  )
}

export default function BoardTab({ projectId, notify, onTasksChanged }) {
  const [params, setParams] = useSearchParams()
  const openTaskId = params.get('task') ? Number(params.get('task')) : null

  const [tasks, setTasks] = useState({})
  const [columns, setColumns] = useState({ todo: [], in_progress: [], review: [], done: [] })
  const [assignees, setAssignees] = useState([])
  const [permissions, setPermissions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState(null)
  const [query, setQuery] = useState('')
  const [who, setWho] = useState(null)        // assignee id filter
  const [form, setForm] = useState(null)      // { status } for new, { task } for edit
  const [confirmDelete, setConfirmDelete] = useState(null)
  const origin = useRef(null)
  const snapshot = useRef(null)

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/projects/${projectId}/tasks`)
      const byId = {}
      const cols = { todo: [], in_progress: [], review: [], done: [] }
      data.data.forEach((t) => { byId[t.id] = t; cols[t.status].push(t.id) })
      setTasks(byId); setColumns(cols); setAssignees(data.assignees); setPermissions(data.permissions)
    } catch (err) {
      notify(parseError(err).message, 'error')
    } finally {
      setLoading(false)
    }
  }, [projectId, notify])

  useEffect(() => { load() }, [load])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const canDragTask = useCallback(
    (t) => !!permissions && (permissions.manage_tasks || (t.assignee?.id === permissions.user_id && t.status !== 'done')),
    [permissions]
  )

  const matches = useCallback((t) =>
    (!query || t.title.toLowerCase().includes(query.toLowerCase())) && (!who || t.assignee?.id === who), [query, who])

  const visible = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s, columns[s].filter((id) => tasks[id] && matches(tasks[id]))])), [columns, tasks, matches])

  const findContainer = (id) => (isCol(id) ? id.slice(4) : STATUSES.find((s) => columns[s].includes(id)))

  const openTask = (id) => setParams((p) => { p.set('tab', 'board'); p.set('task', id); return p }, { replace: true })
  const closeTask = useCallback(() => setParams((p) => { p.delete('task'); return p }, { replace: true }), [setParams])

  /* ——— Drag & drop ——— */
  const onDragStart = ({ active }) => {
    setActiveId(active.id)
    snapshot.current = columns
    const status = findContainer(active.id)
    origin.current = { status, index: columns[status].indexOf(active.id) }
  }

  const onDragOver = ({ active, over }) => {
    if (!over) return
    const from = findContainer(active.id)
    const to = findContainer(over.id)
    if (!from || !to || from === to) return
    setColumns((cols) => {
      const toItems = [...cols[to]]
      const overIndex = toItems.indexOf(over.id)
      const below = over.rect && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height / 2
      toItems.splice(overIndex >= 0 ? overIndex + (below ? 1 : 0) : toItems.length, 0, active.id)
      return { ...cols, [from]: cols[from].filter((id) => id !== active.id), [to]: toItems }
    })
  }

  const revert = (message) => {
    if (snapshot.current) setColumns(snapshot.current)
    if (message) notify(message, 'error')
  }

  const onDragEnd = async ({ active, over }) => {
    setActiveId(null)
    const id = active.id
    if (!over) return revert()

    const status = findContainer(id)
    let cols = columns
    if (status === findContainer(over.id) && over.id !== id && !isCol(over.id)) {
      cols = { ...cols, [status]: arrayMove(cols[status], cols[status].indexOf(id), cols[status].indexOf(over.id)) }
      setColumns(cols)
    }
    const position = cols[status].indexOf(id)
    if (status === origin.current.status && position === origin.current.index) return

    if (!permissions.manage_tasks && status === 'done') {
      return revert('Only the leader or supervisor can mark a task as done. Move it to “In review”.')
    }

    const before = tasks[id]
    setTasks((t) => ({ ...t, [id]: { ...t[id], status } }))
    try {
      await csrf()
      const { data } = await api.patch(`/api/tasks/${id}/move`, { status, position })
      setTasks((t) => ({ ...t, [id]: { ...t[id], ...data.data } }))
      if (status !== origin.current.status) {
        notify(status === 'review' ? 'Submitted for review — your leader will be notified.' : `Moved to ${statusMeta[status].label}.`)
        onTasksChanged?.()
      }
    } catch (err) {
      setTasks((t) => ({ ...t, [id]: before }))
      revert(parseError(err).message)
    }
  }

  /* ——— Create / edit / delete ——— */
  const onSaved = (task, editing) => {
    setForm(null)
    notify(editing ? 'Task updated.' : 'Task created.')
    load(); onTasksChanged?.()
  }

  const doDelete = async () => {
    try {
      await csrf()
      await api.delete(`/api/tasks/${confirmDelete.id}`)
      setConfirmDelete(null); setForm(null); closeTask()
      notify('Task deleted.'); load(); onTasksChanged?.()
    } catch (err) {
      notify(parseError(err).message, 'error')
    }
  }

  if (loading || !permissions) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {STATUSES.map((s) => <div key={s} className="h-96 w-80 shrink-0 animate-pulse rounded-2xl bg-slate-100 xl:flex-1" />)}
      </div>
    )
  }

  const total = Object.keys(tasks).length
  const activeTask = activeId ? tasks[activeId] : null

  return (
    <div className="space-y-5">
      {total === 0 ? <EmptyBoard manager={permissions.manage_tasks} onAdd={(status) => setForm({ status })} /> : (
        <>
          {/* Toolbar */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative sm:w-72">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter tasks…" aria-label="Filter tasks"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10" />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button onClick={() => setWho(who === permissions.user_id ? null : permissions.user_id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${who === permissions.user_id ? 'border-brand-500 bg-brand-600 text-white' : 'border-slate-200 bg-white text-ink-700 hover:border-slate-300'}`}>
                  <User className="h-3.5 w-3.5" /> My tasks
                </button>
                <span className="mx-1 h-5 w-px shrink-0 bg-slate-200" />
                {assignees.map((a) => (
                  <button key={a.id} onClick={() => setWho(who === a.id ? null : a.id)} title={a.name} aria-pressed={who === a.id}
                    className={`shrink-0 rounded-full transition ${who === a.id ? 'ring-2 ring-brand-500 ring-offset-2' : who ? 'opacity-40 hover:opacity-100' : 'hover:-translate-y-0.5'}`}>
                    <UserAvatar user={a} size="h-8 w-8" text="text-[10px]" />
                  </button>
                ))}
                {(who || query) && (
                  <button onClick={() => { setWho(null); setQuery('') }} className="ml-1 flex shrink-0 items-center gap-1 text-xs font-semibold text-ink-500 hover:text-ink-900">
                    <X className="h-3.5 w-3.5" /> Clear
                  </button>
                )}
              </div>
            </div>
            {permissions.manage_tasks && (
              <button onClick={() => setForm({ status: 'todo' })} className="btn-primary !py-2.5"><Plus className="h-4 w-4" /> New task</button>
            )}
          </div>

          {!permissions.manage_tasks && (
            <p className="flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-brand-900">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Drag <b>your own</b> tasks as you work. When you finish, move a task to <b>In review</b> — your leader or supervisor approves it as done.</span>
            </p>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={() => { setActiveId(null); revert() }}>
            <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0 xl:grid xl:grid-cols-4 xl:overflow-visible">
              {STATUSES.map((s) => (
                <Column key={s} status={s} ids={visible[s]} tasks={tasks} permissions={permissions} dragging={!!activeId}
                  onOpen={openTask} onAdd={(status) => setForm({ status })} canDragTask={canDragTask} />
              ))}
            </div>
            <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
              {activeTask && <TaskCard task={activeTask} overlay mine={activeTask.assignee?.id === permissions.user_id} />}
            </DragOverlay>
          </DndContext>
        </>
      )}

      <TaskDrawer taskId={openTaskId} permissions={permissions} onClose={closeTask}
        onChanged={() => { load(); onTasksChanged?.() }} onEdit={(task) => setForm({ task })} />

      <TaskFormModal open={!!form} projectId={projectId} task={form?.task} defaultStatus={form?.status} assignees={assignees}
        onClose={() => setForm(null)} onSaved={onSaved} onDelete={form?.task ? () => setConfirmDelete(form.task) : null} />

      <ConfirmDialog open={!!confirmDelete} title="Delete this task?" confirmLabel="Delete"
        message={`“${confirmDelete?.title}” and its activity history will be removed. This can’t be undone.`}
        onConfirm={doDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  )
}