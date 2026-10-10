import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from './components/layout/PublicLayout'
import AuthLayout from './components/auth/AuthLayout'
import { GuestRoute, ProtectedRoute } from './routes/guards'
import FullPageLoader from './components/ui/FullPageLoader'
import AppLayout from './components/app/AppLayout'
import Home from './pages/Home'

// Auth + app pages are split into their own chunks so the landing page stays fast
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'))
const AcceptInvite = lazy(() => import('./pages/auth/AcceptInvite'))
const Dashboard = lazy(() => import('./pages/app/Dashboard'))
const Projects = lazy(() => import('./pages/app/Projects'))
const ProjectDetail = lazy(() => import('./pages/app/ProjectDetail'))
const MyTasks = lazy(() => import('./pages/app/MyTasks'))
const Reports = lazy(() => import('./pages/app/Reports'))
const Notifications = lazy(() => import('./pages/app/Notifications'))
const Settings = lazy(() => import('./pages/app/Settings'))

export default function App() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
        </Route>

        <Route element={<GuestRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Route>
        </Route>

        {/* Works for guests and logged-in users */}
        <Route element={<AuthLayout />}>
          <Route path="/invite/:token" element={<AcceptInvite />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/app" element={<Dashboard />} />
            <Route path="/app/projects" element={<Projects />} />
            <Route path="/app/projects/:id" element={<ProjectDetail />} />
            <Route path="/app/my-tasks" element={<MyTasks />} />
            <Route path="/app/reports" element={<Reports />} />
            <Route path="/app/reports/:id" element={<Reports />} />
            <Route path="/app/notifications" element={<Notifications />} />
            <Route path="/app/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}