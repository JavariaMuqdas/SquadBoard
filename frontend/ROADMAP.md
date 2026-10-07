# SquadBoard — Full Build Roadmap
**Group Project Task Tracker for student teams**
Stack: **React (Vite + Tailwind) · Laravel 11 (REST API) · MySQL**

---

## 1. Architecture

```
┌──────────────────────┐      HTTPS / JSON       ┌──────────────────────────┐      ┌─────────┐
│  React SPA (Vite)    │  ───────────────────▶   │  Laravel 11 API          │ ───▶ │  MySQL  │
│  Tailwind, Framer    │  Sanctum cookie auth    │  Sanctum, Policies,      │      └─────────┘
│  React Router        │  ◀───────────────────   │  Queues, Mail, DomPDF    │ ───▶ Redis (queue/cache, optional)
│  TanStack Query      │                         │  Reverb (realtime, opt.) │ ───▶ Storage (local / S3)
└──────────────────────┘                         └──────────────────────────┘
```

- **Two folders, one repo:** `frontend/` (this project) and `backend/` (Laravel).
- **Auth:** Laravel Sanctum **SPA cookie auth** (not tokens in localStorage — safer against XSS).
- **Data fetching:** TanStack Query (caching, loading states, optimistic updates for drag-and-drop).
- **Forms:** React Hook Form + Zod.
- **Drag & drop:** `@dnd-kit/core` + `@dnd-kit/sortable`.
- **Charts:** Recharts. **Dates:** date-fns. **Toasts:** sonner.
- **PDF reports:** `barryvdh/laravel-dompdf` on the backend.
- **Realtime (Phase 4):** Laravel Reverb + Laravel Echo so board moves appear live for teammates.

---

## 2. User roles & permissions

| Role | Scope | Can do |
|---|---|---|
| **Owner** (team leader) | Project | Everything: edit project, invite/remove, assign, delete, billing |
| **Member** | Project | Create/edit tasks, move own tasks, comment, upload files |
| **Supervisor** | Project (read-only) | View board, timeline, download reports, leave feedback |
| **Admin** | Whole platform | Manage users, plans, payments, abuse reports |

Implement with a `role` column on the `project_members` pivot + **Laravel Policies** (`ProjectPolicy`, `TaskPolicy`).

---

## 3. Modules (feature list)

### M1 — Authentication & profile
- Register, login, logout, email verification, forgot/reset password
- Google OAuth (Laravel Socialite) — students love one-click login
- Profile: name, avatar, university, department, roll/registration no.
- Notification preferences

### M2 — Teams / Projects (workspaces)
- Create project: title, course, description, start/end date, cover color
- Invite by email or **shareable join link/code** (expires, role-scoped)
- Member list with roles; transfer ownership; leave/archive project
- Project dashboard: progress %, overdue count, upcoming deadlines, recent activity

### M3 — Task board (core)
- Kanban columns: To do → In progress → Review → Done (custom columns later)
- Task: title, description, assignee(s), **effort points (1/2/3/5/8)**, priority, labels, due date, milestone
- Subtasks / checklist
- Drag-and-drop with optimistic updates; column position ordering
- Views: **Board**, **List** (sortable table), **Calendar**, **My tasks**
- Filters: by member, label, priority, milestone, overdue

### M4 — Milestones & deadlines
- Milestones (Proposal, Mid-evaluation, Final, Viva) with dates
- Milestone progress bars; "at-risk" flag when remaining points > remaining time
- Deadline reminders: 48h and 24h before, plus overdue alerts (Laravel Scheduler + Queues)

### M5 — Collaboration
- Comments on tasks with @mentions
- File attachments (size limits per plan)
- **Activity log** — every create/move/assign/comment/upload is recorded automatically (this feeds the report)
- In-app notifications bell + email notifications

### M6 — Contribution reports ⭐ (your differentiator)
- Per-member: tasks completed, effort points completed, % share, on-time rate, late tasks, comments, files
- Contribution score formula (configurable weights), e.g.
  `score = 0.6 × points_share + 0.2 × on_time_rate + 0.2 × activity_share`
- Charts: stacked share bar, points over time per member
- Export **PDF** (branded, with project + supervisor info) and CSV
- Shareable read-only report link for supervisors
- **Peer review** (optional): members anonymously rate each other's contribution at milestones

### M7 — Supervisor portal
- Supervisor dashboard listing all teams they supervise
- Read-only board view, timeline, reports
- Leave milestone feedback / approval

### M8 — Billing & plans
- Plans: Free (≤5 members, 3 projects), Team Pro, Department
- Limits enforced by middleware (`EnsurePlanLimit`)
- Payments via a merchant-of-record (e.g. Paddle or Lemon Squeezy — check which accepts sellers from your country), webhooks update `subscriptions`
- Department plan: manual invoicing at first

### M9 — Admin panel
- Use **Filament** (Laravel) — saves weeks: users, projects, plans, payments, reports, feature flags

### M10 — AI features (Phase 5, your agentic edge)
Build on free-tier LLM APIs (Groq / Gemini):
- **AI task breakdown:** paste the project brief → agent proposes milestones + tasks + effort points → team approves
- **Fair-split assistant:** suggests assignments balancing effort points across members
- **Weekly standup digest:** auto summary of what each member did, what's blocked, what's due
- **Risk agent:** flags "this milestone will miss its deadline at current velocity" and "member X has 0 activity in 7 days"
- **Report narrative:** writes the plain-English summary paragraph in the contribution report

---

## 4. Pages

### Public (SEO-indexed)
| Route | Page |
|---|---|
| `/` | Home ✅ (done) |
| `/features` | Feature deep-dive |
| `/pricing` | Plans + comparison table + FAQ |
| `/for-supervisors` | Landing page aimed at faculty |
| `/about`, `/contact` | Company pages |
| `/blog`, `/blog/:slug` | SEO content (e.g. "How to split FYP work fairly") |
| `/privacy`, `/terms` | Legal |

### Auth
`/login` · `/register` · `/forgot-password` · `/reset-password/:token` · `/verify-email` · `/join/:inviteCode`

### App (protected, `noindex`)
| Route | Page |
|---|---|
| `/app` | Dashboard — my projects, my tasks due soon, notifications |
| `/app/projects/new` | Create project wizard |
| `/app/projects/:id/board` | Kanban board |
| `/app/projects/:id/list` | List view |
| `/app/projects/:id/calendar` | Calendar view |
| `/app/projects/:id/milestones` | Milestones |
| `/app/projects/:id/members` | Members & invites |
| `/app/projects/:id/activity` | Activity timeline |
| `/app/projects/:id/report` | Contribution report + export |
| `/app/projects/:id/settings` | Project settings |
| `/app/my-tasks` | All my tasks across projects |
| `/app/notifications` | Notifications |
| `/app/settings/profile` · `/app/settings/billing` | Account |
| `/app/supervisor` | Supervisor dashboard |
| `/admin` | Filament admin (Laravel side) |

---

## 5. MySQL database schema

```
users               id, name, email, password, avatar, university, department,
                    reg_no, google_id, email_verified_at, timestamps
projects            id, owner_id→users, title, course, description, color,
                    start_date, end_date, status(enum active/archived), timestamps
project_members     id, project_id, user_id, role(enum owner/member/supervisor),
                    joined_at   [unique project_id+user_id]
invitations         id, project_id, email(nullable), code, role, expires_at,
                    accepted_at, invited_by
columns             id, project_id, name, position, is_done_column
milestones          id, project_id, title, due_date, position
tasks               id, project_id, column_id, milestone_id(nullable), title,
                    description, priority(enum), effort_points(tinyint),
                    due_date, position, completed_at, created_by, timestamps,
                    softDeletes
task_assignees      task_id, user_id   [pivot]
labels              id, project_id, name, color
label_task          label_id, task_id
subtasks            id, task_id, title, is_done, position
comments            id, task_id, user_id, body, timestamps
attachments         id, task_id, user_id, path, original_name, size, mime
activities          id, project_id, user_id, subject_type, subject_id,
                    action(enum created/moved/assigned/commented/uploaded/completed),
                    meta(json), created_at
notifications       (Laravel default notifications table)
peer_reviews        id, milestone_id, reviewer_id, reviewee_id, score, note
plans               id, name, max_members, max_projects, storage_mb, price
subscriptions       id, project_id or user_id, plan_id, provider, provider_id,
                    status, renews_at, ends_at
```

Indexes: `tasks(project_id, column_id, position)`, `activities(project_id, user_id, created_at)`, `tasks(due_date)`.

---

## 6. Laravel API endpoints (v1)

```
POST   /api/register | /api/login | /api/logout | /api/forgot-password | /api/reset-password
GET    /api/user                                  PUT /api/user

GET    /api/projects                              POST   /api/projects
GET    /api/projects/{id}                         PUT    /api/projects/{id}   DELETE ...
GET    /api/projects/{id}/dashboard

GET    /api/projects/{id}/members                 DELETE /api/projects/{id}/members/{user}
POST   /api/projects/{id}/invitations             POST   /api/invitations/{code}/accept

GET    /api/projects/{id}/board        (columns + tasks in one call)
POST   /api/projects/{id}/tasks        PUT /api/tasks/{id}     DELETE /api/tasks/{id}
PATCH  /api/tasks/{id}/move            { column_id, position }
POST   /api/tasks/{id}/subtasks        PATCH /api/subtasks/{id}
GET    /api/tasks/{id}/comments        POST  /api/tasks/{id}/comments
POST   /api/tasks/{id}/attachments     DELETE /api/attachments/{id}

GET    /api/projects/{id}/milestones   POST/PUT/DELETE ...
GET    /api/projects/{id}/activities?user=&from=&to=
GET    /api/projects/{id}/report                (JSON for charts)
GET    /api/projects/{id}/report/pdf            (download)
GET    /api/my-tasks
GET    /api/notifications              POST /api/notifications/read-all
POST   /api/billing/checkout           POST /api/webhooks/payments
```

Use **API Resources** for responses, **Form Requests** for validation, an **ActivityObserver** on Task/Comment/Attachment to auto-write the activity log, and a **ReportService** class for score calculation.

---

## 7. Folder structure

```
frontend/src/
  components/  layout/ ui/ home/ board/ report/ common/
  pages/       public/ auth/ app/ supervisor/
  features/    auth/ projects/ tasks/ reports/   (hooks + api calls per domain)
  lib/         axios.js  queryClient.js  utils.js
  routes/      ProtectedRoute.jsx  GuestRoute.jsx
  data/

backend/app/
  Http/Controllers/Api/   Http/Requests/   Http/Resources/
  Models/   Policies/   Observers/   Services/ReportService.php
  Notifications/   Jobs/   Console/ (scheduled reminders)
```

---

## 8. SEO plan

- `react-helmet-async` per page: title, description, canonical, Open Graph, Twitter ✅ (set up on Home)
- JSON-LD: `SoftwareApplication` + `FAQPage` ✅ (on Home); add `Organization` and `BlogPosting` later
- `robots.txt` + `sitemap.xml` ✅ in `/public` (update domain before launch)
- **Important:** a plain React SPA is rendered in the browser, so some crawlers see an empty page. Before launch, **prerender the public pages** to static HTML (e.g. `vite-plugin-prerender`/`react-snap`), or move public pages to Next.js later. App pages get `<meta name="robots" content="noindex">`.
- Add an `og-image.png` (1200×630) in `/public`
- Performance: lazy-load app routes with `React.lazy`, compress images (WebP), aim for Lighthouse 90+
- Blog content targeting searches like "FYP task division", "group project contribution report template"

---

## 9. Phase plan

| Phase | Duration | Deliverables |
|---|---|---|
| **0. Setup** | 2–3 days | Repo, Laravel 11 + Sanctum + MySQL, CORS/cookies config, React routing, axios, design system ✅ |
| **1. Public site** | 1 week | Home ✅, Features, Pricing, For Supervisors, About, Contact, Legal, 404 |
| **2. Auth** | 1 week | Register/login/verify/reset, Google login, protected routes, profile |
| **3. Projects & board (MVP core)** | 2–3 weeks | Projects CRUD, invites/join links, Kanban with drag-and-drop, task details drawer, list view, My tasks, dashboard |
| **4. Collaboration** | 1–2 weeks | Comments, @mentions, attachments, activity log, notifications, deadline reminder emails, realtime board (Reverb) |
| **5. Reports** ⭐ | 1–2 weeks | Report service, charts, PDF export, supervisor role & portal, share links |
| **6. Monetization** | 1 week | Plans, limits middleware, checkout + webhooks, billing page, Filament admin |
| **7. AI agents** | 2 weeks | AI task breakdown, standup digest, risk alerts, report narrative |
| **8. Launch** | 1 week | Prerender, SEO polish, tests (Pest + Vitest), deploy, analytics |

**MVP = Phases 0–5 (~7–9 weeks part-time).** Launch to your own department first — supervisors are your best distribution channel.

---

## 10. Deployment

- **Frontend:** Vercel or Netlify (static build)
- **Backend + MySQL:** a VPS (e.g. DigitalOcean/Hetzner) with Laravel Forge, or Railway; set up queue worker + scheduler cron
- Same parent domain for cookie auth: `squadboard.app` (frontend) + `api.squadboard.app` (backend); set `SANCTUM_STATEFUL_DOMAINS` and `SESSION_DOMAIN=.squadboard.app`
- GitHub Actions: lint + tests on every push

---

## 11. Growth & earning notes

- Free tier is the hook; **contribution reports + supervisor access** are the upgrade triggers
- **Department plan** is where real money is: one HOD sale = every FYP team in the department
- Track: teams created, weekly active teams, % teams that export a report, free→paid conversion
