import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import FullPageLoader from '../components/ui/FullPageLoader'

/** Only logged-in users. Remembers where they were going. */
export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}

/** Only guests (login, register...). Logged-in users go to the app. */
export function GuestRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageLoader />
  if (user) return <Navigate to={location.state?.from || '/app'} replace />
  return <Outlet />
}
