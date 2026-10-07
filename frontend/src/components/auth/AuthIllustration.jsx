import { motion } from 'framer-motion'
import { CheckCircle2, FileBarChart2, UserPlus, ShieldCheck, KeyRound, Mail } from 'lucide-react'

const people = [
  { i: 'AH', c: 'bg-brand-400' },
  { i: 'SK', c: 'bg-mint-400' },
  { i: 'ZR', c: 'bg-amber-400' },
  { i: 'FN', c: 'bg-coral-400' },
]

function ProgressRing({ value = 72 }) {
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
      <circle cx="40" cy="40" r={r} stroke="rgba(99,102,241,.15)" strokeWidth="8" fill="none" />
      <motion.circle
        cx="40" cy="40" r={r} fill="none" strokeWidth="8" strokeLinecap="round"
        stroke="url(#ringGrad)"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - (value / 100) * c }}
        transition={{ duration: 1.6, delay: 0.5, ease: 'easeOut' }}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" /><stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/** Orbiting team around a project card. `variant` swaps the floating chips. */
export default function AuthIllustration({ variant = 'login' }) {
  const secure = variant === 'forgot' || variant === 'reset'

  const chips = {
    login: [
      { icon: CheckCircle2, tone: 'text-mint-500 bg-mint-500/10', title: 'Task completed', sub: 'Login API · Ahmed' },
      { icon: FileBarChart2, tone: 'text-fuchsia-500 bg-fuchsia-500/10', title: 'Report ready', sub: 'Sprint 3 contributions' },
    ],
    register: [
      { icon: UserPlus, tone: 'text-brand-600 bg-brand-500/10', title: 'Sara joined', sub: 'via invite link' },
      { icon: CheckCircle2, tone: 'text-mint-500 bg-mint-500/10', title: '4 tasks assigned', sub: 'Split fairly by effort' },
    ],
    invite: [
      { icon: Mail, tone: 'text-brand-600 bg-brand-500/10', title: 'You’re invited', sub: 'One click to join' },
      { icon: UserPlus, tone: 'text-mint-500 bg-mint-500/10', title: 'Team of 4', sub: 'Waiting for you' },
    ],
    forgot: [
      { icon: Mail, tone: 'text-brand-600 bg-brand-500/10', title: 'Reset link sent', sub: 'Check your inbox' },
      { icon: ShieldCheck, tone: 'text-mint-500 bg-mint-500/10', title: 'Account secured', sub: 'Encrypted passwords' },
    ],
  }[variant === 'reset' ? 'forgot' : variant]

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[440px]" aria-hidden="true">
      {/* orbit rings */}
      <div className="absolute inset-[6%] rounded-full border border-dashed border-white/25" />
      <div className="absolute inset-[22%] rounded-full border border-white/15" />

      {/* orbiting avatars */}
      <motion.div className="absolute inset-[6%]" animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}>
        {people.map((p, idx) => {
          const angle = (idx / people.length) * Math.PI * 2
          return (
            <motion.span
              key={p.i}
              className={`absolute grid h-11 w-11 place-items-center rounded-full text-xs font-bold text-white shadow-lg ring-4 ring-white/30 ${p.c}`}
              style={{ left: `calc(50% + ${Math.cos(angle) * 50}% - 22px)`, top: `calc(50% + ${Math.sin(angle) * 50}% - 22px)` }}
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: -360 }}
              transition={{
                scale: { delay: 0.4 + idx * 0.15, type: 'spring', stiffness: 260, damping: 18 },
                rotate: { duration: 40, repeat: Infinity, ease: 'linear' },
              }}
            >
              {p.i}
            </motion.span>
          )
        })}
      </motion.div>

      {/* center card (wrapper centers it; motion owns the inner transform) */}
      <div className="absolute inset-0 grid place-items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-[58%] rounded-3xl bg-white p-5 shadow-2xl"
      >
        {secure ? (
          <div className="flex flex-col items-center py-2 text-center">
            <motion.span
              className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-glow"
              animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.5 }}
            >
              <KeyRound className="h-8 w-8" />
            </motion.span>
            <p className="mt-4 text-sm font-bold text-ink-900">Secure reset</p>
            <p className="mt-1 text-xs text-ink-500">Link expires in 60 min</p>
          </div>
        ) : (
          <>
            <p className="text-[11px] font-bold uppercase tracking-wide text-brand-600">Final Year Project</p>
            <p className="mt-1 text-sm font-bold leading-snug text-ink-900">Smart Attendance System</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="relative">
                <ProgressRing value={72} />
                <span className="absolute inset-0 grid place-items-center font-display text-sm font-bold text-ink-900">72%</span>
              </div>
              <div className="space-y-1.5 text-[11px] text-ink-500">
                <p><span className="font-semibold text-ink-900">18</span> tasks done</p>
                <p><span className="font-semibold text-ink-900">6</span> in progress</p>
                <p><span className="font-semibold text-ink-900">12</span> days left</p>
              </div>
            </div>
          </>
        )}
      </motion.div>
      </div>

      {/* floating chips */}
      {chips.map((chip, i) => (
        <motion.div
          key={chip.title}
          initial={{ opacity: 0, x: i ? 30 : -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 + i * 0.3, duration: 0.6 }}
          className={`absolute flex items-center gap-3 rounded-2xl bg-white/95 p-3 pr-4 shadow-xl backdrop-blur ${
            i ? 'bottom-[8%] right-0 animate-float-slow' : 'left-0 top-[10%] animate-float'
          }`}
        >
          <span className={`grid h-9 w-9 place-items-center rounded-xl ${chip.tone}`}><chip.icon className="h-5 w-5" /></span>
          <div>
            <p className="text-xs font-bold text-ink-900">{chip.title}</p>
            <p className="text-[11px] text-ink-500">{chip.sub}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
