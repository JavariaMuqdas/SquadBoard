import { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity, Archive, ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, Clock, FileBarChart2, FileText, FolderX,
  KanbanSquare, LayoutGrid, ListChecks, MessageSquareText, PlusCircle, RotateCcw, Send, Settings, Target, Timer,
  UserCheck, UserPlus, Users,
} from 'lucide-react'
import api, { parseError } from '../../lib/api'
import { colorOf, initials } from '../../lib/projectColors'
import { RoleBadge, daysLabel } from '../../lib/roles'
import { STATUSES, statusMeta } from '../../lib/tasks'
import { timeAgo } from '../../lib/time'
import Seo from '../../components/ui/Seo'
import Toast from '../../components/ui/Toast'
import UserAvatar from '../../components/ui/UserAvatar'
import MembersTab from '../../components/project/MembersTab'
import ProjectSettingsTab from '../../components/project/ProjectSettingsTab'
import BoardTab from '../../components/board/BoardTab'

const allTabs = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'board', label: 'Board', icon: KanbanSquare },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings, leaderOnly: true },
]

const activityLine = {
  created: { icon: PlusCircle, cls: 'bg-slate-100 text-slate-600', text: () => 'created' },
  assigned: { icon: UserCheck, cls: 'bg-sky-100 text-sky-600', text: () => 'reassigned' },
  edited: { icon: FileText, cls: 'bg-slate-100 text-slate-600', text: () => 'edited' },
  status: { icon: ArrowRight, cls: 'bg-amber-100 text-amber-600', text: (a) => `moved to ${statusMeta[a.new_status]?.label ?? a.new_status}` },
  submitted: { icon: Send, cls: 'bg-violet-100 text-violet-600', text: () => 'submitted for review' },
  approved: { icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-600', text: () => 'approved' },
  returned: { icon: RotateCcw, cls: 'bg-amber-100 text-amber-600', text: () => 'requested changes on' },
  progress: { icon: Timer, cls: 'bg-brand-100 text-brand-600', text: (a) => `set ${a.progress}% on` },
  note: { icon: MessageSquareText, cls: 'bg-sky-100 text-sky-600', text: () => 'posted an update on' },
}

/* ——— Header ——— */
function ProjectHeader({ project, onInvite }) {
  const c = colorOf(project.color)
  const due = daysLabel(project.days_left)
  const archived = project.status === 'archived'
  return (
    <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
      <div className={`relative h-28 bg-gradient-to-r sm:h-32 ${c.band} ${archived ? 'grayscale' : ''}`}>
        <div className="bg-grid absolute inset-0 opacity-30" />
        <motion.div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 6, repeat: Infinity }} />
      </div>
      <div className="relative px-5 pb-5 sm:px-8">
        <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-start">
          <span className={`grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-white font-display text-2xl font-bold shadow-lg ring-4 ring-white sm:h-24 sm:w-24 sm:text-3xl ${c.soft}`}>
            {initials(project.name)}
          </span>
          <div className="min-w-0 flex-1 sm:mt-14">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">{project.name}</h1>
              <RoleBadge role={project.my_role} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
              {project.course && <span className="font-semibold text-brand-600">{project.course}</span>}
              <span className={`flex items-center gap-1.5 font-medium ${due.cls}`}><CalendarDays className="h-4 w-4" /> {due.text}</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {project.members_count} {project.members_count === 1 ? 'person' : 'people'}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:mt-14">
            <div className="flex -space-x-2">
              {project.members.slice(0, 4).map((m) => <UserAvatar key={m.id} user={m} size="h-9 w-9" text="text-xs" ring="ring-2 ring-white" />)}
            </div>
            <Link to={`/app/reports/${project.id}`} className="btn-ghost !py-2.5"><FileBarChart2 className="h-4 w-4" /> Report</Link>
            {project.permissions.manage_members && !archived && (
              <button onClick={onInvite} className="btn-primary !py-2.5"><UserPlus className="h-4 w-4" /> Invite</button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  )
}

/* ——— Tabs ——— */
function Tabs({ tabs, active, onChange, counts }) {
  return (
    <nav className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Project sections">
      <div className="flex min-w-max gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => onChange(t.id)}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold transition ${active === t.id ? 'text-brand-700' : 'text-ink-500 hover:text-ink-900'}`}
            aria-current={active === t.id ? 'page' : undefined}>
            <t.icon className="h-4 w-4" /> {t.label}
            {counts[t.id] != null && <span className="rounded-md bg-slate-100 px-1.5 text-[11px] font-bold text-ink-700">{counts[t.id]}</span>}
            {active === t.id && <motion.span layoutId="tab-underline" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600" />}
          </button>
        ))}
      </div>
    </nav>
  )
}

/* ——— Overview ——— */
function TaskBreakdown({ stats, goBoard }) {
  const total = STATUSES.reduce((s, k) => s + stats[k], 0)
  const pct = total ? Math.round((stats.done / total) * 100) : 0
  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-sans text-base font-bold text-ink-900"><Target className="h-5 w-5 text-brand-600" /> Task progress</h2>
          <p className="mt-1 text-xs text-ink-500">{total ? `${stats.done} of ${total} tasks approved as done` : 'No tasks on the board yet'}</p>
        </div>
        <p className="font-display text-3xl font-bold text-ink-900">{pct}%</p>
      </div>

      <div className="mt-5 flex h-3 gap-[2px] overflow-hidden rounded-full bg-slate-100" role="img"
        aria-label={STATUSES.map((s) => `${statusMeta[s].label} ${stats[s]}`).join(', ')}>
        {total > 0 && STATUSES.map((s, i) => stats[s] > 0 && (
          <motion.div key={s} className={statusMeta[s].bar} initial={{ width: 0 }} animate={{ width: `${(stats[s] / total) * 100}%` }}
            transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }} title={`${statusMeta[s].label}: ${stats[s]}`} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATUSES.map((s) => {
          const m = statusMeta[s]
          return (
            <button key={s} onClick={goBoard} className="rounded-xl border border-slate-100 p-3 text-left transition hover:border-slate-200 hover:bg-slate-50">
              <span className="flex items-center gap-1.5 text-xs font-medium text-ink-500"><span className={`h-2 w-2 rounded-full ${m.dot}`} /> {m.label}</span>
              <span className="mt-1 block font-display text-xl font-bold text-ink-900">{stats[s]}</span>
            </button>
          )
        })}
      </div>
      {stats.overdue > 0 && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          <Clock className="h-4 w-4" /> {stats.overdue} open task{stats.overdue > 1 ? 's are' : ' is'} past the due date
        </p>
      )}
    </section>
  )
}

function ActivityFeed({ items, projectId }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="flex items-center gap-2 font-sans text-base font-bold text-ink-900"><Activity className="h-5 w-5 text-brand-600" /> Recent activity</h2>
      {items.length === 0 ? (
        <p className="mt-4 rounded-xl bg-slate-50 p-5 text-center text-sm text-ink-500">Task updates, approvals and comments will appear here.</p>
      ) : (
        <ol className="relative mt-5 space-y-4 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-slate-200">
          {items.map((a, i) => {
            const k = activityLine[a.type] ?? activityLine.edited
            return (
              <motion.li key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="relative flex gap-3">
                <span className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full ring-4 ring-white ${k.cls}`}><k.icon className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1 pt-1 text-sm">
                  <p className="text-ink-700">
                    <b className="text-ink-900">{a.user.name}</b> {k.text(a)}{' '}
                    <Link to={`/app/projects/${projectId}?tab=board&task=${a.task.id}`} className="font-semibold text-brand-700 hover:underline">{a.task.title}</Link>
                  </p>
                  {a.note && <p className="mt-1 line-clamp-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-ink-700">“{a.note}”</p>}
                  <p className="mt-0.5 text-[11px] text-ink-500">{timeAgo(a.created_at)}</p>
                </div>
              </motion.li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

function Overview({ project, goTab }) {
  const c = colorOf(project.color)
  const due = daysLabel(project.days_left)
  const s = project.task_stats
  const totalTasks = STATUSES.reduce((sum, k) => sum + s[k], 0)
  const canManage = project.permissions.manage_members

  const details = [
    { icon: CalendarDays, label: 'Deadline', value: project.deadline ? new Date(project.deadline + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not set', sub: due.text, subCls: due.cls },
    { icon: Users, label: 'Team size', value: `${project.limits.used} / ${project.limits.max_members}`, sub: 'Free plan limit' },
    { icon: Target, label: 'Your role', value: project.my_role[0].toUpperCase() + project.my_role.slice(1), sub: project.my_role === 'leader' ? 'You manage this project' : 'Invited by the leader' },
    { icon: Clock, label: 'Created', value: new Date(project.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }), sub: 'Project start' },
  ]

  const steps = [
    { done: project.members.some((m) => m.role === 'member') || project.invitations.some((i) => i.role === 'member'), label: 'Invite your team members', go: canManage && 'members' },
    { done: project.members.some((m) => m.role === 'supervisor') || project.invitations.some((i) => i.role === 'supervisor'), label: 'Add your supervisor', go: canManage && 'members' },
    { done: totalTasks > 0, label: 'Create tasks on the board', go: project.permissions.manage_tasks && 'board' },
    { done: s.done > 0, label: 'Approve the first finished task', go: 'board' },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {details.map((d, i) => (
            <motion.div key={d.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card p-4">
              <span className={`grid h-9 w-9 place-items-center rounded-xl ${c.soft}`}><d.icon className="h-4 w-4" /></span>
              <p className="mt-3 text-xs font-medium text-ink-500">{d.label}</p>
              <p className="mt-0.5 truncate text-sm font-bold text-ink-900">{d.value}</p>
              <p className={`mt-0.5 truncate text-[11px] ${d.subCls || 'text-ink-500'}`}>{d.sub}</p>
            </motion.div>
          ))}
        </section>

        <TaskBreakdown stats={s} goBoard={() => goTab('board')} />

        <section className="card p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-sans text-base font-bold text-ink-900"><FileText className="h-5 w-5 text-brand-600" /> About this project</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-700">{project.description || 'No description added yet.'}</p>
        </section>

        <ActivityFeed items={project.activity} projectId={project.id} />
      </div>

      <aside className="space-y-6">
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-sans text-base font-bold text-ink-900"><ListChecks className="h-5 w-5 text-brand-600" /> Setup checklist</h2>
            <span className="text-xs font-bold text-brand-600">{steps.filter((x) => x.done).length}/{steps.length}</span>
          </div>
          <ul className="mt-4 space-y-1">
            {steps.map((st) => (
              <li key={st.label}>
                <button onClick={st.go ? () => goTab(st.go) : undefined} disabled={!st.go || st.done}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left text-sm transition enabled:hover:bg-slate-50">
                  <motion.span initial={false} animate={{ scale: st.done ? [1, 1.25, 1] : 1 }}
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${st.done ? 'border-mint-500 bg-mint-500 text-white' : 'border-slate-300'}`}>
                    {st.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </motion.span>
                  <span className={st.done ? 'text-ink-500 line-through' : 'font-medium text-ink-800'}>{st.label}</span>
                  {st.go && !st.done && <ArrowRight className="ml-auto h-4 w-4 text-ink-300" />}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-base font-bold text-ink-900">Team</h2>
            <button onClick={() => goTab('members')} className="text-xs font-semibold text-brand-600 hover:text-brand-700">View all</button>
          </div>
          <ul className="mt-4 space-y-3">
            {project.members.slice(0, 6).map((m) => (
              <li key={m.id} className="flex items-center gap-3">
                <UserAvatar user={m} size="h-9 w-9" text="text-xs" />
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900">{m.name}{m.is_me && <span className="font-normal text-ink-500"> (you)</span>}</p>
                <RoleBadge role={m.role} />
              </li>
            ))}
          </ul>
        </section>

        <Link to={`/app/reports/${project.id}`} className="card group flex items-center gap-4 p-5 transition hover:shadow-lg">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-glow"><FileBarChart2 className="h-5 w-5" /></span>
          <div className="flex-1">
            <p className="text-sm font-bold text-ink-900">Contribution report</p>
            <p className="text-xs text-ink-500">Who did what — ready to export as PDF.</p>
          </div>
          <ArrowRight className="h-4 w-4 text-ink-300 transition group-hover:translate-x-1 group-hover:text-brand-600" />
        </Link>
      </aside>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="card overflow-hidden"><div className="h-32 animate-pulse bg-slate-200" /><div className="space-y-3 p-6"><div className="h-6 w-1/3 animate-pulse rounded bg-slate-200" /><div className="h-4 w-1/4 animate-pulse rounded bg-slate-100" /></div></div>
      <div className="h-10 w-80 animate-pulse rounded bg-slate-100" />
      <div className="grid gap-4 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="card h-28 animate-pulse bg-slate-50" />)}</div>
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const [project, setProject] = useState(null)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [focusInvite, setFocusInvite] = useState(false)

  const tabs = allTabs.filter((t) => !t.leaderOnly || project?.permissions.edit_project)
  const requested = params.get('tab')
  const tab = tabs.some((t) => t.id === requested) ? requested : 'overview'

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/projects/${id}`)
      setProject(data.data)
      setError(null)
    } catch (err) {
      setError(parseError(err))
    }
  }, [id])

  useEffect(() => { setProject(null); load() }, [load])

  const setTab = useCallback((t) => {
    setFocusInvite(false)
    setParams(t === 'overview' ? {} : { tab: t }, { replace: true })
  }, [setParams])
  const onInvite = () => { setTab('members'); setFocusInvite(true) }
  const notify = useCallback((text, tone = 'success') => setToast({ text, tone }), [])
  const closeToast = useCallback(() => setToast(null), [])

  if (error) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-ink-500"><FolderX className="h-8 w-8" /></span>
        <h1 className="mt-6 text-2xl font-bold text-ink-900">Project not available</h1>
        <p className="mt-2 text-ink-500">It may have been deleted, or you’re not a member of it.</p>
        <Link to="/app" className="btn-primary mt-8"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
      </div>
    )
  }

  const totalTasks = project ? STATUSES.reduce((s, k) => s + project.task_stats[k], 0) : null

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link to="/app/projects" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 transition hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Projects
      </Link>

      {!project ? <LoadingState /> : (
        <>
          <Seo title={`${project.name} — SquadBoard`} description={`Project board for ${project.name}.`} path={`/app/projects/${project.id}`} />
          <ProjectHeader project={project} onInvite={onInvite} />

          {project.status === 'archived' && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 sm:flex-row sm:items-center">
              <Archive className="h-5 w-5 shrink-0" />
              <p className="flex-1"><b>This project is archived.</b> It’s kept for reference and doesn’t count toward the free-plan limit.</p>
              {project.permissions.edit_project && <button onClick={() => setTab('settings')} className="font-semibold underline">Restore it</button>}
            </motion.div>
          )}

          <Tabs tabs={tabs} active={tab} onChange={setTab} counts={{ members: project.members.length, board: totalTasks }} />

          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
              {tab === 'overview' && <Overview project={project} goTab={setTab} />}
              {tab === 'board' && <BoardTab projectId={project.id} notify={notify} onTasksChanged={load} />}
              {tab === 'members' && <MembersTab project={project} reload={load} notify={notify} focusInvite={focusInvite} />}
              {tab === 'settings' && <ProjectSettingsTab key={project.status + project.name} project={project} reload={load} notify={notify} />}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      <Toast toast={toast} onClose={closeToast} />
    </div>
  )
}