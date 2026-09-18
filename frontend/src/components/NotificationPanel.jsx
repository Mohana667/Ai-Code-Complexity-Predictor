export default function NotificationPanel({ notifications, open, onClose }) {
  if (!open) return null
  return (
    <div className="fixed top-16 right-6 w-80 bg-panel border border-line/10 rounded-lg shadow-xl z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line/10">
        <p className="text-sm text-ink font-medium">Notifications</p>
        <button onClick={onClose} className="text-mute hover:text-ink text-sm">Close</button>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-line/10">
        {notifications.length === 0 ? (
          <p className="text-mute text-sm px-4 py-6 text-center">Nothing yet — analyze some code.</p>
        ) : (
          notifications.map((n, i) => (
            <div key={i} className="px-4 py-3">
              <p className="text-sm text-ink">{n.title}</p>
              <p className="text-xs text-mute mt-1">{n.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
