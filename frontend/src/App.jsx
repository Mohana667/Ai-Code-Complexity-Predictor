import { useEffect, useState } from 'react'
import {
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import { AuthProvider, useAuth } from './context/AuthContext'

import ProtectedRoute from './components/ProtectedRoute'
import PublicOnlyRoute from './components/PublicOnlyRoute'

import Navbar from './components/Navbar'
import NotificationPanel from './components/NotificationPanel'
import ThemeToggle from './components/ThemeToggle'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import TwoFactorVerify from './pages/TwoFactorVerify'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'

import Analyze from './pages/Analyze'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import AdminDashboard from './pages/AdminDashboard'
import AdminRoute from './components/AdminRoute'
import AdminNavbar from './components/AdminNavbar'
import AdminProfile from './pages/AdminProfile'

import { connectRealtime } from './services/notifications'


// =========================================================
// AUTHENTICATED APP SHELL
// =========================================================
function AdminShell({ children }) {
  return (
    <div className="min-h-screen bg-panel text-ink">
      <AdminNavbar />

      <main>
        {children}
      </main>
    </div>
  )
}

function Shell({ children }) {
  const { user } = useAuth()

  const [notifications, setNotifications] = useState([])
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    if (!user) {
      return
    }

    const disconnect = connectRealtime(
      user.uid,
      (payload) => {
        setNotifications((prev) => [
          payload,
          ...prev,
        ].slice(0, 20))
      }
    )

    return disconnect
  }, [user])

  return (
    <div className="min-h-screen bg-panel text-ink">

      {/* APPLICATION NAVBAR */}

      <Navbar
        notificationCount={notifications.length}
        onBellClick={() =>
          setPanelOpen((value) => !value)
        }
      />


      {/* NOTIFICATION PANEL */}

      <NotificationPanel
        notifications={notifications}
        open={panelOpen}
        onClose={() =>
          setPanelOpen(false)
        }
      />


      {/* PAGE CONTENT */}

      <main>
        {children}
      </main>

    </div>
  )
}


// =========================================================
// PUBLIC THEME TOGGLE
// =========================================================

function PublicThemeToggle() {
  return (
    <div className="fixed top-4 right-4 z-[100]">

      <div className="rounded-lg border border-line/10 bg-panel/90 backdrop-blur-xl shadow-sm">

        <ThemeToggle />

      </div>

    </div>
  )
}


// =========================================================
// PUBLIC PAGE WRAPPER
// =========================================================

function PublicPage({ children }) {
  return (
    <div className="relative min-h-screen bg-panel text-ink">

      <PublicThemeToggle />

      {children}

    </div>
  )
}


// =========================================================
// ROUTES
// =========================================================

function AppRoutes() {
  return (
    <Routes>

      {/* =====================================================
          LANDING
      ===================================================== */}

      <Route
        path="/"
        element={
          <PublicOnlyRoute>
            <Landing />
          </PublicOnlyRoute>
        }
      />


      {/* =====================================================
          LOGIN
      ===================================================== */}

      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <PublicPage>
              <Login />
            </PublicPage>
          </PublicOnlyRoute>
        }
      />


      {/* =====================================================
          REGISTER
      ===================================================== */}

      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <PublicPage>
              <Register />
            </PublicPage>
          </PublicOnlyRoute>
        }
      />


      {/* =====================================================
          FORGOT PASSWORD
      ===================================================== */}

      <Route
        path="/forgot-password"
        element={
          <PublicOnlyRoute>
            <PublicPage>
              <ForgotPassword />
            </PublicPage>
          </PublicOnlyRoute>
        }
      />


      {/* =====================================================
          TWO FACTOR
      ===================================================== */}

      <Route
        path="/verify-2fa"
        element={
          <PublicPage>
            <TwoFactorVerify />
          </PublicPage>
        }
      />


      {/* =====================================================
          TERMS
      ===================================================== */}

      <Route
        path="/terms"
        element={
          <PublicPage>
            <Terms />
          </PublicPage>
        }
      />


      {/* =====================================================
          PRIVACY
      ===================================================== */}

      <Route
        path="/privacy"
        element={
          <PublicPage>
            <Privacy />
          </PublicPage>
        }
      />


      {/* =====================================================
          ANALYZE
      ===================================================== */}

      <Route
        path="/analyze"
        element={
          <ProtectedRoute>
            <Shell>
              <Analyze />
            </Shell>
          </ProtectedRoute>
        }
      />


      {/* =====================================================
          DASHBOARD
      ===================================================== */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Shell>
              <Dashboard />
            </Shell>
          </ProtectedRoute>
        }
      />


      {/* =====================================================
          HISTORY
      ===================================================== */}

      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <Shell>
              <History />
            </Shell>
          </ProtectedRoute>
        }
      />

      <Route
      path="/admin"
      element={
      <AdminRoute>
        <AdminShell>
          <AdminDashboard />
          </AdminShell>
        </AdminRoute>
      }
      />
      <Route
      path="/admin/profile"
      element={
      <AdminRoute>
        <AdminShell>
          <AdminProfile />
          </AdminShell>
          </AdminRoute>
        }
        />


      {/* =====================================================
          UNKNOWN ROUTE
      ===================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>
  )
}


// =========================================================
// ROOT APP
// =========================================================

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}