import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { syncProfile } from '../services/api'

const ADMIN_EMAIL = 'admin@gmail.com'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

export default function Login() {
  const { loginWithEmail, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState(null)

  // ==========================================================
  // REDIRECT USER BASED ON ACCOUNT
  // ==========================================================

  const redirectAfterLogin = (firebaseUser) => {
    const loggedInEmail =
      firebaseUser?.user?.email ||
      firebaseUser?.email ||
      email

    if (
      loggedInEmail?.trim().toLowerCase() === ADMIN_EMAIL
    ) {
      navigate('/admin', { replace: true })
    } else {
      navigate('/dashboard', { replace: true })
    }
  }

  // ==========================================================
  // EMAIL LOGIN
  // ==========================================================

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await loginWithEmail(
        email.trim(),
        password
      )

      // Wait for MongoDB profile sync before checking admin access.
      await syncProfile()

      redirectAfterLogin(result)
    } catch (err) {
      if (
        err.code ===
        'auth/multi-factor-auth-required'
      ) {
        navigate('/verify-2fa', {
          state: {
            resolverError: err,
          },
        })
        return
      }

      setError(
        err.message?.replace('Firebase: ', '') ||
          'Authentication failed'
      )
    } finally {
      setLoading(false)
    }
  }

  // ==========================================================
  // GOOGLE LOGIN
  // ==========================================================

  async function handleGoogle() {
    setError('')
    setLoading(true)

    try {
      const result = await loginWithGoogle()

      // Wait for MongoDB profile sync before checking admin access.
      await syncProfile()

      redirectAfterLogin(result)
    } catch (err) {
      if (
        err.code ===
        'auth/multi-factor-auth-required'
      ) {
        navigate('/verify-2fa', {
          state: {
            resolverError: err,
          },
        })
        return
      }

      setError(
        err.message?.replace('Firebase: ', '') ||
          'Google sign-in failed'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-graphite via-graphite to-graphite/95 flex">

      {/* =====================================================
          LEFT PANEL
      ===================================================== */}

      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
        className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-accent/10 via-transparent to-transparent"
      >

        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">

          <motion.div
            {...fadeInUp}
            className="mb-16"
          >
            <Link
              to="/"
              className="inline-block group"
              aria-label="Go to CodeComplexity landing page"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 mb-6 group-hover:bg-accent/30 transition-colors duration-300">
                <span className="text-2xl font-bold text-accent">
                  {'</>'}
                </span>
              </div>

              <h1 className="text-4xl font-bold text-white mb-4 group-hover:text-accent transition-colors duration-300">
                CodeComplexity
              </h1>
            </Link>

            <p className="text-lg text-gray-300 leading-relaxed max-w-md">
              Analyze source code complexity with AI-powered
              insights. Get time and space complexity, risk
              scores, and optimization suggestions in seconds.
            </p>
          </motion.div>

          <motion.div
            {...fadeInUp}
            transition={{
              duration: 0.5,
              delay: 0.2,
            }}
            className="space-y-5"
          >

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-accent/20">
                  <span className="text-accent font-bold">
                    ✓
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-1">
                  4 Languages Supported
                </h3>

                <p className="text-gray-400 text-sm">
                  Python, Java, C, and C++
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-accent/20">
                  <span className="text-accent font-bold">
                    ✓
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-1">
                  Static Complexity Analysis
                </h3>

                <p className="text-gray-400 text-sm">
                  Analyze loops, nesting, functions, and code structure
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-accent/20">
                  <span className="text-accent font-bold">
                    ✓
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-1">
                  AI-Powered Suggestions
                </h3>

                <p className="text-gray-400 text-sm">
                  Get clear explanations and optimization recommendations
                </p>
              </div>
            </div>

          </motion.div>
        </div>

        <motion.div
          {...fadeInUp}
          transition={{
            duration: 0.5,
            delay: 0.4,
          }}
          className="relative z-10 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <p className="text-sm text-gray-400 mb-3">
            Code Analysis Insights
          </p>

          <h3 className="text-white text-lg font-semibold mb-2">
            Understand Your Code Before You Optimize
          </h3>

          <p className="text-sm text-gray-400 leading-relaxed">
            Identify potential performance-intensive code and
            understand its time, space, and complexity characteristics.
          </p>
        </motion.div>

      </motion.div>

      {/* =====================================================
          RIGHT PANEL
      ===================================================== */}

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 lg:py-0"
      >

        <div className="w-full max-w-md">

          {/* MOBILE LOGO */}

          <motion.div
            {...fadeInUp}
            className="lg:hidden mb-12 text-center"
          >
            <Link
              to="/"
              className="inline-block group"
              aria-label="Go to CodeComplexity landing page"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 mb-4">
                <span className="text-2xl font-bold text-accent">
                  {'</>'}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-white">
                CodeComplexity
              </h1>
            </Link>
          </motion.div>

          {/* WELCOME */}

          <motion.div
            {...fadeInUp}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome back
            </h2>

            <p className="text-gray-400">
              Sign in to your account to continue analyzing
            </p>
          </motion.div>

          {/* ERROR */}

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -10,
                }}
                className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3"
              >
                <AlertCircle
                  size={18}
                  className="text-red-400 flex-shrink-0 mt-0.5"
                />

                <p className="text-sm text-red-300">
                  {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* LOGIN FORM */}

          <motion.form
            onSubmit={handleSubmit}
            className="space-y-4 mb-6"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.5,
              delay: 0.1,
            }}
          >

            {/* EMAIL */}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>

              <motion.div
                animate={{
                  borderColor:
                    focusedField === 'email'
                      ? 'rgb(var(--c-accent) / 0.5)'
                      : 'rgba(255,255,255, 0.1)',
                }}
                className="relative"
              >
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  onFocus={() =>
                    setFocusedField('email')
                  }
                  onBlur={() =>
                    setFocusedField(null)
                  }
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:bg-white/8 transition-all duration-300"
                  required
                />
              </motion.div>
            </div>

            {/* PASSWORD */}

            <div>
              <div className="flex items-center justify-between mb-2">

                <label className="block text-sm font-medium text-gray-300">
                  Password
                </label>

                <Link
                  to="/forgot-password"
                  className="text-sm text-accent hover:text-accent/80 transition-colors"
                >
                  Forgot?
                </Link>

              </div>

              <motion.div
                animate={{
                  borderColor:
                    focusedField === 'password'
                      ? 'rgb(var(--c-accent) / 0.5)'
                      : 'rgba(255,255,255, 0.1)',
                }}
                className="relative"
              >

                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  onFocus={() =>
                    setFocusedField('password')
                  }
                  onBlur={() =>
                    setFocusedField(null)
                  }
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-11 py-3 text-white placeholder-gray-500 focus:outline-none focus:bg-white/8 transition-all duration-300"
                  required
                />

                <motion.button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  whileHover={{
                    scale: 1.1,
                  }}
                  whileTap={{
                    scale: 0.95,
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </motion.button>

              </motion.div>
            </div>

            {/* SIGN IN */}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{
                scale: 1.02,
              }}
              whileTap={{
                scale: 0.98,
              }}
              className="w-full mt-6 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white font-semibold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
            >

              {loading && (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              )}

              {loading
                ? 'Signing in...'
                : 'Sign In'}

            </motion.button>

          </motion.form>

          {/* DIVIDER */}

          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.5,
              delay: 0.2,
            }}
            className="relative mb-6"
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>

            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-graphite text-gray-400">
                Or continue with
              </span>
            </div>
          </motion.div>

          {/* GOOGLE */}

          <motion.button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            whileHover={{
              scale: 1.02,
            }}
            whileTap={{
              scale: 0.98,
            }}
            className="w-full border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
          >
            <GoogleIcon />
            Continue with Google
          </motion.button>

          {/* REGISTER */}

          <motion.p
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.5,
              delay: 0.3,
            }}
            className="text-center text-sm text-gray-400 mt-8"
          >
            Don't have an account?{' '}

            <Link
              to="/register"
              className="text-accent hover:text-accent/80 font-semibold transition-colors"
            >
              Create one free
            </Link>
          </motion.p>

        </div>

      </motion.div>

    </div>
  )
}

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 48 48"
    >
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.4-.4-3.5z"
      />

      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34 5.1 29.3 3 24 3 16.2 3 9.5 7.4 6.3 14.7z"
      />

      <path
        fill="#4CAF50"
        d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 36.4 26.7 37 24 37c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.4 40.6 16.1 45 24 45z"
      />

      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.2C40.9 36 44 30.5 44 24c0-1.4-.1-2.4-.4-3.5z"
      />
    </svg>
  )
}