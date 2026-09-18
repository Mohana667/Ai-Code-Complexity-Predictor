import { Link, useLocation } from 'react-router-dom'
import { Bell, LogOut } from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'

const LINKS = [
  { to: '/analyze', label: 'Analyze' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/history', label: 'History' },
]

export default function Navbar({
  notificationCount = 0,
  onBellClick,
}) {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()

  const displayName =
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'User'

  return (
    <header className="border-b border-line/10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo + User Navigation */}
        <div className="flex items-center gap-8">
          <Link
            to="/analyze"
            className="font-mono text-ink font-semibold tracking-tight"
          >
            complexity<span className="text-accent">()</span>
          </Link>

          <nav className="flex items-center gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  pathname === link.to
                    ? 'bg-raised text-ink'
                    : 'text-mute hover:text-ink'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <button
            type="button"
            onClick={onBellClick}
            className="relative p-2 rounded-md text-mute hover:text-ink hover:bg-raised transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />

            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-accent text-white text-[10px] flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          <span className="text-sm text-mute mx-2 max-w-32 truncate">
            {displayName}
          </span>

          <button
            type="button"
            onClick={logout}
            className="p-2 rounded-md text-mute hover:text-ink hover:bg-raised transition-colors"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>

      </div>
    </header>
  )
}