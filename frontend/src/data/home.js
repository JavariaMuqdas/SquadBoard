import {
  LayoutGrid, CalendarClock, Users, FileBarChart2, Bell, MessagesSquare,
  FolderOpen, ShieldCheck, GraduationCap, Crown, UserCheck,
} from 'lucide-react'

export const painPoints = [
  '“Who was supposed to do this?”',
  'One person doing all the work',
  'Deadlines lost in WhatsApp',
  'Files scattered across 5 drives',
  'Viva day: “I did the frontend…”',
  'Supervisor can’t see real effort',
]

export const features = [
  { icon: LayoutGrid, title: 'Kanban task board', text: 'Drag tasks between To do, In progress, Review and Done. Everyone sees the same picture, always.', color: 'from-brand-500 to-violet-500' },
  { icon: Users, title: 'Fair task splitting', text: 'Assign tasks with effort points so work is split evenly — not just by count.', color: 'from-emerald-500 to-teal-500' },
  { icon: CalendarClock, title: 'Deadlines & milestones', text: 'Set due dates, group them into milestones like Proposal, Mid-eval and Final, and see what’s at risk.', color: 'from-amber-400 to-orange-500' },
  { icon: FileBarChart2, title: 'Contribution reports', text: 'One click generates a PDF showing each member’s tasks, hours and activity — ready for your supervisor.', color: 'from-fuchsia-500 to-pink-500' },
  { icon: Bell, title: 'Smart reminders', text: 'Email and in-app nudges before deadlines, so nobody can say “I didn’t know”.', color: 'from-sky-500 to-cyan-500' },
  { icon: MessagesSquare, title: 'Comments & files', text: 'Discuss on the task itself and attach documents, so context never gets lost in chat groups.', color: 'from-rose-500 to-red-500' },
]

export const steps = [
  { n: '01', icon: FolderOpen, title: 'Create a project', text: 'Name your project, add a deadline and invite your group with a link or email.' },
  { n: '02', icon: LayoutGrid, title: 'Split the work', text: 'Break the project into tasks, assign owners and effort points, and set due dates.' },
  { n: '03', icon: CalendarClock, title: 'Track progress', text: 'Move tasks across the board. Every change is logged automatically in the activity timeline.' },
  { n: '04', icon: FileBarChart2, title: 'Share the report', text: 'Export a contribution report or give your supervisor read-only access to the board.' },
]

export const audiences = [
  { icon: GraduationCap, title: 'Students', points: ['See exactly what’s on your plate', 'Get credit for the work you did', 'Never miss a deadline again'] },
  { icon: Crown, title: 'Team leaders', points: ['Split work fairly in minutes', 'Spot blocked or late tasks early', 'Stop chasing people on WhatsApp'] },
  { icon: UserCheck, title: 'Supervisors', points: ['Read-only view of every team', 'Evidence-based contribution data', 'Grade individuals, not just groups'] },
]

export const plans = [
  {
    name: 'Free', price: '$0', period: 'forever', desc: 'For small class groups.',
    features: ['Up to 5 members', '3 active projects', 'Kanban board & deadlines', 'Basic contribution report'],
    cta: 'Start free', highlight: false,
  },
  {
    name: 'Team Pro', price: '$4', period: 'per team / month', desc: 'For FYPs and bigger teams.',
    features: ['Up to 15 members', 'Unlimited projects', 'Detailed PDF reports', 'Supervisor read-only access', 'File storage (2 GB)', 'Priority email reminders'],
    cta: 'Upgrade your team', highlight: true,
  },
  {
    name: 'Department', price: 'Custom', period: 'per semester', desc: 'For faculty managing many teams.',
    features: ['Unlimited teams', 'Supervisor dashboard', 'Bulk team creation (CSV)', 'Department analytics', 'Dedicated support'],
    cta: 'Contact us', highlight: false,
  },
]

export const faqs = [
  { q: 'Is SquadBoard really free for students?', a: 'Yes. Teams of up to 5 members can use the core board, deadlines and a basic contribution report free forever. You only pay if your team grows or needs advanced reports.' },
  { q: 'How is “contribution” calculated?', a: 'Each task carries effort points. The report combines completed points, on-time delivery, and logged activity (comments, files, status changes) for every member — so it reflects real work, not just task count.' },
  { q: 'Can my supervisor see our board?', a: 'Yes. You can invite your supervisor with a read-only role. They can view progress and download reports, but can’t change anything.' },
  { q: 'Does it work on mobile?', a: 'Fully. SquadBoard is responsive, so you can update tasks from your phone between classes.' },
  { q: 'Is our project data private?', a: 'Your boards are visible only to members you invite. Data is stored securely and you can export or delete it at any time.' },
]

export const trust = [{ icon: ShieldCheck, text: 'Private by default' }]
