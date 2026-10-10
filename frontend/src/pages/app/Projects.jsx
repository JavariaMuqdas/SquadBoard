import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Archive, FolderKanban, FolderSearch, LayoutGrid, List, Plus, RotateCw, Search, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api, { parseError } from '../../lib/api'
import { colorOf, initials } from '../../lib/projectColors'
import { RoleBadge, daysLabel } from '../../lib/roles'
import Seo from '../../components/ui/Seo'
import Toast from '../../components/ui/Toast'
import ProjectCard from '../../components/app/ProjectCard'
import CreateProjectModal from '../../components/app/CreateProjectModal'

const statusTabs = [
  { id: 'active', label: 'Active', icon: FolderKanban },
  { id: 'archived', label: 'Archived', icon: Archive },
  { id: 'all', label: 'All', icon: LayoutGrid },
]
const roleFilters = [
  { id: '', label: 'Any role' },
  { id: 'leader', label: 'Leading' },
  { id: 'member', label: 'Member' },
  { id: 'supervisor', label: 'Supervising' },
]

function ProjectRow({ project, index }) {
  const c = colorOf(project.color)
  const due = daysLabel(project.days_left)
  const pct = project.tasks_total ? Math.round((project.tasks_done / project.tasks_total) * 100) : 0
  return (
    <motion.li layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: index * 0.03 }}>
      <Link to={`/app/projects/${project.id}`} className="group flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-slate-50 sm:flex-nowrap">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-sm font-bold ${c.soft}`}>{initials(project.name)}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-ink-900 group-hover:text-brand-700">{project.name}</p>
            {project.status === 'archived' && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink-500">Archived</span>}
          </div>
          <p className="truncate text-xs text-ink-500">{project.course || 'No course'} · {project.members_count} {project.members_count === 1 ? 'person' : 'people'}</p>
        </div>
        <div className="hidden w-40 md:block">
          <div className="mb-1 flex justify-between text-[11px]"><span className="text-ink-500">{project.tasks_done}/{project.tasks_total} tasks</span><span className="font-bold text-ink-900">{pct}%</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full bg-gradient-to-r ${c.band}`} style={{ width: `${pct}%` }} /></div>
        </div>
        <span className={`w-28 text-right text-xs font-semibold ${due.cls}`}>{due.text}</span>
        <RoleBadge role={project.my_role} />
      </Link>
    </motion.li>
  )
}

export default function Projects() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const status = statusTabs.some((t) => t.id === params.get('status')) ? params.get('status') : 'active'
  const [query, setQuery] = useState(params.get('q') || '')
  const [role, setRole] = useState('')
  const [view, setView] = useState(() => { try { return localStorage.getItem('squadboard:projects-view') || 'grid' } catch { return 'grid' } })
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [toast, setToast] = useState(null)

  // Keep the box in sync when the top-bar search sends a new ?q=
  useEffect(() => { setQuery(params.get('q') || '') }, [params])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/projects', { params: { status } })
      setProjects(data.data); setError('')
    } catch (err) {
      setError(parseError(err).message)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { load() }, [load])

  const setStatus = (s) => setParams((p) => { s === 'active' ? p.delete('status') : p.set('status', s); return p }, { replace: true })
  const changeView = (v) => { setView(v); try { localStorage.setItem('squadboard:projects-view', v) } catch { /* ignore */ } }
  const closeToast = useCallback(() => setToast(null), [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects.filter((p) =>
      (!role || p.my_role === role) &&
      (!q || [p.name, p.course, p.description].some((v) => v?.toLowerCase().includes(q))))
  }, [projects, query, role])

  const counts = useMemo(() => Object.fromEntries(roleFilters.map((r) => [r.id, r.id ? projects.filter((p) => p.my_role === r.id).length : projects.length])), [projects])

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Seo title="Projects — SquadBoard" description="All your SquadBoard projects." path="/app/projects" />

      <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">Projects</h1>
          <p className="mt-1 text-ink-500">Every project you lead, work on or supervise.</p>
        </div>
        {user.role === 'student' && (
          <button onClick={() => setModal(true)} className="btn-primary self-start sm:self-auto"><Plus className="h-4 w-4" /> New project</button>
        )}
      </motion.header>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {statusTabs.map((t) => (
          <button key={t.id} onClick={() => setStatus(t.id)} aria-current={status === t.id ? 'page' : undefined}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold transition ${status === t.id ? 'text-brand-700' : 'text-ink-500 hover:text-ink-900'}`}>
            <t.icon className="h-4 w-4" /> {t.label}
            {status === t.id && <motion.span layoutId="projects-tab" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600" />}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or course…" aria-label="Search projects"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10" />
        </div>
        <div className="flex flex-1 items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {roleFilters.map((r) => (
            <button key={r.id} onClick={() => setRole(r.id)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${role === r.id ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-ink-700 hover:border-slate-300'}`}>
              {r.label} <span className={role === r.id ? 'text-brand-100' : 'text-ink-300'}>{counts[r.id]}</span>
            </button>
          ))}
        </div>
        <div className="flex shrink-0 self-end rounded-xl bg-slate-100 p-1 md:self-auto" role="radiogroup" aria-label="View">
          {[['grid', LayoutGrid], ['list', List]].map(([v, Icon]) => (
            <button key={v} role="radio" aria-checked={view === v} aria-label={`${v} view`} onClick={() => changeView(v)}
              className="relative grid h-8 w-9 place-items-center rounded-lg">
              {view === v && <motion.span layoutId="view-pill" className="absolute inset-0 rounded-lg bg-white shadow-sm" />}
              <Icon className={`relative h-4 w-4 ${view === v ? 'text-brand-600' : 'text-ink-500'}`} />
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="card flex flex-col items-center p-10 text-center">
          <p className="font-semibold text-ink-900">Couldn’t load projects</p>
          <p className="mt-1 text-sm text-ink-500">{error}</p>
          <button onClick={load} className="btn-primary mt-5"><RotateCw className="h-4 w-4" /> Try again</button>
        </div>
      ) : loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="card h-72 animate-pulse bg-slate-50" />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="card flex flex-col items-center px-6 py-16 text-center">
          <motion.span animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}
            className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            {status === 'archived' ? <Archive className="h-8 w-8" /> : <FolderSearch className="h-8 w-8" />}
          </motion.span>
          <h2 className="mt-5 text-xl font-bold text-ink-900">
            {query || role ? 'No projects match' : status === 'archived' ? 'Nothing archived' : 'No projects yet'}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-ink-500">
            {query || role
              ? 'Try a different search or clear the filters.'
              : status === 'archived'
                ? 'Archived projects are kept read-only here. Leaders can archive a project from its Settings tab.'
                : user.role === 'student' ? 'Create a project and invite your team to get started.' : 'Projects you’re invited to supervise will appear here.'}
          </p>
          {(query || role) ? (
            <button onClick={() => { setQuery(''); setRole('') }} className="btn-ghost mt-6"><X className="h-4 w-4" /> Clear filters</button>
          ) : status === 'active' && user.role === 'student' && (
            <button onClick={() => setModal(true)} className="btn-primary mt-6"><Plus className="h-4 w-4" /> Create project</button>
          )}
        </motion.div>
      ) : view === 'grid' ? (
        <motion.div layout className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {filtered.map((p, i) => <ProjectCard key={p.id} project={p} index={i} />)}
          </AnimatePresence>
        </motion.div>
      ) : (
        <ul className="card divide-y divide-slate-100 overflow-hidden">
          <AnimatePresence>{filtered.map((p, i) => <ProjectRow key={p.id} project={p} index={i} />)}</AnimatePresence>
        </ul>
      )}

      <CreateProjectModal open={modal} onClose={() => setModal(false)}
        onCreated={(p) => { setModal(false); setToast({ text: `“${p.name}” created.` }); if (status !== 'archived') setProjects((list) => [p, ...list]) }} />
      <Toast toast={toast} onClose={closeToast} />
    </div>
  )
}