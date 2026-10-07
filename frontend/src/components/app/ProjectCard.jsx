import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, Crown, Eye, Users } from 'lucide-react'
import { avatarColors, colorOf, initials } from '../../lib/projectColors'

const roleBadge = {
  leader: { label: 'Leader', icon: Crown, cls: 'bg-amber-50 text-amber-700' },
  member: { label: 'Member', icon: Users, cls: 'bg-slate-100 text-ink-700' },
  supervisor: { label: 'Supervisor', icon: Eye, cls: 'bg-sky-50 text-sky-700' },
}

function deadlineInfo(days) {
  if (days === null || days === undefined) return { text: 'No deadline', cls: 'text-ink-500' }
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, cls: 'text-red-600' }
  if (days === 0) return { text: 'Due today', cls: 'text-red-600' }
  if (days <= 7) return { text: `${days}d left`, cls: 'text-amber-600' }
  return { text: `${days} days left`, cls: 'text-ink-500' }
}

export default function ProjectCard({ project, index = 0 }) {
  const c = colorOf(project.color)
  const role = roleBadge[project.my_role] ?? roleBadge.member
  const due = deadlineInfo(project.days_left)
  const pct = project.tasks_total ? Math.round((project.tasks_done / project.tasks_total) * 100) : 0

  return (
    <Link to={`/app/projects/${project.id}`} className="block rounded-2xl focus-visible:ring-2 focus-visible:ring-brand-500">
      <motion.article
        layout
        initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: index * 0.06, duration: 0.4 }}
        whileHover={{ y: -5 }}
        className="card group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-xl"
      >
        <div className={`relative h-20 bg-gradient-to-r ${c.band}`}>
          <div className="bg-grid absolute inset-0 opacity-30" />
          <span className={`absolute left-5 top-full grid h-12 w-12 -translate-y-1/2 place-items-center rounded-2xl bg-white font-display text-lg font-bold shadow-md ring-4 ring-white ${c.soft}`}>
            {initials(project.name)}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5 pt-9">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-sans text-base font-bold leading-snug text-ink-900">{project.name}</h3>
            <span className={`flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${role.cls}`}>
              <role.icon className="h-3 w-3" /> {role.label}
            </span>
          </div>
          {project.course && <p className="mt-0.5 text-xs font-semibold text-brand-600">{project.course}</p>}
          <p className="mt-2 line-clamp-2 text-sm text-ink-500">{project.description || 'No description yet.'}</p>

          <div className="mt-auto pt-5">
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="font-medium text-ink-500">{project.tasks_total ? `${project.tasks_done}/${project.tasks_total} tasks` : 'No tasks yet'}</span>
              <span className="font-bold text-ink-900">{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <motion.div className={`h-full rounded-full bg-gradient-to-r ${c.band}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.3 }} />
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="flex -space-x-2">
                {project.members?.map((m, i) => (
                  m.avatar
                    ? <img key={m.id} src={m.avatar} alt={m.name} title={m.name} className="h-8 w-8 rounded-full ring-2 ring-white" />
                    : <span key={m.id} title={m.name} className={`grid h-8 w-8 place-items-center rounded-full text-[11px] font-bold text-white ring-2 ring-white ${avatarColors[i % avatarColors.length]}`}>{initials(m.name)}</span>
                ))}
                {project.members_count > 5 && (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-ink-700 ring-2 ring-white">+{project.members_count - 5}</span>
                )}
              </div>
              <span className={`flex items-center gap-1.5 text-xs font-semibold ${due.cls}`}>
                <CalendarDays className="h-3.5 w-3.5" /> {due.text}
              </span>
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  )
}