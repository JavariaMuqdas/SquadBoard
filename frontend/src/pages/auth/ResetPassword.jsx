import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Mail } from 'lucide-react'
import api, { csrf, parseError } from '../../lib/api'
import Seo from '../../components/ui/Seo'
import { Alert, AuthHeading, Field, PasswordField, SubmitButton, passwordScore } from '../../components/auth/FormControls'

export default function ResetPassword() {
  const { token } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: params.get('email') || '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    const local = {}
    if (passwordScore(form.password) < 2) local.password = 'Use 8+ characters with letters and numbers.'
    if (form.password !== form.password_confirmation) local.password_confirmation = 'Passwords don’t match.'
    setErrors(local)
    if (Object.keys(local).length) return

    setLoading(true)
    try {
      await csrf()
      await api.post('/api/reset-password', { ...form, token })
      navigate('/login?reset=1', { replace: true })
    } catch (err) {
      const p = parseError(err)
      setErrors({ ...p.fields, form: Object.keys(p.fields).length ? '' : p.message })
      setLoading(false)
    }
  }

  return (
    <>
      <Seo title="Set a new password — SquadBoard" description="Choose a new password for your SquadBoard account." path="/reset-password" />
      <AuthHeading title="Set a new password" subtitle="Choose a strong password you haven’t used before." />
      <Alert tone="error">{errors.form}</Alert>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Field label="Email" icon={Mail} type="email" value={form.email} onChange={set('email')} locked={!!params.get('email')} error={errors.email} />
        <PasswordField label="New password" autoComplete="new-password" showStrength value={form.password} onChange={set('password')} error={errors.password} />
        <PasswordField label="Confirm new password" autoComplete="new-password" value={form.password_confirmation} onChange={set('password_confirmation')} error={errors.password_confirmation} />
        <SubmitButton loading={loading}>Update password</SubmitButton>
      </form>
      <p className="mt-8 text-center text-sm text-ink-500">Remembered it? <Link to="/login" className="font-semibold text-brand-600">Log in</Link></p>
    </>
  )
}
