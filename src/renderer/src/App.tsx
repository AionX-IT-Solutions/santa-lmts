import { ReactNode, useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import { useUIStore, applyTheme } from './store/uiStore'
import { LoginPage } from './pages/Login'
import { DashboardPage } from './pages/Dashboard'
import { OrdinancesPage } from './pages/ordinances/OrdinancesPage'
import { ResolutionsPage } from './pages/resolutions/ResolutionsPage'
import { TricyclePage } from './pages/tricycle/TricyclePage'
import { MinutesPage } from './pages/minutes/MinutesPage'
import { CommunicationsPage } from './pages/communications/CommunicationsPage'
import { BarangayPage } from './pages/barangay/BarangayPage'
import { TranscriptPage } from './pages/transcript/TranscriptPage'
import { DraftOrdinancesPage } from './pages/draft/DraftOrdinancesPage'
import { DraftResolutionsPage } from './pages/draft/DraftResolutionsPage'
import { DraftCommunicationsPage } from './pages/draft/DraftCommunicationsPage'
import { DraftPetitionsPage } from './pages/draft/DraftPetitionsPage'
import { DraftMessagesMemorialsPage } from './pages/draft/DraftMessagesMemorialsPage'
import { JudicialPage } from './pages/judicial/JudicialPage'
import { ReviewPage } from './pages/review/ReviewPage'
import { CorrectionsPage } from './pages/corrections/CorrectionsPage'
import { IncomingPage } from './pages/incoming/IncomingPage'
import { OtherMattersPage } from './pages/otherMatters/OtherMattersPage'
// import { CommitteesPage } from './pages/committees/CommitteesPage'
import { CommitteeReportsPage } from './pages/committeeReports/CommitteeReportsPage'
import { AccountsPage } from './pages/accounts/AccountsPage'
import { OfficialsPage } from './pages/officials/OfficialsPage'
import { SendEmailPage } from './pages/sendEmail/SendEmailPage'
import { LogsPage } from './pages/logs/LogsPage'
import { SettingsPage } from './pages/settings/SettingsPage'
import { AboutPage } from './pages/about/AboutPage'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  const theme = useUIStore((s) => s.theme)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    if (isAuthenticated) {
      window.electron.ipcRenderer.send('window-maximize')
    }
  }, [isAuthenticated])

  const toastBg = theme === 'dark' ? '#111827' : '#ffffff'
  const toastColor = theme === 'dark' ? '#f1f5f9' : '#0f172a'
  const toastBorder =
    theme === 'dark' ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(0,0,0,0.08)'

  return (
    <HashRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: toastBg,
            color: toastColor,
            fontSize: '13px',
            borderRadius: '12px',
            border: toastBorder,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ordinances"
          element={
            <ProtectedRoute>
              <OrdinancesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resolutions"
          element={
            <ProtectedRoute>
              <ResolutionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tricycle"
          element={
            <ProtectedRoute>
              <TricyclePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/minutes"
          element={
            <ProtectedRoute>
              <MinutesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/communications"
          element={
            <ProtectedRoute>
              <CommunicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/barangay"
          element={
            <ProtectedRoute>
              <BarangayPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transcript"
          element={
            <ProtectedRoute>
              <TranscriptPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/draft-ordinances"
          element={
            <ProtectedRoute>
              <DraftOrdinancesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/draft-resolutions"
          element={
            <ProtectedRoute>
              <DraftResolutionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/draft-communications"
          element={
            <ProtectedRoute>
              <DraftCommunicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/draft-petitions"
          element={
            <ProtectedRoute>
              <DraftPetitionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/draft-messages-memorials"
          element={
            <ProtectedRoute>
              <DraftMessagesMemorialsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/judicial"
          element={
            <ProtectedRoute>
              <JudicialPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/review"
          element={
            <ProtectedRoute>
              <ReviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/corrections"
          element={
            <ProtectedRoute>
              <CorrectionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/incoming"
          element={
            <ProtectedRoute>
              <IncomingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/other-matters"
          element={
            <ProtectedRoute>
              <OtherMattersPage />
            </ProtectedRoute>
          }
        />
        {/* <Route
          path="/committees"
          element={
            <ProtectedRoute>
              <CommitteesPage />
            </ProtectedRoute>
          }
        /> */}
        <Route
          path="/committee-reports"
          element={
            <ProtectedRoute>
              <CommitteeReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts"
          element={
            <ProtectedRoute>
              <AccountsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/officials"
          element={
            <ProtectedRoute>
              <OfficialsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/send-email"
          element={
            <ProtectedRoute>
              <SendEmailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/logs"
          element={
            <ProtectedRoute>
              <LogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/about"
          element={
            <ProtectedRoute>
              <AboutPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </HashRouter>
  )
}
