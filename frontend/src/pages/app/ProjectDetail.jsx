import { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft, CalendarDays, FileText, FolderX, KanbanSquare, LayoutGrid, ListChecks, Settings,
  UserPlus, Users, Clock, Target,
} from 'lucide-react'
import api, { parseError } from '../../lib/api'
import { colorOf, initials } from '../../lib/projectColors'
import { RoleBadge, daysLabel } from '../../lib/roles'
import Seo from '../../components/ui/Seo'
import Toast from '../../components/ui/Toast'
import UserAvatar from '../../components/ui/UserAvatar'
import MembersTab from '../../components/project/MembersTab'

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'board', label: 'Board', icon: KanbanSquare, soon: true },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings, soon: true },
]

/* ——— Header ——— */
function ProjectHeader({ project, onInvite }) {
  const c = colorOf(project.color)
  const due = daysLabel(project.days_left)
  return (
    <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
      <div className={`relative h-28 bg-gradient-to-r sm:h-32 ${c.band}`}>
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
          <div className="flex items-center gap-3 sm:mt-14">
            <div className="flex -space-x-2">
              {project.members.slice(0, 4).map((m) => <UserAvatar key={m.id} user={m} size="h-9 w-9" text="text-xs" ring="ring-2 ring-white" />)}
            </div>
            {project.permissions.manage_members && (
              <button onClick={onInvite} className="btn-primary !py-2.5"><UserPlus className="h-4 w-4" /> Invite</button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  )
}

/* ——— Tabs ——— */
function Tabs({ active, onChange, counts }) {
  return (
    <nav className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Project sections">
      <div className="flex min-w-max gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => !t.soon && onChange(t.id)} disabled={t.soon}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold transition ${
              t.soon ? 'cursor-not-allowed text-ink-300' : active === t.id ? 'text-brand-700' : 'text-ink-500 hover:text-ink-900'
            }`}
            aria-current={active === t.id ? 'page' : undefined}>
            <t.icon className="h-4 w-4" /> {t.label}
            {counts[t.id] != null && <span className="rounded-md bg-slate-100 px-1.5 text-[11px] font-bold text-ink-700">{counts[t.id]}</span>}
            {t.soon && <span className="rounded bg-slate-100 px-1 text-[9px] font-bold uppercase text-ink-500">Soon</span>}
            {active === t.id && <motion.span layoutId="tab-underline" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600" />}
          </button>
        ))}
      </div>
    </nav>
  )
}

/* ——— Overview tab ——— */
function Overview({ project, goMembers }) {
  const c = colorOf(project.color)
  const due = daysLabel(project.days_left)
  const supervisor = project.members.find((m) => m.role === 'supervisor')
  const details = [
    { icon: CalendarDays, label: 'Deadline', value: project.deadline ? new Date(project.deadline + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not set', sub: due.text, subCls: due.cls },
    { icon: Users, label: 'Team size', value: `${project.limits.used} / ${project.limits.max_members}`, sub: 'Free plan limit' },
    { icon: Target, label: 'Your role', value: project.my_role[0].toUpperCase() + project.my_role.slice(1), sub: project.my_role === 'leader' ? 'You manage this project' : 'Invited by the leader' },
    { icon: Clock, label: 'Created', value: new Date(project.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }), sub: 'Project start' },
  ]

  const steps = [
    { done: project.members.some((m) => m.role === 'member') || project.invitations.some((i) => i.role === 'member'), label: 'Invite your team members', action: project.permissions.manage_members && goMembers },
    { done: !!supervisor || project.invitations.some((i) => i.role === 'supervisor'), label: 'Add your supervisor', action: project.permissions.manage_members && goMembers },
    { done: false, label: 'Create tasks on the board', soon: true },
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

        <section className="card p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-sans text-base font-bold text-ink-900"><FileText className="h-5 w-5 text-brand-600" /> About this project</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-700">{project.description || 'No description added yet.'}</p>
        </section>

        {/* Board preview placeholder with illustration */}
        <section className="card relative overflow-hidden p-6 sm:p-8">
          <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
            <div>
              <span className="eyebrow">Coming next</span>
              <h2 className="mt-3 text-xl font-bold text-ink-900">Your task board lands here</h2>
              <p className="mt-2 text-sm text-ink-500">Split work into tasks with owners, effort points and deadlines. Progress here will power the contribution report.</p>
            </div>
            <div className="mx-auto grid w-56 grid-cols-3 gap-2" aria-hidden="true">
              {[3, 2, 1].map((n, ci) => (
                <div key={ci} className="space-y-1.5 rounded-xl bg-slate-50 p-1.5">
                  <div className={`h-1 w-6 rounded-full ${['bg-slate-300', 'bg-amber-400', 'bg-mint-500'][ci]}`} />
                  {Array.from({ length: n }).map((_, i) => (
                    <motion.div key={i} className="h-7 rounded-md bg-white shadow-sm"
                      animate={{ y: [0, -3, 0] }} transition={{ duration: 3, repeat: Infinity, delay: ci * 0.4 + i * 0.2 }} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-sans text-base font-bold text-ink-900"><ListChecks className="h-5 w-5 text-brand-600" /> Setup checklist</h2>
          <ul className="mt-4 space-y-2">
            {steps.map((s) => (
              <li key={s.label}>
                <button onClick={s.action || undefined} disabled={!s.action || s.done}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left text-sm transition enabled:hover:bg-slate-50">
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${s.done ? 'border-mint-500 bg-mint-500 text-white' : 'border-slate-300'}`}>
                    {s.done && <svg viewBox="0 0 12 12" className="h-3 w-3"><path d="M2.5 6.5l2.2 2.2L9.5 3.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </span>
                  <span className={s.done ? 'text-ink-500 line-through' : 'font-medium text-ink-800'}>{s.label}</span>
                  {s.soon && <span className="ml-auto rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink-500">Soon</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-base font-bold text-ink-900">Team</h2>
            <button onClick={goMembers} className="text-xs font-semibold text-brand-600 hover:text-brand-700">View all</button>
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
  const tab = tabs.some((t) => t.id === params.get('tab') && !t.soon) ? params.get('tab') : 'overview'
  const [project, setProject] = useState(null)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [focusInvite, setFocusInvite] = useState(false)

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

  const setTab = (t) => { setFocusInvite(false); setParams(t === 'overview' ? {} : { tab: t }, { replace: true }) }
  const goMembers = () => setTab('members')
  const onInvite = () => { setTab('members'); setFocusInvite(true) } // input autofocuses when the tab mounts
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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link to="/app" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 transition hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      {!project ? <LoadingState /> : (
        <>
          <Seo title={`${project.name} — SquadBoard`} description={`Project board for ${project.name}.`} path={`/app/projects/${project.id}`} />
          <ProjectHeader project={project} onInvite={onInvite} />
          <Tabs active={tab} onChange={setTab} counts={{ members: project.members.length }} />

          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
              {tab === 'overview' && <Overview project={project} goMembers={goMembers} />}
              {tab === 'members' && <MembersTab project={project} reload={load} notify={notify} focusInvite={focusInvite} />}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      <Toast toast={toast} onClose={closeToast} />
    </div>
  )
}