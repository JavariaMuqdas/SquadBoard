import { Crown, Eye, Users } from 'lucide-react'

export const roleStyles = {
  leader: { label: 'Leader', icon: Crown, cls: 'bg-amber-50 text-amber-700' },
  member: { label: 'Member', icon: Users, cls: 'bg-slate-100 text-ink-700' },
  supervisor: { label: 'Supervisor', icon: Eye, cls: 'bg-sky-50 text-sky-700' },
}

export function RoleBadge({ role, className = '' }) {
  const r = roleStyles[role] ?? roleStyles.member
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${r.cls} ${className}`}>
      <r.icon className="h-3 w-3" /> {r.label}
    </span>
  )
}

export function daysLabel(days) {
  if (days === null || days === undefined) return { text: 'No deadline', cls: 'text-ink-500' }
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, cls: 'text-red-600' }
  if (days === 0) return { text: 'Due today', cls: 'text-red-600' }
  if (days <= 7) return { text: `${days}d left`, cls: 'text-amber-600' }
  return { text: `${days} days left`, cls: 'text-ink-500' }
}