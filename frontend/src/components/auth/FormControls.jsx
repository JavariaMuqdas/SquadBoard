import { forwardRef, useId, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Info, Loader2, Lock, GraduationCap, UserCheck, Check } from 'lucide-react'

/* ——— Text input with icon, label, error ——— */
export const Field = forwardRef(function Field({ label, icon: Icon, error, locked, hint, className = '', ...props }, ref) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink-800">{label}</label>
      <div className="relative">
        {Icon && <Icon className={`pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 ${error ? 'text-coral-400' : 'text-ink-300'}`} />}
        <input
          id={id}
          ref={ref}
          readOnly={locked}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className={`h-12 w-full rounded-xl border bg-white text-[15px] text-ink-900 placeholder:text-ink-300 transition-all duration-200
            ${Icon ? 'pl-11' : 'pl-4'} ${locked ? 'pr-11 cursor-not-allowed bg-slate-50 text-ink-500' : 'pr-4'}
            ${error ? 'border-coral-400 focus:ring-4 focus:ring-coral-400/15' : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15'}
            outline-none`}
          {...props}
        />
        {locked && <Lock className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" aria-label="Locked" />}
      </div>
      <FieldMessage id={`${id}-err`} error={error} hint={hint} />
    </div>
  )
})

function FieldMessage({ id, error, hint }) {
  return (
    <AnimatePresence initial={false} mode="wait">
      {error ? (
        <motion.p key="e" id={id} role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-coral-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </motion.p>
      ) : hint ? (
        <motion.p key="h" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 text-xs text-ink-500">{hint}</motion.p>
      ) : null}
    </AnimatePresence>
  )
}

/* ——— Password with show/hide and optional strength meter ——— */
export function passwordScore(pw = '') {
  let s = 0
  if (pw.length >= 8) s++
  if (/[a-zA-Z]/.test(pw) && /\d/.test(pw)) s++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++
  if (/[^a-zA-Z0-9]/.test(pw) || pw.length >= 12) s++
  return s
}

const strength = [
  { label: 'Too short', color: 'bg-slate-200' },
  { label: 'Weak', color: 'bg-coral-400' },
  { label: 'Okay', color: 'bg-amber-400' },
  { label: 'Good', color: 'bg-brand-500' },
  { label: 'Strong', color: 'bg-mint-500' },
]

export const PasswordField = forwardRef(function PasswordField({ label = 'Password', error, showStrength, value, ...props }, ref) {
  const [show, setShow] = useState(false)
  const id = useId()
  const score = passwordScore(value)
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink-800">{label}</label>
      <div className="relative">
        <Lock className={`pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 ${error ? 'text-coral-400' : 'text-ink-300'}`} />
        <input
          id={id} ref={ref} value={value} type={show ? 'text' : 'password'} aria-invalid={!!error}
          className={`h-12 w-full rounded-xl border bg-white pl-11 pr-12 text-[15px] text-ink-900 placeholder:text-ink-300 outline-none transition-all duration-200
            ${error ? 'border-coral-400 focus:ring-4 focus:ring-coral-400/15' : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15'}`}
          {...props}
        />
        <button type="button" onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-ink-500 transition hover:bg-slate-100 hover:text-ink-900"
          aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      </div>
      {showStrength && value?.length > 0 && (
        <div className="mt-2.5">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <motion.div className={`h-full ${strength[score].color}`} initial={{ width: 0 }} animate={{ width: score >= n ? '100%' : '0%' }} transition={{ duration: 0.3 }} />
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-ink-500">Strength: <span className="font-semibold text-ink-800">{strength[score].label}</span> · 8+ characters with letters and numbers</p>
        </div>
      )}
      <FieldMessage error={error} />
    </div>
  )
})

/* ——— Student / Supervisor picker ——— */
const roles = [
  { value: 'student', icon: GraduationCap, title: 'Student', text: 'Join or lead a team' },
  { value: 'supervisor', icon: UserCheck, title: 'Supervisor', text: 'Monitor your teams' },
]

export function RoleSelector({ value, onChange, locked, error }) {
  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-semibold text-ink-800">I am a…</legend>
      <div className="grid grid-cols-2 gap-3" role="radiogroup">
        {roles.map((r) => {
          const active = value === r.value
          return (
            <button
              key={r.value} type="button" role="radio" aria-checked={active}
              disabled={locked && !active}
              onClick={() => !locked && onChange(r.value)}
              className={`relative rounded-2xl border-2 p-3.5 text-left transition-all duration-200 sm:p-4
                ${active ? 'border-brand-500 bg-brand-50/60 shadow-soft' : 'border-slate-200 bg-white hover:border-brand-200'}
                ${locked && !active ? 'cursor-not-allowed opacity-40' : ''}`}
            >
              <span className={`grid h-10 w-10 place-items-center rounded-xl transition-colors ${active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-ink-500'}`}>
                <r.icon className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-bold text-ink-900">{r.title}</p>
              <p className="text-xs text-ink-500">{r.text}</p>
              <AnimatePresence>
                {active && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )
        })}
      </div>
      <FieldMessage error={error} />
    </fieldset>
  )
}

/* ——— Buttons ——— */
export function SubmitButton({ loading, children, ...props }) {
  return (
    <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
      className="btn-primary h-12 w-full text-[15px] disabled:cursor-wait disabled:opacity-80 disabled:hover:translate-y-0" {...props}>
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : children}
    </motion.button>
  )
}

/**
 * "Continue with Google". Add Google's official "G" mark as /public/google-g.svg
 * (download it from Google's sign-in branding guidelines); it's hidden until present.
 */
export function GoogleButton({ href, label = 'Continue with Google' }) {
  return (
    <a href={href} className="btn-ghost h-12 w-full text-[15px]">
      <img src="/google-g.svg" alt="" className="h-5 w-5" onError={(e) => { e.currentTarget.style.display = 'none' }} />
      {label}
    </a>
  )
}

export function Divider({ children = 'or' }) {
  return (
    <div className="relative my-6 flex items-center">
      <span className="h-px flex-1 bg-slate-200" />
      <span className="px-3 text-xs font-medium uppercase tracking-wider text-ink-500">{children}</span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  )
}

/* ——— Alert banner ——— */
const tones = {
  error: { icon: AlertCircle, cls: 'border-coral-400/30 bg-coral-400/10 text-red-700' },
  success: { icon: CheckCircle2, cls: 'border-mint-500/30 bg-mint-500/10 text-emerald-800' },
  info: { icon: Info, cls: 'border-brand-200 bg-brand-50 text-brand-800' },
}

export function Alert({ tone = 'error', children }) {
  const t = tones[tone]
  return (
    <AnimatePresence>
      {children && (
        <motion.div role={tone === 'error' ? 'alert' : 'status'}
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          className="overflow-hidden">
          <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${t.cls}`}>
            <t.icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div>{children}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function AuthHeading({ title, subtitle }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-ink-900 sm:text-[34px]">{title}</h1>
      {subtitle && <p className="mt-2 text-[15px] text-ink-500">{subtitle}</p>}
    </div>
  )
}
