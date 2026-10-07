import { useEffect, useState } from 'react'
import api, { parseError } from '../lib/api'

/** Loads the public invite preview for a token (or does nothing if no token). */
export default function useInvite(token) {
  const [state, setState] = useState({ invite: null, loading: !!token, error: null })

  useEffect(() => {
    if (!token) return
    let alive = true
    api.get(`/api/invitations/${token}`)
      .then(({ data }) => alive && setState({ invite: data, loading: false, error: null }))
      .catch((e) => alive && setState({ invite: null, loading: false, error: parseError(e) }))
    return () => { alive = false }
  }, [token])

  return state
}
