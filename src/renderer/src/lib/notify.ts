import toast, { type ToastOptions, type Renderable } from 'react-hot-toast'
import { useUIStore } from '../store/uiStore'
import { useNotificationStore } from '../store/notificationStore'

function log(type: 'success' | 'error' | 'info' | 'warning', msg: string) {
  useNotificationStore.getState().addNotification(type, msg)
}

/* Plays a short sine-wave beep via the Web Audio API — no audio file needed */
function playBeep(type: 'success' | 'error' | 'info' = 'info') {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = type === 'error' ? 380 : type === 'success' ? 880 : 660
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.28)
    osc.onended = () => ctx.close()
  } catch {
    // AudioContext may be unavailable in some environments
  }
}

function gate(): { allowed: boolean; sound: boolean } {
  const { notificationsEnabled, soundEnabled } = useUIStore.getState()
  return { allowed: notificationsEnabled, sound: soundEnabled }
}

function securityGate(): { allowed: boolean; sound: boolean } {
  const { securityAlerts, notificationsEnabled, soundEnabled } = useUIStore.getState()
  return { allowed: notificationsEnabled && securityAlerts, sound: soundEnabled }
}

function updateGate(): { allowed: boolean; sound: boolean } {
  const { updateNotifs, notificationsEnabled, soundEnabled } = useUIStore.getState()
  return { allowed: notificationsEnabled && updateNotifs, sound: soundEnabled }
}

/* General notifications — respects notificationsEnabled + soundEnabled */
export const notify = {
  success(msg: string, opts?: ToastOptions) {
    const { allowed, sound } = gate()
    log('success', msg)
    if (!allowed) return
    if (sound) playBeep('success')
    toast.success(msg, opts)
  },
  error(msg: string, opts?: ToastOptions) {
    const { allowed, sound } = gate()
    log('error', msg)
    if (!allowed) return
    if (sound) playBeep('error')
    toast.error(msg, opts)
  },
  info(msg: string, opts?: ToastOptions) {
    const { allowed, sound } = gate()
    log('info', msg)
    if (!allowed) return
    if (sound) playBeep('info')
    toast(msg, opts)
  },
  loading(msg: string, opts?: ToastOptions): string {
    const { allowed } = gate()
    if (!allowed) return ''
    return toast.loading(msg, opts)
  },
  dismiss: toast.dismiss,
}

/* Security-specific notifications — gated by securityAlerts */
export const securityNotify = {
  warn(msg: string, opts?: ToastOptions) {
    const { allowed, sound } = securityGate()
    log('warning', msg)
    if (!allowed) return
    if (sound) playBeep('error')
    toast.error(msg, { icon: '🔒', ...opts })
  },
}

/* Update-specific notifications — gated by updateNotifs */
export const updateNotify = {
  info(msg: Renderable, opts?: ToastOptions) {
    const { allowed, sound } = updateGate()
    if (typeof msg === 'string') log('info', msg)
    if (!allowed) return ''
    if (sound) playBeep('info')
    return toast(msg, opts)
  },
  success(msg: string, opts?: ToastOptions) {
    const { allowed, sound } = updateGate()
    log('success', msg)
    if (!allowed) return
    if (sound) playBeep('success')
    toast.success(msg, opts)
  },
}
