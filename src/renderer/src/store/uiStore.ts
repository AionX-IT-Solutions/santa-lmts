import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'
export type AccentColor = 'indigo' | 'cyan' | 'emerald' | 'rose'

const ACCENT_MAP: Record<AccentColor, { primary: string; glow: string }> = {
  indigo: { primary: '#6366f1', glow: 'rgba(99,102,241,0.35)' },
  cyan: { primary: '#06b6d4', glow: 'rgba(6,182,212,0.35)' },
  emerald: { primary: '#10b981', glow: 'rgba(16,185,129,0.35)' },
  rose: { primary: '#f43f5e', glow: 'rgba(244,63,94,0.35)' },
}

interface UIState {
  theme: Theme
  sidebarCollapsed: boolean
  accentColor: AccentColor
  fontSize: number
  language: string
  notificationsEnabled: boolean
  soundEnabled: boolean
  updateNotifs: boolean
  securityAlerts: boolean
  toggleTheme: () => void
  setTheme: (t: Theme) => void
  setSidebarCollapsed: (v: boolean) => void
  setAccentColor: (c: AccentColor) => void
  setFontSize: (s: number) => void
  setLanguage: (lang: string) => void
  setNotificationsEnabled: (v: boolean) => void
  setSoundEnabled: (v: boolean) => void
  setUpdateNotifs: (v: boolean) => void
  setSecurityAlerts: (v: boolean) => void
}

export function applyTheme(theme: Theme): void {
  document.body.classList.toggle('light', theme === 'light')
}

export function applyAccentColor(color: AccentColor): void {
  const { primary, glow } = ACCENT_MAP[color]
  document.documentElement.style.setProperty('--c-accent', primary)
  document.documentElement.style.setProperty('--c-accent-glow', glow)
  document.documentElement.style.setProperty('--c-nav-active-shadow', `inset 3px 0 0 ${primary}`)
  document.documentElement.style.setProperty('--c-nav-active-border', `${primary}38`)
  document.documentElement.style.setProperty('--c-nav-active-bg', `${primary}18`)
  document.documentElement.style.setProperty('--c-border-hover', `${primary}50`)
}

export function applyFontSize(size: number): void {
  document.documentElement.style.setProperty('--app-font-size', `${size}px`)
  // webContents.setZoomFactor scales visually without shrinking the CSS viewport
  if (typeof window !== 'undefined' && window.electron?.ipcRenderer) {
    window.electron.ipcRenderer.send('set-zoom-factor', size / 14)
  } else {
    ;(document.body.style as CSSStyleDeclaration & { zoom: string }).zoom = String(size / 14)
  }
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      sidebarCollapsed: false,
      accentColor: 'indigo',
      fontSize: 14,
      language: 'en',
      notificationsEnabled: true,
      soundEnabled: false,
      updateNotifs: true,
      securityAlerts: true,
      toggleTheme: () => {
        const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: next })
        applyTheme(next)
      },
      setTheme: (t) => {
        set({ theme: t })
        applyTheme(t)
      },
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setAccentColor: (c) => {
        set({ accentColor: c })
        applyAccentColor(c)
      },
      setFontSize: (s) => {
        set({ fontSize: s })
        applyFontSize(s)
      },
      setLanguage: (lang) => {
        set({ language: lang })
      },
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setUpdateNotifs: (v) => set({ updateNotifs: v }),
      setSecurityAlerts: (v) => set({ securityAlerts: v }),
    }),
    {
      name: 'lmts-ui',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme)
          applyAccentColor(state.accentColor)
          applyFontSize(state.fontSize)
        }
      }
    }
  )
)
