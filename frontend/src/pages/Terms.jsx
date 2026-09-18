import LegalPage from './LegalPage'

const SECTIONS = [
  ['1. Acceptance of terms', [
    'By creating an account or using Code Complexity Predictor ("the Service"), you agree to these Terms and Conditions. If you do not agree, do not use the Service.',
  ]],
  ['2. What the Service does', [
    'The Service accepts source code you submit (pasted or uploaded) and returns a static analysis: structural metrics, an estimated time and space complexity, a risk score, and optimization suggestions. Submitted code is analyzed as text and is never executed.',
  ]],
  ['3. Your content', [
    'You retain all rights to any code you submit. You are responsible for ensuring you have the right to submit that code for analysis, including with respect to any employer or client confidentiality obligations. We do not claim ownership over your submitted code.',
  ]],
  ['4. Accounts', [
    'You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us promptly if you suspect unauthorized use.',
  ]],
  ['5. Acceptable use', [
    'You agree not to use the Service to submit malicious code intended to test, probe, or exploit the Service itself, to abuse rate limits, or to attempt to reverse engineer the analysis pipeline.',
  ]],
  ['6. Accuracy of results', [
    'Complexity estimates are heuristic and, where enabled, AI-assisted. They are provided for guidance and are not a formal proof of algorithmic complexity. The Service is provided "as is" without warranty of any kind, express or implied.',
  ]],
  ['7. Limitation of liability', [
    'To the maximum extent permitted by law, the Service and its operators are not liable for any indirect, incidental, or consequential damages arising from use of, or inability to use, the Service.',
  ]],
  ['8. Changes to the Service', [
    'Features, limits, and availability may change at any time. We will make reasonable efforts to communicate material changes.',
  ]],
  ['9. Termination', [
    'You may stop using the Service at any time. We may suspend or terminate accounts that violate these terms.',
  ]],
  ['10. Contact', [
    'Questions about these terms can be directed to the project maintainer through the channel this application was provided to you.',
  ]],
]

export default function Terms() {
  return (
    <LegalPage
      title="Terms and Conditions"
      updated="Template document \u00b7 last updated September 2026"
      pdfHref="/legal/terms.pdf"
      sections={SECTIONS}
    />
  )
}
