import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Mail, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { googleUrl, parseError } from '../../lib/api'
import useInvite from '../../hooks/useInvite'
import Seo from '../../components/ui/Seo'
import InviteBanner from '../../components/auth/InviteBanner'
import { Alert, AuthHeading, Divider, Field, GoogleButton, PasswordField, SubmitButton } from '../../components/auth/FormControls'

export default function Login() {
  const { login } = useAuth()
  const [params] = useSearchParams()
  const inviteToken = params.get('invite')
  const { invite } = useInvite(inviteToken)

  const [form, setForm] = useState({ email: params.get('email') || '', password: '', remember: true })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState(params.get('error') === 'google_failed' ? 'Google sign-in was cancelled or failed. Please try again.' : '')
  const [loading, setLoading] = useState(false)

  const email = invite?.email || form.email
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setErrors({}); setMessage('')
    const local = {}
    if (!email) local.email = 'Enter your email.'
    if (!form.password) local.password = 'Enter your password.'
    if (Object.keys(local).length) return setErrors(local)

    setLoading(true)
    try {
      // On success the GuestRoute redirects to the app (or the page they came from)
      await login({ ...form, email, invite_token: inviteToken || undefined })
    } catch (err) {
      const p = parseError(err)
      setErrors(p.fields)
      if (!Object.keys(p.fields).length) setMessage(p.message)
      setLoading(false)
    }
  }

  return (
    <>
      <Seo title="Log in — SquadBoard" description="Log in to your SquadBoard team workspace." path="/login" />
      <AuthHeading title="Welcome back" subtitle={invite ? 'Log in to accept your invitation.' : 'Log in to see your team’s board.'} />
      <InviteBanner invite={invite} />
      <Alert tone="success">{params.get('reset') ? 'Password updated. Log in with your new password.' : ''}</Alert>
      <Alert tone="error">{message}</Alert>

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Field label="Email" icon={Mail} type="email" autoComplete="email" placeholder="you@university.edu"
          value={email} onChange={set('email')} locked={!!invite} error={errors.email} />
        <PasswordField autoComplete="current-password" placeholder="Your password"
          value={form.password} onChange={set('password')} error={errors.password} />

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={form.remember} onChange={set('remember')} className="h-4 w-4 rounded border-slate-300 accent-brand-600" />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-sm font-semibold text-brand-600 hover:text-brand-700">Forgot password?</Link>
        </div>

        <SubmitButton loading={loading}>Log in <ArrowRight className="h-4 w-4" /></SubmitButton>
      </form>

      <Divider />
      <GoogleButton href={googleUrl({ invite: inviteToken })} />

      <p className="mt-8 text-center text-sm text-ink-500">
        New to SquadBoard?{' '}
        <Link to={`/register${inviteToken ? `?invite=${inviteToken}` : ''}`} className="font-semibold text-brand-600 hover:text-brand-700">Create an account</Link>
      </p>
    </>
  )
}
