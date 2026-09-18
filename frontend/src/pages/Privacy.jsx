import LegalPage from './LegalPage'

const SECTIONS = [
  ['1. What we collect', [
    'Account information: email address and display name, provided via Firebase Authentication (including through Google Sign-In if you choose that option).',
    'Submitted code and filenames: stored so you can view your analysis history and dashboard.',
    'Usage data: timestamps of analyses, selected language, and derived metrics (risk score, complexity estimate).',
    'Push notification subscriptions, only if you explicitly opt in to browser notifications.',
  ]],
  ['2. How we use it', [
    'To provide the core analysis feature and show you your own history and statistics.',
    'To send in-app and, if enabled, browser push notifications about your own analysis results.',
    'To operate caching (Redis) so repeated identical submissions return faster.',
  ]],
  ['3. AI-assisted analysis', [
    "When AI enhancement is enabled, submitted code may be sent to Google's Gemini API to refine the complexity estimate. Review Google's own data handling terms for details on how that provider processes the request.",
  ]],
  ['4. Data storage and retention', [
    'Analysis history and account data are stored in MongoDB. Data is retained until you request deletion or your account is removed.',
  ]],
  ['5. Data sharing', [
    'We do not sell your data. Data is shared only with the service providers necessary to operate the app (authentication, database, optional AI enhancement, optional push notification delivery), and only to the extent needed to provide the Service.',
  ]],
  ['6. Your choices', [
    'You can disable browser push notifications at any time from your browser settings.',
    'You can request deletion of your account and associated analysis history.',
  ]],
  ['7. Security', [
    'Access to your data requires authentication. We apply reasonable technical safeguards, but no system is completely secure, and no guarantee of absolute security can be made.',
  ]],
  ["8. Children's privacy", [
    'The Service is not directed at children under 13, and we do not knowingly collect data from them.',
  ]],
  ['9. Changes to this policy', [
    'We may update this policy from time to time. Material changes will be reflected in the "last updated" date above.',
  ]],
  ['10. Contact', [
    'Questions about this policy can be directed to the project maintainer through the channel this application was provided to you.',
  ]],
]

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="Template document \u00b7 last updated September 2026"
      pdfHref="/legal/privacy.pdf"
      sections={SECTIONS}
    />
  )
}
