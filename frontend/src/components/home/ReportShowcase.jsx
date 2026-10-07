import { motion } from 'framer-motion'
import { Check, Download, FileText } from 'lucide-react'
import Reveal from '../ui/Reveal'

const members = [
  { name: 'Ahmed H.', role: 'Backend', pct: 31, tasks: 14, color: 'bg-brand-500' },
  { name: 'Sara K.', role: 'Research', pct: 27, tasks: 12, color: 'bg-mint-500' },
  { name: 'Zain R.', role: 'Docs', pct: 22, tasks: 10, color: 'bg-amber-400' },
  { name: 'Fatima N.', role: 'UI/UX', pct: 20, tasks: 9, color: 'bg-coral-400' },
]

const bullets = [
  'Tasks completed and effort points per member',
  'On-time vs late delivery for every deadline',
  'Full activity timeline — comments, files, status changes',
  'Export as PDF or share a read-only link',
]

export default function ReportShowcase() {
  return (
    <section id="reports" className="section scroll-mt-20 overflow-hidden">
      <div className="container-x grid items-center gap-16 lg:grid-cols-2">
        <Reveal>
          <span className="eyebrow">Contribution reports</span>
          <h2 className="mt-4 text-3xl font-bold text-ink-900 sm:text-4xl">
            Proof of who did what, <span className="text-gradient">in one click.</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-500 sm:text-lg">
            Supervisors can finally grade individuals fairly. SquadBoard builds the report from real activity on the board — no self-reported guesswork.
          </p>
          <ul className="mt-8 space-y-4">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint-500/10 text-mint-500">
                  <Check className="h-4 w-4" />
                </span>
                <span className="text-ink-700">{b}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.15} className="relative">
          <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-violet-200/50 to-brand-100/40 blur-2xl" />
          <div className="card p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><FileText className="h-5 w-5" /></span>
                <div>
                  <p className="font-bold text-ink-900">Contribution Report</p>
                  <p className="text-xs text-ink-500">Smart Attendance System · Sprint 1–4</p>
                </div>
              </div>
              <button className="btn-ghost !px-3 !py-2 text-xs" tabIndex={-1}><Download className="h-4 w-4" /> PDF</button>
            </div>

            {/* stacked bar */}
            <div className="mt-8 flex h-4 overflow-hidden rounded-full">
              {members.map((m, i) => (
                <motion.div
                  key={m.name}
                  className={m.color}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${m.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.3 + i * 0.15, ease: 'easeOut' }}
                />
              ))}
            </div>

            <div className="mt-6 divide-y divide-slate-100">
              {members.map((m) => (
                <div key={m.name} className="flex items-center gap-4 py-3.5">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${m.color}`}>
                    {m.name.split(' ').map((w) => w[0]).join('')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">{m.name}</p>
                    <p className="text-xs text-ink-500">{m.role} · {m.tasks} tasks</p>
                  </div>
                  <p className="font-display text-lg font-bold text-ink-900">{m.pct}%</p>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-ink-500">Sample report with demo data.</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
