import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mail, X } from 'lucide-react'

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

/** Type or paste emails; Enter, comma or space turns each into a chip. */
export default function EmailChipsInput({ value, onChange, max = 10, disabled, autoFocus }) {
  const [text, setText] = useState('')
  const ref = useRef(null)

  const add = (raw) => {
    const parts = raw.split(/[\s,;]+/).map((p) => p.trim().toLowerCase()).filter(Boolean)
    if (!parts.length) return
    const next = [...value]
    for (const p of parts) if (!next.includes(p) && next.length < max) next.push(p)
    onChange(next)
    setText('')
  }

  const onKeyDown = (e) => {
    if (['Enter', ',', ' ', 'Tab'].includes(e.key) && text.trim()) {
      e.preventDefault()
      add(text)
    } else if (e.key === 'Backspace' && !text && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div
      onClick={() => ref.current?.focus()}
      className={`flex min-h-[52px] cursor-text flex-wrap items-center gap-2 rounded-xl border bg-white px-3 py-2 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15 ${disabled ? 'opacity-60' : 'border-slate-200 hover:border-slate-300'}`}
    >
      <Mail className="h-[18px] w-[18px] shrink-0 text-ink-300" />
      <AnimatePresence initial={false}>
        {value.map((email) => {
          const ok = isEmail(email)
          return (
            <motion.span
              key={email} layout
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              className={`flex max-w-full items-center gap-1 rounded-lg py-1 pl-2.5 pr-1 text-sm font-medium ${ok ? 'bg-brand-50 text-brand-800' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}
              title={ok ? email : 'Not a valid email'}
            >
              <span className="truncate">{email}</span>
              <button type="button" onClick={(e) => { e.stopPropagation(); onChange(value.filter((v) => v !== email)) }}
                className="grid h-5 w-5 place-items-center rounded-md hover:bg-black/5" aria-label={`Remove ${email}`}>
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.span>
          )
        })}
      </AnimatePresence>
      <input
        ref={ref}
        autoFocus={autoFocus}
        type="email"
        value={text}
        disabled={disabled || value.length >= max}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => text.trim() && add(text)}
        onPaste={(e) => { e.preventDefault(); add(e.clipboardData.getData('text')) }}
        placeholder={value.length ? '' : 'ali@uni.edu, sara@uni.edu…'}
        aria-label="Email addresses"
        className="min-w-[160px] flex-1 bg-transparent py-1 text-[15px] outline-none placeholder:text-ink-300"
      />
    </div>
  )
}

export { isEmail }