import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { kindOf } from '../../lib/notificationKinds'
import { colorOf } from '../../lib/projectColors'
import { timeAgo } from '../../lib/time'
import UserAvatar from '../ui/UserAvatar'

export default function NotificationItem({ n, onOpen, onRemove, index = 0, compact = false }) {
  const k = kindOf(n.kind)
  const unread = !n.read_at

  return (
    <motion.li layout
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40, height: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.03 }}
      className={`group relative flex cursor-pointer gap-3 ${compact ? 'px-4 py-3' : 'px-5 py-4'} transition-colors ${unread ? 'bg-brand-50/50 hover:bg-brand-50' : 'hover:bg-slate-50'}`}
      onClick={() => onOpen(n)}
    >
      <div className="relative shrink-0">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${k.cls}`}><k.icon className="h-5 w-5" /></span>
        {n.actor && (
          <span className="absolute -bottom-1 -right-1">
            <UserAvatar user={n.actor} size="h-5 w-5" text="text-[8px]" ring="ring-2 ring-white" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1 pr-6">
        <p className={`text-sm leading-snug ${unread ? 'font-bold text-ink-900' : 'font-semibold text-ink-700'}`}>{n.title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-500">{n.body}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-500">
          {n.project && (
            <span className="inline-flex items-center gap-1 font-semibold">
              <span className={`h-1.5 w-1.5 rounded-full ${colorOf(n.project.color).dot}`} /> {n.project.name}
            </span>
          )}
          <span>{timeAgo(n.created_at)}</span>
        </div>
      </div>

      {unread && <span className="absolute right-4 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-brand-600 ring-4 ring-brand-100 group-hover:opacity-0" aria-label="Unread" />}
      {onRemove && (
        <button onClick={(e) => { e.stopPropagation(); onRemove(n.id) }}
          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-ink-300 opacity-0 transition hover:bg-white hover:text-red-600 group-hover:opacity-100 focus:opacity-100"
          aria-label="Delete notification">
          <X className="h-4 w-4" />
        </button>
      )}
    </motion.li>
  )
}