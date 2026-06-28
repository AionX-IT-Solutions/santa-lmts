import type { ReactNode } from 'react'
import { Layout, PageContainer } from '../../components/layout/Layout'
import { Badge } from '../../components/ui/Badge'
import lmtsLogo from '../../assets/lmts-logo.png'

const techStack = [
  { name: 'Electron', variant: 'blue' as const },
  { name: 'React 19', variant: 'indigo' as const },
  { name: 'Vite 7', variant: 'green' as const },
  { name: 'TypeScript', variant: 'blue' as const },
  { name: 'Tailwind CSS', variant: 'cyan' as const },
  { name: 'Zustand', variant: 'green' as const },
  { name: 'Firebase', variant: 'yellow' as const },
  { name: 'Lucide React', variant: 'gray' as const },
  { name: 'TanStack Table', variant: 'purple' as const },
  { name: 'React Hook Form', variant: 'pink' as const },
]

const buildInfo = [
  { label: 'Version', value: '1.0.0' },
  { label: 'Build Tool', value: 'electron-vite' },
  { label: 'Node Target', value: 'ES2022' },
  { label: 'Renderer Target', value: 'Chromium 130+' },
  { label: 'Architecture', value: 'x64' },
  { label: 'License', value: 'Proprietary' },
]

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: 'var(--c-card-shadow)',
        marginBottom: 16,
      }}
    >
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--c-border)' }}>
        <h2
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--c-text-3)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </h2>
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  )
}

export function AboutPage() {
  return (
    <Layout>
      <PageContainer>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: 32, paddingTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <img
                src={lmtsLogo}
                alt="LMTS"
                style={{ width: 120, height: 'auto', objectFit: 'contain' }}
                draggable={false}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
            <Badge variant="indigo">v1.0.0</Badge>
            <p
              style={{
                fontSize: 13,
                color: 'var(--c-text-2)',
                lineHeight: '1.5',
                maxWidth: 420,
                margin: '12px auto 0',
              }}
            >
              Legislative Management &amp; Tracking System — Municipality of Santa Sangguniang
              Bayan
            </p>
          </div>

          {/* Tech Stack */}
          <InfoCard title="Tech Stack">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {techStack.map((t) => (
                <Badge key={t.name} variant={t.variant}>
                  {t.name}
                </Badge>
              ))}
            </div>
          </InfoCard>

          {/* Build Info */}
          <InfoCard title="Build Information">
            {buildInfo.map((item, i) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 0',
                  borderBottom:
                    i < buildInfo.length - 1 ? '1px solid var(--c-border)' : 'none',
                }}
              >
                <span style={{ fontSize: 12, color: 'var(--c-text-3)' }}>{item.label}</span>
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--c-text-1)',
                    fontFamily: 'monospace',
                    fontWeight: 500,
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </InfoCard>

          {/* Credits */}
          <p
            style={{
              textAlign: 'center',
              fontSize: 11,
              color: 'var(--c-text-3)',
              marginTop: 8,
              lineHeight: '1.6',
            }}
          >
            Built with electron-vite · React 19 · TypeScript · Tailwind CSS
            <br />
            Developed by AionX IT Solutions
          </p>
        </div>
      </PageContainer>
    </Layout>
  )
}
