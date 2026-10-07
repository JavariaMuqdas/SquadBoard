import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import SectionHeading from '../ui/SectionHeading'
import Reveal from '../ui/Reveal'
import { plans } from '../../data/home'

export default function Pricing() {
  return (
    <section id="pricing" className="section scroll-mt-20">
      <div className="container-x">
        <SectionHeading
          eyebrow="Pricing"
          title="Free for small groups. Fair for bigger ones."
          subtitle="Start free today. Upgrade only when your team or your project grows."
        />
        <div className="mx-auto mt-16 grid max-w-5xl items-stretch gap-6 lg:grid-cols-3">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.1}
              className={`relative flex flex-col rounded-3xl p-8 ${
                p.highlight
                  ? 'bg-gradient-to-b from-brand-600 to-violet-700 text-white shadow-glow lg:-my-4 lg:py-12'
                  : 'card'
              }`}>
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-ink-900">
                  Most popular
                </span>
              )}
              <h3 className={`font-sans text-lg font-bold ${p.highlight ? 'text-white' : 'text-ink-900'}`}>{p.name}</h3>
              <p className={`mt-1 text-sm ${p.highlight ? 'text-brand-100' : 'text-ink-500'}`}>{p.desc}</p>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-4xl font-extrabold">{p.price}</span>
                <span className={`text-sm ${p.highlight ? 'text-brand-100' : 'text-ink-500'}`}>{p.period}</span>
              </p>
              <ul className="mt-8 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${p.highlight ? 'text-mint-400' : 'text-brand-600'}`} />
                    <span className={p.highlight ? 'text-white' : 'text-ink-700'}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to={p.name === 'Department' ? '/contact' : '/register'}
                className={`mt-8 w-full ${p.highlight ? 'btn bg-white text-brand-700 hover:bg-brand-50' : 'btn-ghost'}`}>
                {p.cta}
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
