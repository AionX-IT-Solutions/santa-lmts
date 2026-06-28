import { useState, useEffect, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { Layout } from '../../components/layout/Layout'
import { Modal } from '../../components/ui/Modal'
import { useUIStore, type AccentColor } from '../../store/uiStore'
import { useT } from '../../lib/i18n'
import {
  Palette,
  Bell,
  Settings as SettingsIcon,
  ChevronDown,
  Check,
  AlertTriangle,
  RotateCcw,
  Sun,
  Moon
} from 'lucide-react'

/* ── Card ───────────────────────────────────────────────────── */
function Card({ header, children }: { header: ReactNode; children: ReactNode }) {
  const { theme } = useUIStore()
  const isDark = theme === 'dark'
  return (
    <div
      style={{
        background: isDark ? 'rgba(10,18,38,0.82)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid var(--c-border)',
        borderRadius: 14,
        boxShadow: 'var(--c-card-shadow)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '20px 20px 0', borderBottom: '1px solid var(--c-border)', paddingBottom: 20 }}>
        {header}
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  )
}

/* ── Setting Row ────────────────────────────────────────────── */
function SettingRow({
  label,
  description,
  children,
  last,
}: {
  label: string
  description?: string
  children: ReactNode
  last?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '14px 0',
        borderBottom: last ? 'none' : '1px solid var(--c-border)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-text-1)' }}>{label}</span>
        {description && (
          <p style={{ fontSize: 12, color: 'var(--c-text-3)', lineHeight: '1.4', marginTop: 2 }}>
            {description}
          </p>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

/* ── Section Header ─────────────────────────────────────────── */
function SectionHeader({ icon, title, description }: { icon: ReactNode; title: string; description?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
      <div
        style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--c-accent)', flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--c-text-1)', marginBottom: 2 }}>{title}</h2>
        {description && <p style={{ fontSize: 12, color: 'var(--c-text-3)' }}>{description}</p>}
      </div>
    </div>
  )
}

/* ── Styled Switch ──────────────────────────────────────────── */
function StyledSwitch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) {
  const { theme } = useUIStore()
  const isDark = theme === 'dark'
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      style={{
        position: 'relative', display: 'inline-flex', height: 22, width: 40,
        cursor: 'pointer', borderRadius: 999,
        border: `1px solid ${checked ? 'var(--c-accent)' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)'}`,
        background: checked ? 'var(--c-accent)' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
        transition: 'all 0.2s ease', flexShrink: 0, outline: 'none',
        boxShadow: checked ? '0 0 12px var(--c-accent-glow)' : 'none',
      }}
    >
      <span
        style={{
          display: 'block', width: 16, height: 16, borderRadius: '50%',
          background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
          transition: 'transform 0.2s ease',
          transform: checked ? 'translateX(20px)' : 'translateX(2px)',
          willChange: 'transform', marginTop: 2,
        }}
      />
    </button>
  )
}

/* ── Accent Picker ──────────────────────────────────────────── */
const accentOptions: { value: AccentColor; color: string; label: string }[] = [
  { value: 'indigo', color: '#6366f1', label: 'Indigo' },
  { value: 'cyan', color: '#06b6d4', label: 'Cyan' },
  { value: 'emerald', color: '#10b981', label: 'Emerald' },
  { value: 'rose', color: '#f43f5e', label: 'Rose' },
]

function AccentPicker() {
  const accentColor = useUIStore((s) => s.accentColor)
  const setAccentColor = useUIStore((s) => s.setAccentColor)
  const t = useT()
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {accentOptions.map((opt) => (
        <button
          key={opt.value}
          onClick={() => { setAccentColor(opt.value); toast.success(`${t('accentColor')}: ${opt.label}`) }}
          title={opt.label}
          style={{
            width: 28, height: 28, borderRadius: '50%', background: opt.color,
            border: accentColor === opt.value ? '3px solid white' : '3px solid transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: accentColor === opt.value ? `0 0 12px ${opt.color}80` : 'none',
            transition: 'all 0.15s ease', outline: 'none',
          }}
        >
          {accentColor === opt.value && <Check size={12} color="white" strokeWidth={3} />}
        </button>
      ))}
    </div>
  )
}

/* ── Styled Slider ──────────────────────────────────────────── */
function StyledSlider({
  value, onValueChange, onValueCommit, min = 10, max = 20, step = 1,
}: {
  value: number; onValueChange: (v: number) => void; onValueCommit?: (v: number) => void
  min?: number; max?: number; step?: number
}) {
  const fillPct = `${((value - min) / (max - min)) * 100}%`
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: 200 }}>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onValueChange(Number(e.target.value))}
        onMouseUp={(e) => onValueCommit?.(Number((e.target as HTMLInputElement).value))}
        onTouchEnd={(e) => onValueCommit?.(Number((e.currentTarget as HTMLInputElement).value))}
        className="settings-slider"
        style={{ flex: 1, '--fill-pct': fillPct } as React.CSSProperties}
      />
      <span style={{ fontSize: 12, color: 'var(--c-accent)', fontFamily: 'monospace', fontWeight: 600, minWidth: 28 }}>
        {value}px
      </span>
    </div>
  )
}

/* ── Settings Page ──────────────────────────────────────────── */
export function SettingsPage() {
  const t = useT()
  const {
    theme, toggleTheme, setTheme,
    accentColor, setAccentColor,
    fontSize, setFontSize,
    language, setLanguage,
    notificationsEnabled, setNotificationsEnabled,
    soundEnabled, setSoundEnabled,
    updateNotifs, setUpdateNotifs,
    securityAlerts, setSecurityAlerts,
  } = useUIStore()

  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [draftFontSize, setDraftFontSize] = useState(fontSize)

  useEffect(() => { setDraftFontSize(fontSize) }, [fontSize])

  const handleReset = () => {
    setTheme('dark')
    setAccentColor('indigo')
    setFontSize(14)
    setDraftFontSize(14)
    setNotificationsEnabled(true)
    setSoundEnabled(false)
    setUpdateNotifs(true)
    setSecurityAlerts(true)
    setResetModalOpen(false)
    toast.success(t('resetSettings'))
  }

  return (
    <Layout>
      {/* Use raw main layout (not PageContainer) so the scroll area reaches the right edge */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        {/* Page header — has its own left/top padding */}
        <div style={{ padding: '20px 20px 0', flexShrink: 0, marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--c-text-1)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            {t('settingsTitle')}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--c-text-2)' }}>{t('settingsSubtitle')}</p>
        </div>

        {/* Full-width scroll container — scrollbar sits at window right edge */}
        <div className="scrollbar-thin" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720, paddingBottom: 20, paddingLeft: 20 }}>

            {/* ── Appearance ── */}
            <div style={{ animation: 'settingsFadeIn 0.3s ease 0.05s both' }}>
              <Card header={<SectionHeader icon={<Palette size={18} />} title={t('appearance')} description={t('appearanceDesc')} />}>
                <SettingRow label={t('darkMode')} description={t('darkModeDesc')}>
                  <button
                    onClick={() => { toggleTheme(); toast.success(`Switched to ${theme === 'dark' ? t('light') : t('dark')} mode`) }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      padding: '5px 12px', borderRadius: 8,
                      border: '1px solid var(--c-border)',
                      background: theme === 'dark' ? 'rgba(99,102,241,0.1)' : 'rgba(251,191,36,0.1)',
                      color: theme === 'dark' ? 'var(--c-accent)' : '#f59e0b',
                      cursor: 'pointer', fontSize: 12, fontWeight: 500,
                      transition: 'all 0.2s ease', outline: 'none',
                    }}
                  >
                    {theme === 'dark' ? <><Moon size={13} /> {t('dark')}</> : <><Sun size={13} /> {t('light')}</>}
                  </button>
                </SettingRow>

                <SettingRow label={t('accentColor')} description={t('accentColorDesc')}>
                  <AccentPicker />
                </SettingRow>

                <SettingRow label={t('fontSize')} description={t('fontSizeDesc')}>
                  <StyledSlider
                    value={draftFontSize}
                    onValueChange={setDraftFontSize}
                    onValueCommit={(v) => { setFontSize(v); toast.success(`${t('fontSize')}: ${v}px`) }}
                    min={10} max={20} step={1}
                  />
                </SettingRow>

                <SettingRow label={t('language')} last>
                  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                    <select
                      value={language}
                      onChange={(e) => { setLanguage(e.target.value); toast.success(`${t('language')} updated`) }}
                      style={{
                        appearance: 'none', WebkitAppearance: 'none',
                        padding: '6px 32px 6px 12px',
                        background: 'var(--c-input-bg)',
                        border: '1px solid var(--c-border)',
                        borderRadius: 8, color: 'var(--c-text-1)',
                        fontSize: 12, cursor: 'pointer', outline: 'none', minWidth: 130,
                      }}
                    >
                      <option value="en">English</option>
                      <option value="tl">Filipino</option>
                    </select>
                    <ChevronDown size={13} style={{ position: 'absolute', right: 10, pointerEvents: 'none', color: 'var(--c-text-3)' }} />
                  </div>
                </SettingRow>
              </Card>
            </div>

            {/* ── Notifications ── */}
            <div style={{ animation: 'settingsFadeIn 0.3s ease 0.12s both' }}>
              <Card header={<SectionHeader icon={<Bell size={18} />} title={t('notifications')} description={t('notificationsDesc')} />}>
                <SettingRow label={t('enableNotifications')} description={t('enableNotificationsDesc')}>
                  <StyledSwitch checked={notificationsEnabled} onCheckedChange={(v) => { setNotificationsEnabled(v); toast.success(v ? t('enableNotifications') + ' ON' : t('enableNotifications') + ' OFF') }} />
                </SettingRow>
                <SettingRow label={t('soundAlerts')} description={t('soundAlertsDesc')}>
                  <StyledSwitch checked={soundEnabled} onCheckedChange={(v) => { setSoundEnabled(v); toast.success(v ? t('soundAlerts') + ' ON' : t('soundAlerts') + ' OFF') }} />
                </SettingRow>
                <SettingRow label={t('updateNotifications')} description={t('updateNotificationsDesc')}>
                  <StyledSwitch checked={updateNotifs} onCheckedChange={(v) => { setUpdateNotifs(v); toast.success(v ? t('updateNotifications') + ' ON' : t('updateNotifications') + ' OFF') }} />
                </SettingRow>
                <SettingRow label={t('securityAlerts')} description={t('securityAlertsDesc')} last>
                  <StyledSwitch checked={securityAlerts} onCheckedChange={(v) => { setSecurityAlerts(v); toast.success(v ? t('securityAlerts') + ' ON' : t('securityAlerts') + ' OFF') }} />
                </SettingRow>
              </Card>
            </div>

            {/* ── Advanced ── */}
            <div style={{ animation: 'settingsFadeIn 0.3s ease 0.19s both' }}>
              <Card header={<SectionHeader icon={<SettingsIcon size={18} />} title={t('advanced')} description={t('advancedDesc')} />}>
                <div
                  style={{
                    padding: 16, background: 'rgba(239,68,68,0.05)',
                    border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10,
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <AlertTriangle size={14} color="#ef4444" />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-1)' }}>{t('resetSettings')}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--c-text-3)', lineHeight: '1.4' }}>{t('resetSettingsDesc')}</p>
                  </div>
                  <button onClick={() => setResetModalOpen(true)} className="btn-danger" style={{ flexShrink: 0, fontSize: 12, padding: '6px 12px' }}>
                    <RotateCcw size={13} />
                    {t('reset')}
                  </button>
                </div>
              </Card>
            </div>

          </div>
        </div>

        <Modal
          open={resetModalOpen}
          onClose={() => setResetModalOpen(false)}
          title={t('resetConfirmTitle')}
          footer={
            <>
              <button className="btn-ghost" onClick={() => setResetModalOpen(false)} style={{ fontSize: 12 }}>
                {t('cancel')}
              </button>
              <button className="btn-danger" onClick={handleReset} style={{ fontSize: 12 }}>
                <RotateCcw size={13} />
                {t('reset')}
              </button>
            </>
          }
        >
          <div style={{ padding: 14, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertTriangle size={16} color="#ef4444" style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-text-1)', marginBottom: 4 }}>{t('resetConfirmDesc')}</p>
              <ul style={{ fontSize: 12, color: 'var(--c-text-2)', paddingLeft: 16, lineHeight: '1.8' }}>
                <li>{t('resetItem1')}</li>
                <li>{t('resetItem2')}</li>
                <li>{t('resetItem3')}</li>
              </ul>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  )
}
