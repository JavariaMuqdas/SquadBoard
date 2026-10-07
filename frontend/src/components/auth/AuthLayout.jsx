import { Link, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Logo from '../ui/Logo'
import AuthIllustration from './AuthIllustration'

const copy = {
  login: { title: 'Welcome back to your team.', text: 'Pick up right where your group left off — tasks, deadlines and progress, all in one board.' },
  register: { title: 'Every contribution, counted.', text: 'Your own account means every task you finish is credited to you — and shows up in the report.' },
  invite: { title: 'Your team is waiting.', text: 'Join the project board, see your tasks, and start shipping together.' },
  forgot: { title: 'Locked out? No stress.', text: 'We’ll email you a secure link to set a new password in under a minute.' },
}

function variantFor(pathname) {
  if (pathname.startsWith('/register')) return 'register'
  if (pathname.startsWith('/invite')) return 'invite'
  if (pathname.startsWith('/forgot') || pathname.startsWith('/reset')) return 'forgot'
  return 'login'
}

export default function AuthLayout() {
  const { pathname } = useLocation()
  const variant = variantFor(pathname)
  const c = copy[variant]

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      {/* ——— Form side ——— */}
      <div className="relative flex flex-col overflow-hidden px-4 py-6 sm:px-10 lg:px-16">
        {/* mobile-only soft glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-200/50 blur-3xl lg:hidden" />

        <header className="relative flex items-center justify-between">
          <Logo />
          <Link to="/" className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-500 transition hover:bg-brand-50 hover:text-brand-700">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to home</span>
          </Link>
        </header>

        <div className="relative flex flex-1 items-center justify-center py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="relative text-center text-xs text-ink-500">
          © {new Date().getFullYear()} SquadBoard · <a href="#" className="hover:text-brand-700">Privacy</a> · <a href="#" className="hover:text-brand-700">Terms</a>
        </p>
      </div>

      {/* ——— Illustration side (desktop) ——— */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-600 via-violet-600 to-fuchsia-600 lg:flex lg:flex-col lg:justify-center lg:px-14 xl:px-20">
        <div className="bg-grid absolute inset-0 opacity-25" />
        <div className="absolute -left-24 -top-24 h-80 w-80 animate-float-slow rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 h-96 w-96 animate-float rounded-full bg-fuchsia-300/20 blur-3xl" />

        <div className="relative">
          <AuthIllustration key={variant} variant={variant} />
          <AnimatePresence mode="wait">
            <motion.div
              key={variant}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="mx-auto mt-10 max-w-md text-center"
            >
              <h2 className="text-3xl font-bold text-white">{c.title}</h2>
              <p className="mt-3 leading-relaxed text-brand-100">{c.text}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </aside>
    </div>
  )
}
