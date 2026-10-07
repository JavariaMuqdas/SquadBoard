import { motion } from 'framer-motion'
import SectionHeading from '../ui/SectionHeading'
import { features } from '../../data/home'

export default function Features() {
  return (
    <section id="features" className="section scroll-mt-20">
      <div className="container-x">
        <SectionHeading
          eyebrow="Features"
          title="Everything your team needs. Nothing it doesn’t."
          subtitle="A focused toolkit for student teams — simple enough to set up in two minutes, powerful enough for a full final-year project."
        />
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.article
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
              whileHover={{ y: -6 }}
              className="card group relative overflow-hidden p-7"
            >
              <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${f.color} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20`} />
              <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${f.color} text-white shadow-lg`}>
                <f.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-6 font-sans text-lg font-bold text-ink-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{f.text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
