import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  UserCircle,
  Mail,
  Check,
  X,
  ArrowLeft,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import ThemeToggle from '../components/ThemeToggle'

const ADMIN_EMAIL = 'admin@gmail.com'

export default function AdminProfile() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [displayName, setDisplayName] = useState('Admin')
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = () => {
    setIsEditing(false)
  }

  const handleCancel = () => {
    setDisplayName('Admin')
    setIsEditing(false)
  }

  return (
    <div className="min-h-screen bg-panel text-ink">

      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <ShieldCheck
                size={24}
                className="text-accent"
              />
            </div>

            <div>
              <h1 className="text-2xl font-semibold">
                Admin Profile
              </h1>

              <p className="text-sm text-mute mt-1">
                Manage your administrator profile
              </p>
            </div>
          </div>

          <ThemeToggle />
        </div>
      </div>

      {/* Profile Card */}
      <main className="max-w-5xl mx-auto px-6 pb-12">
        <div className="border border-line/10 rounded-2xl bg-panel overflow-hidden">

          {/* Profile Header */}
          <div className="p-8 border-b border-line/10">
            <div className="flex items-center gap-5">

              {/* Admin Avatar */}
              <div className="w-24 h-24 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                <ShieldCheck
                  size={42}
                  className="text-accent"
                />
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">
                    Admin
                  </h2>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                    <ShieldCheck size={13} />
                    Administrator
                  </span>
                </div>

                <p className="text-sm text-mute mt-2">
                  {ADMIN_EMAIL}
                </p>
              </div>

            </div>
          </div>

          {/* Profile Details */}
          <div className="p-8">

            {/* Display Name */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm text-mute mb-2">
                <UserCircle size={16} />
                Display Name
              </label>

              {isEditing ? (
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-line/20 bg-panel text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              ) : (
                <div className="h-12 px-4 flex items-center rounded-lg border border-line/10 bg-raised">
                  Admin
                </div>
              )}
            </div>

            {/* Email */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm text-mute mb-2">
                <Mail size={16} />
                Email Address
              </label>

              <div className="h-12 px-4 flex items-center rounded-lg border border-line/10 bg-raised text-ink">
                {ADMIN_EMAIL}
              </div>

              <p className="text-xs text-mute mt-2">
                Administrator email is managed separately from user profiles.
              </p>
            </div>

            {/* Administrator Access */}
            <div className="rounded-xl border border-accent/20 bg-accent/5 p-5 mb-8">
              <div className="flex items-start gap-4">

                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <ShieldCheck
                    size={20}
                    className="text-accent"
                  />
                </div>

                <div>
                  <h3 className="font-medium">
                    Administrator Access
                  </h3>

                  <p className="text-sm text-mute mt-1">
                    This account has administrator privileges.
                  </p>
                </div>

              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">

              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-mute hover:text-ink hover:bg-raised transition-colors"
              >
                <ArrowLeft size={16} />
                Back to Admin Dashboard
              </button>

              <div className="flex items-center gap-3">

                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-line/20 text-sm text-mute hover:text-ink hover:bg-raised transition-colors"
                    >
                      <X size={16} />
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleSave}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <Check size={16} />
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Edit Profile
                  </button>
                )}

              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}