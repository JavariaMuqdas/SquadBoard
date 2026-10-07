import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X, ArrowRight } from 'lucide-react'
import Logo from '../ui/Logo'
import { useAuth } from '../../context/AuthContext'

const links = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Reports', href: '#reports' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
  }, [open])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-xl' : 'bg-transparent'
      }`}
    >
      <nav className="container-x flex h-16 items-center justify-between sm:h-[72px]" aria-label="Main">
        <Logo />

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="rounded-lg px-3.5 py-2 text-sm font-medium text-ink-500 transition hover:bg-brand-50 hover:text-brand-700">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <Link to="/app" className="btn-primary !py-2.5">Dashboard <ArrowRight className="h-4 w-4" /></Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-ink-700 hover:text-brand-700">Log in</Link>
              <Link to="/register" className="btn-primary !py-2.5">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-200 bg-white lg:hidden"
          >
            <div className="container-x flex h-[calc(100dvh-64px)] flex-col gap-1 py-6">
              {links.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)}
                   className="rounded-xl px-4 py-3 text-base font-semibold text-ink-800 hover:bg-brand-50">
                  {l.label}
                </a>
              ))}
              <div className="mt-auto grid gap-3">
                {user ? (
                  <Link to="/app" onClick={() => setOpen(false)} className="btn-primary w-full">Go to dashboard</Link>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setOpen(false)} className="btn-ghost w-full">Log in</Link>
                    <Link to="/register" onClick={() => setOpen(false)} className="btn-primary w-full">Start free</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
