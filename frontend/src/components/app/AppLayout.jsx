import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard, FolderKanban, ListChecks, FileBarChart2, Settings, Bell, Search,
  Menu, X, LogOut, ChevronDown, Sparkles, UserRound,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Logo from '../ui/Logo'
import { initials } from '../../lib/projectColors'

const nav = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/projects', label: 'Projects', icon: FolderKanban, soon: true },
  { to: '/app/my-tasks', label: 'My tasks', icon: ListChecks, soon: true },
  { to: '/app/reports', label: 'Reports', icon: FileBarChart2, soon: true },
  { to: '/app/settings', label: 'Settings', icon: Settings, soon: true },
]

function Avatar({ user, size = 'h-9 w-9' }) {
  return user.avatar ? (
    <img src={user.avatar} alt="" className={`${size} rounded-full object-cover`} />
  ) : (
    <span className={`${size} grid place-items-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-sm font-bold text-white`}>
      {initials(user.name)}
    </span>
  )
}

function SidebarContent({ onNavigate }) {
  const { user } = useAuth()
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5"><Logo /></div>

      <nav className="mt-4 flex-1 space-y-1 px-3" aria-label="App">
        {nav.map((item) =>
          item.soon ? (
            <span key={item.to} className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-300">
              <item.icon className="h-5 w-5" /> {item.label}
              <span className="ml-auto rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink-500">Soon</span>
            </span>
          ) : (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive ? 'text-brand-700' : 'text-ink-500 hover:bg-slate-100 hover:text-ink-900'
                }`}>
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-brand-50" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                  <item.icon className="relative h-5 w-5" /> <span className="relative">{item.label}</span>
                </>
              )}
            </NavLink>
          )
        )}
      </nav>

      {/* Plan card */}
      <div className="m-3 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-violet-700 p-4 text-white">
        <div className="flex items-center gap-2 text-sm font-bold"><Sparkles className="h-4 w-4 text-amber-400" /> Free plan</div>
        <p className="mt-1 text-xs text-brand-100">Up to 3 projects and 5 members per team.</p>
        <button className="mt-3 w-full rounded-lg bg-white/15 py-2 text-xs font-semibold transition hover:bg-white/25">See Pro features</button>
      </div>

      <div className="flex items-center gap-3 border-t border-slate-100 p-4">
        <Avatar user={user} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-900">{user.name}</p>
          <p className="truncate text-xs capitalize text-ink-500">{user.role}</p>
        </div>
      </div>
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

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full p-1 pr-2 transition hover:bg-slate-100" aria-haspopup="menu" aria-expanded={open}>
        <Avatar user={user} />
        <ChevronDown className={`hidden h-4 w-4 text-ink-500 transition sm:block ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 z-50 w-64 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
            <div className="border-b border-slate-100 px-3 pb-3 pt-2">
              <p className="truncate text-sm font-semibold text-ink-900">{user.name}</p>
              <p className="truncate text-xs text-ink-500">{user.email}</p>
            </div>
            <button disabled className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-300">
              <UserRound className="h-4 w-4" /> Profile <span className="ml-auto text-[10px] font-bold uppercase">Soon</span>
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

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setMobileOpen(false), [pathname])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
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

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button onClick={() => setMobileOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <div className="sm:hidden"><Logo /></div>

            <div className="relative hidden max-w-md flex-1 sm:block">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
              <input type="search" placeholder="Search projects and tasks…" aria-label="Search"
                className="h-10 w-full rounded-xl border border-transparent bg-slate-100 pl-10 pr-4 text-sm outline-none transition focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-500/10" />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button className="relative grid h-10 w-10 place-items-center rounded-xl text-ink-500 transition hover:bg-slate-100 hover:text-ink-900" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-coral-400 ring-2 ring-white" />
              </button>
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}