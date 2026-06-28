import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Building2 } from 'lucide-react'
import { queryDocuments, auth, ensureAuth } from '../lib/firebase'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import toast from 'react-hot-toast'
import { securityNotify } from '../lib/notify'
import { Spinner } from '../components/ui/Spinner'
import aionxLogo from '../assets/aionx-logo.png'
import lmtsLogo from '../assets/lmts-logo.png'
import bcrypt from 'bcryptjs'
import pkg from '../../../../package.json'

const APP_VERSION = `v${pkg.version}`

export function LoginPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const { theme, toggleTheme } = useUIStore()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<'user' | 'pass' | null>(null)

  async function handleLogin(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      securityNotify.warn('Please enter your username and password')
      return
    }
    setLoading(true)
    try {
      const users = await queryDocuments<Record<string, unknown>>(
        'santa_users',
        'username',
        username.trim()
      )
      if (!users.length) {
        securityNotify.warn('Username not found')
        return
      }
      const account = users[0]
      const match = await bcrypt.compare(password, String(account.password))
      if (!match) {
        securityNotify.warn('Incorrect password')
        return
      }
      await ensureAuth()
      const token = (await auth.currentUser?.getIdToken()) ?? ''
      setUser({
        token,
        firstName: String(account.firstName ?? ''),
        middleName: String(account.middleName ?? ''),
        lastName: String(account.lastName ?? ''),
        role: String(account.role ?? ''),
        privileges: Array.isArray(account.privileges) ? (account.privileges as string[]) : [],
        fileUrl: String(account.fileUrl ?? '')
      })
      toast.success(`Welcome, ${account.firstName}!`)
      window.electron.ipcRenderer.send('window-maximize')
      navigate('/dashboard')
    } catch (err: unknown) {
      console.error('[Login]', err)
      securityNotify.warn('Login failed. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const isDark = theme === 'dark'

  function fieldStyle(active: boolean): React.CSSProperties {
    return {
      width: '100%',
      padding: '11px 14px 11px 14px',
      fontSize: 13,
      borderRadius: 10,
      outline: 'none',
      background: isDark
        ? active
          ? 'rgba(99,102,241,0.08)'
          : 'rgba(255,255,255,0.04)'
        : active
          ? 'rgba(99,102,241,0.05)'
          : 'rgba(0,0,0,0.03)',
      border: active
        ? '1.5px solid var(--c-accent)'
        : isDark
          ? '1.5px solid rgba(255,255,255,0.08)'
          : '1.5px solid rgba(0,0,0,0.1)',
      color: isDark ? '#e2e8f0' : '#0f172a',
      boxShadow: active ? '0 0 0 3px var(--c-accent-glow)' : 'none',
      transition: 'all 0.2s ease'
    }
  }

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', overflow: 'hidden' }}>
      {/* ── Left brand panel ──────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          background: isDark
            ? 'linear-gradient(160deg, #0d1535 0%, #111827 40%, #0a0f20 100%)'
            : 'linear-gradient(160deg, #1e3a8a 0%, #3730a3 50%, #1e1b4b 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 20px'
        }}
      >
        {/* Animated orbs */}
        <div
          className="animate-float"
          style={{
            position: 'absolute',
            top: '-60px',
            left: '-60px',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />
        <div
          className="animate-float"
          style={{
            position: 'absolute',
            bottom: '-70px',
            right: '-50px',
            width: 220,
            height: 220,
            borderRadius: '50%',
            animationDelay: '1.5s',
            background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />
        <div
          className="animate-float"
          style={{
            position: 'absolute',
            top: '55%',
            left: '-30px',
            width: 120,
            height: 120,
            borderRadius: '50%',
            animationDelay: '0.8s',
            background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        {/* Grid overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '22px 22px'
          }}
        />

        {/* Ring decorations */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            right: -40,
            width: 120,
            height: 120,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.06)',
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            left: -30,
            width: 100,
            height: 100,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.05)',
            pointerEvents: 'none'
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          {/* Logo badge */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              margin: '0 auto 16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}
          >
            <img
              src={lmtsLogo}
              alt="LMTS"
              style={{ width: 48, height: 48, objectFit: 'contain' }}
            />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              marginBottom: 10,
              padding: '3px 10px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)'
            }}
          >
            <Building2 size={10} color="rgba(255,255,255,0.7)" />
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.7)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}
            >
              Municipality of Santa
            </span>
          </div>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '-0.5px',
              lineHeight: 1,
              marginBottom: 6,
              textShadow: '0 2px 20px rgba(99,102,241,0.5)'
            }}
          >
            LMTS
          </h1>

          <p
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.55)',
              lineHeight: '1.5',
              maxWidth: 160,
              margin: '0 auto 24px'
            }}
          >
            Legislative Management &amp; Tracking System
          </p>

          {/* Feature pills */}
          {['Ordinances & Resolutions', 'Committee Reports', 'Barangay Actions'].map((label) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '6px 12px',
                borderRadius: 8,
                marginBottom: 6,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#818cf8',
                  flexShrink: 0
                }}
              />
              <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom branding */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5
          }}
        >
          <img src={aionxLogo} alt="AionX" style={{ width: 11, height: 11, opacity: 0.4 }} />
          <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.3)' }}>AionX IT Solutions</span>
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 28px',
          background: isDark
            ? 'linear-gradient(160deg, #080d1c 0%, #0b1222 100%)'
            : 'linear-gradient(160deg, #f8faff 0%, #f1f5ff 100%)',
          overflow: 'hidden'
        }}
      >
        {/* Subtle bg blob */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-20%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            pointerEvents: 'none',
            background: isDark
              ? 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            left: '-10%',
            width: 200,
            height: 200,
            borderRadius: '50%',
            pointerEvents: 'none',
            background: isDark
              ? 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)'
          }}
        />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to light' : 'Switch to dark'}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            zIndex: 10,
            width: 32,
            height: 32,
            borderRadius: 9,
            cursor: 'pointer',
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            transition: 'all 0.2s',
            backdropFilter: 'blur(10px)'
          }}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        {/* Form container */}
        <div
          className="animate-scale-in"
          style={{ width: '100%', maxWidth: 360, position: 'relative', zIndex: 1 }}
        >
          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--c-accent)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 6
              }}
            >
              Welcome back
            </p>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '-0.4px',
                color: isDark ? '#f1f5f9' : '#0f172a',
                marginBottom: 4
              }}
            >
              Sign in to your account
            </h2>
            <p style={{ fontSize: 12, color: isDark ? '#475569' : '#94a3b8' }}>
              Enter your credentials to continue
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleLogin}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {/* Username */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 600,
                  color: isDark ? '#94a3b8' : '#64748b',
                  marginBottom: 7,
                  letterSpacing: '0.02em'
                }}
              >
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={loading}
                autoFocus
                style={fieldStyle(focused === 'user')}
                onFocus={() => setFocused('user')}
                onBlur={() => setFocused(null)}
              />
            </div>

            {/* Password */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 600,
                  color: isDark ? '#94a3b8' : '#64748b',
                  marginBottom: 7,
                  letterSpacing: '0.02em'
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  style={{ ...fieldStyle(focused === 'pass'), paddingRight: 40 }}
                  onFocus={() => setFocused('pass')}
                  onBlur={() => setFocused(null)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: 11,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: isDark ? '#64748b' : '#94a3b8',
                    padding: 3,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 0',
                marginTop: 4,
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                borderRadius: 11,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: loading
                  ? 'rgba(99,102,241,0.4)'
                  : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: loading ? 'none' : '0 6px 20px rgba(99,102,241,0.45)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.transform = 'translateY(-1px)'
                  el.style.boxShadow = '0 10px 28px rgba(99,102,241,0.55)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = '0 6px 20px rgba(99,102,241,0.45)'
                }
              }}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="text-white" /> Signing in…
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div
            style={{
              marginTop: 28,
              paddingTop: 16,
              borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <p style={{ fontSize: 9.5, color: isDark ? '#334155' : '#cbd5e1' }}>
              © {new Date().getFullYear()} Municipality of Santa
            </p>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 5,
                background: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.07)',
                color: isDark ? '#818cf8' : '#6366f1',
                border: isDark
                  ? '1px solid rgba(99,102,241,0.2)'
                  : '1px solid rgba(99,102,241,0.15)'
              }}
            >
              {APP_VERSION}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
