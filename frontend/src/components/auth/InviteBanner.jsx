import { motion } from 'framer-motion'
import { Users } from 'lucide-react'

const roleLabel = { member: 'Member', supervisor: 'Supervisor', leader: 'Leader' }

export default function InviteBanner({ invite }) {
  if (!invite) return null
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      className="mb-6 flex items-center gap-4 rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50 to-violet-50 p-4"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-glow">
        <Users className="h-6 w-6" />
      </span>
      <div className="min-w-0 text-sm">
        <p className="text-ink-500"><span className="font-semibold text-ink-900">{invite.invited_by}</span> invited you to join</p>
        <p className="truncate font-bold text-ink-900">{invite.project?.name}</p>
        <span className="mt-1 inline-block rounded-md bg-white px-2 py-0.5 text-[11px] font-bold text-brand-700">as {roleLabel[invite.role] ?? invite.role}</span>
      </div>
    </motion.div>
  )
}
