import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle, Award, CalendarDays, CheckCircle2, ChevronDown, ClipboardCheck, Clock, Download, FileBarChart2,
  FolderKanban, Info, KanbanSquare, RotateCw, Target, Zap,
} from 'lucide-react'
import api, { parseError } from '../../lib/api'
import { colorOf, initials } from '../../lib/projectColors'
import { colorMap } from '../../lib/chartColors'
import { RoleBadge } from '../../lib/roles'
import { formatDate, timeAgo } from '../../lib/time'
import Seo from '../../components/ui/Seo'
import UserAvatar from '../../components/ui/UserAvatar'

/* ——— Project picker ——— */
function ProjectPicker({ projects, current, onChange }) {
  const [open, setOpen] = useState(false)
  const c = colorOf(current?.color)
  return (
    <div className="relative print:hidden">
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-slate-300 sm:w-80">
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold ${c.soft}`}>{initials(current?.name || '?')}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink-900">{current?.name || 'Choose a project'}</span>
          {current?.course && <span className="block truncate text-[11px] text-ink-500">{current.course}</span>}
        </span>
        <ChevronDown className={`h-4 w-4 text-ink-500 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul role="listbox" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="absolute left-0 right-0 z-30 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl sm:w-80">
            {projects.map((p) => (
              <li key={p.id}>
                <button role="option" aria-selected={p.id === current?.id} onClick={() => { setOpen(false); onChange(p.id) }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${p.id === current?.id ? 'bg-brand-50' : ''}`}>
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[10px] font-bold ${colorOf(p.color).soft}`}>{initials(p.name)}</span>
                  <span className="min-w-0 flex-1 truncate font-medium text-ink-900">{p.name}</span>
                  {p.status === 'archived' && <span className="text-[10px] font-bold uppercase text-ink-300">Archived</span>}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ——— Contribution split: one stacked bar, 2px gaps, legend + direct labels ——— */
function ContributionBar({ members, colors }) {
  const withWork = members.filter((m) => m.points_done > 0)
  const [hover, setHover] = useState(null)
  if (!withWork.length) {
    return <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-ink-500">No approved tasks yet — the split appears once work is marked done.</p>
  }
  const ordered = [...withWork].sort((a, b) => a.id - b.id)   // stable order = by person, not rank
  return (
    <div>
      <div className="relative flex h-10 gap-[2px] overflow-hidden rounded-lg" role="img"
        aria-label={`Share of completed effort points: ${ordered.map((m) => `${m.name} ${m.share}%`).join(', ')}`}>
        {ordered.map((m, i) => (
          <motion.div key={m.id}
            initial={{ width: 0 }} animate={{ width: `${m.share}%` }} transition={{ duration: 0.9, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
            onMouseEnter={() => setHover(m.id)} onMouseLeave={() => setHover(null)}
            className="relative flex items-center justify-center first:rounded-l-lg last:rounded-r-lg"
            style={{ backgroundColor: colors[m.id], opacity: hover && hover !== m.id ? 0.45 : 1 }}>
            {m.share >= 12 && <span className="text-xs font-bold text-white drop-shadow-sm">{Math.round(m.share)}%</span>}
          </motion.div>
        ))}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2" aria-label="Legend">
        {ordered.map((m) => (
          <li key={m.id} onMouseEnter={() => setHover(m.id)} onMouseLeave={() => setHover(null)}
            className={`flex items-center gap-2 text-sm transition ${hover && hover !== m.id ? 'opacity-50' : ''}`}>
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: colors[m.id] }} />
            <span className="font-medium text-ink-900">{m.name}</span>
            <span className="text-ink-500">{m.points_done} pts · {m.share}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ——— Weekly completed points: single series → no legend, hover tooltip ——— */
function WeeklyChart({ weeks }) {
  const max = Math.max(1, ...weeks.map((w) => w.points))
  const [hover, setHover] = useState(null)
  return (
    <div>
      <div className="relative flex h-44 items-end gap-3 border-b border-slate-200 pt-6" role="img"
        aria-label={`Effort points completed per week: ${weeks.map((w) => `${w.label} ${w.points}`).join(', ')}`}>
        {[0.5, 1].map((f) => (
          <div key={f} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-slate-100" style={{ bottom: `${f * 100}%` }} />
        ))}
        {weeks.map((w, i) => (
          <div key={w.label} className="relative flex h-full flex-1 cursor-default items-end justify-center"
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <AnimatePresence>
              {hover === i && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute z-10 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
                  style={{ bottom: `calc(${(w.points / max) * 100}% + 8px)` }}>
                  Week of {w.label}: <b>{w.points} pts</b>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div className="w-full max-w-[44px] rounded-t-[4px]"
              style={{ backgroundColor: hover === null || hover === i ? '#4f46e5' : '#a5b4fc' }}
              initial={{ height: 0 }} animate={{ height: `${Math.max(w.points ? 4 : 0, (w.points / max) * 100)}%` }}
              transition={{ duration: 0.7, delay: 0.1 + i * 0.06, ease: 'easeOut' }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3">
        {weeks.map((w) => <span key={w.label} className="flex-1 text-center text-[11px] text-ink-500">{w.label}</span>)}
      </div>
    </div>
  )
}

function ScoreRing({ value, color }) {
  const r = 18, c = 2 * Math.PI * r
  return (
    <span className="relative grid h-12 w-12 shrink-0 place-items-center">
      <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#eef2f7" strokeWidth="5" />
        <motion.circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (Math.min(100, value) / 100) * c }} transition={{ duration: 1.1, ease: 'easeOut' }} />
      </svg>
      <span className="relative text-xs font-bold text-ink-900">{value}</span>
    </span>
  )
}

/* ——— Per-member cards (also the table view of the chart) ——— */
function MemberCard({ m, color, rank, index }) {
  const stats = [
    { label: 'Tasks done', value: `${m.tasks_done}/${m.tasks_assigned}` },
    { label: 'Points done', value: m.points_done },
    { label: 'On time', value: m.on_time_rate == null ? '—' : `${m.on_time_rate}%` },
    { label: 'Updates', value: m.updates },
  ]
  return (
    <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + index * 0.06 }}
      className="card break-inside-avoid p-5">
      <div className="flex items-center gap-3">
        <div className="relative">
          <UserAvatar user={m} size="h-11 w-11" />
          <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full ring-2 ring-white" style={{ backgroundColor: color }} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-bold text-ink-900">{m.name}</p>
            {rank === 0 && m.score > 0 && <Award className="h-4 w-4 shrink-0 text-amber-500" aria-label="Top contributor" />}
          </div>
          <div className="mt-0.5 flex items-center gap-2"><RoleBadge role={m.role} />
            <span className="truncate text-[11px] text-ink-500">{m.last_active_at ? `Active ${timeAgo(m.last_active_at)}` : 'No activity yet'}</span>
          </div>
        </div>
        <div className="text-center"><ScoreRing value={m.score} color={color} /><p className="mt-0.5 text-[10px] font-semibold uppercase text-ink-500">Score</p></div>
      </div>

      <dl className="mt-4 grid grid-cols-4 gap-2 rounded-xl bg-slate-50 p-3 text-center">
        {stats.map((s) => (
          <div key={s.label}><dt className="text-[10px] font-medium text-ink-500">{s.label}</dt><dd className="mt-0.5 text-sm font-bold text-ink-900">{s.value}</dd></div>
        ))}
      </dl>

      <div className="mt-4 space-y-2.5 text-xs">
        <div>
          <div className="mb-1 flex justify-between"><span className="text-ink-500">Share of completed work</span><span className="font-bold text-ink-900">{m.share}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <motion.div className="h-full rounded-full" style={{ backgroundColor: color }} initial={{ width: 0 }} animate={{ width: `${m.share}%` }} transition={{ duration: 0.9, delay: 0.3 }} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {m.tasks_open > 0 && <span className="rounded-md bg-amber-50 px-2 py-1 font-semibold text-amber-700">{m.tasks_open} open{m.avg_progress != null ? ` · avg ${m.avg_progress}%` : ''}</span>}
          {m.tasks_overdue > 0 && <span className="flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 font-semibold text-red-700"><AlertTriangle className="h-3 w-3" /> {m.tasks_overdue} overdue</span>}
          {m.tasks_assigned === 0 && <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-ink-500">No tasks assigned</span>}
        </div>
      </div>
    </motion.article>
  )
}

function EmptyReports() {
  return (
    <div className="card flex flex-col items-center px-6 py-16 text-center">
      <motion.span animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}
        className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600"><FileBarChart2 className="h-8 w-8" /></motion.span>
      <h2 className="mt-5 text-xl font-bold text-ink-900">No projects to report on</h2>
      <p className="mt-2 max-w-sm text-sm text-ink-500">Reports are built from the task board. Join or create a project and the contribution report appears here.</p>
      <Link to="/app/projects" className="btn-primary mt-6"><FolderKanban className="h-4 w-4" /> Go to projects</Link>
    </div>
  )
}

export default function Reports() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [projects, setProjects] = useState(null)
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/api/projects', { params: { status: 'all' } })
      .then(({ data }) => setProjects(data.data))
      .catch((err) => setError(parseError(err).message))
  }, [])

  const projectId = id ? Number(id) : projects?.find((p) => p.status === 'active')?.id ?? projects?.[0]?.id
  const current = projects?.find((p) => p.id === projectId)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const { data } = await api.get(`/api/projects/${projectId}/report`)
      setReport(data); setError('')
    } catch (err) {
      setError(parseError(err).message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { load() }, [load])

  const colors = useMemo(() => colorMap(report?.members ?? []), [report])

  if (projects && projects.length === 0) return <div className="mx-auto max-w-6xl"><EmptyReports /></div>

  const t = report?.totals
  const kpis = t && [
    { label: 'Completion', value: `${t.completion}%`, sub: `${t.done} of ${t.tasks} tasks done`, icon: Target, cls: 'bg-brand-50 text-brand-600' },
    { label: 'Effort delivered', value: t.points_done, sub: `of ${t.points} points planned`, icon: Zap, cls: 'bg-amber-50 text-amber-600' },
    { label: 'Waiting for review', value: t.in_review, sub: 'Submitted, not yet approved', icon: ClipboardCheck, cls: 'bg-violet-50 text-violet-600' },
    { label: 'Overdue', value: t.overdue, sub: t.unassigned ? `${t.unassigned} task(s) unassigned` : 'Open tasks past due date', icon: AlertTriangle, cls: t.overdue ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-ink-500' },
  ]

  return (
    <div className="report-print mx-auto max-w-6xl space-y-6">
      <Seo title={`${report?.project?.name ? `${report.project.name} report` : 'Reports'} — SquadBoard`} description="Contribution report." path="/app/reports" />

      <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="eyebrow print:hidden"><FileBarChart2 className="h-3.5 w-3.5" /> Contribution report</span>
          <h1 className="mt-3 text-3xl font-bold text-ink-900">{report?.project?.name ?? 'Reports'}</h1>
          {report && (
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
              {report.project.course && <span className="font-semibold text-brand-600">{report.project.course}</span>}
              {report.project.deadline && <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> Due {formatDate(report.project.deadline, { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
              {report.project.supervisors.length > 0 && <span>Supervisor: {report.project.supervisors.join(', ')}</span>}
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Generated {new Date(report.generated_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {projects && current && <ProjectPicker projects={projects} current={current} onChange={(pid) => navigate(`/app/reports/${pid}`)} />}
          {report && (
            <div className="flex gap-2 print:hidden">
              <Link to={`/app/projects/${projectId}?tab=board`} className="btn-ghost whitespace-nowrap !py-2.5"><KanbanSquare className="h-4 w-4" /> Board</Link>
              <button onClick={() => window.print()} className="btn-primary whitespace-nowrap !py-2.5"><Download className="h-4 w-4" /> Export PDF</button>
            </div>
          )}
        </div>
      </motion.header>

      {error ? (
        <div className="card flex flex-col items-center p-10 text-center">
          <p className="font-semibold text-ink-900">Couldn’t load the report</p>
          <p className="mt-1 text-sm text-ink-500">{error}</p>
          <button onClick={load} className="btn-primary mt-5"><RotateCw className="h-4 w-4" /> Try again</button>
        </div>
      ) : !report || loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="card h-28 animate-pulse bg-slate-50" />)}</div>
          <div className="card h-48 animate-pulse bg-slate-50" />
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {kpis.map((k, i) => (
              <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card break-inside-avoid p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-medium text-ink-500 sm:text-sm">{k.label}</p>
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${k.cls}`}><k.icon className="h-4 w-4" /></span>
                </div>
                <p className="mt-1 font-display text-2xl font-bold text-ink-900 sm:text-3xl">{k.value}</p>
                <p className="mt-1 text-[11px] text-ink-500">{k.sub}</p>
              </motion.div>
            ))}
          </section>

          <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
            <section className="card break-inside-avoid p-5 sm:p-6">
              <h2 className="font-sans text-base font-bold text-ink-900">Who delivered the completed work</h2>
              <p className="mb-5 mt-1 text-xs text-ink-500">Share of effort points from tasks approved as done.</p>
              <ContributionBar members={report.members} colors={colors} />
            </section>
            <section className="card break-inside-avoid p-5 sm:p-6">
              <h2 className="font-sans text-base font-bold text-ink-900">Effort completed per week</h2>
              <p className="mb-2 mt-1 text-xs text-ink-500">Points approved in each of the last 6 weeks.</p>
              <WeeklyChart weeks={report.weekly} />
            </section>
          </div>

          <section>
            <h2 className="mb-4 flex items-center gap-2 font-sans text-lg font-bold text-ink-900"><CheckCircle2 className="h-5 w-5 text-brand-600" /> Individual contribution</h2>
            {report.members.length === 0
              ? <p className="card p-6 text-center text-sm text-ink-500">No team members yet.</p>
              : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{report.members.map((m, i) => <MemberCard key={m.id} m={m} color={colors[m.id]} rank={i} index={i} />)}</div>}
          </section>

          <section className="flex gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-5 text-sm text-brand-900 break-inside-avoid">
            <Info className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">How the score is calculated</p>
              <p className="mt-1 leading-relaxed">
                Score = <b>60%</b> share of completed effort points + <b>20%</b> on-time delivery rate + <b>20%</b> share of activity (progress updates, notes and status changes).
                Only tasks approved as <b>Done</b> by the leader or supervisor count as completed, and every number comes from the board’s activity history — not self-reporting.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  )
}