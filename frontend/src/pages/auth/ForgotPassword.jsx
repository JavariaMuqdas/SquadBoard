import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, MailCheck } from 'lucide-react'
import api, { csrf, parseError } from '../../lib/api'
import Seo from '../../components/ui/Seo'
import { Alert, AuthHeading, Field, SubmitButton } from '../../components/auth/FormControls'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.')
    setLoading(true); setError('')
    try {
      await csrf()
      await api.post('/api/forgot-password', { email })
      setSent(true)
    } catch (err) {
      const p = parseError(err)
      setError(p.fields.email || p.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200 }}
          className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-mint-500/10 text-mint-500">
          <MailCheck className="h-8 w-8" />
        </motion.span>
        <h1 className="mt-6 text-3xl font-bold text-ink-900">Check your inbox</h1>
        <p className="mt-3 text-ink-500">If an account exists for <span className="font-semibold text-ink-900">{email}</span>, we’ve sent a link to reset your password.</p>
        <Link to="/login" className="btn-ghost mt-8"><ArrowLeft className="h-4 w-4" /> Back to login</Link>
      </div>
    )
  }

  return (
    <>
      <Seo title="Forgot password — SquadBoard" description="Reset your SquadBoard password." path="/forgot-password" />
      <AuthHeading title="Forgot password?" subtitle="Enter your email and we’ll send you a reset link." />
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Field label="Email" icon={Mail} type="email" autoComplete="email" placeholder="you@university.edu"
          value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
        <SubmitButton loading={loading}>Send reset link</SubmitButton>
      </form>
      <Link to="/login" className="mt-8 flex items-center justify-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Back to login
      </Link>
    </>
  )
}
