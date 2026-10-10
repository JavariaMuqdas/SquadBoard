import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { Bell, CheckCheck, Volume2, VolumeX } from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'
import NotificationItem from './NotificationItem'
import EmptyNotifications from './EmptyNotifications'

export default function NotificationBell() {
    const { items, unread, ping, soundOn, toggleSound, markAllRead, open, remove, clearPopups } = useNotifications()
  const [show, setShow] = useState(false)
  const [tab, setTab] = useState('all')
  const ref = useRef(null)
  const bell = useAnimationControls()

  // Wiggle when something new arrives
  useEffect(() => {
    if (ping) bell.start({ rotate: [0, -18, 15, -10, 6, 0], transition: { duration: 0.8 } })
  }, [ping, bell])

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setShow(false)
    const esc = (e) => e.key === 'Escape' && setShow(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [])

  const list = tab === 'unread' ? items.filter((n) => !n.read_at) : items

  return (
    <div className="relative" ref={ref}>
            <button onClick={() => { setShow((s) => !s); clearPopups() }} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={show}
        className={`relative grid h-10 w-10 place-items-center rounded-xl transition ${show ? 'bg-brand-50 text-brand-700' : 'text-ink-500 hover:bg-slate-100 hover:text-ink-900'}`}>
        <motion.span animate={bell} style={{ originX: 0.5, originY: 0.1 }}><Bell className="h-5 w-5" /></motion.span>
        <AnimatePresence>
          {unread > 0 && (
            <motion.span key={unread}
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              className="absolute -right-0.5 -top-0.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-coral-400 px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {unread > 99 ? '99+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-3 top-[68px] z-50 origin-top overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[400px] sm:origin-top-right"
            role="dialog" aria-label="Notifications"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <h2 className="font-sans text-base font-bold text-ink-900">Notifications</h2>
                {unread > 0 && <span className="rounded-md bg-coral-400/15 px-1.5 py-0.5 text-[11px] font-bold text-red-600">{unread} new</span>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={toggleSound} title={soundOn ? 'Mute sound' : 'Turn sound on'}
                  className={`grid h-8 w-8 place-items-center rounded-lg transition hover:bg-slate-100 ${soundOn ? 'text-brand-600' : 'text-ink-300'}`}
                  aria-label={soundOn ? 'Mute notification sound' : 'Turn notification sound on'} aria-pressed={soundOn}>
                  {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
                <button onClick={markAllRead} disabled={!unread}
                  className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-brand-600 transition hover:bg-brand-50 disabled:text-ink-300 disabled:hover:bg-transparent">
                  <CheckCheck className="h-4 w-4" /> Mark all as read
                </button>
              </div>
            </div>

            <div className="flex gap-1 px-4 pt-3" role="tablist">
              {[['all', 'All'], ['unread', `Unread${unread ? ` (${unread})` : ''}`]].map(([id, label]) => (
                <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                  className={`relative rounded-lg px-3 py-1.5 text-xs font-semibold transition ${tab === id ? 'text-brand-700' : 'text-ink-500 hover:text-ink-900'}`}>
                  {tab === id && <motion.span layoutId="notif-tab" className="absolute inset-0 rounded-lg bg-brand-50" />}
                  <span className="relative">{label}</span>
                </button>
              ))}
            </div>

            <ul className="mt-2 max-h-[min(60vh,440px)] divide-y divide-slate-100 overflow-y-auto overscroll-contain">
              <AnimatePresence initial={false}>
                {list.length === 0
                  ? <li key="empty"><EmptyNotifications unreadOnly={tab === 'unread'} /></li>
                  : list.slice(0, 15).map((n, i) => (
                    <NotificationItem key={n.id} n={n} index={i} compact onOpen={(x) => { setShow(false); open(x) }} onRemove={remove} />
                  ))}
              </AnimatePresence>
            </ul>

            <Link to="/app/notifications" onClick={() => setShow(false)}
              className="block border-t border-slate-100 bg-slate-50/70 py-3 text-center text-sm font-semibold text-brand-600 transition hover:bg-brand-50">
              View all notifications
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}