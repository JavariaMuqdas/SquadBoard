import { Github, Linkedin, Twitter, Mail } from 'lucide-react'
import Logo from '../ui/Logo'

const cols = [
  { title: 'Product', items: ['Features', 'Pricing', 'Contribution reports', 'For supervisors', 'Changelog'] },
  { title: 'Resources', items: ['Help center', 'FYP planning guide', 'Blog', 'Templates', 'Status'] },
  { title: 'Company', items: ['About', 'Contact', 'Privacy policy', 'Terms of service'] },
]

export default function Footer() {
  return (
    <footer className="bg-ink-900 text-ink-300">
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            The task board built for student teams. Split the work, hit your deadlines, and show your supervisor exactly who did what.
          </p>
          <div className="mt-6 flex gap-3">
            {[Twitter, Linkedin, Github, Mail].map((Icon, i) => (
              <a key={i} href="#" aria-label="Social link"
                 className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 transition hover:bg-brand-600 hover:text-white">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h3 className="font-sans text-sm font-semibold text-white">{c.title}</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {c.items.map((i) => (
                <li key={i}><a href="#" className="transition hover:text-white">{i}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} SquadBoard. All rights reserved.</p>
          <p>Made for student teams everywhere.</p>
        </div>
      </div>
    </footer>
  )
}
