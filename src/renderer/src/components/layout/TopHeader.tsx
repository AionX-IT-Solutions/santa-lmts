import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Sun, Moon, Bell, CheckCheck, Trash2, X, ShieldAlert, Info, CircleCheck, CircleX } from 'lucide-react'
import toast from 'react-hot-toast'
import { updateNotify } from '../../lib/notify'
import { useNotificationStore, type AppNotification, type NotifType } from '../../store/notificationStore'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'

const PAGE_MAP: Record<string, { module: string; title: string }> = {
  '/dashboard': { module: 'Overview', title: 'Dashboard' },
  '/ordinances': { module: 'Legislation', title: 'Ordinances' },
  '/resolutions': { module: 'Legislation', title: 'Resolutions' },
  '/draft-ordinances': { module: 'Drafts', title: 'Draft Ordinances' },
  '/draft-resolutions': { module: 'Drafts', title: 'Draft Resolutions' },
  '/minutes': { module: 'Sessions', title: 'Calendar of Business' },
  '/tricycle': { module: 'Franchise', title: 'Tricycle Franchise' },
  '/barangay': { module: 'Local Affairs', title: 'Barangay Actions' },
  '/communications': { module: 'Communications', title: 'Other Communications' },
  '/transcript': { module: 'Sessions', title: 'Transcript of Proceedings' },
  '/committees': { module: 'Committees', title: 'Standing Committees' },
  '/committee-reports': { module: 'Committees', title: 'Committee Reports' },
  '/review': { module: 'Local Affairs', title: 'Barangay Review' },
  '/judicial': { module: 'Legal', title: 'Quasi-Judicial Function' },
  '/corrections': { module: 'Documents', title: 'Addendum & Corrections' },
  '/incoming': { module: 'Documents', title: 'Incoming Documents' },
  '/other-matters': { module: 'Sessions', title: 'Other Matters' },
  '/officials': { module: 'Officials', title: 'S.B. Officials' },
  '/send-email': { module: 'Communications', title: 'Send to Email' },
  '/accounts': { module: 'Administration', title: 'Account Management' },
  '/logs': { module: 'Administration', title: 'Activity Log' },
  '/settings': { module: 'System', title: 'Settings' },
  '/about': { module: 'System', title: 'About' }
}

function IconBtn({
  onClick,
  title,
  isDark,
  children
}: {
  onClick?: () => void
  title?: string
  isDark: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        flexShrink: 0,
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: isDark ? '#64748b' : '#94a3b8',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)'
        el.style.color = isDark ? '#e2e8f0' : '#0f172a'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
        el.style.color = isDark ? '#64748b' : '#94a3b8'
      }}
    >
      {children}
    </button>
  )
}

/* ── helpers ────────────────────────────────────────────────── */
function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

const TYPE_META: Record<NotifType, { color: string; icon: React.ReactNode }> = {
  success: { color: '#10b981', icon: <CircleCheck size={14} /> },
  error:   { color: '#ef4444', icon: <CircleX size={14} /> },
  info:    { color: '#06b6d4', icon: <Info size={14} /> },
  warning: { color: '#f59e0b', icon: <ShieldAlert size={14} /> },
}

function NotifItem({ n, onRemove, isDark }: { n: AppNotification; onRemove: () => void; isDark: boolean }) {
  const meta = TYPE_META[n.type]
  return (
    <div
      style={{
        display: 'flex', gap: 10, padding: '10px 14px',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
        background: n.read ? 'transparent' : isDark ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.04)',
        transition: 'background 0.15s',
      }}
    >
      <span style={{ color: meta.color, flexShrink: 0, marginTop: 1 }}>{meta.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, color: 'var(--c-text-1)', lineHeight: '1.4', wordBreak: 'break-word' }}>{n.message}</p>
        <p style={{ fontSize: 10, color: 'var(--c-text-3)', marginTop: 3 }}>{timeAgo(n.timestamp)}</p>
      </div>
      <button
        onClick={onRemove}
        style={{
          flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--c-text-3)', padding: 2, borderRadius: 4, display: 'flex', alignItems: 'center',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--c-text-3)' }}
      >
        <X size={11} />
      </button>
    </div>
  )
}

export function TopHeader() {
  const location = useLocation()
  const { user } = useAuthStore()
  const { theme, toggleTheme } = useUIStore()
  const { notifications, markAllRead, removeNotification, clearAll } = useNotificationStore()
  const [panelOpen, setPanelOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const unread = notifications.filter((n) => !n.read).length

  useEffect(() => {
    if (!panelOpen) return
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [panelOpen])

  function openPanel() {
    setPanelOpen((v) => !v)
    if (!panelOpen) markAllRead()
  }

  const page = PAGE_MAP[location.pathname] ?? { module: 'LMTS', title: 'Dashboard' }
  const isDark = theme === 'dark'

  useEffect(() => {
    const ipc = window.electron.ipcRenderer

    const offAvailable = ipc.on('update-available', (_e, version: string) => {
      updateNotify.info(`Update v${version} is downloading...`, { icon: '⬇️', duration: 5000 })
    })

    const offDownloaded = ipc.on('update-downloaded', () => {
      const { updateNotifs, notificationsEnabled } = useUIStore.getState()
      if (!notificationsEnabled || !updateNotifs) return
      toast(
        (t) => (
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Update ready to install.
            <button
              onClick={() => {
                toast.dismiss(t.id)
                window.electron.ipcRenderer.send('install-update')
              }}
              style={{
                padding: '4px 10px',
                background: 'var(--c-accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              Restart & Update
            </button>
          </span>
        ),
        { duration: Infinity, icon: '✅' }
      )
    })

    return () => {
      offAvailable()
      offDownloaded()
    }
  }, [])
  const fullName = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : 'User'
  const initials = user
    ? [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join('').toUpperCase()
    : 'U'

  return (
    <header
      className="drag-region"
      style={{
        height: 58,
        background: isDark ? '#0d1424' : '#ffffff',
        borderBottom: isDark ? '1px solid rgba(99,102,241,0.12)' : '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 22px',
        flexShrink: 0,
        zIndex: 10
      }}
    >
      {/* Left: breadcrumb */}
      <div className="no-drag">
        <p
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#3b82f6',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            lineHeight: 1
          }}
        >
          LMTS &nbsp;·&nbsp; {page.module}
        </p>
        <h2
          style={{
            fontSize: 17,
            fontWeight: 700,
            lineHeight: 1.2,
            marginTop: 3,
            color: isDark ? '#e2e8f0' : '#0f172a'
          }}
        >
          {page.title}
        </h2>
      </div>

      {/* Right: actions + user */}
      <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <IconBtn
          isDark={isDark}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggleTheme}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </IconBtn>

        <div ref={panelRef} style={{ position: 'relative' }}>
          <IconBtn isDark={isDark} title="Notifications" onClick={openPanel}>
            <Bell size={15} />
          </IconBtn>

          {/* Unread badge */}
          {unread > 0 && (
            <span
              style={{
                position: 'absolute', top: 5, right: 5,
                minWidth: 14, height: 14, borderRadius: 7,
                background: '#ef4444',
                border: isDark ? '1.5px solid #0d1424' : '1.5px solid #ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700, color: '#fff',
                pointerEvents: 'none', lineHeight: 1, padding: '0 3px',
              }}
            >
              {unread > 9 ? '9+' : unread}
            </span>
          )}

          {/* Notification panel */}
          {panelOpen && (
            <div
              style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 320,
                background: isDark ? 'rgba(10,18,38,0.97)' : 'rgba(255,255,255,0.98)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
                borderRadius: 14,
                boxShadow: isDark
                  ? '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)'
                  : '0 20px 60px rgba(0,0,0,0.15)',
                zIndex: 200,
                overflow: 'hidden',
              }}
            >
              {/* Panel header */}
              <div
                style={{
                  padding: '14px 14px 10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Bell size={13} style={{ color: 'var(--c-accent)' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-1)' }}>Notifications</span>
                  {notifications.length > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, color: 'var(--c-accent)',
                      background: 'rgba(99,102,241,0.12)', borderRadius: 999, padding: '1px 6px',
                    }}>
                      {notifications.length}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {notifications.length > 0 && (
                    <>
                      <button
                        onClick={markAllRead}
                        title="Mark all read"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--c-text-3)', padding: '3px 5px', borderRadius: 6,
                          display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--c-accent)' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--c-text-3)' }}
                      >
                        <CheckCheck size={12} /> Read all
                      </button>
                      <button
                        onClick={clearAll}
                        title="Clear all"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--c-text-3)', padding: '3px 5px', borderRadius: 6,
                          display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--c-text-3)' }}
                      >
                        <Trash2 size={12} /> Clear
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="scrollbar-thin" style={{ maxHeight: 340, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                    <Bell size={28} style={{ color: 'var(--c-text-3)', margin: '0 auto 10px' }} />
                    <p style={{ fontSize: 13, color: 'var(--c-text-2)', fontWeight: 500 }}>No notifications</p>
                    <p style={{ fontSize: 11, color: 'var(--c-text-3)', marginTop: 4 }}>You're all caught up!</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <NotifItem
                      key={n.id}
                      n={n}
                      isDark={isDark}
                      onRemove={() => removeNotification(n.id)}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 28,
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            margin: '0 6px'
          }}
        />

        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'default' }}>
          <div style={{ textAlign: 'right' }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                color: isDark ? '#e2e8f0' : '#0f172a'
              }}
            >
              {fullName}
            </p>
            <p
              style={{
                fontSize: 11,
                lineHeight: 1.2,
                marginTop: 1,
                color: isDark ? '#475569' : '#64748b'
              }}
            >
              {user?.role}
            </p>
          </div>

          {user?.fileUrl ? (
            <img
              src={user.fileUrl}
              alt="avatar"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                objectFit: 'cover',
                flexShrink: 0,
                border: '2px solid rgba(37,99,235,0.35)'
              }}
            />
          ) : (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                flexShrink: 0,
                background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                boxShadow: '0 2px 8px rgba(37,99,235,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                color: '#fff'
              }}
            >
              {initials}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
