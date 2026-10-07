import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, PlayCircle, Sparkles, Star } from 'lucide-react'
import BoardIllustration from './BoardIllustration'

const fade = (d = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay: d, ease: [0.22, 1, 0.36, 1] },
})

export default function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-32 sm:pt-40 lg:pb-28">
      {/* background */}
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-b from-brand-200/60 to-transparent blur-3xl" />

      <div className="container-x relative grid items-center gap-16 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        <div className="text-center lg:text-left">
          <motion.span {...fade(0)} className="eyebrow">
            <Sparkles className="h-3.5 w-3.5" /> Built for FYPs & group assignments
          </motion.span>

          <motion.h1 {...fade(0.1)} className="mt-6 text-4xl font-extrabold leading-[1.1] text-ink-900 sm:text-5xl lg:text-6xl">
            Group projects, <br className="hidden sm:block" />
            <span className="text-gradient">without the chaos.</span>
          </motion.h1>

          <motion.p {...fade(0.2)} className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-500 sm:text-lg lg:mx-0">
            SquadBoard lets your team split tasks, set deadlines and track who did what — then turns it into a
            fair contribution report your supervisor can trust.
          </motion.p>

          <motion.div {...fade(0.3)} className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link to="/register" className="btn-primary w-full px-7 py-3.5 text-base sm:w-auto">
              Create your team board <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#how-it-works" className="btn-ghost w-full px-6 py-3.5 text-base sm:w-auto">
              <PlayCircle className="h-5 w-5 text-brand-600" /> See how it works
            </a>
          </motion.div>

          <motion.div {...fade(0.4)} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <div className="flex -space-x-3">
              {['bg-brand-500', 'bg-mint-500', 'bg-amber-400', 'bg-coral-400', 'bg-violet-500'].map((c, i) => (
                <span key={i} className={`h-10 w-10 rounded-full ring-4 ring-white ${c}`} />
              ))}
            </div>
            <div className="text-sm">
              <div className="flex justify-center gap-0.5 text-amber-400 sm:justify-start">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="mt-1 text-ink-500"><span className="font-semibold text-ink-900">Free forever</span> for teams up to 5</p>
            </div>
          </motion.div>
        </div>

        <div className="mx-auto w-full max-w-xl lg:max-w-none">
          <BoardIllustration />
        </div>
      </div>
    </section>
  )
}
