import { avatarColors, initials } from '../../lib/projectColors'

/** Photo if available, otherwise coloured initials (colour is stable per user id). */
export default function UserAvatar({ user, size = 'h-10 w-10', text = 'text-sm', ring = '' }) {
  if (user.avatar) return <img src={user.avatar} alt="" className={`${size} shrink-0 rounded-full object-cover ${ring}`} />
  const color = avatarColors[(user.id ?? user.name?.length ?? 0) % avatarColors.length]
  return (
    <span className={`${size} ${text} ${color} ${ring} grid shrink-0 place-items-center rounded-full font-bold text-white`}>
      {initials(user.name || user.email || '?')}
    </span>
  )
}