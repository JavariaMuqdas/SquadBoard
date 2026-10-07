import axios from 'axios'

/**
 * Axios instance for the Laravel API (Sanctum SPA cookie auth).
 * - withCredentials: send the session cookie
 * - withXSRFToken: send the XSRF-TOKEN cookie back as the X-XSRF-TOKEN header
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
})

/** Must be called before any POST from a fresh page (login, register...). */
export const csrf = () => api.get('/sanctum/csrf-cookie')

/** Turns a Laravel error into { message, fields: { email: '...', ... }, reason } */
export function parseError(err) {
  const data = err?.response?.data
  if (!err?.response) return { message: 'Can’t reach the server. Check your connection and try again.', fields: {} }
  const fields = {}
  if (data?.errors) for (const [k, v] of Object.entries(data.errors)) fields[k] = Array.isArray(v) ? v[0] : v
  if (err.response.status === 419) return { message: 'Your session expired. Please try again.', fields }
  if (err.response.status === 429) return { message: 'Too many attempts. Please wait a minute and try again.', fields }
  return { message: data?.message || 'Something went wrong. Please try again.', fields, reason: data?.reason }
}

export const googleUrl = ({ role, invite } = {}) => {
  const q = new URLSearchParams()
  if (role) q.set('role', role)
  if (invite) q.set('invite', invite)
  return `${import.meta.env.VITE_API_URL || ''}/oauth/google/redirect?${q}`
}

export default api
