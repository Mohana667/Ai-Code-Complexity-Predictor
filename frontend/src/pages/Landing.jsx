import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Braces,
  CheckCircle2,
  Code2,
  Cpu,
  FileText,
  Gauge,
  GitCompare,
  History,
  Menu,
  Network,
  ScanSearch,
  Sparkles,
  Terminal,
  Timer,
  X,
  Zap,
} from 'lucide-react'

import HeroDemo from '../components/HeroDemo'
import Reveal from '../components/Reveal'
import { StaggerGroup, StaggerItem } from '../components/Stagger'
import AnimatedBlobs from '../components/AnimatedBlobs'
import ThemeToggle from '../components/ThemeToggle'

const LANGUAGES = [
  {
    name: 'Python',
    icon: '🐍',
    description:
      'Analyze Python loops, functions, recursion, and control flow.',
  },
  {
    name: 'Java',
    icon: '☕',
    description:
      'Evaluate Java code structure and estimate algorithmic complexity.',
  },
  {
    name: 'C',
    icon: Terminal,
    description:
      'Inspect C loops, functions, nesting, and memory-related patterns.',
  },
  {
    name: 'C++',
    icon: Braces,
    description:
      'Analyze C++ structures, loops, functions, and dependencies.',
  },
]

const ANALYSIS_ITEMS = [
  {
    icon: Timer,
    title: 'Time Complexity',
    description:
      'Estimate how the running time of your code grows as the input size increases.',
  },
  {
    icon: Network,
    title: 'Space Complexity',
    description:
      'Evaluate memory usage and identify patterns that may increase space requirements.',
  },
  {
    icon: ScanSearch,
    title: 'Code Structure',
    description:
      'Inspect loops, nesting, functions, recursion, conditions, and dependencies.',
  },
  {
    icon: Gauge,
    title: 'Risk Assessment',
    description:
      'Get a complexity score and risk level to identify potentially expensive code.',
  },
  {
    icon: Zap,
    title: 'Performance Hotspots',
    description:
      'Highlight code patterns that may contribute to inefficient execution.',
  },
  {
    icon: Sparkles,
    title: 'AI Explanation',
    description:
      'Use AI-enhanced analysis to explain the predicted complexity in simple terms.',
  },
]

const FEATURES = [
  {
    icon: Code2,
    title: 'Multi-language analysis',
    description:
      'Analyze source code written in Python, Java, C, and C++ from a single workflow.',
  },
  {
    icon: Cpu,
    title: 'Static code analysis',
    description:
      'Inspect the structure and patterns of your code without executing the program.',
  },
  {
    icon: Sparkles,
    title: 'AI-enhanced insights',
    description:
      'Get an additional explanation of the predicted time and space complexity.',
  },
  {
    icon: History,
    title: 'Analysis history',
    description:
      'Keep previous analyses available so you can review your earlier results.',
  },
  {
    icon: GitCompare,
    title: 'Version comparison',
    description:
      'Compare different code versions to understand which implementation is more efficient.',
  },
  {
    icon: FileText,
    title: 'Downloadable reports',
    description:
      'Download analysis results as PDF reports for documentation and reference.',
  },
]

const STEPS = [
  {
    number: '01',
    title: 'Enter your code',
    description:
      'Paste or provide your source code and select the programming language.',
  },
  {
    number: '02',
    title: 'Analyze the structure',
    description:
      'The system examines loops, nesting, recursion, functions, conditions, and dependencies.',
  },
  {
    number: '03',
    title: 'Predict complexity',
    description:
      'Receive estimated time complexity, space complexity, scores, and risk information.',
  },
  {
    number: '04',
    title: 'Understand and improve',
    description:
      'Review AI explanations, hotspots, and optimization suggestions for your code.',
  },
]

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const closeMenu = () => setMobileMenuOpen(false)

  return (
    <div className="min-h-screen overflow-x-hidden bg-panel text-ink">

      <header className="sticky top-0 z-50 border-b border-line/10 bg-panel/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">

          <div className="h-16 flex items-center justify-between">

            {/* Logo */}
            <Link
              to="/"
              onClick={closeMenu}
              className="flex items-center gap-2.5 font-mono font-semibold tracking-tight text-ink"
            >
              <div className="w-8 h-8 rounded-lg border border-accent/20 bg-accent/10 flex items-center justify-center shadow-sm dark:shadow-none">
                <Braces size={17} className="text-accent" />
              </div>

              <span>
                complexity<span className="text-accent">()</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">

              <a
                href="#how-it-works"
                className="px-3 py-2 text-sm text-mute hover:text-ink hover:bg-raised rounded-md transition-all"
              >
                How it works
              </a>

              <a
                href="#analysis"
                className="px-3 py-2 text-sm text-mute hover:text-ink hover:bg-raised rounded-md transition-all"
              >
                Analysis
              </a>

              <a
                href="#features"
                className="px-3 py-2 text-sm text-mute hover:text-ink hover:bg-raised rounded-md transition-all"
              >
                Features
              </a>

            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">

              <ThemeToggle />

              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-mute hover:text-ink transition-colors"
              >
                Sign in
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium shadow-sm hover:shadow-md hover:opacity-95 transition-all"
              >
                Get started
                <ArrowRight size={15} />
              </Link>

            </div>

            {/* Mobile Actions */}
            <div className="md:hidden flex items-center gap-1">

              <ThemeToggle />

              <button
                type="button"
                onClick={() => setMobileMenuOpen((value) => !value)}
                className="p-2 rounded-md text-mute hover:text-ink hover:bg-raised transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? (
                  <X size={20} />
                ) : (
                  <Menu size={20} />
                )}
              </button>

            </div>

          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-line/10 py-4">

              <nav className="flex flex-col gap-1">

                <a
                  href="#how-it-works"
                  onClick={closeMenu}
                  className="px-3 py-2.5 rounded-md text-sm text-mute hover:text-ink hover:bg-raised"
                >
                  How it works
                </a>

                <a
                  href="#analysis"
                  onClick={closeMenu}
                  className="px-3 py-2.5 rounded-md text-sm text-mute hover:text-ink hover:bg-raised"
                >
                  Analysis
                </a>

                <a
                  href="#features"
                  onClick={closeMenu}
                  className="px-3 py-2.5 rounded-md text-sm text-mute hover:text-ink hover:bg-raised"
                >
                  Features
                </a>

                <div className="mt-3 pt-3 border-t border-line/10 flex gap-2">

                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="flex-1 text-center px-4 py-2.5 rounded-lg border border-line/20 text-sm text-ink hover:bg-raised"
                  >
                    Sign in
                  </Link>

                  <Link
                    to="/register"
                    onClick={closeMenu}
                    className="flex-1 text-center px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium"
                  >
                    Get started
                  </Link>

                </div>

              </nav>

            </div>
          )}

        </div>
      </header>

      <main>

        <section className="relative isolate overflow-hidden">

          {/* Light Theme Background */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50/80 via-white to-emerald-50/60 dark:bg-none" />

          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-blue-200/20 blur-3xl -z-10 dark:hidden" />

          <div className="absolute top-20 right-1/4 w-96 h-96 rounded-full bg-emerald-200/20 blur-3xl -z-10 dark:hidden" />

          <div className="absolute bottom-0 left-1/2 w-80 h-80 rounded-full bg-indigo-200/15 blur-3xl -z-10 dark:hidden" />

          <AnimatedBlobs />

          <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">

            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-4rem)] py-20 lg:py-24">

              {/* Hero Content */}
              <Reveal>

                <div className="max-w-2xl">

                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-accent/20 bg-white/70 dark:bg-accent/5 backdrop-blur-sm text-accent text-xs font-medium shadow-sm dark:shadow-none mb-6">
                    <Sparkles size={13} />
                    AI-Powered Code Analysis
                  </div>

                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] text-ink">
                    Understand your code&apos;s{' '}
                    <span className="text-accent">
                      complexity
                    </span>{' '}
                    before it runs.
                  </h1>

                  <p className="mt-6 text-base sm:text-lg leading-8 text-mute max-w-xl">
                    Analyze your source code and predict time complexity,
                    space complexity, structural risks, and performance
                    hotspots using static analysis and AI-enhanced insights.
                  </p>

                  <div className="mt-8 flex flex-col sm:flex-row gap-3">

                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-accent text-white font-medium shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/25 hover:opacity-95 transition-all"
                    >
                      Start analyzing
                      <ArrowRight size={17} />
                    </Link>

                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-line/20 bg-white/70 dark:bg-transparent text-ink font-medium shadow-sm hover:bg-raised hover:shadow-md transition-all"
                    >
                      Sign in
                    </Link>

                  </div>

                  {/* Supported Languages */}
                  <div className="mt-10">

                    <p className="text-xs uppercase tracking-[0.18em] text-mute mb-3">
                      Supported languages
                    </p>

                    <div className="flex flex-wrap gap-2">

                      {LANGUAGES.map((language) => (
                        <span
                          key={language.name}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-line/10 bg-white/75 dark:bg-raised backdrop-blur-sm text-sm text-ink shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                        >

                          {typeof language.icon === 'string' ? (
                            <span>{language.icon}</span>
                          ) : (
                            (() => {
                              const Icon = language.icon
                              return <Icon size={16} strokeWidth={1.8} />
                            })()
                          )}

                          {language.name}

                        </span>
                      ))}

                    </div>

                  </div>

                </div>

              </Reveal>

              {/* Hero Demo */}
              <Reveal delay={0.15}>

                <div className="relative">

                  <div className="rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-none">
                    <HeroDemo />
                  </div>

                </div>

              </Reveal>

            </div>

          </div>

        </section>
        <section
          id="analysis"
          className="relative py-20 lg:py-28 border-t border-line/10 bg-white/50 dark:bg-transparent"
        >

          <div className="absolute inset-0 pointer-events-none dark:hidden bg-gradient-to-b from-white via-blue-50/30 to-white" />

          <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">

            <Reveal>

              <div className="max-w-2xl">

                <p className="text-sm font-medium text-accent mb-3">
                  WHAT GETS ANALYZED
                </p>

                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
                  Go beyond a single Big-O label.
                </h2>

                <p className="mt-4 text-mute leading-7">
                  The analyzer looks at multiple aspects of your source code
                  to build a more useful complexity picture.
                </p>

              </div>

            </Reveal>

            <StaggerGroup className="relative mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">

              {ANALYSIS_ITEMS.map((item) => {
                const Icon = item.icon

                return (
                  <StaggerItem key={item.title}>

                    <div className="group h-full p-6 rounded-2xl border border-line/10 bg-white dark:bg-raised shadow-sm dark:shadow-none hover:shadow-lg hover:shadow-slate-900/5 hover:-translate-y-1 hover:border-accent/20 transition-all duration-300">

                      <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-accent/10 text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Icon size={20} />
                      </div>

                      <h3 className="mt-5 font-semibold text-ink">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-mute">
                        {item.description}
                      </p>

                    </div>

                  </StaggerItem>
                )
              })}

            </StaggerGroup>

          </div>
        </section>
        <section
          id="how-it-works"
          className="relative py-20 lg:py-28 border-y border-line/10 bg-slate-50/80 dark:bg-raised/40"
        >

          <div className="absolute inset-0 pointer-events-none dark:hidden bg-gradient-to-br from-blue-50/50 via-slate-50 to-indigo-50/40" />

          <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">

            <Reveal>

              <div className="max-w-2xl">

                <p className="text-sm font-medium text-accent mb-3">
                  HOW IT WORKS
                </p>

                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
                  From source code to actionable insight.
                </h2>

                <p className="mt-4 text-mute leading-7">
                  A straightforward workflow for understanding how your
                  implementation behaves as the input grows.
                </p>

              </div>

            </Reveal>

            <div className="mt-12 grid md:grid-cols-4 gap-5">

              {STEPS.map((step, index) => (
                <Reveal
                  key={step.number}
                  delay={index * 0.08}
                >

                  <div className="h-full p-6 rounded-2xl border border-line/10 bg-white dark:bg-panel shadow-sm dark:shadow-none hover:shadow-lg hover:shadow-slate-900/5 hover:-translate-y-1 transition-all duration-300">

                    <span className="font-mono text-sm text-accent">
                      {step.number}
                    </span>

                    <h3 className="mt-5 font-semibold text-ink">
                      {step.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-mute">
                      {step.description}
                    </p>

                  </div>

                </Reveal>
              ))}

            </div>

            {/* Analysis Flow */}
            <Reveal delay={0.2}>

              <div className="mt-10 p-5 sm:p-6 rounded-2xl border border-line/10 bg-white dark:bg-panel shadow-sm dark:shadow-none">

                <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">

                  {[
                    ['Code', Code2],
                    ['Static Analysis', ScanSearch],
                    ['Complexity', BarChart3],
                    ['AI Insights', Sparkles],
                  ].map(([label, Icon], index, array) => (

                    <div
                      key={label}
                      className="flex items-center gap-3 md:flex-1 md:justify-center"
                    >

                      <div className="flex items-center gap-3">

                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-accent/10 text-accent flex items-center justify-center shadow-sm">
                          <Icon size={17} />
                        </div>

                        <span className="text-sm font-medium text-ink">
                          {label}
                        </span>

                      </div>

                      {index < array.length - 1 && (
                        <ArrowRight
                          size={16}
                          className="hidden md:block mx-4 text-mute"
                        />
                      )}

                    </div>

                  ))}

                </div>

              </div>

            </Reveal>

          </div>
        </section>
        <section
          id="features"
          className="relative py-20 lg:py-28 bg-white dark:bg-transparent"
        >

          <div className="absolute inset-0 pointer-events-none dark:hidden bg-gradient-to-b from-white via-indigo-50/20 to-white" />

          <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">

            <Reveal>

              <div className="text-center max-w-2xl mx-auto">

                <p className="text-sm font-medium text-accent mb-3">
                  BUILT FOR CODE ANALYSIS
                </p>

                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
                  Everything you need to understand complexity.
                </h2>

                <p className="mt-4 text-mute leading-7">
                  Use structural analysis, AI explanations, history, reports,
                  and version comparison together in one workflow.
                </p>

              </div>

            </Reveal>

            <StaggerGroup className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">

              {FEATURES.map((feature) => {
                const Icon = feature.icon

                return (
                  <StaggerItem key={feature.title}>

                    <div className="group h-full p-6 rounded-2xl border border-line/10 bg-white dark:bg-raised shadow-sm dark:shadow-none hover:shadow-lg hover:shadow-slate-900/5 hover:-translate-y-1 hover:border-accent/20 transition-all duration-300">

                      <div className="flex items-start gap-4">

                        <div className="shrink-0 w-11 h-11 rounded-xl bg-blue-50 dark:bg-accent/10 text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Icon size={19} />
                        </div>

                        <div>

                          <h3 className="font-semibold text-ink">
                            {feature.title}
                          </h3>

                          <p className="mt-2 text-sm leading-6 text-mute">
                            {feature.description}
                          </p>

                        </div>

                      </div>

                    </div>

                  </StaggerItem>
                )
              })}

            </StaggerGroup>

          </div>
        </section>
        <section className="relative py-20 lg:py-28 border-y border-line/10 bg-slate-50/80 dark:bg-raised/40">

          <div className="absolute inset-0 pointer-events-none dark:hidden bg-gradient-to-br from-indigo-50/40 via-slate-50 to-blue-50/40" />

          <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">

            <div className="grid lg:grid-cols-2 gap-12 items-center">

              <Reveal>

                <div>

                  <p className="text-sm font-medium text-accent mb-3">
                    BEFORE EXECUTION
                  </p>

                  <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
                    Find expensive patterns before they become a performance
                    problem.
                  </h2>

                  <p className="mt-5 text-mute leading-7">
                    Complexity analysis helps you reason about scalability
                    without needing to execute every possible input. The
                    predictor combines structural code analysis with
                    AI-enhanced explanations to make those results easier to
                    understand.
                  </p>

                </div>

              </Reveal>

              <Reveal delay={0.12}>

                <div className="space-y-3">

                  {[
                    'Identify nested and repeated loops',
                    'Detect recursive patterns',
                    'Inspect functions and conditional structures',
                    'Review memory allocation patterns',
                    'Understand dependencies and code structure',
                    'Get optimization suggestions for higher-risk code',
                  ].map((item) => (

                    <div
                      key={item}
                      className="flex items-center gap-3 p-4 rounded-xl border border-line/10 bg-white dark:bg-panel shadow-sm dark:shadow-none hover:shadow-md transition-shadow"
                    >

                      <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-50 dark:bg-accent/10 flex items-center justify-center">

                        <CheckCircle2
                          size={17}
                          className="text-accent"
                        />

                      </div>

                      <span className="text-sm text-ink">
                        {item}
                      </span>

                    </div>

                  ))}

                </div>

              </Reveal>

            </div>

          </div>
        </section>
        <section className="relative py-20 lg:py-24 bg-white dark:bg-transparent">

          <div className="absolute inset-0 pointer-events-none dark:hidden bg-gradient-to-b from-white via-blue-50/20 to-white" />

          <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">

            <Reveal>

              <div className="text-center max-w-2xl mx-auto">

                <p className="text-sm font-medium text-accent mb-3">
                  LANGUAGE SUPPORT
                </p>

                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
                  Analyze the languages you actually use.
                </h2>

                <p className="mt-4 text-mute leading-7">
                  Choose your language and let the analyzer apply the
                  appropriate code-structure analysis.
                </p>

              </div>

            </Reveal>

            <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">

              {LANGUAGES.map((language) => {

                const Icon =
                  typeof language.icon === 'string'
                    ? null
                    : language.icon

                return (
                  <Reveal key={language.name}>

                    <div className="group h-full p-6 rounded-2xl border border-line/10 bg-white dark:bg-raised text-center shadow-sm dark:shadow-none hover:shadow-lg hover:shadow-slate-900/5 hover:-translate-y-1 hover:border-accent/20 transition-all duration-300">

                      {/* Language Icon */}
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-accent/10 text-accent flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">

                        {Icon ? (
                          <Icon
                            size={27}
                            strokeWidth={1.8}
                          />
                        ) : (
                          <span className="text-3xl">
                            {language.icon}
                          </span>
                        )}

                      </div>

                      <h3 className="mt-4 font-semibold text-ink">
                        {language.name}
                      </h3>

                      <p className="mt-2 text-xs sm:text-sm leading-5 text-mute">
                        {language.description}
                      </p>

                    </div>

                  </Reveal>
                )
              })}

            </div>

          </div>
        </section>
        <section className="relative py-20 lg:py-28 bg-white dark:bg-transparent">

          <div className="absolute inset-0 pointer-events-none dark:hidden bg-gradient-to-b from-white via-blue-50/40 to-white" />

          <div className="relative max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">

            <Reveal>

              <div className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:bg-accent/5 dark:bg-none p-8 sm:p-12 text-center shadow-lg shadow-blue-900/5 dark:shadow-none">

                <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-blue-200/30 blur-3xl dark:hidden" />

                <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-indigo-200/25 blur-3xl dark:hidden" />

                <div className="relative">

                  <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-100 dark:bg-accent/10 text-accent flex items-center justify-center">
                    <Braces size={22} />
                  </div>

                  <h2 className="mt-6 text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
                    Understand your code before you optimize it.
                  </h2>

                  <p className="mt-4 max-w-xl mx-auto text-mute leading-7">
                    Analyze your implementation, understand its complexity,
                    and identify opportunities to improve it.
                  </p>

                  <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">

                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-accent text-white font-medium shadow-md shadow-accent/20 hover:shadow-lg hover:opacity-95 transition-all"
                    >
                      Start analyzing
                      <ArrowRight size={17} />
                    </Link>

                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-line/20 bg-white dark:bg-transparent text-ink font-medium shadow-sm hover:bg-raised hover:shadow-md transition-all"
                    >
                      Sign in
                    </Link>

                  </div>

                </div>

              </div>

            </Reveal>

          </div>
        </section>

      </main>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer className="border-t border-line/10 bg-slate-50/70 dark:bg-transparent">

        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10">

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Brand */}
            <div className="lg:col-span-2">

              <Link
                to="/"
                className="inline-flex items-center gap-2 font-mono font-semibold text-ink"
              >

                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Braces
                    size={17}
                    className="text-accent"
                  />
                </div>

                <span>
                  complexity<span className="text-accent">()</span>
                </span>

              </Link>

              <p className="mt-4 max-w-md text-sm leading-6 text-mute">
                AI-powered source code analysis for understanding time
                complexity, space complexity, and performance-related code
                patterns.
              </p>

            </div>

            {/* Product */}
            <div>

              <h3 className="text-sm font-semibold text-ink">
                Product
              </h3>

              <div className="mt-4 flex flex-col gap-3">

                <a
                  href="#analysis"
                  className="text-sm text-mute hover:text-ink transition-colors"
                >
                  Analysis
                </a>

                <a
                  href="#features"
                  className="text-sm text-mute hover:text-ink transition-colors"
                >
                  Features
                </a>

                <a
                  href="#how-it-works"
                  className="text-sm text-mute hover:text-ink transition-colors"
                >
                  How it works
                </a>

                <Link
                  to="/login"
                  className="text-sm text-mute hover:text-ink transition-colors"
                >
                  Sign in
                </Link>

              </div>

            </div>

            {/* Resources */}
            <div>

              <h3 className="text-sm font-semibold text-ink">
                Resources
              </h3>

              <div className="mt-4 flex flex-col gap-3">

                <Link
                  to="/terms"
                  className="text-sm text-mute hover:text-ink transition-colors"
                >
                  Terms
                </Link>

                <Link
                  to="/privacy"
                  className="text-sm text-mute hover:text-ink transition-colors"
                >
                  Privacy
                </Link>

              </div>

            </div>

          </div>

          <div className="mt-10 pt-6 border-t border-line/10 flex flex-col sm:flex-row items-center justify-between gap-3">

            <p className="text-xs text-mute">
              AI Code Complexity Predictor
            </p>

            <p className="text-xs text-mute">
              Analyze. Understand. Optimize.
            </p>

          </div>

        </div>
      </footer>

    </div>
  )
}