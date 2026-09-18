import { Link } from 'react-router-dom'
import { Download, ArrowLeft } from 'lucide-react'
import PublicNav from '../components/PublicNav'
import Footer from '../components/Footer'

export default function LegalPage({ title, updated, pdfHref, sections }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav variant="landing" />

      <div className="max-w-3xl mx-auto px-6 py-16 flex-1 w-full">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink transition-colors mb-8">
          <ArrowLeft size={14} />
          Back home
        </Link>

        <div className="flex items-start justify-between gap-6 flex-wrap mb-2">
          <h1 className="text-3xl font-semibold text-ink">{title}</h1>
          <a
            href={pdfHref}
            download
            className="inline-flex items-center gap-2 px-4 py-2 border border-line/10 rounded-md text-sm text-ink hover:bg-raised transition-colors shrink-0"
          >
            <Download size={15} />
            Download PDF
          </a>
        </div>
        <p className="text-sm text-mute mb-12">{updated}</p>

        <div className="space-y-8">
          {sections.map(([heading, paragraphs]) => (
            <div key={heading}>
              <h2 className="text-ink font-medium mb-2">{heading}</h2>
              {paragraphs.map((p, i) => (
                <p key={i} className="text-mute text-sm leading-relaxed mb-2">{p}</p>
              ))}
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  )
}
