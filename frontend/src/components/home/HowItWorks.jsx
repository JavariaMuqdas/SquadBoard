import { motion } from 'framer-motion'
import SectionHeading from '../ui/SectionHeading'
import { steps } from '../../data/home'

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section scroll-mt-20 bg-gradient-to-b from-brand-50/60 to-white">
      <div className="container-x">
        <SectionHeading
          eyebrow="How it works"
          title="From group chat chaos to a clear plan in 4 steps"
          subtitle="No training needed. If you can use a to-do list, you can run your team on SquadBoard."
        />
        <div className="relative mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent lg:block" />
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative text-center lg:text-left"
            >
              <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-brand-100 bg-white text-brand-600 shadow-soft lg:mx-0">
                <s.icon className="h-7 w-7" />
                <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{i + 1}</span>
              </div>
              <h3 className="mt-6 font-sans text-lg font-bold text-ink-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
