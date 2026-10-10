import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Archive, ArchiveRestore, BookOpen, CalendarDays, Check, FolderKanban, Loader2, Save, Trash2, TriangleAlert } from 'lucide-react'
import api, { csrf, parseError } from '../../lib/api'
import { projectColors } from '../../lib/projectColors'
import { Alert, Field } from '../auth/FormControls'

function DeleteDialog({ project, open, onClose }) {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const matches = text.trim() === project.name

  const remove = async () => {
    setLoading(true); setError('')
    try {
      await csrf()
      await api.delete(`/api/projects/${project.id}`, { data: { confirm: text.trim() } })
      navigate('/app/projects', { replace: true })
    } catch (err) {
      setError(parseError(err).message); setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] grid place-items-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="del-title">
          <motion.div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !loading && onClose()} />
          <motion.div initial={{ opacity: 0, scale: 0.94, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }} className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <motion.span initial={{ rotate: -12 }} animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 0.6 }}
              className="grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600"><Trash2 className="h-7 w-7" /></motion.span>
            <h2 id="del-title" className="mt-4 font-sans text-lg font-bold text-ink-900">Delete “{project.name}”?</h2>
            <p className="mt-2 text-sm text-ink-500">This permanently deletes the board, every task, the activity history and the contribution report for all members. This can’t be undone.</p>
            <label className="mt-5 block text-sm font-semibold text-ink-800" htmlFor="del-confirm">
              Type <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[13px]">{project.name}</span> to confirm
            </label>
            <input id="del-confirm" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" autoFocus
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10" />
            {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={onClose} disabled={loading} className="btn-ghost h-11">Cancel</button>
              <button onClick={remove} disabled={!matches || loading} className="btn h-11 bg-red-600 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete forever'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default function ProjectSettingsTab({ project, reload, notify }) {
  const initial = {
    name: project.name, course: project.course ?? '', description: project.description ?? '',
    deadline: project.deadline ?? '', color: project.color ?? 'indigo',
  }
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const archived = project.status === 'archived'
  const dirty = JSON.stringify(form) !== JSON.stringify(initial)

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((er) => ({ ...er, [k]: undefined })) }

  const save = async (e) => {
    e.preventDefault()
    if (form.name.trim().length < 3) return setErrors({ name: 'Project name needs at least 3 characters.' })
    setSaving(true); setErrors({})
    try {
      await csrf()
      await api.put(`/api/projects/${project.id}`, { ...form, name: form.name.trim(), deadline: form.deadline || null })
      notify('Project details saved.')
      reload()
    } catch (err) {
      const p = parseError(err); setErrors({ ...p.fields, form: Object.keys(p.fields).length ? '' : p.message })
    } finally {
      setSaving(false)
    }
  }

  const toggleArchive = async () => {
    setArchiving(true)
    try {
      await csrf()
      const { data } = await api.post(`/api/projects/${project.id}/archive`)
      notify(data.message)
      reload()
    } catch (err) {
      notify(parseError(err).message, 'error')
    } finally {
      setArchiving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <motion.form onSubmit={save} noValidate initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
        <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><FolderKanban className="h-5 w-5" /></span>
          <div><h2 className="font-sans text-base font-bold text-ink-900">Project details</h2><p className="text-xs text-ink-500">Everyone in the project sees these.</p></div>
        </header>
        <div className="space-y-5 p-5 sm:p-6">
          <Alert tone="error">{errors.form}</Alert>
          <Field label="Project name" icon={FolderKanban} value={form.name} onChange={set('name')} error={errors.name} maxLength={100} />
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
            <Field label="Course" icon={BookOpen} placeholder="e.g. FYP, SRE" value={form.course} onChange={set('course')} error={errors.course} maxLength={100} />
            <Field label="Deadline" icon={CalendarDays} type="date" value={form.deadline} onChange={set('deadline')} error={errors.deadline} />
          </div>
          <div>
            <label htmlFor="ps-desc" className="mb-1.5 block text-sm font-semibold text-ink-800">Description</label>
            <textarea id="ps-desc" rows={4} maxLength={500} value={form.description} onChange={set('description')} placeholder="What is this project about?"
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-[15px] outline-none transition hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15" />
            <p className="mt-1 text-right text-xs text-ink-500">{form.description.length}/500</p>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-ink-800">Colour</legend>
            <div className="flex flex-wrap gap-3">
              {Object.entries(projectColors).map(([name, c]) => (
                <button key={name} type="button" onClick={() => setForm((f) => ({ ...f, color: name }))} aria-label={name} aria-pressed={form.color === name}
                  className={`grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br ${c.band} transition-transform hover:scale-110 ${form.color === name ? `ring-2 ring-offset-2 ${c.ring}` : ''}`}>
                  {form.color === name && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
        <footer className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
          <AnimatePresence>{dirty && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mr-auto text-xs font-medium text-amber-600">Unsaved changes</motion.span>}</AnimatePresence>
          <button type="button" onClick={() => { setForm(initial); setErrors({}) }} disabled={!dirty || saving} className="btn-ghost !py-2.5 disabled:opacity-40">Reset</button>
          <button type="submit" disabled={!dirty || saving} className="btn-primary !py-2.5 disabled:opacity-50 disabled:hover:translate-y-0">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
        </footer>
      </motion.form>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="card overflow-hidden border-red-100">
        <header className="flex items-center gap-3 border-b border-red-100 bg-red-50/40 px-5 py-4 sm:px-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-100 text-red-600"><TriangleAlert className="h-5 w-5" /></span>
          <div><h2 className="font-sans text-base font-bold text-ink-900">Danger zone</h2><p className="text-xs text-ink-500">Only you, as team leader, can do this.</p></div>
        </header>
        <div className="divide-y divide-slate-100">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="flex-1">
              <p className="font-semibold text-ink-900">{archived ? 'Restore project' : 'Archive project'}</p>
              <p className="text-sm text-ink-500">{archived
                ? 'Make the project active again. It will count toward your free-plan limit of 3 active projects.'
                : 'Hide it from the dashboard when the semester ends. Nothing is deleted and it no longer counts toward your 3-project limit.'}</p>
            </div>
            <button onClick={toggleArchive} disabled={archiving} className="btn-ghost shrink-0">
              {archiving ? <Loader2 className="h-4 w-4 animate-spin" /> : archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
              {archived ? 'Restore' : 'Archive'}
            </button>
          </div>
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="flex-1">
              <p className="font-semibold text-ink-900">Delete project</p>
              <p className="text-sm text-ink-500">Permanently removes the project, its tasks and its history for everyone.</p>
            </div>
            <button onClick={() => setDeleting(true)} className="btn shrink-0 border border-red-200 bg-white text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>
      </motion.section>

      <DeleteDialog project={project} open={deleting} onClose={() => setDeleting(false)} />
    </div>
  )
}