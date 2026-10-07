import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Mail, User, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { googleUrl, parseError } from '../../lib/api'
import useInvite from '../../hooks/useInvite'
import Seo from '../../components/ui/Seo'
import InviteBanner from '../../components/auth/InviteBanner'
import { Alert, AuthHeading, Divider, Field, GoogleButton, PasswordField, RoleSelector, SubmitButton, passwordScore } from '../../components/auth/FormControls'

export default function Register() {
  const { register } = useAuth()
  const [params] = useSearchParams()
  const inviteToken = params.get('invite')
  const { invite, error: inviteError } = useInvite(inviteToken)

  const [form, setForm] = useState({
    name: '', email: '', password: '', password_confirmation: '',
    role: params.get('role') === 'supervisor' ? 'supervisor' : 'student', terms: false,
  })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Invited: email is locked to the invited address, role follows the invite
  useEffect(() => {
    if (invite) setForm((f) => ({ ...f, email: invite.email, role: invite.role === 'supervisor' ? 'supervisor' : 'student' }))
  }, [invite])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const validate = () => {
    const e = {}
    if (form.name.trim().length < 2) e.name = 'Enter your full name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address.'
    if (passwordScore(form.password) < 2) e.password = 'Use 8+ characters with letters and numbers.'
    if (form.password !== form.password_confirmation) e.password_confirmation = 'Passwords don’t match.'
    if (!form.terms) e.terms = 'Please accept the terms to continue.'
    return e
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    const local = validate()
    setErrors(local)
    if (Object.keys(local).length) return

    setLoading(true)
    try {
      await register({ ...form, invite_token: inviteToken || undefined })
    } catch (err) {
      const p = parseError(err)
      setErrors(p.fields)
      if (!Object.keys(p.fields).length) setMessage(p.message)
      setLoading(false)
    }
  }

  return (
    <>
      <Seo title="Create your account — SquadBoard" description="Create a free SquadBoard account for your student team or as a supervisor." path="/register" />
      <AuthHeading title="Create your account" subtitle={invite ? 'One quick step and you’re on the team.' : 'Free for student teams. No card required.'} />

      <InviteBanner invite={invite} />
      <Alert tone="error">{inviteError?.message || message}</Alert>
      {invite?.account_exists && (
        <Alert tone="info">
          You already have an account with {invite.email}.{' '}
          <Link to={`/login?invite=${inviteToken}`} className="font-semibold underline">Log in to accept</Link>
        </Alert>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <RoleSelector value={form.role} onChange={(role) => setForm((f) => ({ ...f, role }))} locked={!!invite} error={errors.role} />

        <Field label="Full name" icon={User} autoComplete="name" placeholder="e.g. Ali Khan"
          value={form.name} onChange={set('name')} error={errors.name} />
        <Field label="Email" icon={Mail} type="email" autoComplete="email" placeholder="you@university.edu"
          value={form.email} onChange={set('email')} locked={!!invite} error={errors.email}
          hint={invite ? 'Locked to the email your invitation was sent to.' : undefined} />

        <PasswordField autoComplete="new-password" placeholder="Create a password" showStrength
          value={form.password} onChange={set('password')} error={errors.password} />
        <PasswordField label="Confirm password" autoComplete="new-password" placeholder="Repeat password"
          value={form.password_confirmation} onChange={set('password_confirmation')} error={errors.password_confirmation} />

        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-700">
            <input type="checkbox" checked={form.terms} onChange={set('terms')} className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-brand-600" />
            <span>I agree to the <a href="#" className="font-semibold text-brand-600">Terms</a> and <a href="#" className="font-semibold text-brand-600">Privacy Policy</a>.</span>
          </label>
          {errors.terms && <p role="alert" className="mt-1.5 text-xs font-medium text-coral-400">{errors.terms}</p>}
        </div>

        <SubmitButton loading={loading}>{invite ? 'Create account & join' : 'Create account'} <ArrowRight className="h-4 w-4" /></SubmitButton>
      </form>

      <Divider />
      <GoogleButton href={googleUrl({ role: form.role, invite: inviteToken })} label="Sign up with Google" />

      <p className="mt-8 text-center text-sm text-ink-500">
        Already have an account?{' '}
        <Link to={`/login${inviteToken ? `?invite=${inviteToken}` : ''}`} className="font-semibold text-brand-600 hover:text-brand-700">Log in</Link>
      </p>
    </>
  )
}
