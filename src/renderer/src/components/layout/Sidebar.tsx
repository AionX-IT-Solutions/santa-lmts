import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { useT } from '../../lib/i18n'
import { Modal } from '../ui/Modal'
import { cn } from '../../lib/utils'
import {
  LayoutDashboard,
  ScrollText,
  FileCheck,
  BookOpen,
  Bike,
  MessageSquare,
  Mic,
  GitMerge,
  Scale,
  Mail,
  PenTool,
  UserCog,
  Users,
  UserSquare,
  ChevronDown,
  FileEdit,
  ArrowDownToLine,
  ClipboardList,
  LogOut,
  Building2,
  Scroll,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Settings,
  Info
} from 'lucide-react'

type TKey = Parameters<ReturnType<typeof useT>>[0]

interface NavItem {
  label: string
  tKey: TKey
  icon: React.ReactNode
  path?: string
  privilege?: string
  children?: NavItem[]
}

const NAV: NavItem[] = [
  { label: 'Dashboard', tKey: 'dashboard', icon: <LayoutDashboard size={16} />, path: '/dashboard' },
  { label: 'Calendar of Business', tKey: 'calendarOfBusiness', icon: <BookOpen size={16} />, path: '/minutes', privilege: 'Calendar of Business' },
  { label: 'Ordinances', tKey: 'ordinances', icon: <ScrollText size={16} />, path: '/ordinances', privilege: 'Ordinances' },
  { label: 'Resolutions', tKey: 'resolutions', icon: <FileCheck size={16} />, path: '/resolutions', privilege: 'Resolutions' },
  {
    label: 'Draft Documents', tKey: 'draftDocuments',
    icon: <FileEdit size={16} />,
    privilege: 'Draft Ordinance/s and Draft Resolutions',
    children: [
      { label: 'Draft Ordinances', tKey: 'draftOrdinances', icon: <FileEdit size={15} />, path: '/draft-ordinances' },
      { label: 'Draft Resolutions', tKey: 'draftResolutions', icon: <FileEdit size={15} />, path: '/draft-resolutions' },
      { label: 'Communications', tKey: 'draftCommunications', icon: <FileEdit size={15} />, path: '/draft-communications' },
      { label: 'Petitions', tKey: 'draftPetitions', icon: <FileEdit size={15} />, path: '/draft-petitions' },
      { label: 'Messages & Memorials', tKey: 'draftMessagesMemorials', icon: <FileEdit size={15} />, path: '/draft-messages-memorials' }
    ]
  },
  { label: 'Transcribed Record of Proceedings', tKey: 'minutesTranscript', icon: <Mic size={16} />, path: '/transcript', privilege: 'Transcript of Proceedings' },
  { label: 'Committee Reports', tKey: 'committeeReports', icon: <ClipboardList size={16} />, path: '/committee-reports', privilege: 'Committee Reports' },
  { label: 'Tricycle Franchise', tKey: 'tricycleFranchise', icon: <Bike size={16} />, path: '/tricycle', privilege: 'Tricycle Franchise' },
  { label: 'Barangay Actions', tKey: 'barangayActions', icon: <Building2 size={16} />, path: '/barangay', privilege: 'Barangay Actions' },
  // { label: 'Other Communications', tKey: 'otherCommunications', icon: <MessageSquare size={16} />, path: '/communications', privilege: 'Other Communications' },
  // { label: 'Barangay Review', tKey: 'barangayReview', icon: <GitMerge size={16} />, path: '/review', privilege: 'Barangay Review' },
  // { label: 'Quasi-Judicial', tKey: 'quasiJudicial', icon: <Scale size={16} />, path: '/judicial', privilege: 'Quasi-Judicial Function' },
  // { label: 'Addendum', tKey: 'addendum', icon: <PenTool size={16} />, path: '/corrections', privilege: 'Addendum and Corrections' },
  // { label: 'Incoming', tKey: 'incoming', icon: <ArrowDownToLine size={16} />, path: '/incoming', privilege: 'Incoming' },
  // { label: 'Other Matters', tKey: 'otherMatters', icon: <Scroll size={16} />, path: '/other-matters', privilege: 'Other Matters' },
  { label: 'Send to Email', tKey: 'sendToEmail', icon: <Mail size={16} />, path: '/send-email', privilege: 'Send File to Email' },
  { label: 'S.B. Officials', tKey: 'spMembers', icon: <UserSquare size={16} />, path: '/officials', privilege: 'S.B. Members' },
  { label: 'Account Management', tKey: 'accountManagement', icon: <UserCog size={16} />, path: '/accounts', privilege: 'Account Management' },
  { label: 'Activity Log', tKey: 'activityLog', icon: <ClipboardCheck size={16} />, path: '/logs' }
]

function FadeText({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <span
      style={{
        maxWidth: show ? 220 : 0,
        opacity: show ? 1 : 0,
        overflow: 'hidden',
        whiteSpace: show ? 'normal' : 'nowrap',
        transition: 'max-width 0.25s ease, opacity 0.2s ease',
        display: 'inline-block',
        lineHeight: 1.25
      }}
    >
      {children}
    </span>
  )
}

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, hasPrivilege } = useAuthStore()
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore()
  const t = useT()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [logoutOpen, setLogoutOpen] = useState(false)

  function confirmLogout() {
    window.electron.ipcRenderer.send('window-restore-login')
    logout()
    navigate('/login')
  }

  const isActive = (path?: string) => !!(path && location.pathname === path)
  const isChildActive = (item: NavItem) => !!item.children?.some((c) => isActive(c.path))
  const collapsed = sidebarCollapsed

  const visible = NAV.filter((item) => !item.privilege || hasPrivilege(item.privilege))

  return (
    <aside
      style={{
        width: collapsed ? 64 : 270,
        minWidth: collapsed ? 64 : 270,
        background: 'var(--c-sidebar-bg)',
        borderRight: '1px solid var(--c-sidebar-border)',
        boxShadow: '2px 0 12px rgba(0,0,0,0.1)',
        transition:
          'width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden'
      }}
    >
      {/* ── Logo header ──────────────────────────────────────── */}
      <div
        className="drag-region"
        style={{
          height: 58,
          padding: collapsed ? '0 14px' : '0 14px',
          borderBottom: '1px solid var(--c-sidebar-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          flexShrink: 0,
          transition: 'padding 0.25s ease'
        }}
      >
        {/* Logo — clicking expands when collapsed */}
        <button
          className="no-drag"
          onClick={() => collapsed && setSidebarCollapsed(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'none',
            border: 'none',
            cursor: collapsed ? 'pointer' : 'default',
            padding: 0,
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              flexShrink: 0,
              background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
              boxShadow: '0 4px 12px rgba(37,99,235,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Building2 size={16} color="#fff" />
          </div>
          <FadeText show={!collapsed}>
            <div>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  lineHeight: 1,
                  color: 'var(--c-sidebar-text)',
                  textAlign: 'left'
                }}
              >
                LMTS
              </p>
              <p
                style={{
                  fontSize: 10,
                  marginTop: 2,
                  color: 'var(--c-sidebar-sub)',
                  textAlign: 'left'
                }}
              >
                Municipality of Santa, Ilocos Sur
              </p>
            </div>
          </FadeText>
        </button>

        {/* Collapse button — visible when expanded */}
        {!collapsed && (
          <button
            className="no-drag sidebar-ctrl-btn"
            onClick={() => setSidebarCollapsed(true)}
            title="Collapse sidebar"
            style={{ width: 26, height: 26 }}
          >
            <ChevronLeft size={13} />
          </button>
        )}
      </div>

      {/* ── Navigation ───────────────────────────────────────── */}
      <nav
        className="scrollbar-thin"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: collapsed ? '10px 8px' : '10px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        {visible.map((item) => {
          if (item.children) {
            const open = expanded === item.label || isChildActive(item)
            return (
              <div key={item.label}>
                <button
                  className={cn('sidebar-item', isChildActive(item) && 'active')}
                  style={
                    collapsed
                      ? { justifyContent: 'center', padding: '9px 0' }
                      : { justifyContent: 'space-between' }
                  }
                  title={collapsed ? t(item.tKey) : undefined}
                  onClick={() => {
                    if (collapsed) {
                      setSidebarCollapsed(false)
                      return
                    }
                    setExpanded(open ? null : item.label)
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {item.icon}
                    <FadeText show={!collapsed}>{t(item.tKey)}</FadeText>
                  </span>
                  {!collapsed && (
                    <ChevronDown
                      size={12}
                      style={{
                        color: 'var(--c-nav-text)',
                        transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
                        transition: 'transform 0.2s ease',
                        flexShrink: 0,
                        opacity: 0.6
                      }}
                    />
                  )}
                </button>
                {open && !collapsed && (
                  <div
                    className="animate-fade-in"
                    style={{
                      marginLeft: 10,
                      marginTop: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1
                    }}
                  >
                    {item.children.map((child) => (
                      <button
                        key={child.path}
                        className={cn('sidebar-item', isActive(child.path) && 'active')}
                        style={{ paddingLeft: 28 }}
                        onClick={() => navigate(child.path!)}
                      >
                        {child.icon}
                        <FadeText show={!collapsed}>{t(child.tKey)}</FadeText>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          }
          return (
            <button
              key={item.path}
              className={cn('sidebar-item', isActive(item.path) && 'active')}
              style={
                collapsed
                  ? { justifyContent: 'center', padding: '9px 0' }
                  : { alignItems: 'flex-start' }
              }
              title={collapsed ? t(item.tKey) : undefined}
              onClick={() => navigate(item.path!)}
            >
              <span style={{ flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
              <FadeText show={!collapsed}>{t(item.tKey)}</FadeText>
            </button>
          )
        })}
      </nav>

      {/* ── Footer: expand + logout ───────────────────────────── */}
      <div
        style={{
          padding: collapsed ? '10px 8px' : '10px 10px',
          borderTop: '1px solid var(--c-sidebar-border)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }}
      >
        {/* Expand button — only when collapsed */}
        {collapsed && (
          <button
            className="sidebar-ctrl-btn"
            onClick={() => setSidebarCollapsed(false)}
            title="Expand sidebar"
            style={{ width: '100%', height: 34, marginBottom: 2 }}
          >
            <ChevronRight size={14} />
          </button>
        )}

        {/* Settings */}
        <button
          className={cn('sidebar-item', location.pathname === '/settings' && 'active')}
          style={
            collapsed
              ? { justifyContent: 'center', padding: '9px 0' }
              : { alignItems: 'center' }
          }
          title={collapsed ? t('settings') : undefined}
          onClick={() => navigate('/settings')}
        >
          <span style={{ flexShrink: 0 }}>
            <Settings size={16} />
          </span>
          <FadeText show={!collapsed}>{t('settings')}</FadeText>
        </button>

        {/* About */}
        <button
          className={cn('sidebar-item', location.pathname === '/about' && 'active')}
          style={
            collapsed
              ? { justifyContent: 'center', padding: '9px 0' }
              : { alignItems: 'center' }
          }
          title={collapsed ? t('about') : undefined}
          onClick={() => navigate('/about')}
        >
          <span style={{ flexShrink: 0 }}>
            <Info size={16} />
          </span>
          <FadeText show={!collapsed}>{t('about')}</FadeText>
        </button>

        {/* Logout */}
        <button
          onClick={() => setLogoutOpen(true)}
          title={t('logout')}
          style={{
            width: '100%',
            padding: collapsed ? '9px 0' : '8px 12px',
            borderRadius: 10,
            background: 'transparent',
            border: '1px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 10,
            color: '#ef4444',
            fontSize: 13,
            fontWeight: 500,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.2)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'
          }}
        >
          <LogOut size={15} />
          <FadeText show={!collapsed}>{t('logout')}</FadeText>
        </button>
      </div>

      <Modal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Confirm Logout"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setLogoutOpen(false)} style={{ fontSize: 12 }}>
              Cancel
            </button>
            <button className="btn-danger" onClick={confirmLogout} style={{ fontSize: 12 }}>
              <LogOut size={13} />
              Logout
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '4px 0' }}>
          <div
            style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <LogOut size={17} color="#ef4444" />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-1)', marginBottom: 4 }}>
              Are you sure you want to logout?
            </p>
            <p style={{ fontSize: 12, color: 'var(--c-text-3)', lineHeight: '1.5' }}>
              You will be signed out of your current session and returned to the login screen.
            </p>
          </div>
        </div>
      </Modal>
    </aside>
  )
}
