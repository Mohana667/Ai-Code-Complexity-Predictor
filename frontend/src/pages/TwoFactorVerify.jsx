import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getMultiFactorResolver,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
} from 'firebase/auth'
import { auth } from '../services/firebase'
import { ShieldCheck, Loader2, AlertCircle, Send, Clock } from 'lucide-react'

export default function TwoFactorVerify() {
  const location = useLocation()
  const navigate = useNavigate()
  const resolverError = location.state?.resolverError

  const [resolver, setResolver] = useState(null)
  const [verificationId, setVerificationId] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const recaptchaRef = useRef(null)
  const recaptchaVerifierRef = useRef(null)

  useEffect(() => {
    if (!resolverError) {
      navigate('/login', { replace: true })
      return
    }
    try {
      const r = getMultiFactorResolver(auth, resolverError)
      setResolver(r)
    } catch {
      setError('This verification session expired — sign in again.')
    }
  }, [resolverError, navigate])

  useEffect(() => {
    let timer
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  async function sendCode() {
    if (!resolver) return
    setError('')
    setBusy(true)
    try {
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
          size: 'invisible',
        })
      }
      const phoneHint = resolver.hints.find((h) => h.factorId === PhoneMultiFactorGenerator.FACTOR_ID)
      if (!phoneHint) throw new Error('No phone factor enrolled for this account.')

      const phoneAuthProvider = new PhoneAuthProvider(auth)
      const id = await phoneAuthProvider.verifyPhoneNumber(
        { multiFactorHint: phoneHint, session: resolver.session },
        recaptchaVerifierRef.current
      )
      setVerificationId(id)
      setSent(true)
      setCountdown(60)
    } catch (err) {
      setError(err.message?.replace('Firebase: ', '') || 'Could not send verification code.')
    } finally {
      setBusy(false)
    }
  }

  async function confirmCode(e) {
    e.preventDefault()
    if (!resolver || !verificationId) return
    setError('')
    setBusy(true)
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code)
      const assertion = PhoneMultiFactorGenerator.assertion(credential)
      await resolver.resolveSignIn(assertion)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message?.replace('Firebase: ', '') || 'Invalid code — try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-graphite via-graphite to-graphite/95 flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
          {/* Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8 text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 mb-6"
            >
              <ShieldCheck size={32} className="text-accent" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">Verify it's you</h1>
            <p className="text-gray-400">
              {sent
                ? 'Enter the 6-digit code we sent to your phone.'
                : 'Two-factor verification is enabled on this account.'}
            </p>
          </motion.div>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3"
              >
                <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div
                key="send"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <motion.button
                  onClick={sendCode}
                  disabled={busy || !resolver}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {busy && <Loader2 size={18} className="animate-spin" />}
                  {busy ? 'Sending code...' : (
                    <>
                      <Send size={18} />
                      Send Verification Code
                    </>
                  )}
                </motion.button>

                <p className="text-xs text-gray-500 text-center">
                  We'll send a 6-digit code to your registered phone number
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="verify"
                onSubmit={confirmCode}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Code Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Verification Code</label>
                  <motion.input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-all font-mono tracking-widest text-center text-2xl"
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={busy || code.length < 6}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {busy && <Loader2 size={18} className="animate-spin" />}
                  {busy ? 'Verifying...' : 'Verify and Sign In'}
                </motion.button>

                {/* Resend Button */}
                <motion.button
                  type="button"
                  onClick={sendCode}
                  disabled={busy || countdown > 0}
                  className="w-full text-gray-300 hover:text-white disabled:text-gray-500 font-medium py-2 transition-colors flex items-center justify-center gap-2"
                >
                  {countdown > 0 ? (
                    <>
                      <Clock size={16} />
                      Resend in {countdown}s
                    </>
                  ) : (
                    'Resend Code'
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 pt-6 border-t border-white/10 text-center"
          >
            <p className="text-sm text-gray-400">
              Back to{' '}
              <Link to="/login" className="text-accent hover:text-accent/80 font-semibold transition-colors">
                Sign In
              </Link>
            </p>
          </motion.div>
        </div>

        {/* Recaptcha */}
        <div ref={recaptchaRef} />
      </motion.div>
    </div>
  )
}
