import { useEffect, useMemo, useState } from 'react'
import {
  Eye,
  Download,
  X,
  Loader2,
  AlertTriangle,
  Code2,
} from 'lucide-react'

import {
  getHistory,
  getAnalysis,
} from '../services/api'

import { downloadAnalysisPdf } from '../utils/pdfReport'

const RISK_COLOR = {
  low: 'text-mint',
  moderate: 'text-amber',
  high: 'text-red',
  critical: 'text-red',
}

export default function History() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  const [selected, setSelected] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [detailError, setDetailError] = useState('')

  useEffect(() => {
    getHistory(50)
      .then(setItems)
      .catch(() =>
        setError(
          'Could not load history — check the backend is running.'
        )
      )
  }, [])

  const languages = useMemo(() => {
    if (!items) return []

    return Array.from(
      new Set(items.map((item) => item.language))
    )
  }, [items])

  const filtered = useMemo(() => {
    if (!items) return []

    return filter === 'all'
      ? items
      : items.filter(
          (item) => item.language === filter
        )
  }, [items, filter])

  async function handleView(id) {
    setLoadingDetails(true)
    setDetailError('')

    try {
      const data = await getAnalysis(id)
      setSelected(data)
    } catch (err) {
      setDetailError(
        err?.response?.data?.detail ||
          'Unable to load this analysis.'
      )
    } finally {
      setLoadingDetails(false)
    }
  }

  function closeDetails() {
    setSelected(null)
    setDetailError('')
  }

  function handleDownload(item) {
    downloadAnalysisPdf(item)
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-ink">
            History
          </h1>

          <p className="text-mute text-sm mt-1.5">
            Every analysis you've run, most recent first.
          </p>
        </div>

        {languages.length > 1 && (
          <select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value)
            }
            className="bg-panel border border-line/10 rounded-md px-3 py-1.5 text-sm text-ink font-mono focus:border-accent outline-none"
          >
            <option value="all">
              All languages
            </option>

            {languages.map((language) => (
              <option
                key={language}
                value={language}
              >
                {language}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-red text-sm border border-red/20 bg-red/5 rounded-md px-4 py-3 inline-block">
          {error}
        </p>
      )}

      {/* Loading */}
      {!error && !items && (
        <p className="text-mute text-sm">
          Loading…
        </p>
      )}

      {/* Empty */}
      {items && items.length === 0 && (
        <div className="border border-dashed border-line/10 rounded-lg py-16 text-center text-mute text-sm">
          No analyses yet — run one from the
          Analyze tab.
        </div>
      )}

      {/* History list */}
      {items && items.length > 0 && (
        <div className="border border-line/10 rounded-lg divide-y divide-line/10 overflow-hidden">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-raised transition-colors"
            >
              {/* Information */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Code2
                    size={16}
                    className="text-accent shrink-0"
                  />

                  <p className="text-sm text-ink truncate">
                    {item.filename ||
                      `${item.language} snippet`}
                  </p>
                </div>

                <p className="text-xs text-mute mt-1">
                  {new Date(
                    item.created_at
                  ).toLocaleString()}{' '}
                  · {item.language}
                </p>
              </div>

              {/* Result */}
              <div className="flex items-center gap-5 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="font-mono text-sm text-ink">
                    {item.estimate
                      ?.time_complexity || 'N/A'}
                  </p>

                  <p
                    className={`text-xs mt-0.5 ${
                      RISK_COLOR[
                        item.estimate?.risk_level
                      ] || 'text-mute'
                    }`}
                  >
                    {item.estimate
                      ?.risk_level || 'unknown'}
                  </p>
                </div>

                {/* View */}
                <button
                  onClick={() =>
                    handleView(item.id)
                  }
                  disabled={loadingDetails}
                  title="View analysis"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-line/10 text-sm text-ink hover:bg-raised hover:border-accent/30 transition-colors disabled:opacity-50"
                >
                  <Eye size={15} />
                  <span className="hidden sm:inline">
                    View
                  </span>
                </button>

                {/* PDF */}
                <button
                  onClick={() =>
                    handleDownload(item)
                  }
                  title="Download PDF"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-accent text-white text-sm hover:opacity-90 transition-opacity"
                >
                  <Download size={15} />
                  <span className="hidden sm:inline">
                    PDF
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No filtered result */}
      {items &&
        items.length > 0 &&
        filtered.length === 0 && (
          <div className="border border-dashed border-line/10 rounded-lg py-12 text-center text-mute text-sm">
            No analyses found for this language.
          </div>
        )}

      {/* Loading detail */}
      {loadingDetails && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-panel border border-line/10 rounded-xl px-6 py-5 flex items-center gap-3">
            <Loader2
              size={20}
              className="animate-spin text-accent"
            />

            <span className="text-sm text-ink">
              Loading analysis…
            </span>
          </div>
        </div>
      )}

      {/* Detail error */}
      {detailError && !loadingDetails && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center px-5">
          <div className="bg-panel border border-red/20 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={20}
                className="text-red shrink-0"
              />

              <div>
                <h3 className="text-ink font-semibold">
                  Unable to open analysis
                </h3>

                <p className="text-mute text-sm mt-1">
                  {detailError}
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                setDetailError('')
              }
              className="mt-5 px-4 py-2 rounded-md bg-accent text-white text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Full analysis modal */}
      {selected && (
        <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm overflow-y-auto p-4 sm:p-8">
          <div className="max-w-5xl mx-auto bg-panel border border-line/10 rounded-2xl shadow-2xl">
            {/* Modal header */}
            <div className="sticky top-0 z-10 bg-panel border-b border-line/10 px-5 sm:px-7 py-4 flex items-center justify-between gap-4 rounded-t-2xl">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-ink truncate">
                  {selected.filename ||
                    `${selected.language} Analysis`}
                </h2>

                <p className="text-xs text-mute mt-1">
                  {selected.language} ·{' '}
                  {new Date(
                    selected.created_at
                  ).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleDownload(selected)
                  }
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-accent text-white text-sm hover:opacity-90"
                >
                  <Download size={15} />
                  Download PDF
                </button>

                <button
                  onClick={closeDetails}
                  title="Close"
                  className="p-2 rounded-md text-mute hover:text-ink hover:bg-raised"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            {/* Modal content */}
            <div className="p-5 sm:p-7 space-y-6">
              {/* Complexity cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ResultCard
                  label="Time Complexity"
                  value={
                    selected.estimate
                      ?.time_complexity
                  }
                />

                <ResultCard
                  label="Space Complexity"
                  value={
                    selected.estimate
                      ?.space_complexity
                  }
                />

                <ResultCard
                  label="Risk"
                  value={
                    selected.estimate?.risk_level
                  }
                  extra={
                    selected.estimate?.risk_score !==
                    undefined
                      ? `${selected.estimate.risk_score}/100`
                      : ''
                  }
                />
              </div>

              {/* Metrics */}
              <section>
                <SectionTitle>
                  Structural Metrics
                </SectionTitle>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Metric
                    label="Lines"
                    value={
                      selected.metrics
                        ?.lines_of_code
                    }
                  />

                  <Metric
                    label="Loops"
                    value={
                      selected.metrics?.loop_count
                    }
                  />

                  <Metric
                    label="Nested Loops"
                    value={
                      selected.metrics
                        ?.nested_loop_depth
                    }
                  />

                  <Metric
                    label="Functions"
                    value={
                      selected.metrics
                        ?.function_count
                    }
                  />

                  <Metric
                    label="Nesting"
                    value={
                      selected.metrics
                        ?.max_nesting_depth
                    }
                  />

                  <Metric
                    label="Conditionals"
                    value={
                      selected.metrics
                        ?.conditional_count
                    }
                  />

                  <Metric
                    label="Dependencies"
                    value={
                      selected.metrics
                        ?.dependency_count
                    }
                  />

                  <Metric
                    label="Cyclomatic"
                    value={
                      selected.metrics
                        ?.cyclomatic_complexity
                    }
                  />
                </div>
              </section>

              {/* Explanation */}
              <TextSection
                title="Complexity Explanation"
                text={
                  selected.estimate
                    ?.explanation
                }
              />

              {/* Hotspots */}
              <ListSection
                title="Performance Hotspots"
                items={
                  selected.estimate?.hotspots
                }
              />

              {/* Suggestions */}
              <ListSection
                title="Optimization Suggestions"
                items={
                  selected.estimate
                    ?.optimization_suggestions
                }
              />

              {/* Source code */}
              <section>
                <SectionTitle>
                  Source Code
                </SectionTitle>

                <pre className="bg-raised border border-line/10 rounded-lg p-4 overflow-x-auto text-xs leading-5 text-ink font-mono max-h-[450px]">
                  {selected.code ||
                    'Source code was not stored for this analysis.'}
                </pre>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ResultCard({
  label,
  value,
  extra,
}) {
  return (
    <div className="bg-raised border border-line/10 rounded-xl p-4">
      <p className="text-xs text-mute">
        {label}
      </p>

      <p className="text-xl font-semibold text-ink font-mono mt-2">
        {value || 'N/A'}
      </p>

      {extra && (
        <p className="text-xs text-mute mt-1">
          {extra}
        </p>
      )}
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="bg-raised border border-line/10 rounded-lg p-3">
      <p className="text-xs text-mute">
        {label}
      </p>

      <p className="text-lg font-semibold text-ink mt-1">
        {value ?? 'N/A'}
      </p>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-sm font-semibold text-ink mb-3">
      {children}
    </h3>
  )
}

function TextSection({ title, text }) {
  return (
    <section>
      <SectionTitle>
        {title}
      </SectionTitle>

      <div className="bg-raised border border-line/10 rounded-lg p-4 text-sm text-ink leading-6 whitespace-pre-wrap">
        {text || 'No information available.'}
      </div>
    </section>
  )
}

function ListSection({ title, items }) {
  return (
    <section>
      <SectionTitle>
        {title}
      </SectionTitle>

      <div className="bg-raised border border-line/10 rounded-lg p-4">
        {items?.length ? (
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li
                key={index}
                className="text-sm text-ink leading-6 flex gap-2"
              >
                <span className="text-accent">
                  •
                </span>

                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-mute">
            No information available.
          </p>
        )}
      </div>
    </section>
  )
}