import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell, ChevronDown, FileBarChart2, FolderKanban, LayoutDashboard, ListChecks, LogOut, Menu, Search, Settings, Sparkles, UserRound, X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { NotificationProvider, useNotifications } from '../../context/NotificationContext'
import NotificationBell from '../notifications/NotificationBell'
import Logo from '../ui/Logo'
import UserAvatar from '../ui/UserAvatar'

const nav = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/projects', label: 'Projects', icon: FolderKanban },
  { to: '/app/my-tasks', label: 'My tasks', icon: ListChecks },
  { to: '/app/reports', label: 'Reports', icon: FileBarChart2 },
  { to: '/app/notifications', label: 'Notifications', icon: Bell, badge: 'unread' },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

function SidebarContent({ onNavigate }) {
  const { user } = useAuth()
  const { unread } = useNotifications()

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5"><Logo /></div>

      <nav className="mt-4 flex-1 space-y-1 px-3" aria-label="App">
        {nav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                isActive ? 'text-brand-700' : 'text-ink-500 hover:bg-slate-100 hover:text-ink-900'
              }`}>
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-brand-50" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                <item.icon className="relative h-5 w-5" />
                <span className="relative">{item.label}</span>
                {item.badge === 'unread' && unread > 0 && (
                  <span className="relative ml-auto rounded-full bg-coral-400 px-2 py-0.5 text-[10px] font-bold text-white">{unread > 99 ? '99+' : unread}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Plan card */}
      <div className="relative m-3 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-violet-700 p-4 text-white">
        <motion.div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 5, repeat: Infinity }} />
        <div className="relative flex items-center gap-2 text-sm font-bold"><Sparkles className="h-4 w-4 text-amber-400" /> Free plan</div>
        <p className="relative mt-1 text-xs text-brand-100">Up to 3 projects and 5 members per team.</p>
        <Link to="/#pricing" className="relative mt-3 block w-full rounded-lg bg-white/15 py-2 text-center text-xs font-semibold transition hover:bg-white/25">See Pro features</Link>
      </div>

      <Link to="/app/settings" onClick={onNavigate} className="flex items-center gap-3 border-t border-slate-100 p-4 transition hover:bg-slate-50">
        <UserAvatar user={user} size="h-9 w-9" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-900">{user.name}</p>
          <p className="truncate text-xs capitalize text-ink-500">{user.role}</p>
        </div>
      </Link>
    </div>
  )
}

function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const go = (to) => { setOpen(false); navigate(to) }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full p-1 pr-2 transition hover:bg-slate-100" aria-haspopup="menu" aria-expanded={open}>
        <UserAvatar user={user} size="h-9 w-9" />
        <ChevronDown className={`hidden h-4 w-4 text-ink-500 transition sm:block ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 z-50 w-64 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-100 px-3 pb-3 pt-2">
              <UserAvatar user={user} size="h-10 w-10" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900">{user.name}</p>
                <p className="truncate text-xs text-ink-500">{user.email}</p>
              </div>
            </div>
            <button role="menuitem" onClick={() => go('/app/settings')} className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-slate-50">
              <UserRound className="h-4 w-4" /> Profile & settings
            </button>
            <button role="menuitem" onClick={() => go('/app/notifications')} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-slate-50">
              <Bell className="h-4 w-4" /> Notifications
            </button>
            <button role="menuitem" onClick={async () => { await logout(); navigate('/login') }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50">
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Top-bar search: Enter opens the Projects page filtered by the text. */
function TopSearch() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  return (
    <form className="relative hidden max-w-md flex-1 sm:block" role="search"
      onSubmit={(e) => { e.preventDefault(); navigate(`/app/projects${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`) }}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects…" aria-label="Search projects"
        className="h-10 w-full rounded-xl border border-transparent bg-slate-100 pl-10 pr-4 text-sm outline-none transition focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-500/10" />
    </form>
  )
}

function Shell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setMobileOpen(false), [pathname])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block print:hidden">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
            <motion.aside className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl lg:hidden"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 320, damping: 34 }}>
              <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-64 print:pl-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl print:hidden">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button onClick={() => setMobileOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <div className="sm:hidden"><Logo /></div>
            <TopSearch />
            <div className="ml-auto flex items-center gap-2">
              <NotificationBell />
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function AppLayout() {
  return (
    <NotificationProvider>
      <Shell />
    </NotificationProvider>
  )
}