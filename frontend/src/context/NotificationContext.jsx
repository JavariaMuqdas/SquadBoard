import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import api from '../lib/api'
import { playChime, unlockAudio } from '../lib/sound'
import { kindOf } from '../lib/notificationKinds'

const NotificationContext = createContext(null)
const POLL_MS = 20000
const POPUP_MS = 6000
const POPUP_MAX_AGE_MS = 2 * 60 * 1000   // only notifications newer than 2 minutes pop up
const SOUND_KEY = 'squadboard:sound'
const SHOWN_KEY = 'squadboard:popups-shown'

const readSoundPref = () => {
  try { return localStorage.getItem(SOUND_KEY) !== 'off' } catch { return true }
}

// IDs that already popped up (or were dismissed) this browser session — they never pop up again
const loadShown = () => {
  try { return new Set(JSON.parse(sessionStorage.getItem(SHOWN_KEY) || '[]')) } catch { return new Set() }
}
const saveShown = (set) => {
  try { sessionStorage.setItem(SHOWN_KEY, JSON.stringify([...set].slice(-200))) } catch { /* private mode */ }
}

/** One pop-up card. Closes itself after POPUP_MS; hovering pauses the timer so you can read it. */
function Popup({ n, onOpen, onClose }) {
  const [paused, setPaused] = useState(false)
  const k = kindOf(n.kind)

  useEffect(() => {
    if (paused) return
    const t = setTimeout(() => onClose(n.id), POPUP_MS)
    return () => clearTimeout(t)
  }, [paused, n.id, onClose])

  return (
    <motion.div layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 60, scale: 0.95, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      className="pointer-events-auto relative flex cursor-pointer items-start gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 pr-12 shadow-2xl"
      onClick={() => onOpen(n)} role="status">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${k.cls}`}><k.icon className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink-900">{n.title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-ink-500">{n.body}</p>
      </div>
      <button type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onClose(n.id) }}
        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-slate-100 hover:text-ink-900"
        aria-label="Dismiss notification">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

function Provider({ children }) {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [soundOn, setSoundOn] = useState(readSoundPref)
  const [ping, setPing] = useState(0)          // increments on each new arrival → bell wiggle
  const [popups, setPopups] = useState([])     // slide-in cards for new arrivals
  const seen = useRef(null)
  const shown = useRef(loadShown())
  const soundRef = useRef(soundOn)
  soundRef.current = soundOn

  const fetchAll = useCallback(async () => {
    try {
      const { data } = await api.get('/api/notifications', { params: { limit: 30 } })
      const list = data.data
      setItems(list)
      setUnread(data.unread_count)
      setLoaded(true)

      if (seen.current === null) {
        seen.current = new Set(list.map((n) => n.id))   // first load: no sound, no pop-ups
        return
      }
      const fresh = list.filter((n) => !seen.current.has(n.id) && !n.read_at)
      list.forEach((n) => seen.current.add(n.id))
      if (!fresh.length) return

      if (soundRef.current) playChime()
      setPing((p) => p + 1)

      const now = Date.now()
      const toShow = fresh.filter((n) => !shown.current.has(n.id) && now - new Date(n.created_at).getTime() < POPUP_MAX_AGE_MS)
      if (toShow.length) {
        toShow.forEach((n) => shown.current.add(n.id))
        saveShown(shown.current)
        setPopups((p) => [...toShow.slice(0, 3), ...p.filter((x) => !toShow.some((t) => t.id === x.id))].slice(0, 3))
      }
    } catch {
      /* offline or logged out — try again next tick */
    }
  }, [])

  // Poll while the tab is visible; refetch immediately when the user comes back
  useEffect(() => {
    fetchAll()
    const tick = setInterval(() => { if (document.visibilityState === 'visible') fetchAll() }, POLL_MS)
    const onVisible = () => document.visibilityState === 'visible' && fetchAll()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pointerdown', unlockAudio, { once: true })
    return () => { clearInterval(tick); document.removeEventListener('visibilitychange', onVisible) }
  }, [fetchAll])

  // "(3) SquadBoard" in the browser tab
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, '')
    document.title = unread ? `(${unread}) ${base}` : base
  }, [unread, items])

  const closePopup = useCallback((id) => setPopups((p) => p.filter((x) => x.id !== id)), [])
  const clearPopups = useCallback(() => setPopups([]), [])

  const markRead = useCallback(async (id) => {
    setItems((list) => list.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: new Date().toISOString() } : n)))
    setUnread((u) => Math.max(0, u - (items.find((n) => n.id === id && !n.read_at) ? 1 : 0)))
    try { const { data } = await api.post(`/api/notifications/${id}/read`); setUnread(data.unread_count) } catch { /* ignore */ }
  }, [items])

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString()
    setItems((list) => list.map((n) => (n.read_at ? n : { ...n, read_at: now })))
    setUnread(0)
    setPopups([])
    try { await api.post('/api/notifications/read-all') } catch { fetchAll() }
  }, [fetchAll])

  const remove = useCallback(async (id) => {
    setItems((list) => list.filter((n) => n.id !== id))
    setPopups((p) => p.filter((x) => x.id !== id))
    try { const { data } = await api.delete(`/api/notifications/${id}`); setUnread(data.unread_count) } catch { fetchAll() }
  }, [fetchAll])

  const toggleSound = useCallback(() => {
    setSoundOn((on) => {
      const next = !on
      try { localStorage.setItem(SOUND_KEY, next ? 'on' : 'off') } catch { /* private mode */ }
      if (next) playChime()
      return next
    })
  }, [])

  const open = useCallback((n) => {
    if (!n.read_at) markRead(n.id)
    closePopup(n.id)
    if (n.url) navigate(n.url)
  }, [markRead, navigate, closePopup])

  const value = useMemo(
    () => ({ items, unread, loaded, soundOn, ping, refresh: fetchAll, markRead, markAllRead, remove, toggleSound, open, clearPopups }),
    [items, unread, loaded, soundOn, ping, fetchAll, markRead, markAllRead, remove, toggleSound, open, clearPopups]
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {/* New-notification pop-ups (top right) */}
      <div className="pointer-events-none fixed right-4 top-20 z-[95] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 print:hidden" aria-live="polite">
        <AnimatePresence initial={false}>
          {popups.map((n) => <Popup key={n.id} n={n} onOpen={open} onClose={closePopup} />)}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  )
}

/** Safe to mount more than once: a nested provider just reuses the outer one (no second poller or pop-ups). */
export function NotificationProvider({ children }) {
  const parent = useContext(NotificationContext)
  if (parent) return children
  return <Provider>{children}</Provider>
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationProvider>')
  return ctx
}