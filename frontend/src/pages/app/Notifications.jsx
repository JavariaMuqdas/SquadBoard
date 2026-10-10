import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, CheckCheck, Volume2, VolumeX } from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'
import { dayGroup } from '../../lib/time'
import Seo from '../../components/ui/Seo'
import NotificationItem from '../../components/notifications/NotificationItem'
import EmptyNotifications from '../../components/notifications/EmptyNotifications'

const filters = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'tasks', label: 'Tasks', kinds: ['task_assigned', 'task_submitted', 'task_approved', 'task_returned', 'task_update', 'deadline'] },
  { id: 'team', label: 'Team', kinds: ['member_joined', 'member_left', 'removed'] },
]

export default function Notifications() {
   const { items, unread, loaded, soundOn, toggleSound, markAllRead, open, remove, clearPopups } = useNotifications()

  // Everything is already listed on this page, so pop-ups would just cover it
  useEffect(() => { clearPopups() }, [clearPopups, items.length])
  const [filter, setFilter] = useState('all')

  const groups = useMemo(() => {
    const f = filters.find((x) => x.id === filter)
    const list = items.filter((n) => (filter === 'unread' ? !n.read_at : f.kinds ? f.kinds.includes(n.kind) : true))
    return list.reduce((acc, n) => {
      const g = dayGroup(n.created_at)
      ;(acc[g] ||= []).push(n)
      return acc
    }, {})
  }, [items, filter])

  const empty = Object.keys(groups).length === 0

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Seo title="Notifications — SquadBoard" description="Your SquadBoard notifications." path="/app/notifications" />

      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-glow"><Bell className="h-7 w-7" /></span>
          <div>
            <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">Notifications</h1>
            <p className="text-sm text-ink-500">{unread ? `You have ${unread} unread notification${unread === 1 ? '' : 's'}.` : 'You’re all caught up.'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={toggleSound} className="btn-ghost !py-2.5" aria-pressed={soundOn}>
            {soundOn ? <Volume2 className="h-4 w-4 text-brand-600" /> : <VolumeX className="h-4 w-4" />} Sound {soundOn ? 'on' : 'off'}
          </button>
          <button onClick={markAllRead} disabled={!unread} className="btn-primary !py-2.5 disabled:opacity-50 disabled:hover:translate-y-0">
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </button>
        </div>
      </motion.header>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200 sm:w-fit">
        {filters.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`relative whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${filter === f.id ? 'text-white' : 'text-ink-500 hover:text-ink-900'}`}>
            {filter === f.id && <motion.span layoutId="notif-page-tab" className="absolute inset-0 rounded-lg bg-brand-600" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
            <span className="relative">{f.label}{f.id === 'unread' && unread ? ` (${unread})` : ''}</span>
          </button>
        ))}
      </div>

      {!loaded ? (
        <div className="card space-y-4 p-5">{[0, 1, 2, 3].map((i) => <div key={i} className="flex gap-3"><div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200" /><div className="flex-1 space-y-2"><div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" /><div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" /></div></div>)}</div>
      ) : empty ? (
        <div className="card"><EmptyNotifications unreadOnly={filter === 'unread'} /></div>
      ) : (
        Object.entries(groups).map(([group, list]) => (
          <section key={group}>
            <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-ink-500">{group}</h2>
            <ul className="card divide-y divide-slate-100 overflow-hidden">
              <AnimatePresence initial={false}>
                {list.map((n, i) => <NotificationItem key={n.id} n={n} index={i} onOpen={open} onRemove={remove} />)}
              </AnimatePresence>
            </ul>
          </section>
        ))
      )}
    </div>
  )
}