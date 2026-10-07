import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Circle,
  Crown,
  FolderKanban,
  Plus,
  Users,
  X,
  CalendarDays,
  ListChecks,
  TrendingUp,
  RotateCw,
  ServerCrash,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api, { parseError } from '../../lib/api'
import { colorOf } from "../../lib/projectColors";
import Seo from "../../components/ui/Seo";
import StatCard from "../../components/app/StatCard";
import ProjectCard from "../../components/app/ProjectCard";
import EmptyProjects from "../../components/app/EmptyProjects";
import CreateProjectModal from "../../components/app/CreateProjectModal";

const inviteErrors = {
  email_mismatch:
    "That invitation was sent to a different email, so it wasn’t accepted.",
  expired: "That invitation has expired. Ask your team leader for a new one.",
  accepted: "That invitation was already used.",
  revoked: "That invitation was cancelled.",
  invalid: "That invitation link is invalid.",
};

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

/* ——— Welcome banner with a small floating illustration ——— */
function WelcomeBanner({ user, isNew, onCreate }) {
  const first = user.name.split(" ")[0];
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-violet-600 to-fuchsia-600 p-6 text-white sm:p-8 lg:p-10"
    >
      <div className="bg-grid absolute inset-0 opacity-25" />
      <div className="absolute -right-16 -top-20 h-72 w-72 animate-float-slow rounded-full bg-white/10 blur-3xl" />

      <div className="relative grid items-center gap-8 md:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="text-sm font-medium text-brand-100">{today}</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            {isNew ? "Welcome" : greeting()}, {first} 👋
          </h1>
          <p className="mt-3 max-w-lg text-brand-100">
            {user.role === "supervisor"
              ? "Track every team you supervise and see who is really contributing."
              : "Here’s what’s happening with your team projects today."}
          </p>
          {user.role === "student" && (
            <button
              onClick={onCreate}
              className="btn mt-6 bg-white text-brand-700 shadow-lg hover:-translate-y-0.5 hover:bg-brand-50"
            >
              <Plus className="h-4 w-4" /> New project
            </button>
          )}
        </div>

        {/* decorative illustration */}
        <div className="relative hidden h-44 md:block" aria-hidden="true">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute right-6 top-0 w-56 animate-float rounded-2xl bg-white p-4 text-ink-900 shadow-2xl"
          >
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-mint-500/10 text-mint-500">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold">Task completed</p>
                <p className="text-[11px] text-ink-500">
                  Database schema · Sara
                </p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-0 right-24 w-60 animate-float-slow rounded-2xl bg-white p-4 text-ink-900 shadow-2xl"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold">Sprint progress</span>
              <span className="font-bold text-brand-600">68%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500"
                initial={{ width: 0 }}
                animate={{ width: "68%" }}
                transition={{ delay: 0.8, duration: 1.2 }}
              />
            </div>
            <div className="mt-3 flex -space-x-2">
              {[
                "bg-brand-500",
                "bg-mint-500",
                "bg-amber-400",
                "bg-coral-400",
              ].map((c) => (
                <span
                  key={c}
                  className={`h-6 w-6 rounded-full ring-2 ring-white ${c}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

/* ——— Right column widgets ——— */
function GettingStarted({ hasProject, hasTeam }) {
  const items = [
    { label: "Create your account", done: true },
    { label: "Create your first project", done: hasProject },
    { label: "Invite your team & supervisor", done: hasTeam },
    { label: "Add your first tasks", done: false, soon: true },
  ];
  const done = items.filter((i) => i.done).length;
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-base font-bold text-ink-900">
          Getting started
        </h2>
        <span className="text-xs font-bold text-brand-600">
          {done}/{items.length}
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="h-full bg-gradient-to-r from-brand-500 to-violet-500"
          initial={{ width: 0 }}
          animate={{ width: `${(done / items.length) * 100}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
      <ul className="mt-4 space-y-3">
        {items.map((i) => (
          <li key={i.label} className="flex items-center gap-3 text-sm">
            {i.done ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-mint-500" />
            ) : (
              <Circle className="h-5 w-5 shrink-0 text-slate-300" />
            )}
            <span
              className={
                i.done
                  ? "text-ink-500 line-through"
                  : "font-medium text-ink-800"
              }
            >
              {i.label}
            </span>
            {i.soon && (
              <span className="ml-auto rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink-500">
                Soon
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function UpcomingDeadlines({ projects }) {
  const upcoming = projects
    .filter((p) => p.days_left !== null && p.days_left >= 0)
    .slice(0, 4);
  return (
    <div className="card p-5">
      <h2 className="flex items-center gap-2 font-sans text-base font-bold text-ink-900">
        <CalendarClock className="h-5 w-5 text-brand-600" /> Upcoming deadlines
      </h2>
      {upcoming.length === 0 ? (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-center text-sm text-ink-500">
          No deadlines set yet.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {upcoming.map((p) => {
            const d = new Date(p.deadline + "T00:00:00");
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50"
              >
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-center leading-none ${colorOf(p.color).soft}`}
                >
                  <span>
                    <span className="block text-[10px] font-bold uppercase">
                      {d.toLocaleDateString(undefined, { month: "short" })}
                    </span>
                    <span className="text-base font-bold">{d.getDate()}</span>
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {p.name}
                  </p>
                  <p
                    className={`text-xs ${p.days_left <= 7 ? "font-semibold text-amber-600" : "text-ink-500"}`}
                  >
                    {p.days_left === 0
                      ? "Due today"
                      : `${p.days_left} days left`}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {[0, 1].map((i) => (
        <div key={i} className="card overflow-hidden">
          <div className="h-20 animate-pulse bg-slate-200" />
          <div className="space-y-3 p-5 pt-8">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-2 w-full animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user, flash: pending, setFlash } = useAuth();
  const [params] = useSearchParams();
  const [flash] = useState(pending);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null)
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState(() => {
    const joined = flash?.joined?.name || params.get("joined");
    const err =
      flash?.inviteError?.message || inviteErrors[params.get("invite_error")];
    return joined
      ? { tone: "success", text: `You joined “${joined}”.` }
      : err
        ? { tone: "error", text: err }
        : null;
  });

  useEffect(() => {
    if (pending) setFlash(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

   const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, d] = await Promise.all([api.get('/api/projects'), api.get('/api/dashboard')])
      setProjects(p.data.data)
      setStats(d.data.stats)
      setLoadError(null)
    } catch (err) {
      // Show a real error instead of a misleading "no projects yet" screen
      setLoadError(parseError(err).message)
      console.error('Dashboard load failed:', err.response?.data ?? err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const onCreated = (project) => {
    setModal(false);
    setProjects((list) => [project, ...list]);
    setToast({
      tone: "success",
      text: `“${project.name}” created. Next: invite your team.`,
    });
    api
      .get("/api/dashboard")
      .then((d) => setStats(d.data.stats))
      .catch(() => {});
  };

  const isSupervisor = user.role === "supervisor";
  const openModal = useCallback(() => setModal(true), []);
  const closeModal = useCallback(() => setModal(false), []);

  const statCards = [
    {
      icon: FolderKanban,
      label: "Active projects",
      value: stats?.projects,
      hint: "Across all your courses",
      tone: { icon: "bg-brand-50 text-brand-600", blob: "bg-brand-500" },
    },
    {
      icon: Crown,
      label: "You lead",
      value: stats?.leading,
      hint: "Projects where you’re leader",
      tone: { icon: "bg-amber-50 text-amber-600", blob: "bg-amber-400" },
    },
    {
      icon: Users,
      label: "Teammates",
      value: stats?.teammates,
      hint: "People you work with",
      tone: { icon: "bg-emerald-50 text-emerald-600", blob: "bg-mint-500" },
    },
    {
      icon: CalendarDays,
      label: "Due in 14 days",
      value: stats?.due_soon,
      hint: "Projects nearing deadline",
      tone: { icon: "bg-rose-50 text-rose-600", blob: "bg-coral-400" },
    },
  ];

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-8">
        <Seo
          title="Dashboard — SquadBoard"
          description="Your SquadBoard workspace."
          path="/app"
        />

        <WelcomeBanner
          user={user}
          isNew={flash?.welcome}
          onCreate={openModal}
        />

        <section
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
          aria-label="Overview"
        >
          {statCards.map((s, i) => (
            <StatCard key={s.label} {...s} delay={0.1 + i * 0.07} />
          ))}
        </section>

                {loadError ? (
          <section className="card flex flex-col items-center p-10 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600"><ServerCrash className="h-7 w-7" /></span>
            <h2 className="mt-4 font-sans text-lg font-bold text-ink-900">Couldn’t load your projects</h2>
            <p className="mt-1 max-w-md text-sm text-ink-500">{loadError}</p>
            <button onClick={load} className="btn-primary mt-6"><RotateCw className="h-4 w-4" /> Try again</button>
          </section>
        ) : !loading && projects.length === 0 ? (
          <EmptyProjects isSupervisor={isSupervisor} onCreate={openModal} />
        ) : (
          <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
            <section aria-labelledby="projects-title">
              <div className="mb-5 flex items-center justify-between">
                <h2
                  id="projects-title"
                  className="flex items-center gap-2 font-sans text-lg font-bold text-ink-900"
                >
                  <TrendingUp className="h-5 w-5 text-brand-600" /> Your
                  projects
                </h2>
                {!isSupervisor && (
                  <button
                    onClick={openModal}
                    className="btn-ghost !py-2 text-sm"
                  >
                    <Plus className="h-4 w-4" /> New
                  </button>
                )}
              </div>
              {loading ? (
                <Skeleton />
              ) : (
                <motion.div layout className="grid gap-5 sm:grid-cols-2">
                  {projects.map((p, i) => (
                    <ProjectCard key={p.id} project={p} index={i} />
                  ))}
                  {!isSupervisor && (
                    <motion.button
                      layout
                      onClick={openModal}
                      whileHover={{ y: -5 }}
                      className="group grid min-h-[280px] place-items-center rounded-2xl border-2 border-dashed border-slate-300 bg-white/50 p-6 text-center transition hover:border-brand-400 hover:bg-brand-50/40"
                    >
                      <span>
                        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 transition group-hover:scale-110 group-hover:bg-brand-600 group-hover:text-white">
                          <Plus className="h-7 w-7" />
                        </span>
                        <span className="mt-4 block font-bold text-ink-900">
                          Create new project
                        </span>
                        <span className="mt-1 block text-sm text-ink-500">
                          Free plan: up to 3 projects
                        </span>
                      </span>
                    </motion.button>
                  )}
                </motion.div>
              )}
            </section>

            <aside className="space-y-6">
              {!isSupervisor && (
                <GettingStarted
                  hasProject={projects.some((p) => p.my_role === "leader")}
                  hasTeam={projects.some((p) => p.members_count > 1)}
                />
              )}{" "}
              <UpcomingDeadlines projects={projects} />
              <div className="card flex items-center gap-4 p-5">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-600">
                  <ListChecks className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-ink-900">Your tasks</p>
                  <p className="text-xs text-ink-500">
                    Assigned tasks will show here once the board is live.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Kept outside the space-y container so its margins don't offset these fixed overlays */}
      <CreateProjectModal
        open={modal}
        onClose={closeModal}
        onCreated={onCreated}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed inset-x-4 bottom-6 z-[70] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink-900 px-5 py-4 text-sm text-white shadow-2xl"
            role="status"
          >
            {toast.tone === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-mint-400" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
            )}
            <p className="flex-1">{toast.text}</p>
            <button onClick={() => setToast(null)} aria-label="Dismiss">
              <X className="h-4 w-4 text-ink-300" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
