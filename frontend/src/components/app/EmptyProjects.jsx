import { motion } from 'framer-motion'
import { FolderPlus, Plus, Sparkles, UserPlus, ListChecks, FileBarChart2 } from 'lucide-react'

function Illustration() {
  const cols = [
    { title: 'To do', cards: 2, dot: 'bg-slate-300' },
    { title: 'Doing', cards: 1, dot: 'bg-amber-400' },
    { title: 'Done', cards: 0, dot: 'bg-mint-500' },
  ]
  return (
    <div className="relative mx-auto h-56 w-full max-w-sm" aria-hidden="true">
      <div className="absolute inset-x-8 bottom-0 top-6 rounded-[2rem] bg-gradient-to-br from-brand-100 via-violet-100 to-fuchsia-100" />
      <motion.div
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}
        className="absolute inset-x-12 top-10 grid grid-cols-3 gap-2 rounded-2xl bg-white p-3 shadow-xl"
      >
        {cols.map((col, ci) => (
          <div key={col.title}>
            <div className="mb-2 flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} />
              <span className="text-[9px] font-bold uppercase text-ink-500">{col.title}</span>
            </div>
            <div className="space-y-1.5">
              {Array.from({ length: col.cards }).map((_, i) => (
                <motion.div key={i} className="h-8 rounded-lg bg-slate-100"
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + ci * 0.15 + i * 0.1 }} />
              ))}
              <div className="grid h-8 place-items-center rounded-lg border-2 border-dashed border-brand-200">
                <Plus className="h-3 w-3 text-brand-300" />
              </div>
            </div>
          </div>
        ))}
      </motion.div>
      <motion.span className="absolute right-6 top-2 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-glow"
        animate={{ y: [0, -8, 0], rotate: [0, 6, 0] }} transition={{ duration: 4, repeat: Infinity }}>
        <FolderPlus className="h-6 w-6" />
      </motion.span>
      <motion.span className="absolute bottom-6 left-4 text-amber-400" animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 2.5, repeat: Infinity }}>
        <Sparkles className="h-7 w-7" />
      </motion.span>
    </div>
  )
}

const steps = [
  { icon: FolderPlus, title: 'Create a project', text: 'Name, course and deadline' },
  { icon: UserPlus, title: 'Invite your team', text: 'Members & supervisor by email' },
  { icon: ListChecks, title: 'Split the work', text: 'Tasks with owners & effort' },
  { icon: FileBarChart2, title: 'Share the report', text: 'Fair contribution proof' },
]

export default function EmptyProjects({ isSupervisor, onCreate }) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card overflow-hidden">
      <div className="grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-2">
        <Illustration />
        <div className="text-center lg:text-left">
          <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">
            {isSupervisor ? 'No teams to supervise yet' : 'Start your first project'}
          </h2>
          <p className="mt-3 text-ink-500">
            {isSupervisor
              ? 'When a team leader invites you as their supervisor, their project will appear here with live progress and contribution reports.'
              : 'Set up a board for your group in under a minute. You’ll be the team leader, and you can invite members and your supervisor next.'}
          </p>
          {!isSupervisor && (
            <button onClick={onCreate} className="btn-primary mt-6 px-6 py-3.5 text-base">
              <Plus className="h-5 w-5" /> Create project
            </button>
          )}
        </div>
      </div>

      {!isSupervisor && (
        <ol className="grid border-t border-slate-100 bg-slate-50/60 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="flex items-center gap-3 border-slate-100 p-5 sm:[&:nth-child(odd)]:border-r lg:border-r lg:last:border-r-0">
              <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-sm">
                <s.icon className="h-5 w-5" />
                <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{i + 1}</span>
              </span>
              <div>
                <p className="text-sm font-bold text-ink-900">{s.title}</p>
                <p className="text-xs text-ink-500">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </motion.section>
  )
}