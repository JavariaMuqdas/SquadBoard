import { XCircle } from 'lucide-react'
import { painPoints } from '../../data/home'

export default function PainMarquee() {
  const items = [...painPoints, ...painPoints]
  return (
    <section aria-label="Common group project problems" className="border-y border-slate-100 bg-slate-50/60 py-6">
      <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">
        Sound familiar? SquadBoard fixes all of this
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex w-max animate-marquee gap-4 hover:[animation-play-state:paused]">
          {items.map((p, i) => (
            <span key={i} className="flex items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-ink-700">
              <XCircle className="h-4 w-4 text-coral-400" /> {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
