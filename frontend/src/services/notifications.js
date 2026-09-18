// ============================================================
// Real-time Notifications
// WebSocket + Chrome Desktop Notification
// ============================================================

let socket = null
let keepAliveTimer = null

const BACKEND_WS_URL = 'ws://127.0.0.1:5000'


// ============================================================
// CONNECT REALTIME
// ============================================================

export function connectRealtime(userId, onMessage) {
  if (!userId) {
    console.warn('Notification connection skipped: no userId')
    return () => {}
  }

  // Close previous connection if any
  if (socket) {
    try {
      socket.close()
    } catch {
      // ignore
    }
    socket = null
  }

  const wsUrl =
    `${BACKEND_WS_URL}/api/v1/notifications/ws/${userId}`

  console.log('Connecting to notification WebSocket:', wsUrl)

  socket = new WebSocket(wsUrl)

  // ----------------------------------------------------------
  // Connected
  // ----------------------------------------------------------

  socket.onopen = () => {
    console.log('✅ Real-time notifications connected')
  }

  // ----------------------------------------------------------
  // Notification received
  // ----------------------------------------------------------

  socket.onmessage = (event) => {
    console.log('📩 Raw notification received:', event.data)

    try {
      const payload = JSON.parse(event.data)

      console.log('🔔 Notification payload:', payload)

      // Existing in-app notification
      if (typeof onMessage === 'function') {
        onMessage(payload)
      }

      // Chrome desktop notification
      showBrowserNotification(payload)

    } catch (error) {
      console.error(
        '❌ Failed to process notification:',
        error
      )
    }
  }

  // ----------------------------------------------------------
  // Error
  // ----------------------------------------------------------

  socket.onerror = (error) => {
    console.error(
      '❌ Notification WebSocket error:',
      error
    )
  }

  // ----------------------------------------------------------
  // Closed
  // ----------------------------------------------------------

  socket.onclose = (event) => {
    console.log(
      '🔌 Real-time notifications disconnected:',
      event.code,
      event.reason || ''
    )
  }

  // ----------------------------------------------------------
  // Keep connection alive
  // ----------------------------------------------------------

  keepAliveTimer = setInterval(() => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send('ping')
    }
  }, 25000)

  // ----------------------------------------------------------
  // Cleanup
  // ----------------------------------------------------------

  return () => {
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer)
      keepAliveTimer = null
    }

    if (socket) {
      try {
        socket.close()
      } catch {
        // ignore
      }

      socket = null
    }
  }
}


// ============================================================
// CHROME DESKTOP NOTIFICATION
// ============================================================

function showBrowserNotification(payload) {
  console.log('🔔 Attempting browser notification...')

  // Browser support
  if (!('Notification' in window)) {
    console.warn(
      '❌ Browser does not support notifications.'
    )
    return
  }

  // Permission status
  console.log(
    'Notification permission:',
    Notification.permission
  )

  // User blocked notifications
  if (Notification.permission !== 'granted') {
    console.warn(
      '❌ Notification permission is not granted.'
    )
    return
  }

  const title =
    payload?.title ||
    'CodeComplexity'

  const body =
    payload?.body ||
    'Code analysis completed.'

  try {
    const notification = new Notification(title, {
      body: body,

      // Use payload icon if available
      icon:
        payload?.icon ||
        '/favicon.ico',

      tag:
        `codecomplexity-${Date.now()}`,

      requireInteraction: false,
    })

    console.log(
      '✅ Chrome notification displayed'
    )

    // Click notification
    notification.onclick = () => {
      window.focus()

      if (payload?.url) {
        window.location.href = payload.url
      }

      notification.close()
    }

    // Auto close
    setTimeout(() => {
      notification.close()
    }, 6000)

  } catch (error) {
    console.error(
      '❌ Chrome notification creation failed:',
      error
    )
  }
}