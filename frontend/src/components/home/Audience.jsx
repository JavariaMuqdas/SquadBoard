import { CheckCircle2 } from 'lucide-react'
import SectionHeading from '../ui/SectionHeading'
import Reveal from '../ui/Reveal'
import { audiences } from '../../data/home'

export default function Audience() {
  return (
    <section className="section bg-ink-900 text-white">
      <div className="container-x">
        <div className="[&_h2]:text-white [&_p]:text-ink-300 [&_.eyebrow]:border-white/10 [&_.eyebrow]:bg-white/5 [&_.eyebrow]:text-brand-200">
          <SectionHeading
            eyebrow="Who it’s for"
            title="One board. Three happy roles."
            subtitle="Every person in a group project needs something different. SquadBoard gives each of them exactly that."
          />
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {audiences.map((a, i) => (
            <Reveal key={a.title} delay={i * 0.1}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition hover:border-brand-400/50 hover:bg-white/[0.06]">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/15 text-brand-300">
                <a.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-6 font-sans text-xl font-bold">{a.title}</h3>
              <ul className="mt-5 space-y-3">
                {a.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm text-ink-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint-400" /> {p}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
