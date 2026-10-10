import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bell, BellRing, KeyRound, LogOut, Mail, Save, Shield, User, UserRound, Volume2, VolumeX } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import api, { csrf, parseError } from '../../lib/api'
import { playChime } from '../../lib/sound'
import Seo from '../../components/ui/Seo'
import Toast from '../../components/ui/Toast'
import UserAvatar from '../../components/ui/UserAvatar'
import { Alert, Field, PasswordField, SubmitButton, passwordScore } from '../../components/auth/FormControls'

const sections = [
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'security', label: 'Password', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

function Card({ id, icon: Icon, title, subtitle, children, delay = 0 }) {
  return (
    <motion.section id={id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="card scroll-mt-24 overflow-hidden">
      <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></span>
        <div><h2 className="font-sans text-base font-bold text-ink-900">{title}</h2><p className="text-xs text-ink-500">{subtitle}</p></div>
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </motion.section>
  )
}

function ProfileForm({ notify }) {
  const { user, refresh } = useAuth()
  const [name, setName] = useState(user.name)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    if (name.trim().length < 2) return setError('Enter your full name.')
    setLoading(true); setError('')
    try {
      await csrf()
      await api.put('/api/user', { name: name.trim() })
      await refresh()
      notify('Profile updated.')
    } catch (err) {
      const p = parseError(err); setError(p.fields.name || p.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-center gap-4">
        <UserAvatar user={{ ...user, name: name || user.name }} size="h-16 w-16" text="text-xl" />
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-ink-900">{name || user.name}</p>
          <p className="text-sm text-ink-500">{user.role === 'supervisor' ? 'Supervisor' : 'Student'} account · Joined {new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" icon={User} value={name} onChange={(e) => { setName(e.target.value); setError('') }} error={error} maxLength={80} autoComplete="name" />
        <Field label="Email" icon={Mail} value={user.email} locked hint="Your email is your login and can’t be changed." />
      </div>
      <div className="flex justify-end">
        <div className="w-full sm:w-44"><SubmitButton loading={loading} disabled={loading || name.trim() === user.name}><Save className="h-4 w-4" /> Save changes</SubmitButton></div>
      </div>
    </form>
  )
}

function PasswordForm({ notify }) {
  const { user } = useAuth()
  const empty = { current_password: '', password: '', password_confirmation: '' }
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((er) => ({ ...er, [k]: undefined })) }

  const save = async (e) => {
    e.preventDefault()
    const local = {}
    if (user.has_password && !form.current_password) local.current_password = 'Enter your current password.'
    if (passwordScore(form.password) < 2) local.password = 'Use 8+ characters with letters and numbers.'
    if (form.password !== form.password_confirmation) local.password_confirmation = 'Passwords don’t match.'
    setErrors(local)
    if (Object.keys(local).length) return

    setLoading(true)
    try {
      await csrf()
      await api.put('/api/user/password', form)
      setForm(empty)
      notify('Password updated.')
    } catch (err) {
      const p = parseError(err); setErrors({ ...p.fields, form: Object.keys(p.fields).length ? '' : p.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={save} noValidate className="space-y-5">
      <Alert tone="error">{errors.form}</Alert>
      {!user.has_password && <Alert tone="info">You signed up with Google. Set a password to also log in with your email.</Alert>}
      {user.has_password && (
        <div className="sm:w-1/2 sm:pr-2">
          <PasswordField label="Current password" autoComplete="current-password" value={form.current_password} onChange={set('current_password')} error={errors.current_password} />
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
        <PasswordField label="New password" autoComplete="new-password" showStrength value={form.password} onChange={set('password')} error={errors.password} />
        <PasswordField label="Confirm new password" autoComplete="new-password" value={form.password_confirmation} onChange={set('password_confirmation')} error={errors.password_confirmation} />
      </div>
      <div className="flex justify-end">
        <div className="w-full sm:w-48"><SubmitButton loading={loading}><KeyRound className="h-4 w-4" /> Update password</SubmitButton></div>
      </div>
    </form>
  )
}

function NotificationPrefs() {
  const { soundOn, toggleSound, unread, markAllRead } = useNotifications()
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${soundOn ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-ink-300'}`}>
          {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink-900">Notification sound</p>
          <p className="text-xs text-ink-500">Play a soft chime when a new notification arrives. Saved on this device.</p>
        </div>
        <button type="button" role="switch" aria-checked={soundOn} aria-label="Notification sound" onClick={toggleSound}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${soundOn ? 'bg-brand-600' : 'bg-slate-300'}`}>
          <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 32 }}
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow ${soundOn ? 'right-1' : 'left-1'}`} />
        </button>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={() => playChime()} className="btn-ghost"><BellRing className="h-4 w-4" /> Play test sound</button>
        <button type="button" onClick={markAllRead} disabled={!unread} className="btn-ghost disabled:opacity-50">
          Mark all {unread ? unread : ''} notifications as read
        </button>
      </div>
      <p className="text-xs text-ink-500">You’re notified when someone joins your project, a task is assigned to you, work is submitted for review, approved or sent back, someone posts an update, and the day before a task is due.</p>
    </div>
  )
}

export default function Settings() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [toast, setToast] = useState(null)
  const notify = useCallback((text) => setToast({ text }), [])
  const closeToast = useCallback(() => setToast(null), [])

  return (
    <div className="mx-auto max-w-5xl">
      <Seo title="Settings — SquadBoard" description="Account settings." path="/app/settings" />
      <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold text-ink-900">Settings</h1>
        <p className="mt-1 text-ink-500">Manage your profile, password and notifications.</p>
      </motion.header>

      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:self-start lg:px-0" aria-label="Settings sections">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-500 transition hover:bg-white hover:text-ink-900">
              <s.icon className="h-4 w-4" /> {s.label}
            </a>
          ))}
          <button onClick={async () => { await logout(); navigate('/login') }}
            className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 lg:mt-4">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </nav>

        <div className="space-y-6">
          <Card id="profile" icon={UserRound} title="Profile" subtitle="How your name appears to your team and on reports."><ProfileForm notify={notify} /></Card>
          <Card id="security" icon={Shield} title="Password" subtitle="Use at least 8 characters with letters and numbers." delay={0.06}><PasswordForm notify={notify} /></Card>
          <Card id="notifications" icon={Bell} title="Notifications" subtitle="In-app alerts and sound." delay={0.12}><NotificationPrefs /></Card>
        </div>
      </div>

      <Toast toast={toast} onClose={closeToast} />
    </div>
  )
}