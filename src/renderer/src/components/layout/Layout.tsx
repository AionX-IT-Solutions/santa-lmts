import { Sidebar } from './Sidebar'
import { TopHeader } from './TopHeader'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: 'var(--c-bg)'
      }}
    >
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopHeader />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="animate-fade-in"
      style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20, overflow: 'hidden', minHeight: 0 }}
    >
      {children}
    </div>
  )
}
