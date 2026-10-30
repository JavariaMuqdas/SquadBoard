import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Clock, Copy, Eye, LogOut, MailPlus, RotateCw, Send, UserMinus, Users, XCircle } from 'lucide-react'
import api, { csrf, parseError } from '../../lib/api'
import { RoleBadge } from '../../lib/roles'
import UserAvatar from '../ui/UserAvatar'
import ConfirmDialog from '../ui/ConfirmDialog'
import EmailChipsInput, { isEmail } from './EmailChipsInput'
import { Alert } from '../auth/FormControls'

const roleOptions = [
  { value: 'member', label: 'Member', icon: Users, text: 'Works on tasks' },
  { value: 'supervisor', label: 'Supervisor', icon: Eye, text: 'Views & reviews' },
]

/* ——— Invite form (leader only) ——— */
function InviteForm({ project, onDone, autoFocus }) {
  const [emails, setEmails] = useState([])
  const [role, setRole] = useState('member')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState('')

  const { used, max_members: max } = project.limits
  const left = Math.max(0, max - used)
  const pct = Math.min(100, (used / max) * 100)

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setResult(null)
    if (!emails.length) return setError('Type at least one email and press Enter.')
    if (emails.some((m) => !isEmail(m))) return setError('Remove or fix the emails marked in red.')
    if (role === 'member' && emails.length > left) return setError(`You can invite ${left} more member${left === 1 ? '' : 's'} on the free plan.`)

    setLoading(true)
    try {
      await csrf()
      const { data } = await api.post(`/api/projects/${project.id}/invitations`, { emails, role })
      setResult(data)
      setEmails([])
      onDone(data.sent.length ? `Invitation${data.sent.length > 1 ? 's' : ''} sent to ${data.sent.length} ${data.sent.length > 1 ? 'people' : 'person'}.` : null)
    } catch (err) {
      setError(parseError(err).message)
    } finally {
      setLoading(false)
    }
  }

  const copy = async (link) => {
    await navigator.clipboard?.writeText(link)
    setCopied(link)
    setTimeout(() => setCopied(''), 1500)
  }

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-100 p-5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><MailPlus className="h-5 w-5" /></span>
        <div>
          <h2 className="font-sans text-base font-bold text-ink-900">Invite people</h2>
          <p className="text-xs text-ink-500">They’ll get an email with a link to join.</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1" role="radiogroup" aria-label="Invite as">
          {roleOptions.map((o) => (
            <button key={o.value} type="button" role="radio" aria-checked={role === o.value} onClick={() => setRole(o.value)}
              className="relative rounded-lg px-3 py-2 text-left">
              {role === o.value && <motion.span layoutId="role-pill" className="absolute inset-0 rounded-lg bg-white shadow-sm" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
              <span className="relative flex items-center gap-2 text-sm font-semibold text-ink-900"><o.icon className="h-4 w-4" /> {o.label}</span>
              <span className="relative block text-[11px] text-ink-500">{o.text}</span>
            </button>
          ))}
        </div>

        <EmailChipsInput value={emails} onChange={(v) => { setEmails(v); setError('') }} autoFocus={autoFocus} />
        <p className="-mt-2 text-xs text-ink-500">Press Enter or comma after each email. You can paste a list.</p>

        <Alert tone="error">{error}</Alert>

        <button type="submit" disabled={loading} className="btn-primary h-11 w-full disabled:opacity-70">
          {loading ? <RotateCw className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Send {emails.length > 1 ? `${emails.length} invites` : 'invite'}</>}
        </button>

        {/* Capacity meter */}
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-ink-700">Team size</span>
            <span className={`font-bold ${left === 0 ? 'text-red-600' : 'text-ink-900'}`}>{used}/{max} on free plan</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <motion.div className={`h-full rounded-full ${left === 0 ? 'bg-red-500' : 'bg-gradient-to-r from-brand-500 to-violet-500'}`}
              initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
          </div>
          <p className="mt-2 text-[11px] text-ink-500">Includes you and pending member invites. Supervisors don’t count.</p>
        </div>

        <AnimatePresence>
          {result && (result.skipped.length > 0 || Object.keys(result.dev_links || {}).length > 0) && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
              {result.skipped.map((s) => (
                <p key={s.email} className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"><b>{s.email}</b> skipped — {s.reason}</p>
              ))}
              {Object.entries(result.dev_links || {}).map(([email, link]) => (
                <div key={email} className="flex items-center gap-2 rounded-lg border border-dashed border-brand-200 bg-brand-50/50 px-3 py-2 text-xs">
                  <span className="min-w-0 flex-1 truncate text-brand-800"><b>Invite link</b> for {email}</span>
                  <button type="button" onClick={() => copy(link)} className="flex items-center gap-1 font-semibold text-brand-700">
                    {copied === link ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.section>
  )
}

/* ——— Members list ——— */
function MemberRow({ m, canManage, onRemove, index }) {
  return (
    <motion.li layout initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50/80">
      <UserAvatar user={m} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-900">{m.name} {m.is_me && <span className="font-normal text-ink-500">(you)</span>}</p>
        <p className="truncate text-xs text-ink-500">{m.email}</p>
      </div>
      <p className="hidden text-xs text-ink-500 md:block">Joined {new Date(m.joined_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p>
      <RoleBadge role={m.role} />
      {canManage && m.role !== 'leader' ? (
        <button onClick={() => onRemove(m)} className="grid h-9 w-9 place-items-center rounded-lg text-ink-300 transition hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
          aria-label={`Remove ${m.name}`}>
          <UserMinus className="h-4 w-4" />
        </button>
      ) : canManage ? <span className="w-9" /> : null}
    </motion.li>
  )
}

/* ——— Pending invitations ——— */
function PendingInvites({ project, onChanged, notify }) {
  const [busy, setBusy] = useState(null)
  if (!project.invitations.length) return null

  const act = async (inv, action) => {
    setBusy(`${action}-${inv.id}`)
    try {
      await csrf()
      if (action === 'resend') {
        const { data } = await api.post(`/api/projects/${project.id}/invitations/${inv.id}/resend`)
        if (data.dev_link) {
          // Email may be unavailable (e.g. free hosting) — give the leader a fresh link to share
          try { await navigator.clipboard.writeText(data.dev_link); notify(`New invite link for ${inv.email} copied — paste it to them.`) }
          catch { notify(`New invite link: ${data.dev_link}`) }
        } else {
          notify(`Invite re-sent to ${inv.email}.`)
        }
      } else {
        await api.delete(`/api/projects/${project.id}/invitations/${inv.id}`)
        notify(`Invite to ${inv.email} cancelled.`)
      }
      onChanged()
    } catch (err) {
      notify(parseError(err).message, 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="card overflow-hidden">
      <h2 className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 font-sans text-base font-bold text-ink-900">
        <Clock className="h-5 w-5 text-amber-500" /> Pending invitations
        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">{project.invitations.length}</span>
      </h2>
      <ul className="divide-y divide-slate-100">
        <AnimatePresence initial={false}>
          {project.invitations.map((inv) => {
            const expired = inv.status === 'expired'
            return (
              <motion.li key={inv.id} layout exit={{ opacity: 0, height: 0 }} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-dashed border-slate-300 text-ink-300">
                  <MailPlus className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">{inv.email}</p>
                  <p className={`text-xs ${expired ? 'font-semibold text-red-600' : 'text-ink-500'}`}>
                    {expired ? 'Expired — resend to reactivate' : `Expires ${new Date(inv.expires_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`}
                  </p>
                </div>
                <RoleBadge role={inv.role} />
                <div className="flex gap-1">
                  <button onClick={() => act(inv, 'resend')} disabled={!!busy} className="btn-ghost !h-9 !px-3 !py-0 text-xs" aria-label={`Resend invite to ${inv.email}`}>
                    <RotateCw className={`h-3.5 w-3.5 ${busy === `resend-${inv.id}` ? 'animate-spin' : ''}`} /> Resend
                  </button>
                  <button onClick={() => act(inv, 'revoke')} disabled={!!busy}
                    className="grid h-9 w-9 place-items-center rounded-xl text-ink-300 transition hover:bg-red-50 hover:text-red-600" aria-label={`Cancel invite to ${inv.email}`}>
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
    </section>
  )
}

export default function MembersTab({ project, reload, notify, focusInvite }) {
  const navigate = useNavigate()
  const canManage = project.permissions.manage_members
  const me = project.members.find((m) => m.is_me)
  const [confirm, setConfirm] = useState(null) // { type: 'remove' | 'leave', member }
  const [working, setWorking] = useState(false)

  const doConfirm = async () => {
    setWorking(true)
    try {
      await csrf()
      const target = confirm.type === 'leave' ? me : confirm.member
      const { data } = await api.delete(`/api/projects/${project.id}/members/${target.id}`)
      setConfirm(null)
      if (confirm.type === 'leave') navigate('/app', { replace: true })
      else { notify(data.message); reload() }
    } catch (err) {
      notify(parseError(err).message, 'error')
    } finally {
      setWorking(false)
    }
  }

  const people = project.members.filter((m) => m.role !== 'supervisor')
  const supervisors = project.members.filter((m) => m.role === 'supervisor')

  return (
    <div className={`grid gap-6 ${canManage ? 'lg:grid-cols-[1fr_380px]' : ''}`}>
      <div className="order-2 space-y-6 lg:order-1">
        <section className="card overflow-hidden">
          <h2 className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 font-sans text-base font-bold text-ink-900">
            <Users className="h-5 w-5 text-brand-600" /> Team members
            <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">{people.length}</span>
          </h2>
          <ul className="divide-y divide-slate-100">
            <AnimatePresence initial={false}>
              {people.map((m, i) => <MemberRow key={m.id} m={m} index={i} canManage={canManage} onRemove={(member) => setConfirm({ type: 'remove', member })} />)}
            </AnimatePresence>
          </ul>
        </section>

        <section className="card overflow-hidden">
          <h2 className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 font-sans text-base font-bold text-ink-900">
            <Eye className="h-5 w-5 text-sky-600" /> Supervisor
          </h2>
          {supervisors.length ? (
            <ul className="divide-y divide-slate-100">
              {supervisors.map((m, i) => <MemberRow key={m.id} m={m} index={i} canManage={canManage} onRemove={(member) => setConfirm({ type: 'remove', member })} />)}
            </ul>
          ) : (
            <p className="px-5 py-6 text-center text-sm text-ink-500">
              No supervisor yet.{canManage && ' Invite one with the “Supervisor” option — they’ll get read-only access and reports.'}
            </p>
          )}
        </section>

        {canManage && <PendingInvites project={project} onChanged={reload} notify={notify} />}

        {!canManage && me && (
          <section className="card flex flex-col gap-4 border-red-100 p-5 sm:flex-row sm:items-center">
            <div className="flex-1">
              <h2 className="font-sans text-base font-bold text-ink-900">Leave project</h2>
              <p className="text-sm text-ink-500">You’ll lose access to this board. The leader can invite you again.</p>
            </div>
            <button onClick={() => setConfirm({ type: 'leave' })} className="btn border border-red-200 bg-white text-red-600 hover:bg-red-50">
              <LogOut className="h-4 w-4" /> Leave
            </button>
          </section>
        )}
      </div>

      {canManage && (
        <div className="order-1 lg:order-2">
          <div className="lg:sticky lg:top-24">
            <InviteForm project={project} autoFocus={focusInvite} onDone={(msg) => { if (msg) notify(msg); reload() }} />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        loading={working}
        title={confirm?.type === 'leave' ? 'Leave this project?' : `Remove ${confirm?.member?.name}?`}
        message={confirm?.type === 'leave'
          ? 'You will lose access to the board and its tasks.'
          : 'They will lose access to the project. Their past work stays in the history.'}
        confirmLabel={confirm?.type === 'leave' ? 'Leave' : 'Remove'}
        onConfirm={doConfirm}
        onCancel={() => !working && setConfirm(null)}
      />
    </div>
  )
}