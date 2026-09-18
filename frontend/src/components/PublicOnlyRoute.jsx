import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-mute text-sm">Loading…</div>
  if (user) return <Navigate to="/dashboard" replace />
  return children
}
