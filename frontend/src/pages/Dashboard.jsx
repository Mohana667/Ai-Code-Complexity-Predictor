import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts'

import {
  Activity,
  TrendingUp,
  Layers,
  Gauge,
  Settings,
  Camera,
  Award,
  Zap,
  History as HistoryIcon,
  Save,
  X,
  Upload,
  UserRound,
} from 'lucide-react'

import { getDashboardStats } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { StaggerGroup, StaggerItem } from '../components/Stagger'

const RISK_VAR = {
  low: 'rgb(var(--c-mint))',
  moderate: 'rgb(var(--c-amber))',
  high: 'rgb(var(--c-red))',
  critical: 'rgb(var(--c-red))',
}

const RISK_TEXT = {
  low: 'text-mint',
  moderate: 'text-amber',
  high: 'text-red',
  critical: 'text-red',
}

function formatLanguage(language) {
  if (!language) return 'Unknown'

  const value = String(language).toLowerCase()

  if (value === 'python') return 'Python'
  if (value === 'java') return 'Java'
  if (value === 'c') return 'C'
  if (value === 'cpp') return 'C++'

  return language
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  return (
    <div className="relative min-w-[130px] rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#171b23] px-3.5 py-3 shadow-xl shadow-black/10 dark:shadow-black/30">

      <div className="absolute left-1/2 -bottom-1.5 w-3 h-3 -translate-x-1/2 rotate-45 border-r border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#171b23]" />

      {label && (
        <p className="relative z-10 text-xs font-semibold text-gray-800 dark:text-white mb-1.5 capitalize">
          {formatLanguage(label)}
        </p>
      )}

      {payload.map((item, index) => (
        <div
          key={`${item.name}-${index}`}
          className="relative z-10 flex items-center justify-between gap-4"
        >
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {item.name}
          </span>

          <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">
            {item.value}
          </span>
        </div>
      ))}

    </div>
  )
}

export default function Dashboard() {

  const {
    user,
    updateProfile,
    uploadProfilePhoto,
  } = useAuth()

  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  const [showProfileEdit, setShowProfileEdit] = useState(false)

  const [activeTab, setActiveTab] = useState('overview')

  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    photoURL: user?.photoUrl || user?.photoURL || '',
    email: user?.email || '',
  })

  const [savingProfile, setSavingProfile] = useState(false)

  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [profileMessage, setProfileMessage] = useState('')

  const [profileError, setProfileError] = useState('')

  const fileInputRef = useRef(null)

  useEffect(() => {

    getDashboardStats()
      .then(setStats)
      .catch(() =>
        setError('Could not load stats')
      )

  }, [])

  useEffect(() => {

    setProfileData({
      displayName:
        user?.displayName || '',
      photoURL:
        user?.photoUrl ||
        user?.photoURL ||
        '',
      email:
        user?.email || '',
    })

  }, [
    user?.displayName,
    user?.photoUrl,
    user?.photoURL,
    user?.email,
  ])

  const openPhotoPicker = () => {

    if (!showProfileEdit) {
      return
    }

    fileInputRef.current?.click()

  }

  const handlePhotoChange = async (event) => {

    const file =
      event.target.files?.[0]

    if (!file) {
      return
    }


    if (!file.type.startsWith('image/')) {

      setProfileError(
        'Please select a valid image file.'
      )

      event.target.value = ''

      return
    }


    if (file.size > 5 * 1024 * 1024) {

      setProfileError(
        'Please select an image smaller than 5 MB.'
      )

      event.target.value = ''

      return
    }

    setUploadingPhoto(true)
    setProfileError('')
    setProfileMessage('')

    try {

      const updatedUser =
        await uploadProfilePhoto(file)


      setProfileData((prev) => ({
        ...prev,

        photoURL:
          updatedUser?.photoUrl ||
          updatedUser?.photoURL ||
          '',
      }))


      setProfileMessage(
        'Profile photo updated.'
      )

    } catch (err) {

      setProfileError(
        err?.message ||
        'Could not upload profile photo.'
      )

    } finally {

      setUploadingPhoto(false)

      event.target.value = ''

    }

  }

  const handleOpenEdit = () => {

    setProfileError('')
    setProfileMessage('')

    setShowProfileEdit(
      (value) => !value
    )

  }

  const handleCancelEdit = () => {

    setProfileData({
      displayName:
        user?.displayName || '',

      photoURL:
        user?.photoUrl ||
        user?.photoURL ||
        '',

      email:
        user?.email || '',
    })

    setProfileError('')
    setProfileMessage('')

    setShowProfileEdit(false)

  }

  const handleSaveProfile = async () => {

    const name =
      profileData.displayName.trim()


    if (!name) {

      setProfileError(
        'Display Name cannot be empty.'
      )

      return
    }


    if (name.length > 100) {

      setProfileError(
        'Display Name must be 100 characters or less.'
      )

      return
    }


    setSavingProfile(true)

    setProfileError('')
    setProfileMessage('')


    try {

      const updatedUser =
        await updateProfile({
          displayName: name,
        })


      setProfileData((prev) => ({
        ...prev,

        displayName:
          updatedUser?.displayName ||
          name,

        photoURL:
          updatedUser?.photoUrl ||
          updatedUser?.photoURL ||
          prev.photoURL,
      }))


      setProfileMessage(
        'Profile updated successfully.'
      )

      setTimeout(() => {

        setShowProfileEdit(false)

        setProfileMessage('')

      }, 600)

    } catch (err) {

      setProfileError(
        err?.message ||
        'Could not save profile changes.'
      )

    } finally {

      setSavingProfile(false)

    }

  }

  if (error) {

    return (
      <div className="min-h-screen bg-panel text-ink">

        <div className="max-w-6xl mx-auto px-6 py-10">

          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 inline-flex">

            <span className="text-red-500 text-sm">
              {error}
            </span>

          </div>

        </div>

      </div>
    )
  }

  if (!stats) {

    return (
      <div className="min-h-screen bg-panel text-ink">

        <div className="max-w-6xl mx-auto px-6 py-10">

          <div className="flex items-center gap-3 text-mute text-sm">

            <div className="w-4 h-4 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />

            Loading dashboard...

          </div>

        </div>

      </div>
    )
  }

  const riskData =
    Object.entries(
      stats.risk_distribution || {}
    )
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
      }))


  const langData =
    Object.entries(
      stats.language_distribution || {}
    )
      .map(([name, count]) => ({
        name,
        count,
      }))


  const topLanguage =
    langData
      .slice()
      .sort(
        (a, b) => b.count - a.count
      )[0]


  const highRiskCount =
    (stats.risk_distribution?.high || 0) +
    (stats.risk_distribution?.critical || 0)


  return (

    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-panel text-ink transition-colors duration-300"
    >

      <div className="max-w-7xl mx-auto px-5 md:px-6 py-7 md:py-8">

        <div className="mb-7">
          <h1 className="text-2xl md:text-3xl font-bold text-ink">Dashboard</h1>
          <p className="text-sm text-mute mt-1">
            Welcome back, {profileData.displayName || 'Developer'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">

          <motion.aside
            initial={{
              opacity: 0,
              x: -40,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.5,
            }}
            className="lg:col-span-1"
          >

            <div className="bg-raised/70 backdrop-blur border border-line/10 rounded-2xl p-5 sticky top-24 shadow-sm dark:shadow-none">


              {/* PROFILE HEADER */}

              <div className="text-center">


                {/* HIDDEN INPUT */}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />


                {/* PHOTO */}

                <motion.button
                  type="button"
                  onClick={openPhotoPicker}
                  disabled={
                    !showProfileEdit ||
                    uploadingPhoto
                  }
                  whileHover={{
                    scale:
                      showProfileEdit
                        ? 1.04
                        : 1,
                  }}
                  whileTap={{
                    scale:
                      showProfileEdit
                        ? 0.97
                        : 1,
                  }}
                  className={`
                    relative inline-block mb-4 rounded-full
                    focus:outline-none
                    ${
                      showProfileEdit
                        ? 'cursor-pointer'
                        : 'cursor-default'
                    }
                  `}
                >

                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-white text-3xl font-bold overflow-hidden border-2 border-accent/30 shadow-lg shadow-accent/10">

                    {profileData.photoURL ? (

                      <img
                        src={
                          profileData.photoURL
                        }
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />

                    ) : (

                      (
                        profileData.displayName ||
                        'U'
                      )[0].toUpperCase()

                    )}

                  </div>


                  {/* PHOTO OVERLAY */}

                  {showProfileEdit && (

                    <div className="absolute inset-0 rounded-full bg-black/45 flex items-center justify-center">

                      <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">

                        {uploadingPhoto ? (

                          <span className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />

                        ) : (

                          <Camera
                            size={19}
                            className="text-white"
                          />

                        )}

                      </div>

                    </div>

                  )}

                </motion.button>


                <h3 className="text-xl font-bold text-ink">

                  {profileData.displayName ||
                    'User'}

                </h3>


                <p className="text-sm text-mute mt-1 break-all">
                  {profileData.email}
                </p>


                {/* PROFILE STATS */}

                <div className="mt-6 grid grid-cols-2 gap-3">

                  <div className="bg-accent/10 border border-accent/10 rounded-xl p-3">

                    <p className="text-2xl font-bold text-accent">
                      {stats.total_analyses}
                    </p>

                    <p className="text-xs text-mute mt-0.5">
                      Analyses
                    </p>

                  </div>


                  <div className="bg-blue-500/10 border border-blue-500/10 rounded-xl p-3">

                    <p className="text-2xl font-bold text-blue-500">
                      {stats.avg_risk_score.toFixed(
                        0
                      )}
                    </p>

                    <p className="text-xs text-mute mt-0.5">
                      Avg Risk
                    </p>

                  </div>

                </div>

              </div>

              <motion.button
                onClick={
                  handleOpenEdit
                }
                whileHover={{
                  y: -1,
                }}
                whileTap={{
                  scale: 0.98,
                }}
                className="w-full mt-5 bg-accent hover:bg-accent/90 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
              >

                <Settings size={16} />

                {showProfileEdit
                  ? 'Close Profile'
                  : 'Edit Profile'}

              </motion.button>

              <AnimatePresence>

                {showProfileEdit && (

                  <motion.div
                    initial={{
                      opacity: 0,
                      height: 0,
                    }}
                    animate={{
                      opacity: 1,
                      height: 'auto',
                    }}
                    exit={{
                      opacity: 0,
                      height: 0,
                    }}
                    className="overflow-hidden"
                  >

                    <div className="space-y-4 pt-5 mt-4 border-t border-line/10">


                      {/* PHOTO HELP */}

                      <div className="rounded-xl bg-accent/5 border border-accent/10 p-3">

                        <div className="flex items-start gap-2.5">

                          <Upload
                            size={16}
                            className="text-accent mt-0.5 flex-shrink-0"
                          />

                          <p className="text-xs text-mute leading-5">
                            Click your profile photo
                            to choose a new image
                            from your computer.
                          </p>

                        </div>

                      </div>


                      {/* DISPLAY NAME */}

                      <div>

                        <label className="text-xs font-medium text-mute">
                          Display Name
                        </label>

                        <div className="relative mt-1.5">

                          <UserRound
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-mute"
                          />

                          <input
                            type="text"
                            value={
                              profileData.displayName
                            }
                            onChange={(e) =>
                              setProfileData(
                                (prev) => ({
                                  ...prev,
                                  displayName:
                                    e.target.value,
                                })
                              )
                            }
                            maxLength={100}
                            className="w-full bg-panel border border-line/15 rounded-lg pl-9 pr-3 py-2.5 text-ink placeholder:text-mute/60 text-sm focus:outline-none focus:border-accent/50 transition-all"
                            placeholder="Enter your name"
                          />

                        </div>

                      </div>


                      {/* EMAIL */}

                      <div>

                        <label className="text-xs font-medium text-mute">
                          Email
                        </label>

                        <input
                          type="text"
                          value={
                            profileData.email
                          }
                          readOnly
                          className="w-full bg-panel/60 border border-line/10 rounded-lg px-3 py-2.5 text-mute text-sm mt-1.5 cursor-not-allowed"
                        />

                      </div>


                      {/* ERROR */}

                      <AnimatePresence>

                        {profileError && (

                          <motion.div
                            initial={{
                              opacity: 0,
                              y: -5,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            exit={{
                              opacity: 0,
                              y: -5,
                            }}
                            className="rounded-lg bg-red-500/10 border border-red-500/15 px-3 py-2.5"
                          >

                            <p className="text-xs text-red-500">
                              {profileError}
                            </p>

                          </motion.div>

                        )}

                      </AnimatePresence>


                      {/* SUCCESS */}

                      <AnimatePresence>

                        {profileMessage && (

                          <motion.div
                            initial={{
                              opacity: 0,
                              y: -5,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            exit={{
                              opacity: 0,
                              y: -5,
                            }}
                            className="rounded-lg bg-green-500/10 border border-green-500/15 px-3 py-2.5"
                          >

                            <p className="text-xs text-green-600 dark:text-green-400">
                              {profileMessage}
                            </p>

                          </motion.div>

                        )}

                      </AnimatePresence>


                      {/* BUTTONS */}

                      <div className="grid grid-cols-2 gap-2">

                        <motion.button
                          onClick={
                            handleSaveProfile
                          }
                          disabled={
                            savingProfile ||
                            uploadingPhoto
                          }
                          whileHover={{
                            y: -1,
                          }}
                          whileTap={{
                            scale: 0.98,
                          }}
                          className="py-2.5 rounded-lg bg-accent hover:bg-accent/90 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                        >

                          {savingProfile ? (

                            <>
                              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />

                              Saving...
                            </>

                          ) : (

                            <>
                              <Save size={15} />

                              Save
                            </>

                          )}

                        </motion.button>


                        <button
                          onClick={
                            handleCancelEdit
                          }
                          disabled={
                            savingProfile ||
                            uploadingPhoto
                          }
                          className="py-2.5 rounded-lg bg-panel border border-line/15 text-mute hover:text-ink hover:border-line/30 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                        >

                          <X size={15} />

                          Cancel

                        </button>

                      </div>

                    </div>

                  </motion.div>

                )}

              </AnimatePresence>

              <div className="pt-5 mt-5 border-t border-line/10">

                <p className="text-xs text-mute uppercase font-semibold mb-3 tracking-wide">
                  Achievements
                </p>


                <div className="space-y-2">

                  {stats.total_analyses >= 10 ? (

                    <motion.div
                      whileHover={{
                        x: 4,
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-panel transition-colors"
                    >

                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">

                        <Award
                          size={16}
                          className="text-amber-500"
                        />

                      </div>

                      <div>

                        <p className="text-sm text-ink">
                          Quick Analyzer
                        </p>

                        <p className="text-xs text-mute">
                          10+ analyses
                        </p>

                      </div>

                    </motion.div>

                  ) : (

                    <p className="text-xs text-mute px-2 leading-5">
                      {10 -
                        stats.total_analyses}{' '}
                      more{' '}
                      {stats.total_analyses === 9
                        ? 'analysis'
                        : 'analyses'}{' '}
                      to unlock Quick Analyzer
                    </p>

                  )}

                </div>

              </div>

            </div>

          </motion.aside>

          <motion.main
            initial={{
              opacity: 0,
              y: 40,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.6,
              delay: 0.1,
            }}
            className="lg:col-span-3 min-w-0"
          >

            <div className="flex gap-5 mb-7 border-b border-line/10">

              {[
                'Overview',
                'Analysis',
                'Settings',
              ].map((tab) => (

                <motion.button
                  key={tab}
                  onClick={() =>
                    setActiveTab(
                      tab.toLowerCase()
                    )
                  }
                  className={`
                    pb-3
                    text-sm
                    font-medium
                    transition-colors
                    relative
                    ${
                      activeTab ===
                      tab.toLowerCase()
                        ? 'text-accent'
                        : 'text-mute hover:text-ink'
                    }
                  `}
                >

                  {tab}

                  {activeTab ===
                    tab.toLowerCase() && (

                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t"
                    />

                  )}

                </motion.button>

              ))}

            </div>

            {activeTab === 'overview' && (

              <motion.div
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                transition={{
                  duration: 0.5,
                }}
                className="space-y-6"
              >


                {/* STAT CARDS */}

                <StaggerGroup
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
                  stagger={0.06}
                >

                  <StaggerItem>

                    <StatCard
                      icon={Activity}
                      label="Total analyses"
                      value={
                        stats.total_analyses
                      }
                    />

                  </StaggerItem>


                  <StaggerItem>

                    <StatCard
                      icon={Gauge}
                      label="Avg risk score"
                      value={stats.avg_risk_score.toFixed(
                        1
                      )}
                    />

                  </StaggerItem>


                  <StaggerItem>

                    <StatCard
                      icon={Layers}
                      label="Top language"
                      value={
                        topLanguage
                          ? formatLanguage(
                              topLanguage.name
                            )
                          : '—'
                      }
                      mono={false}
                    />

                  </StaggerItem>


                  <StaggerItem>

                    <StatCard
                      icon={TrendingUp}
                      label="High / critical"
                      value={highRiskCount}
                      accent={
                        highRiskCount > 0
                      }
                    />

                  </StaggerItem>

                </StaggerGroup>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">


                  {/* RISK */}

                  <motion.div
                    whileHover={{
                      y: -3,
                    }}
                    className="bg-raised/70 backdrop-blur border border-line/10 rounded-2xl p-5 md:p-6 shadow-sm dark:shadow-none"
                  >

                    <div className="flex items-center justify-between mb-2">

                      <div>

                        <p className="text-sm font-semibold text-ink">
                          Risk Distribution
                        </p>

                        <p className="text-xs text-mute mt-1">
                          Breakdown of your analysis risk levels
                        </p>

                      </div>

                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">

                        <Activity
                          size={15}
                          className="text-accent"
                        />

                      </div>

                    </div>


                    {riskData.length === 0 ? (

                      <div className="h-56 flex items-center justify-center">

                        <p className="text-mute text-sm">
                          No data yet
                        </p>

                      </div>

                    ) : (

                      <ResponsiveContainer
                        width="100%"
                        height={240}
                      >

                        <PieChart>

                          <Pie
                            data={riskData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={58}
                            outerRadius={86}
                            paddingAngle={3}
                            stroke="rgb(var(--c-panel))"
                            strokeWidth={2}
                          >

                            {riskData.map(
                              (entry) => (

                                <Cell
                                  key={
                                    entry.name
                                  }
                                  fill={
                                    RISK_VAR[
                                      entry.name
                                    ] ||
                                    'rgb(var(--c-mute))'
                                  }
                                />

                              )
                            )}

                          </Pie>

                          <Tooltip
                            content={
                              <ChartTooltip />
                            }
                            cursor={false}
                          />

                        </PieChart>

                      </ResponsiveContainer>

                    )}


                    {riskData.length > 0 && (

                      <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-1">

                        {riskData.map(
                          (item) => (

                            <span
                              key={
                                item.name
                              }
                              className="flex items-center gap-2 text-xs text-mute"
                            >

                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{
                                  background:
                                    RISK_VAR[
                                      item.name
                                    ],
                                }}
                              />

                              <span className="capitalize">
                                {item.name}
                              </span>

                              <span className="text-ink font-medium">
                                ({item.value})
                              </span>

                            </span>

                          )
                        )}

                      </div>

                    )}

                  </motion.div>


                  {/* LANGUAGE */}

                  <motion.div
                    whileHover={{
                      y: -3,
                    }}
                    className="bg-raised/70 backdrop-blur border border-line/10 rounded-2xl p-5 md:p-6 shadow-sm dark:shadow-none"
                  >

                    <div className="flex items-center justify-between mb-2">

                      <div>

                        <p className="text-sm font-semibold text-ink">
                          By Language
                        </p>

                        <p className="text-xs text-mute mt-1">
                          Number of analyses per language
                        </p>

                      </div>

                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">

                        <Layers
                          size={15}
                          className="text-blue-500"
                        />

                      </div>

                    </div>


                    {langData.length === 0 ? (

                      <div className="h-56 flex items-center justify-center">

                        <p className="text-mute text-sm">
                          No data yet
                        </p>

                      </div>

                    ) : (

                      <ResponsiveContainer
                        width="100%"
                        height={240}
                      >

                        <BarChart
                          data={langData}
                          margin={{
                            top: 10,
                            right: 8,
                            left: -10,
                            bottom: 0,
                          }}
                        >

                          <XAxis
                            dataKey="name"
                            stroke="rgb(var(--c-mute))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={{
                              stroke:
                                'rgb(var(--c-line) / 0.15)',
                            }}
                            tickFormatter={
                              formatLanguage
                            }
                          />

                          <YAxis
                            stroke="rgb(var(--c-mute))"
                            fontSize={12}
                            allowDecimals={false}
                            tickLine={false}
                            axisLine={false}
                          />

                          <Tooltip
                            content={
                              <ChartTooltip />
                            }
                            cursor={{
                              fill:
                                'rgb(var(--c-accent) / 0.06)',
                            }}
                          />

                          <Bar
                            dataKey="count"
                            name="Analyses"
                            fill="rgb(var(--c-accent))"
                            radius={[
                              7,
                              7,
                              0,
                              0,
                            ]}
                            maxBarSize={54}
                          />

                        </BarChart>

                      </ResponsiveContainer>

                    )}

                  </motion.div>

                </div>

                <motion.div
                  whileHover={{
                    y: -2,
                  }}
                  className="bg-raised/70 backdrop-blur border border-line/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-none"
                >

                  <div className="px-5 md:px-6 py-4 border-b border-line/10 flex items-center justify-between">

                    <div>

                      <p className="text-sm font-semibold text-ink">
                        Recent Activity
                      </p>

                      <p className="text-xs text-mute mt-1">
                        Your latest code complexity analyses
                      </p>

                    </div>

                    <HistoryIcon
                      size={17}
                      className="text-mute"
                    />

                  </div>


                  {(!stats.recent_analyses ||
                    stats.recent_analyses.length === 0) ? (

                    <div className="py-14 text-center">

                      <div className="w-10 h-10 rounded-xl bg-accent/10 mx-auto flex items-center justify-center mb-3">

                        <Activity
                          size={18}
                          className="text-accent"
                        />

                      </div>

                      <p className="text-mute text-sm">
                        No analyses yet
                      </p>

                      <Link
                        to="/analyze"
                        className="inline-block mt-3 text-sm text-accent hover:underline"
                      >
                        Analyze your first code
                      </Link>

                    </div>

                  ) : (

                    <div className="divide-y divide-line/10">

                      {stats.recent_analyses
                        .slice(0, 5)
                        .map(
                          (
                            item,
                            index
                          ) => (

                            <motion.div
                              key={
                                item.id ||
                                item.created_at ||
                                index
                              }
                              initial={{
                                opacity: 0,
                                x: -20,
                              }}
                              animate={{
                                opacity: 1,
                                x: 0,
                              }}
                              transition={{
                                delay:
                                  index *
                                  0.05,
                              }}
                              whileHover={{
                                x: 4,
                              }}
                              className="px-5 md:px-6 py-4 flex items-center justify-between gap-4 hover:bg-panel/70 transition-colors"
                            >

                              <div className="min-w-0">

                                <p className="text-sm font-medium text-ink truncate">

                                  {item.filename ||
                                    `${formatLanguage(
                                      item.language
                                    )} snippet`}

                                </p>

                                <p className="text-xs text-mute mt-1">
                                  {new Date(
                                    item.created_at
                                  ).toLocaleString()}
                                </p>

                              </div>


                              <div className="text-right flex-shrink-0">

                                <p className="font-mono text-sm text-accent">
                                  {
                                    item
                                      .estimate
                                      .time_complexity
                                  }
                                </p>

                                <p
                                  className={`text-xs mt-0.5 capitalize ${
                                    RISK_TEXT[
                                      item
                                        .estimate
                                        .risk_level
                                    ] ||
                                    'text-mute'
                                  }`}
                                >

                                  {
                                    item
                                      .estimate
                                      .risk_level
                                  }

                                </p>

                              </div>

                            </motion.div>

                          )
                        )}

                    </div>

                  )}

                </motion.div>

              </motion.div>

            )}

            {activeTab === 'analysis' && (

              <motion.div
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="rounded-2xl bg-raised/70 border border-line/10 p-8 text-center shadow-sm dark:shadow-none"
              >

                <div className="w-12 h-12 rounded-xl bg-accent/10 mx-auto flex items-center justify-center mb-4">

                  <Zap
                    size={21}
                    className="text-accent"
                  />

                </div>

                <h3 className="text-lg font-semibold text-ink">
                  Ready to analyze?
                </h3>

                <p className="text-sm text-mute mt-2 max-w-md mx-auto leading-6">
                  Go to the Analyze page to submit source
                  code and get time complexity, space
                  complexity, risk analysis, and AI insights.
                </p>

                <Link
                  to="/analyze"
                  className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-semibold transition-all"
                >

                  <Zap size={16} />

                  Analyze Code

                </Link>

              </motion.div>

            )}

            {activeTab === 'settings' && (

              <motion.div
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="space-y-5"
              >

                <div className="bg-raised/70 backdrop-blur border border-line/10 rounded-2xl p-5 md:p-6 shadow-sm dark:shadow-none">

                  <div className="flex items-center gap-3 mb-5">

                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">

                      <Settings
                        size={17}
                        className="text-accent"
                      />

                    </div>

                    <div>

                      <h3 className="text-base font-semibold text-ink">
                        Preferences
                      </h3>

                      <p className="text-xs text-mute mt-1">
                        Configure your dashboard preferences
                      </p>

                    </div>

                  </div>


                  <div className="space-y-4">

                    <label className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-panel transition-colors cursor-pointer">

                      <div>

                        <p className="text-sm text-ink">
                          Enable notifications
                        </p>

                        <p className="text-xs text-mute mt-1">
                          Receive analysis-related notifications
                        </p>

                      </div>

                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 accent-accent"
                      />

                    </label>


                    <label className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-panel transition-colors cursor-pointer">

                      <div>

                        <p className="text-sm text-ink">
                          Email on high-risk analysis
                        </p>

                        <p className="text-xs text-mute mt-1">
                          Get notified when an analysis has high risk
                        </p>

                      </div>

                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 accent-accent"
                      />

                    </label>

                  </div>

                </div>


                <div className="bg-accent/[0.04] border border-accent/10 rounded-2xl p-5">

                  <div className="flex items-center justify-between gap-4">

                    <div>

                      <p className="text-sm font-semibold text-ink">
                        Profile
                      </p>

                      <p className="text-xs text-mute mt-1">
                        Update your display name or profile photo
                      </p>

                    </div>

                    <button
                      onClick={() => {

                        setActiveTab(
                          'overview'
                        )

                        setShowProfileEdit(
                          true
                        )

                      }}
                      className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-all"
                    >
                      Edit
                    </button>

                  </div>

                </div>

              </motion.div>

            )}

          </motion.main>

        </div>

      </div>

    </motion.div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent = false,
  mono = true,
  trend,
}) {

  return (

    <motion.div
      whileHover={{
        y: -4,
      }}
      transition={{
        duration: 0.2,
      }}
      className="bg-raised/70 backdrop-blur border border-line/10 rounded-xl p-4 hover:border-accent/20 hover:shadow-md dark:hover:shadow-none transition-all"
    >

      <div className="flex items-center justify-between mb-3">

        <div className="w-8 h-8 rounded-lg bg-panel flex items-center justify-center">

          <Icon
            size={17}
            className={
              accent
                ? 'text-red-500'
                : 'text-accent'
            }
          />

        </div>


        {trend && (

          <span className="text-xs font-semibold text-green-500">
            {trend}
          </span>

        )}

      </div>


      <p className="text-xs text-mute mb-1">
        {label}
      </p>


      <p
        className={`
          text-2xl
          font-bold
          ${
            mono
              ? 'font-mono'
              : ''
          }
          ${
            accent
              ? 'text-red-500'
              : 'text-ink'
          }
        `}
      >
        {value}
      </p>

    </motion.div>
  )
}