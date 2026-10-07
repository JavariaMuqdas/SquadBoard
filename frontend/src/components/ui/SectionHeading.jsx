import Reveal from './Reveal'

export default function SectionHeading({ eyebrow, title, subtitle, center = true }) {
  return (
    <Reveal className={`max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className="mt-4 text-3xl font-bold text-ink-900 sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-base leading-relaxed text-ink-500 sm:text-lg">{subtitle}</p>}
    </Reveal>
  )
}
