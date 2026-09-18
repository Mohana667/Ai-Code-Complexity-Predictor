import { useEffect, useState } from 'react'
import {
  Users,
  BarChart3,
  Activity,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Code2,
} from 'lucide-react'

import {
  getAdminOverview,
  getAdminUsers,
  getAdminAnalyses,
} from '../services/api'

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAdminData = async () => {
    try {
      setLoading(true)
      setError('')

      const [overviewData, usersData, analysesData] =
        await Promise.all([
          getAdminOverview(),
          getAdminUsers(),
          getAdminAnalyses(50),
        ])

      setOverview(overviewData)
      setUsers(Array.isArray(usersData) ? usersData : [])
      setAnalyses(Array.isArray(analysesData) ? analysesData : [])
    } catch (err) {
      console.error('Admin dashboard error:', err)

      if (err?.response?.status === 403) {
        setError('Admin access required')
      } else {
        setError(
          err?.response?.data?.detail ||
          'Unable to load admin dashboard'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-panel text-ink flex items-center justify-center">
        <div className="flex items-center gap-2 text-mute">
          <RefreshCw size={18} className="animate-spin" />
          Loading admin dashboard...
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-panel text-ink">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="border border-line/10 rounded-xl bg-raised p-8 text-center">
            <ShieldCheck
              size={42}
              className="mx-auto mb-4 text-red"
            />

            <h1 className="text-xl font-semibold">
              Access Denied
            </h1>

            <p className="text-mute mt-2">
              {error}
            </p>

            <button
              onClick={loadAdminData}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white hover:opacity-90 transition"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </main>
    )
  }

  const risk = overview?.risk_distribution || {}
  const languages = overview?.language_distribution || {}

  return (
    <main className="min-h-[calc(100vh-64px)] bg-panel text-ink">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <ShieldCheck
                  size={22}
                  className="text-accent"
                />
              </div>

              <div>
                <h1 className="text-2xl font-semibold">
                  Admin Dashboard
                </h1>

                <p className="text-sm text-mute mt-1">
                  Application overview and activity
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={loadAdminData}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-line/10 bg-raised text-sm hover:bg-panel transition"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <StatCard
            icon={<Users size={20} />}
            title="Total Users"
            value={overview?.total_users ?? 0}
          />

          <StatCard
            icon={<BarChart3 size={20} />}
            title="Total Analyses"
            value={overview?.total_analyses ?? 0}
          />

          <StatCard
            icon={<Activity size={20} />}
            title="Active Users (24h)"
            value={overview?.active_users_24h ?? 0}
          />

          <StatCard
            icon={<AlertTriangle size={20} />}
            title="Average Risk"
            value={Number(
              overview?.avg_risk_score ?? 0
            ).toFixed(2)}
          />

        </div>

        {/* Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">

          {/* Risk */}
          <section className="rounded-xl border border-line/10 bg-raised p-6">
            <div className="flex items-center gap-2 mb-5">
              <AlertTriangle
                size={18}
                className="text-accent"
              />

              <h2 className="font-semibold">
                Risk Distribution
              </h2>
            </div>

            <DistributionRow
              label="Low"
              value={risk.low ?? 0}
            />

            <DistributionRow
              label="Moderate"
              value={risk.moderate ?? 0}
            />

            <DistributionRow
              label="High"
              value={risk.high ?? 0}
            />

            <DistributionRow
              label="Critical"
              value={risk.critical ?? 0}
            />
          </section>

          {/* Languages */}
          <section className="rounded-xl border border-line/10 bg-raised p-6">
            <div className="flex items-center gap-2 mb-5">
              <Code2
                size={18}
                className="text-accent"
              />

              <h2 className="font-semibold">
                Language Distribution
              </h2>
            </div>

            <DistributionRow
              label="Python"
              value={languages.python ?? 0}
            />

            <DistributionRow
              label="Java"
              value={languages.java ?? 0}
            />

            <DistributionRow
              label="C"
              value={languages.c ?? 0}
            />

            <DistributionRow
              label="C++"
              value={languages.cpp ?? 0}
            />
          </section>

        </div>

        {/* Users */}
        <section className="mt-6 rounded-xl border border-line/10 bg-raised overflow-hidden">
          <div className="p-6 border-b border-line/10">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-accent" />

              <h2 className="font-semibold">
                Registered Users
              </h2>

              <span className="text-xs text-mute">
                ({users.length})
              </span>
            </div>
          </div>

          {users.length === 0 ? (
            <div className="p-8 text-center text-mute">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line/10 text-mute">
                    <th className="text-left px-6 py-3 font-medium">
                      User
                    </th>

                    <th className="text-left px-6 py-3 font-medium">
                      Role
                    </th>

                    <th className="text-left px-6 py-3 font-medium">
                      Analyses
                    </th>

                    <th className="text-left px-6 py-3 font-medium">
                      Avg Risk
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.uid}
                      className="border-b border-line/10 last:border-0 hover:bg-panel/60"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium">
                          {user.display_name || 'Unnamed User'}
                        </div>

                        <div className="text-xs text-mute mt-1">
                          {user.email}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {user.is_admin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent/10 text-accent text-xs">
                            <ShieldCheck size={13} />
                            Admin
                          </span>
                        ) : (
                          <span className="text-mute">
                            User
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {user.analysis_count ?? 0}
                      </td>

                      <td className="px-6 py-4">
                        {Number(
                          user.avg_risk_score ?? 0
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent analyses */}
        <section className="mt-6 rounded-xl border border-line/10 bg-raised overflow-hidden">
          <div className="p-6 border-b border-line/10">
            <div className="flex items-center gap-2">
              <BarChart3
                size={18}
                className="text-accent"
              />

              <h2 className="font-semibold">
                Recent Analyses
              </h2>
            </div>
          </div>

          {analyses.length === 0 ? (
            <div className="p-8 text-center text-mute">
              No analyses found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line/10 text-mute">
                    <th className="text-left px-6 py-3 font-medium">
                      File
                    </th>

                    <th className="text-left px-6 py-3 font-medium">
                      Language
                    </th>

                    <th className="text-left px-6 py-3 font-medium">
                      Time Complexity
                    </th>

                    <th className="text-left px-6 py-3 font-medium">
                      Risk
                    </th>

                    <th className="text-left px-6 py-3 font-medium">
                      AI
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {analyses.slice(0, 20).map((analysis) => {
                    const estimate = analysis.estimate || {}

                    return (
                      <tr
                        key={analysis.id}
                        className="border-b border-line/10 last:border-0 hover:bg-panel/60"
                      >
                        <td className="px-6 py-4 font-mono text-xs">
                          {analysis.filename || 'Untitled'}
                        </td>

                        <td className="px-6 py-4 capitalize">
                          {analysis.language || '-'}
                        </td>

                        <td className="px-6 py-4 font-mono">
                          {estimate.time_complexity || '-'}
                        </td>

                        <td className="px-6 py-4 capitalize">
                          {estimate.risk_level || '-'}
                        </td>

                        <td className="px-6 py-4">
                          {analysis.ai_enhanced ? (
                            <span className="text-accent text-xs font-medium">
                              Enabled
                            </span>
                          ) : (
                            <span className="text-mute text-xs">
                              Static
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </main>
  )
}

function StatCard({ icon, title, value }) {
  return (
    <div className="rounded-xl border border-line/10 bg-raised p-5">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
          {icon}
        </div>
      </div>

      <p className="text-sm text-mute mt-4">
        {title}
      </p>

      <p className="text-2xl font-semibold mt-1">
        {value}
      </p>
    </div>
  )
}

function DistributionRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-line/10 last:border-0">
      <span className="text-sm text-mute">
        {label}
      </span>

      <span className="font-semibold">
        {value}
      </span>
    </div>
  )
}