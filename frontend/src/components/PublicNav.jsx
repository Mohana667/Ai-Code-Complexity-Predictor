import { Link } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

export default function PublicNav({ variant = 'landing' }) {
  return (
    <header className="border-b border-line/10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-mono text-ink font-semibold tracking-tight">
          complexity<span className="text-accent">()</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {variant !== 'login' && (
            <Link
              to="/login"
              className="px-4 py-2 text-sm text-mute hover:text-ink transition-colors"
            >
              Sign in
            </Link>
          )}
          {variant !== 'register' && (
            <Link
              to="/register"
              className="px-4 py-2 text-sm bg-accent text-graphite font-medium rounded-md hover:opacity-90 transition-opacity"
            >
              Get started
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
