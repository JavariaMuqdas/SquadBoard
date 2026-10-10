import { AlarmClock, CheckCircle2, ClipboardList, MessageSquareText, RotateCcw, Send, UserMinus, UserPlus, LogOut, Bell } from 'lucide-react'

export const notificationKinds = {
  member_joined: { icon: UserPlus, cls: 'bg-emerald-100 text-emerald-600' },
  member_left: { icon: LogOut, cls: 'bg-slate-100 text-slate-600' },
  removed: { icon: UserMinus, cls: 'bg-red-100 text-red-600' },
  task_assigned: { icon: ClipboardList, cls: 'bg-brand-100 text-brand-600' },
  task_submitted: { icon: Send, cls: 'bg-violet-100 text-violet-600' },
  task_approved: { icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-600' },
  task_returned: { icon: RotateCcw, cls: 'bg-amber-100 text-amber-600' },
  task_update: { icon: MessageSquareText, cls: 'bg-sky-100 text-sky-600' },
  deadline: { icon: AlarmClock, cls: 'bg-rose-100 text-rose-600' },
}

export const kindOf = (kind) => notificationKinds[kind] ?? { icon: Bell, cls: 'bg-slate-100 text-slate-600' }