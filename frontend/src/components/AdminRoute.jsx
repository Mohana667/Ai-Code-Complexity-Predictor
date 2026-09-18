import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { getAdminOverview } from '../services/api'

export default function AdminRoute({ children }) {
  const { user, loading: authLoading } = useAuth()

  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let active = true

    const verifyAdmin = async () => {
      if (!user) {
        if (active) {
          setIsAdmin(false)
          setChecking(false)
        }
        return
      }

      try {
        await getAdminOverview()

        if (active) {
          setIsAdmin(true)
        }
      } catch (error) {
        if (active) {
          setIsAdmin(false)
        }
      } finally {
        if (active) {
          setChecking(false)
        }
      }
    }

    if (!authLoading) {
      verifyAdmin()
    }

    return () => {
      active = false
    }
  }, [user, authLoading])

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-panel text-ink flex items-center justify-center">
        <p className="text-sm text-mute">
          Verifying admin access...
        </p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}