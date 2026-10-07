import { Link } from 'react-router-dom'

export default function Logo({ light = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="SquadBoard home">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-glow">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <rect x="3" y="4" width="4.5" height="16" rx="1.6" fill="#fff" />
          <rect x="9.75" y="4" width="4.5" height="11" rx="1.6" fill="#fff" opacity=".85" />
          <rect x="16.5" y="4" width="4.5" height="7" rx="1.6" fill="#fff" opacity=".7" />
        </svg>
      </span>
      <span className={`font-display text-lg font-bold ${light ? 'text-white' : 'text-ink-900'}`}>
        Squad<span className="text-brand-600">Board</span>
      </span>
    </Link>
  )
}
