import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, Clock, Loader2, LogIn, UserPlus, Users, XCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api, { parseError } from '../../lib/api'
import useInvite from '../../hooks/useInvite'
import Seo from '../../components/ui/Seo'
import { Alert, SubmitButton } from '../../components/auth/FormControls'

const statusText = {
  accepted: 'This invitation has already been used.',
  expired: 'This invitation has expired. Ask your team leader to send a new one.',
  revoked: 'This invitation was cancelled by the team leader.',
}

export default function AcceptInvite() {
  const { token } = useParams()
  const { user, loading: authLoading, logout, setFlash } = useAuth()
  const { invite, loading, error } = useInvite(token)
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const accept = async () => {
    setBusy(true); setMessage('')
    try {
      const { data } = await api.post(`/api/invitations/${token}/accept`)
      setFlash({ joined: data.joined_project })
      navigate('/app', { replace: true })
    } catch (e) {
      setMessage(parseError(e).message)
      setBusy(false)
    }
  }

  if (loading || authLoading) {
    return <div className="grid place-items-center py-24"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>
  }

  const dead = error || (invite && invite.status !== 'pending')
  if (dead) {
    return (
      <div className="text-center">
        <Seo title="Invitation — SquadBoard" description="Join your team on SquadBoard." path={`/invite`} />
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-coral-400/10 text-coral-400">
          <XCircle className="h-8 w-8" />
        </motion.span>
        <h1 className="mt-6 text-2xl font-bold text-ink-900">Invitation unavailable</h1>
        <p className="mt-2 text-ink-500">{error?.message || statusText[invite.status]}</p>
        <Link to={user ? '/app' : '/login'} className="btn-primary mt-8">{user ? 'Go to dashboard' : 'Go to login'}</Link>
      </div>
    )
  }

  const wrongAccount = user && user.email !== invite.email

  return (
    <div>
      <Seo title={`Join ${invite.project.name} — SquadBoard`} description="You’ve been invited to a SquadBoard project." path="/invite" />
      <p className="text-sm font-semibold text-brand-600">You’re invited 🎉</p>
      <h1 className="mt-2 text-3xl font-bold text-ink-900">Join your team</h1>
      <p className="mt-2 text-ink-500"><span className="font-semibold text-ink-900">{invite.invited_by}</span> wants you on this project as <span className="font-semibold text-ink-900">{invite.role}</span>.</p>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="card my-8 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500" />
        <div className="p-6">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Users className="h-6 w-6" /></span>
            <div className="min-w-0">
              <p className="text-lg font-bold text-ink-900">{invite.project.name}</p>
              {invite.project.description && <p className="mt-1 text-sm text-ink-500">{invite.project.description}</p>}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-500">
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {invite.project.members_count} {invite.project.members_count === 1 ? 'member' : 'members'}</span>
            {invite.project.deadline && <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> Due {invite.project.deadline}</span>}
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Link expires {new Date(invite.expires_at).toLocaleDateString()}</span>
          </div>
        </div>
      </motion.div>

      <Alert tone="error">{message}</Alert>

      {!user && (
        <div className="space-y-3">
          {invite.account_exists ? (
            <Link to={`/login?invite=${token}`} className="btn-primary h-12 w-full text-[15px]"><LogIn className="h-4 w-4" /> Log in as {invite.email}</Link>
          ) : (
            <Link to={`/register?invite=${token}`} className="btn-primary h-12 w-full text-[15px]"><UserPlus className="h-4 w-4" /> Create account & join</Link>
          )}
          <p className="text-center text-xs text-ink-500">Invitation sent to <span className="font-semibold text-ink-800">{invite.email}</span></p>
        </div>
      )}

      {user && !wrongAccount && <SubmitButton type="button" loading={busy} onClick={accept}>Accept & join project</SubmitButton>}

      {wrongAccount && (
        <>
          <Alert tone="error">
            This invitation was sent to <b>{invite.email}</b>, but you’re logged in as <b>{user.email}</b>.
          </Alert>
          <button onClick={async () => { await logout(); navigate(`/login?invite=${token}`) }} className="btn-primary h-12 w-full">
            Log out and switch account
          </button>
        </>
      )}
    </div>
  )
}
