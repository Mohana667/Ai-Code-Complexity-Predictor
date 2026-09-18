import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LogOut,
  ShieldCheck,
  UserCircle,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'

export default function AdminNavbar() {
  const { logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <header className="border-b border-line/10 bg-panel">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Left */}
        <div className="flex items-center gap-8">

          <Link
            to="/admin"
            className="flex items-center gap-2 font-semibold text-ink"
          >
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <ShieldCheck
                size={18}
                className="text-accent"
              />
            </div>

            <span>
              complexity<span className="text-accent">()</span>
            </span>

            <span className="text-sm text-mute font-normal">
              Admin
            </span>
          </Link>

          {/* Admin navigation */}
          <nav className="flex items-center gap-1">

            <Link
              to="/admin"
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                pathname === '/admin'
                  ? 'bg-raised text-ink'
                  : 'text-mute hover:text-ink'
              }`}
            >
              Overview
            </Link>

            <Link
              to="/admin/profile"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                pathname === '/admin/profile'
                  ? 'bg-raised text-ink'
                  : 'text-mute hover:text-ink'
              }`}
            >
              <UserCircle size={15} />
              Profile
            </Link>

          </nav>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">

          <ThemeToggle />

          {/* Always Admin */}
          <span className="text-sm text-mute mx-2">
            Admin
          </span>

          <button
            onClick={logout}
            className="p-2 text-mute hover:text-ink transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>

        </div>

      </div>
    </header>
  )
}