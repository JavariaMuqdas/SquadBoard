import { motion } from 'framer-motion'
import { CheckCircle2, Clock, MessageSquare, Paperclip, TrendingUp } from 'lucide-react'

const members = {
  AH: 'bg-brand-500', SK: 'bg-mint-500', ZR: 'bg-amber-400', FN: 'bg-coral-400',
}

const columns = [
  {
    title: 'To do', dot: 'bg-slate-400', cards: [
      { t: 'Write literature review', tag: 'Docs', tagC: 'bg-sky-50 text-sky-700', who: 'ZR', due: 'Oct 14' },
      { t: 'Design ER diagram', tag: 'Design', tagC: 'bg-violet-50 text-violet-700', who: 'FN', due: 'Oct 16' },
    ],
  },
  {
    title: 'In progress', dot: 'bg-amber-400', cards: [
      { t: 'Build login API', tag: 'Backend', tagC: 'bg-emerald-50 text-emerald-700', who: 'AH', due: 'Oct 10', progress: 65 },
      { t: 'Survey 50 students', tag: 'Research', tagC: 'bg-amber-50 text-amber-700', who: 'SK', due: 'Oct 12', progress: 40 },
    ],
  },
  {
    title: 'Done', dot: 'bg-mint-500', cards: [
      { t: 'Project proposal', tag: 'Docs', tagC: 'bg-sky-50 text-sky-700', who: 'SK', done: true },
    ],
  },
]

function Avatar({ who }) {
  return (
    <span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold text-white ring-2 ring-white ${members[who]}`}>
      {who}
    </span>
  )
}

export default function BoardIllustration() {
  return (
    <div className="relative" aria-hidden="true">
      {/* glow */}
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-brand-400/30 via-violet-400/20 to-fuchsia-300/20 blur-2xl" />

      <motion.div
        initial={{ opacity: 0, y: 40, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 shadow-2xl backdrop-blur"
      >
        {/* window bar */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-coral-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-mint-400" />
          </div>
          <p className="truncate px-2 text-xs font-semibold text-ink-500">FYP · Smart Attendance System</p>
          <div className="hidden -space-x-2 sm:flex">
            {Object.keys(members).map((m) => <Avatar key={m} who={m} />)}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 bg-slate-50/70 p-4 sm:gap-4 sm:p-5">
          {columns.map((col, ci) => (
            <div key={col.title} className="min-w-0">
              <div className="mb-3 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                <p className="truncate text-[11px] font-bold uppercase tracking-wide text-ink-500">{col.title}</p>
                <span className="ml-auto rounded-md bg-white px-1.5 text-[10px] font-semibold text-ink-500">{col.cards.length}</span>
              </div>
              <div className="space-y-3">
                {col.cards.map((c, i) => (
                  <motion.div
                    key={c.t}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + ci * 0.15 + i * 0.1, duration: 0.5 }}
                    className="rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm sm:p-3"
                  >
                    <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold sm:text-[10px] ${c.tagC}`}>{c.tag}</span>
                    <p className={`mt-2 text-[11px] font-semibold leading-snug sm:text-xs ${c.done ? 'text-ink-500 line-through' : 'text-ink-800'}`}>{c.t}</p>
                    {c.progress && (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${c.progress}%` }}
                          transition={{ delay: 1.2, duration: 1.2, ease: 'easeOut' }}
                        />
                      </div>
                    )}
                    <div className="mt-2.5 flex items-center justify-between">
                      <Avatar who={c.who} />
                      {c.done ? (
                        <CheckCircle2 className="h-4 w-4 text-mint-500" />
                      ) : (
                        <span className="hidden items-center gap-1 text-[10px] font-medium text-ink-500 sm:flex">
                          <Clock className="h-3 w-3" /> {c.due}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* floating chips */}
      <motion.div
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4 }}
        className="absolute -left-4 bottom-10 hidden animate-float rounded-2xl border border-slate-100 bg-white p-3 shadow-soft sm:flex sm:items-center sm:gap-3 lg:-left-14"
      >
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-mint-500/10 text-mint-500"><TrendingUp className="h-5 w-5" /></span>
        <div>
          <p className="text-[11px] font-medium text-ink-500">Sprint progress</p>
          <p className="text-sm font-bold text-ink-900">72% complete</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.7 }}
        className="absolute -bottom-6 right-2 hidden animate-float-slow rounded-2xl border border-slate-100 bg-white p-3 shadow-soft sm:block lg:-right-8"
      >
        <div className="flex items-center gap-2">
          <Avatar who="SK" />
          <p className="text-xs font-semibold text-ink-800">Sara attached a file</p>
        </div>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-ink-500">
          <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" /> survey.xlsx</span>
          <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> 3</span>
        </div>
      </motion.div>
    </div>
  )
}
