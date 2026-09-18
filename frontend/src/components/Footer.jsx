import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-line/10 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <span className="font-mono text-ink font-semibold tracking-tight">
            complexity<span className="text-accent">()</span>
          </span>
          <p className="text-mute text-sm mt-3 leading-relaxed max-w-[220px]">
            Static complexity analysis for Python, Java, C, JavaScript, HTML, and CSS.
          </p>
        </div>

        <div>
          <p className="text-ink text-sm font-medium mb-3">Product</p>
          <ul className="space-y-2">
            <li><a href="/#how-it-works" className="text-mute text-sm hover:text-ink transition-colors">How it works</a></li>
            <li><a href="/#features" className="text-mute text-sm hover:text-ink transition-colors">Features</a></li>
            <li><Link to="/register" className="text-mute text-sm hover:text-ink transition-colors">Get started</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-ink text-sm font-medium mb-3">Account</p>
          <ul className="space-y-2">
            <li><Link to="/login" className="text-mute text-sm hover:text-ink transition-colors">Sign in</Link></li>
            <li><Link to="/register" className="text-mute text-sm hover:text-ink transition-colors">Create account</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-ink text-sm font-medium mb-3">Legal</p>
          <ul className="space-y-2">
            <li><Link to="/terms" className="text-mute text-sm hover:text-ink transition-colors">Terms and Conditions</Link></li>
            <li><Link to="/privacy" className="text-mute text-sm hover:text-ink transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line/10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-xs text-mute">© 2026 Code Complexity Predictor. Runs locally — your code never leaves this app.</span>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="text-xs text-mute hover:text-ink transition-colors">Terms</Link>
            <Link to="/privacy" className="text-xs text-mute hover:text-ink transition-colors">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
