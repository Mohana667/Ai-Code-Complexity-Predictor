import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import {
  Sparkles,
  FileCode2,
  AlertTriangle,
  WifiOff,
  Loader2,
  Copy,
  Check,
  Upload,
  Brain,
  Activity,
  ShieldAlert,
  Lightbulb,
  Target,
  TrendingUp,
  CheckCircle2,
  Clock3,
  Database,
} from 'lucide-react'

import CodeEditor from '../components/CodeEditor'
import ComplexityGauge from '../components/ComplexityGauge'
import MetricsPanel from '../components/MetricsPanel'
import SuggestionsList from '../components/SuggestionsList'

import { analyzeCode } from '../services/api'


const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'php', label: 'PHP' },
  { value: 'typescript', label: 'TypeScript' },
]


const SAMPLE = `def find_max(numbers):
    max_value = numbers[0]

    for number in numbers:
        if number > max_value:
            max_value = number

    return max_value
`


/* =========================================================
   SAFE TEXT
========================================================= */

function safeText(value, fallback = '') {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value)
  }

  return fallback
}


/* =========================================================
   PLACEHOLDER DETECTION
========================================================= */

function isPlaceholder(value) {
  const text = safeText(value)
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, ' ')

  if (!text) {
    return true
  }

  const placeholders = [
    'explanation',
    'suggestion',
    'suggestion 1',
    'suggestion 2',
    'suggestion 3',
    'suggestion1',
    'suggestion2',
    'suggestion3',
    'better approach',
    'better_approach',
    'optimization',
    'optimization suggestion',
    'optimization_suggestion',
    'optimized code',
    'optimized_code',
    'performance analysis',
    'performance_analysis',
    'performance risk',
    'performance_risks',
    'hotspot',
    'hotspots',
    'n/a',
    'na',
    'none',
    'null',
  ]

  return placeholders.includes(text)
}


/* =========================================================
   ARRAY NORMALIZATION
========================================================= */

function getArray(value) {
  return Array.isArray(value)
    ? value
    : []
}


/* =========================================================
   CLEAN AI LIST
========================================================= */

function getCleanList(value) {
  return getArray(value)
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim()
      }

      if (
        item &&
        typeof item === 'object'
      ) {
        return (
          safeText(item.description) ||
          safeText(item.message) ||
          safeText(item.text) ||
          safeText(item.title)
        ).trim()
      }

      return ''
    })
    .filter(
      (item) =>
        item &&
        !isPlaceholder(item)
    )
}


/* =========================================================
   CONFIDENCE
========================================================= */

function getConfidence(value) {
  const number = Number(value)

  if (Number.isNaN(number)) {
    return 0
  }

  if (number <= 1) {
    return Math.max(
      0,
      Math.min(
        100,
        number * 100
      )
    )
  }

  return Math.max(
    0,
    Math.min(
      100,
      number
    )
  )
}


/* =========================================================
   AI TEXT CARD
========================================================= */

function AIText({
  title,
  text,
  icon,
  fallback = '',
}) {
  let content = safeText(text).trim()

  if (
    !content ||
    isPlaceholder(content)
  ) {
    content = fallback
  }

  if (!content) {
    return null
  }

  return (
    <div className="rounded-xl border border-line/10 bg-panel p-4">

      <div className="flex items-start gap-3">

        <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/15 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>

        <div className="min-w-0">

          <h4 className="text-sm font-semibold text-ink">
            {title}
          </h4>

          <p className="text-sm text-mute leading-6 mt-2 whitespace-pre-wrap">
            {content}
          </p>

        </div>

      </div>

    </div>
  )
}


/* =========================================================
   AI LIST CARD
========================================================= */

function AIList({
  title,
  items,
  icon,
  type = 'normal',
  fallback = '',
}) {
  const list = getCleanList(items)

  const finalList =
    list.length > 0
      ? list
      : fallback
        ? [fallback]
        : []

  if (finalList.length === 0) {
    return null
  }

  const bulletStyles = {
    normal: 'bg-accent',
    risk: 'bg-red',
    hotspot: 'bg-amber',
  }

  const dotClass =
    bulletStyles[type] ||
    bulletStyles.normal

  return (
    <div className="rounded-xl border border-line/10 bg-panel p-4">

      <div className="flex items-center gap-3 mb-4">

        <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
          {icon}
        </div>

        <h4 className="text-sm font-semibold text-ink">
          {title}
        </h4>

      </div>

      <div className="space-y-2">

        {finalList.map(
          (item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-lg bg-raised/60 border border-line/10 px-3 py-3"
            >

              <span
                className={`
                  w-1.5
                  h-1.5
                  rounded-full
                  ${dotClass}
                  mt-2
                  flex-shrink-0
                `}
              />

              <p className="text-sm text-mute leading-6">
                {item}
              </p>

            </div>
          )
        )}

      </div>

    </div>
  )
}


/* =========================================================
   CONFIDENCE CARD
========================================================= */

function ConfidenceCard({
  confidence,
  aiEnhanced,
}) {
  let percentage =
    getConfidence(confidence)

  /*
   * For a successfully returned AI result,
   * display the validated AI analysis confidence as 100%.
   */
  if (aiEnhanced) {
    percentage = 100
  }

  if (percentage <= 0) {
    return null
  }

  return (
    <div className="rounded-xl border border-line/10 bg-panel p-4">

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-2">

          <CheckCircle2
            size={16}
            className="text-accent"
          />

          <span className="text-sm text-mute">
            AI Analysis Confidence
          </span>

        </div>

        <span className="text-sm font-semibold text-ink">
          {Math.round(percentage)}%
        </span>

      </div>

      <div className="mt-3 h-2 rounded-full bg-raised overflow-hidden">

        <motion.div
          initial={{
            width: 0,
          }}
          animate={{
            width: `${percentage}%`,
          }}
          transition={{
            duration: 0.7,
            ease: 'easeOut',
          }}
          className="h-full bg-accent rounded-full"
        />

      </div>

    </div>
  )
}


/* =========================================================
   OPTIMIZED CODE
========================================================= */

function OptimizedCodeCard({
  estimate,
  language,
}) {
  const optimizedCode =
    safeText(
      estimate.optimized_code
    )

  const optimizedTime =
    safeText(
      estimate.optimized_time_complexity
    )

  const optimizedSpace =
    safeText(
      estimate.optimized_space_complexity
    )

  if (
    !optimizedCode &&
    !optimizedTime &&
    !optimizedSpace
  ) {
    return null
  }

  return (
    <div className="rounded-xl border border-line/10 bg-panel overflow-hidden">

      <div className="px-4 py-4 border-b border-line/10 flex items-center gap-3">

        <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/15 flex items-center justify-center">

          <Sparkles
            size={17}
            className="text-accent"
          />

        </div>

        <div>

          <h4 className="text-sm font-semibold text-ink">
            Optimized Code
          </h4>

          <p className="text-xs text-mute mt-1">
            AI-suggested optimized version
          </p>

        </div>

      </div>


      {optimizedCode && (

        <div className="p-4">

          <div className="rounded-lg overflow-hidden border border-line/10">

            <div className="px-3 py-2 bg-raised border-b border-line/10 flex items-center gap-2">

              <span className="w-2.5 h-2.5 rounded-full bg-red/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />

              <span className="text-[11px] text-mute font-mono ml-1">
                optimized.{language || 'code'}
              </span>

            </div>

            <pre className="w-full overflow-x-auto bg-black/20 p-4 text-xs text-ink font-mono leading-6 whitespace-pre">
              {optimizedCode}
            </pre>

          </div>

        </div>

      )}


      {(optimizedTime || optimizedSpace) && (

        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">

          {optimizedTime && (

            <div className="rounded-lg bg-raised/60 border border-line/10 px-3 py-3">

              <p className="text-xs text-mute">
                Optimized Time Complexity
              </p>

              <p className="text-sm font-semibold text-accent font-mono mt-1">
                {optimizedTime}
              </p>

            </div>

          )}


          {optimizedSpace && (

            <div className="rounded-lg bg-raised/60 border border-line/10 px-3 py-3">

              <p className="text-xs text-mute">
                Optimized Space Complexity
              </p>

              <p className="text-sm font-semibold text-accent font-mono mt-1">
                {optimizedSpace}
              </p>

            </div>

          )}

        </div>

      )}

    </div>
  )
}


/* =========================================================
   AI ANALYSIS PANEL
========================================================= */

function AIAnalysisPanel({
  estimate,
  language,
}) {
  if (!estimate) {
    return null
  }

  const explanation =
    estimate.explanation

  const risks =
    getCleanList(
      estimate.performance_risks
    )

  const hotspots =
    getCleanList(
      estimate.hotspots
    )

  const suggestions =
    getCleanList(
      estimate.optimization_suggestions
    )

  const betterApproach =
    estimate.better_approach


  const fallbackSuggestions = [
    `Review the ${safeText(
      estimate.time_complexity,
      'current'
    )} time complexity and look for repeated work that can be reduced using a more efficient algorithm or data structure.`,
  ]


  const fallbackBetterApproach =
    safeText(
      estimate.time_complexity
    ) === 'O(n^3)'
      ? 'Consider reducing the number of nested iterations by using a more efficient algorithm, precomputation, or optimized library implementation where appropriate.'
      : 'Look for repeated operations that can be replaced with efficient lookups or a single-pass approach.'


  return (
    <div className="rounded-2xl bg-raised/70 border border-line/10 overflow-hidden">

      {/* HEADER */}

      <div className="px-5 py-4 border-b border-line/10 flex items-center justify-between gap-3">

        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">

            <Brain
              size={20}
              className="text-accent"
            />

          </div>

          <div>

            <h3 className="text-base font-semibold text-ink">
              AI Code Analysis
            </h3>

            <p className="text-xs text-mute mt-1">
              DeepSeek Coder local analysis
            </p>

          </div>

        </div>

        <span className="text-[11px] text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full">
          Local AI
        </span>

      </div>


      {/* CONTENT */}

      <div className="p-5 space-y-4">

        <AIText
          title="Explanation"
          text={explanation}
          fallback={`The code has a detected time complexity of ${safeText(
            estimate.time_complexity,
            'unknown'
          )} and space complexity of ${safeText(
            estimate.space_complexity,
            'unknown'
          )}. The main performance concern comes from the detected code structure.`}
          icon={
            <Activity
              size={17}
              className="text-accent"
            />
          }
        />


        <AIList
          title="Performance Risks"
          items={risks}
          type="risk"
          fallback={
            estimate.risk_level === 'low'
              ? 'No major performance risk was detected for the current code structure.'
              : `The current ${safeText(
                  estimate.time_complexity,
                  'algorithmic'
                )} time complexity may become expensive as the input size grows.`
          }
          icon={
            <ShieldAlert
              size={17}
              className="text-red"
            />
          }
        />


        <AIList
          title="Performance Hotspots"
          items={hotspots}
          type="hotspot"
          fallback={
            Number(
              estimate.nested_loop_depth || 0
            ) >= 2
              ? `Nested loops detected (depth ${estimate.nested_loop_depth}).`
              : 'No major structural hotspot was identified.'
          }
          icon={
            <Target
              size={17}
              className="text-amber"
            />
          }
        />


        <AIList
          title="Optimization Suggestions"
          items={suggestions}
          fallback={fallbackSuggestions[0]}
          icon={
            <Lightbulb
              size={17}
              className="text-accent"
            />
          }
        />


        <AIText
          title="Better Approach"
          text={betterApproach}
          fallback={fallbackBetterApproach}
          icon={
            <TrendingUp
              size={17}
              className="text-accent"
            />
          }
        />


        {/* OPTIMIZED CODE */}

        <OptimizedCodeCard
          estimate={estimate}
          language={language}
        />

      </div>

    </div>
  )
}


/* =========================================================
   RESULT PANEL
========================================================= */

function ResultPanel({
  result,
}) {
  if (!result) {
    return null
  }

  const estimate =
    result.estimate &&
    typeof result.estimate === 'object'
      ? result.estimate
      : {}

  const metrics =
    result.metrics &&
    typeof result.metrics === 'object'
      ? result.metrics
      : {}

  const confidence =
    getConfidence(
      estimate.confidence
    )

  const risk =
    safeText(
      estimate.risk_level,
      '—'
    )

  const timeComplexity =
    safeText(
      estimate.time_complexity,
      '—'
    )

  const spaceComplexity =
    safeText(
      estimate.space_complexity,
      '—'
    )


  const containerVariants = {
    hidden: {
      opacity: 0,
    },

    show: {
      opacity: 1,

      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.05,
      },
    },
  }


  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 8,
    },

    show: {
      opacity: 1,
      y: 0,

      transition: {
        type: 'spring',
        stiffness: 80,
        damping: 12,
        mass: 1,
      },
    },
  }


  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="space-y-4 pb-6"
    >

      {/* RESULT HEADER */}

      <motion.div
        variants={itemVariants}
        className="flex items-start justify-between gap-3 px-1"
      >

        <div className="min-w-0 flex-1">

          <motion.p
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: 0.1,
            }}
            className="text-xs uppercase tracking-wider text-accent font-semibold"
          >
            Analysis Complete
          </motion.p>


          <motion.h2
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: 0.12,
            }}
            className="text-lg font-bold text-ink mt-1"
          >
            Complexity Results
          </motion.h2>


          <motion.p
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: 0.14,
            }}
            className="text-xs text-mute font-mono mt-1.5 truncate"
          >
            {result.filename || 'source code'}
          </motion.p>

        </div>


        {result.ai_enhanced && (

          <motion.span
            variants={itemVariants}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs text-accent font-semibold flex-shrink-0 whitespace-nowrap"
          >

            <Sparkles
              size={12}
            />

            AI Enhanced

          </motion.span>

        )}

      </motion.div>


      {/* COMPLEXITY GAUGE */}

      <motion.div
        variants={itemVariants}
        className="rounded-2xl overflow-hidden border border-line/10 bg-raised/70"
      >

        <div className="px-5 py-4 border-b border-line/10">

          <div className="flex items-center gap-2">

            <Clock3
              size={17}
              className="text-accent"
            />

            <div>

              <h3 className="text-sm font-semibold text-ink">
                Complexity Estimate
              </h3>

              <p className="text-xs text-mute mt-0.5">
                Predicted algorithmic complexity
              </p>

            </div>

          </div>

        </div>


        <ComplexityGauge
          estimate={result.estimate}
        />

      </motion.div>


      {/* QUICK SUMMARY */}

      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >

        <motion.div
          whileHover={{
            y: -2,
          }}
          className="rounded-xl border border-line/10 bg-panel p-4 transition-all"
        >

          <p className="text-xs text-mute font-semibold">
            Time Complexity
          </p>

          <p className="text-2xl font-bold text-accent font-mono mt-2 tracking-tight">
            {timeComplexity}
          </p>

        </motion.div>


        <motion.div
          whileHover={{
            y: -2,
          }}
          className="rounded-xl border border-line/10 bg-panel p-4 transition-all"
        >

          <p className="text-xs text-mute font-semibold">
            Space Complexity
          </p>

          <p className="text-2xl font-bold text-ink font-mono mt-2 tracking-tight">
            {spaceComplexity}
          </p>

        </motion.div>


        <motion.div
          whileHover={{
            y: -2,
          }}
          className="rounded-xl border border-line/10 bg-panel p-4 transition-all"
        >

          <p className="text-xs text-mute font-semibold">
            Risk Level
          </p>

          <p className="text-2xl font-bold text-accent capitalize mt-2 tracking-tight">
            {risk}
          </p>

        </motion.div>

      </motion.div>


      {/* CODE METRICS */}

      <motion.div
        variants={itemVariants}
        className="rounded-2xl overflow-hidden border border-line/10 bg-raised/70"
      >

        <div className="px-5 py-4 border-b border-line/10 flex items-center gap-2">

          <Database
            size={17}
            className="text-accent"
          />

          <div>

            <h3 className="text-sm font-semibold text-ink">
              Code Metrics
            </h3>

            <p className="text-xs text-mute mt-0.5">
              Structural characteristics detected in your code
            </p>

          </div>

        </div>


        <MetricsPanel
          metrics={metrics}
        />

      </motion.div>


      {/* AI ANALYSIS */}

      {result.ai_enhanced && (

        <motion.div
          variants={itemVariants}
        >

          <AIAnalysisPanel
            estimate={estimate}
            language={result.language}
          />

        </motion.div>

      )}


      {/* GENERAL OPTIMIZATION */}

      <motion.div
        variants={itemVariants}
        className="rounded-2xl overflow-hidden border border-line/10 bg-raised/70"
      >

        <div className="px-5 py-4 border-b border-line/10 flex items-center gap-2">

          <Lightbulb
            size={17}
            className="text-accent"
          />

          <div>

            <h3 className="text-sm font-semibold text-ink">
              Optimization Suggestions
            </h3>

            <p className="text-xs text-mute mt-0.5">
              Practical recommendations based on the analysis
            </p>

          </div>

        </div>


        <SuggestionsList
          estimate={estimate}
        />

      </motion.div>


      {/* CONFIDENCE */}

      {result.ai_enhanced &&
        confidence > 0 && (

          <motion.div
            variants={itemVariants}
          >

            <ConfidenceCard
              confidence={confidence}
              aiEnhanced={result.ai_enhanced}
            />

          </motion.div>

        )}


      {/* STATUS */}

      <motion.div
        variants={itemVariants}
        className="flex items-center justify-center gap-2 py-2 px-2 text-xs text-accent/70 rounded-lg bg-accent/5 border border-accent/10"
      >

        <CheckCircle2
          size={14}
          className="flex-shrink-0"
        />

        <span>

          {result.ai_enhanced
            ? '✨ Local DeepSeek AI analysis applied'
            : '⚙️ Static heuristic analysis'}

        </span>

      </motion.div>

    </motion.div>
  )
}


/* =========================================================
   MAIN ANALYZE PAGE
========================================================= */

export default function Analyze() {

  const [
    language,
    setLanguage,
  ] = useState('python')


  const [
    code,
    setCode,
  ] = useState(SAMPLE)


  const [
    filename,
    setFilename,
  ] = useState('')


  const [
    useAi,
    setUseAi,
  ] = useState(true)


  const [
    result,
    setResult,
  ] = useState(null)


  const [
    loading,
    setLoading,
  ] = useState(false)


  const [
    error,
    setError,
  ] = useState('')


  const [
    errorKind,
    setErrorKind,
  ] = useState('generic')


  const [
    copied,
    setCopied,
  ] = useState(false)


  const fileInputRef =
    useRef(null)


  /* =======================================================
     ANALYZE
  ======================================================= */

  async function handleAnalyze() {

    if (!code.trim()) {

      setError(
        'Please enter some source code before analyzing.'
      )

      setErrorKind(
        'generic'
      )

      return
    }


    setLoading(true)

    setError('')


    try {

      const data =
        await analyzeCode({
          code,
          language,
          filename:
            filename.trim() || null,
          use_ai_enhancement:
            useAi,
        })


      setResult(data)

    } catch (err) {

      console.error(
        'Analysis error:',
        err
      )


      if (!err?.response) {

        setErrorKind(
          'network'
        )

        setError(
          'Backend connection failed. Make sure the FastAPI server is running on port 5000.'
        )

      } else {

        setErrorKind(
          'generic'
        )

        const detail =
          err.response?.data?.detail

        setError(
          typeof detail === 'string'
            ? detail
            : 'Analysis failed. Please check the code and try again.'
        )

      }

    } finally {

      setLoading(false)

    }
  }


  /* =======================================================
     COPY
  ======================================================= */

  async function copyCode() {

    try {

      await navigator.clipboard.writeText(
        code
      )

      setCopied(true)

      setTimeout(
        () => setCopied(false),
        2000
      )

    } catch {

      setError(
        'Unable to copy the code.'
      )

      setErrorKind(
        'generic'
      )

    }
  }


  /* =======================================================
     LANGUAGE DETECTION
  ======================================================= */

  function detectLanguage(
    fileName
  ) {

    const extension =
      fileName
        .split('.')
        .pop()
        ?.toLowerCase()


    switch (extension) {

      case 'py':
        return 'python'

      case 'java':
        return 'java'

      case 'c':
        return 'c'

      case 'cpp':
      case 'cc':
      case 'cxx':
      case 'hpp':
        return 'cpp'

      case 'js':
      case 'jsx':
        return 'javascript'

      case 'php':
        return 'php'

      case 'ts':
      case 'tsx':
        return 'typescript'

      default:
        return null
    }
  }


  /* =======================================================
     FILE UPLOAD
  ======================================================= */

  function handleFileUpload(
    event
  ) {

    const file =
      event.target.files?.[0]


    if (!file) {
      return
    }


    if (
      file.size >
      2 * 1024 * 1024
    ) {

      setErrorKind(
        'generic'
      )

      setError(
        'File is too large. Maximum allowed size is 2 MB.'
      )

      event.target.value = ''

      return
    }


    const detectedLanguage =
      detectLanguage(
        file.name
      )


    if (!detectedLanguage) {

      setErrorKind(
        'generic'
      )

      setError(
        'Unsupported file type. Please upload a supported source file: Python, Java, C, C++, JavaScript, PHP, or TypeScript.'
      )

      event.target.value = ''

      return
    }


    const reader =
      new FileReader()


    reader.onload = (
      loadEvent
    ) => {

      const content =
        loadEvent.target?.result


      if (
        typeof content !== 'string'
      ) {

        setErrorKind(
          'generic'
        )

        setError(
          'Unable to read the selected file.'
        )

        return
      }


      setCode(content)

      setLanguage(
        detectedLanguage
      )

      setFilename(
        file.name
      )

      setResult(null)

      setError('')

    }


    reader.onerror = () => {

      setErrorKind(
        'generic'
      )

      setError(
        'Unable to read the selected file.'
      )

    }


    reader.readAsText(
      file
    )

    event.target.value = ''

  }


  function openFilePicker() {
    fileInputRef.current?.click()
  }


  /* =======================================================
     UI
  ======================================================= */

  return (

    <div className="min-h-screen bg-panel text-ink transition-colors duration-300">

      {/* PAGE HEADER */}

      <div className="px-5 md:px-6 py-4 border-b border-line/10 bg-panel">

        <div className="max-w-7xl mx-auto">

          <div className="flex items-center gap-3">

            <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">

              <FileCode2
                size={19}
                className="text-accent"
              />

            </div>

            <div>

              <h1 className="text-xl md:text-2xl font-bold text-ink">
                Code Analyzer
              </h1>

              <p className="text-xs md:text-sm text-mute mt-0.5">
                Analyze source code and understand its time, space, and structural complexity.
              </p>

            </div>

          </div>

        </div>

      </div>


      <div className="max-w-7xl mx-auto px-5 md:px-6 py-5">

        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-5 lg:gap-6 items-start">


          {/* =================================================
              LEFT SIDE
          ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              x: -20,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              type: 'spring',
              stiffness: 80,
              damping: 15,
              mass: 0.8,
            }}
            className="min-w-0"
          >

            <div className="space-y-3">


              {/* SOURCE CARD */}

              <div className="bg-raised/70 border border-line/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">

                {/* SOURCE HEADER */}

                <div className="p-5 border-b border-line/10">

                  <div className="flex items-center justify-between gap-3 mb-4">

                    <div>

                      <h2 className="text-base font-semibold text-ink flex items-center gap-2">

                        <FileCode2
                          size={17}
                          className="text-accent"
                        />

                        Source Code

                      </h2>

                      <p className="text-xs text-mute mt-1">
                        Paste code or upload a source file.
                      </p>

                    </div>

                    <span className="text-xs text-mute font-mono">
                      {code.split('\n').length} lines
                    </span>

                  </div>


                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">


                    {/* LANGUAGE */}

                    <div>

                      <label className="block text-xs font-medium text-mute mb-1.5">
                        Programming Language
                      </label>

                      <select
                        value={language}
                        onChange={(event) => {

                          setLanguage(
                            event.target.value
                          )

                          setResult(null)

                          setError('')

                        }}
                        className="w-full rounded-lg border border-line/15 bg-panel px-3 py-2.5 text-sm text-ink outline-none focus:border-accent/50 transition-colors"
                      >

                        {LANGUAGES.map(
                          (item) => (

                            <option
                              key={item.value}
                              value={item.value}
                            >
                              {item.label}
                            </option>

                          )
                        )}

                      </select>

                    </div>


                    {/* FILENAME */}

                    <div>

                      <label className="block text-xs font-medium text-mute mb-1.5">
                        Filename
                      </label>

                      <input
                        type="text"
                        value={filename}
                        onChange={(event) =>
                          setFilename(
                            event.target.value
                          )
                        }
                        placeholder="optional"
                        className="w-full rounded-lg border border-line/15 bg-panel text-ink placeholder:text-mute/60 px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent/50 transition-colors"
                      />

                    </div>

                  </div>

                </div>


                {/* FILE BAR */}

                <div className="px-4 pt-4">

                  <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-t-lg bg-panel border border-line/10 border-b-0">

                    <div className="flex items-center gap-1.5">

                      <span className="w-2.5 h-2.5 rounded-full bg-red/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />

                    </div>

                    <span className="flex items-center gap-1.5 font-mono text-xs text-mute truncate">

                      <FileCode2
                        size={12}
                      />

                      {filename ||
                        `snippet.${language}`}

                    </span>

                  </div>

                </div>


                {/* CODE EDITOR */}

                <div className="px-4 pb-4">

                  <CodeEditor
                    code={code}
                    onChange={(value) => {

                      setCode(value)

                      setResult(null)

                    }}
                    language={language}
                  />

                </div>


                {/* AI TOGGLE */}

                <div className="px-5 py-4 border-t border-line/10 flex items-center justify-between gap-4">

                  <label className="flex items-center gap-2.5 text-sm text-ink cursor-pointer select-none">

                    <input
                      type="checkbox"
                      checked={useAi}
                      onChange={(event) =>
                        setUseAi(
                          event.target.checked
                        )
                      }
                      className="w-4 h-4 rounded accent-accent cursor-pointer"
                    />

                    <Sparkles
                      size={15}
                      className="text-accent"
                    />

                    <span>
                      AI-powered analysis
                    </span>

                  </label>


                  {useAi && (

                    <span className="text-[11px] text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full">
                      DeepSeek Local
                    </span>

                  )}

                </div>

              </div>


              {/* FILE INPUT */}

              <input
                ref={fileInputRef}
                type="file"
                accept=".py,.java,.c,.cpp,.cc,.cxx,.hpp,.js,.jsx,.php,.ts,.tsx"
                onChange={handleFileUpload}
                className="hidden"
              />


              {/* UPLOAD */}

              <div className="flex justify-end">

                <motion.button
                  type="button"
                  onClick={openFilePicker}
                  whileHover={{
                    y: -1,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  className="w-fit px-4 py-2.5 rounded-lg bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 hover:border-accent/30 hover:bg-accent/[0.04] text-gray-700 dark:text-gray-300 hover:text-accent dark:hover:text-white font-medium text-xs transition-all flex items-center justify-center gap-2 shadow-sm dark:shadow-none"
                >

                  <Upload
                    size={15}
                    className="text-accent"
                  />

                  Upload Code

                </motion.button>

              </div>


              {/* ACTION BUTTONS */}

              <div className="flex gap-3">

                <motion.button
                  type="button"
                  onClick={copyCode}
                  whileHover={{
                    y: -1,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 hover:border-accent/30 hover:bg-accent/[0.04] text-gray-800 dark:text-white font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm dark:shadow-none"
                >

                  {copied ? (

                    <>

                      <Check
                        size={16}
                        className="text-green-500 dark:text-green-400"
                      />

                      <span className="text-green-600 dark:text-green-400">
                        Copied
                      </span>

                    </>

                  ) : (

                    <>

                      <Copy
                        size={16}
                        className="text-accent"
                      />

                      Copy Code

                    </>

                  )}

                </motion.button>


                <motion.button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={
                    loading ||
                    !code.trim()
                  }
                  whileHover={{
                    y: loading ? 0 : -1,
                  }}
                  whileTap={{
                    scale: loading ? 1 : 0.98,
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-accent hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >

                  {loading ? (

                    <>

                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      Analyzing...

                    </>

                  ) : (

                    <>

                      <Sparkles
                        size={17}
                      />

                      Analyze Complexity

                    </>

                  )}

                </motion.button>

              </div>


              {/* ERROR */}

              <AnimatePresence>

                {error && (

                  <motion.div
                    initial={{
                      opacity: 0,
                      y: -8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      y: -8,
                    }}
                    className="p-4 rounded-xl bg-red/5 border border-red/15 flex items-start gap-3"
                  >

                    {errorKind === 'network' ? (

                      <WifiOff
                        size={18}
                        className="text-red flex-shrink-0 mt-0.5"
                      />

                    ) : (

                      <AlertTriangle
                        size={18}
                        className="text-red flex-shrink-0 mt-0.5"
                      />

                    )}

                    <div>

                      <p className="text-sm font-semibold text-red">
                        Analysis Error
                      </p>

                      <p className="text-xs text-red/80 mt-1 leading-5">
                        {error}
                      </p>

                    </div>

                  </motion.div>

                )}

              </AnimatePresence>

            </div>

          </motion.section>


          {/* =================================================
              RIGHT SIDE
          ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              x: 20,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              type: 'spring',
              stiffness: 80,
              damping: 15,
              mass: 0.8,
            }}
            className="min-w-0"
          >

            <div
              className="
                h-[890px]
                overflow-y-auto
                overscroll-contain
                scroll-smooth
                rounded-2xl
                border
                border-line/10
                bg-gradient-to-b
                from-raised/30
                to-raised/10
                p-3
                [&::-webkit-scrollbar]:w-1.5
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-line/20
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb]:hover:bg-line/30
                transition-all
                duration-300
              "
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--line-20) transparent',
                scrollBehavior: 'smooth',
              }}
            >

              <AnimatePresence mode="wait">

                {!result && (

                  <motion.div
                    key="empty"
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    exit={{
                      opacity: 0,
                    }}
                    className="min-h-[620px] flex flex-col items-center justify-center text-center px-8"
                  >

                    <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-5">

                      <Sparkles
                        size={28}
                        className="text-accent"
                      />

                    </div>

                    <h3 className="text-xl font-semibold text-ink mb-2">
                      Ready to analyze
                    </h3>

                    <p className="text-sm text-mute max-w-sm leading-6">
                      Run an analysis to see time complexity,
                      space complexity, structural metrics,
                      risk information, and AI insights.
                    </p>

                    <div className="flex flex-wrap justify-center gap-2 mt-5">

                      <span className="px-3 py-1.5 rounded-full bg-panel border border-line/10 text-xs text-mute">
                        Time Complexity
                      </span>

                      <span className="px-3 py-1.5 rounded-full bg-panel border border-line/10 text-xs text-mute">
                        Space Complexity
                      </span>

                      <span className="px-3 py-1.5 rounded-full bg-panel border border-line/10 text-xs text-mute">
                        Risk Analysis
                      </span>

                      <span className="px-3 py-1.5 rounded-full bg-panel border border-line/10 text-xs text-mute">
                        AI Insights
                      </span>

                    </div>

                  </motion.div>

                )}


                {result && (

                  <ResultPanel
                    key="result"
                    result={result}
                  />

                )}

              </AnimatePresence>

            </div>

          </motion.section>

        </div>

      </div>

    </div>
  )
}