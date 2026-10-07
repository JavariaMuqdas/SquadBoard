import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import SectionHeading from '../ui/SectionHeading'
import { faqs } from '../../data/home'

export default function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section id="faq" className="section scroll-mt-20 bg-slate-50/70">
      <div className="container-x max-w-3xl">
        <SectionHeading eyebrow="FAQ" title="Questions? We’ve got answers." />
        <div className="mt-12 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={f.q} className={`rounded-2xl border bg-white transition ${isOpen ? 'border-brand-200 shadow-soft' : 'border-slate-200'}`}>
                <h3>
                  <button
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-sans text-base font-semibold text-ink-900"
                  >
                    {f.q}
                    <Plus className={`h-5 w-5 shrink-0 text-brand-600 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-sm leading-relaxed text-ink-500">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
