export function timeAgo(value) {
  if (!value) return ''
  const date = new Date(value)
  const secs = Math.round((Date.now() - date.getTime()) / 1000)
  if (secs < 45) return 'just now'
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function dayGroup(value) {
  const d = new Date(value)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const that = new Date(d); that.setHours(0, 0, 0, 0)
  const diff = Math.round((today - that) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return 'This week'
  return 'Earlier'
}

export const formatDate = (value, opts = { day: 'numeric', month: 'short' }) =>
  value ? new Date(String(value).length === 10 ? value + 'T00:00:00' : value).toLocaleDateString(undefined, opts) : ''