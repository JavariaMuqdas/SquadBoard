// Full class names are written out so Tailwind keeps them in the build.
export const projectColors = {
  indigo: { band: 'from-brand-500 to-violet-500', soft: 'bg-brand-50 text-brand-700', dot: 'bg-brand-500', ring: 'ring-brand-500' },
  violet: { band: 'from-violet-500 to-fuchsia-500', soft: 'bg-violet-50 text-violet-700', dot: 'bg-violet-500', ring: 'ring-violet-500' },
  emerald: { band: 'from-emerald-400 to-teal-500', soft: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', ring: 'ring-emerald-500' },
  amber: { band: 'from-amber-400 to-orange-500', soft: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', ring: 'ring-amber-500' },
  rose: { band: 'from-rose-400 to-pink-500', soft: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500', ring: 'ring-rose-500' },
  sky: { band: 'from-sky-400 to-cyan-500', soft: 'bg-sky-50 text-sky-700', dot: 'bg-sky-500', ring: 'ring-sky-500' },
}

export const colorOf = (name) => projectColors[name] ?? projectColors.indigo

export const avatarColors = ['bg-brand-500', 'bg-mint-500', 'bg-amber-400', 'bg-coral-400', 'bg-violet-500', 'bg-sky-500']
export const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()