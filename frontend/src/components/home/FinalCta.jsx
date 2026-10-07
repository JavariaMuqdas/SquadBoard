import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Reveal from '../ui/Reveal'

export default function FinalCta() {
  return (
    <section className="section">
      <div className="container-x">
        <Reveal className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-600 via-violet-600 to-fuchsia-600 px-6 py-16 text-center text-white sm:px-16 sm:py-20">
          <div className="bg-grid absolute inset-0 opacity-30" />
          <div className="absolute -left-20 -top-20 h-64 w-64 animate-float-slow rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 -right-16 h-72 w-72 animate-float rounded-full bg-fuchsia-300/20 blur-2xl" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold sm:text-5xl">Your next group project deserves better.</h2>
            <p className="mx-auto mt-5 max-w-xl text-brand-100 sm:text-lg">
              Set up your team board in under 2 minutes. Free for teams up to 5 — no card required.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/register" className="btn bg-white px-7 py-3.5 text-base text-brand-700 shadow-xl hover:-translate-y-0.5 hover:bg-brand-50">
                Get started free <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#pricing" className="btn border border-white/30 px-7 py-3.5 text-base text-white hover:bg-white/10">
                Compare plans
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
