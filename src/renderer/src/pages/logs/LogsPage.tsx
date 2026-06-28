import { useState, useMemo, useCallback, useRef } from 'react'
import { useListData } from '../../hooks/useListData'
import { useDebounce } from '../../hooks/useDebounce'
import { Activity, Loader2 } from 'lucide-react'
import { Layout, PageContainer } from '../../components/layout/Layout'
import { PageHeader } from '../../components/ui/PageHeader'
import type { Log } from '../../types'
import { sortByField } from '../../lib/utils'

export function LogsPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { items, loading, loadingMore, hasMore, loadMore, sortField, sortDirection } = useListData<Record<string, unknown>>({
    endpoint: 'santa_logs',
    sortParam: 'date|desc',
    dataKey: 'santa_logs',
    searchQuery: debouncedSearch
  })
  const ticking = useRef(false)
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!hasMore || loadingMore || ticking.current) return
      const el = e.currentTarget
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
        ticking.current = true
        loadMore()
        setTimeout(() => {
          ticking.current = false
        }, 400)
      }
    },
    [hasMore, loadingMore, loadMore]
  )
  const filtered = useMemo(() => {
    const base = items as unknown as Log[]
    const q = debouncedSearch.toLowerCase()
    const result = !debouncedSearch.trim() ? base : base.filter(
      (l) =>
        l.name?.toLowerCase().includes(q) ||
        l.activity?.toLowerCase().includes(q) ||
        l.date?.toLowerCase().includes(q)
    )
    return sortByField(result as unknown as Record<string, unknown>[], sortField, sortDirection) as unknown as Log[]
  }, [items, debouncedSearch, sortField, sortDirection])

  return (
    <Layout>
      <PageContainer>
        <PageHeader
          title="Activity Log"
          subtitle={`${filtered.length} records`}
          icon={<Activity size={18} />}
          actions={
            <input
              type="text"
              placeholder="Search logs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ width: 220, paddingTop: 7, paddingBottom: 7, fontSize: 12 }}
            />
          }
        />

        <div
          className="card"
          style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        >
          <div
            className="scrollbar-thin"
            style={{ overflow: 'auto', flex: 1 }}
            onScroll={handleScroll}
          >
            {loading ? (
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 38, opacity: 1 - i * 0.07 }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 200,
                  color: 'var(--c-text-3)',
                  fontSize: 13
                }}
              >
                No activity logs found
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr
                    style={{
                      background: 'var(--c-thead-bg)',
                      borderBottom: '1px solid var(--c-divider)'
                    }}
                  >
                    {['#', 'User', 'Activity', 'Date / Time'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 16px',
                          textAlign: 'left',
                          fontSize: 10,
                          fontWeight: 700,
                          color: 'var(--c-text-3)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.07em',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr
                      key={row.id ?? i}
                      className="table-row-hover"
                      style={{ borderBottom: '1px solid var(--c-divider)' }}
                    >
                      <td
                        style={{
                          padding: '10px 16px',
                          color: 'var(--c-text-3)',
                          fontSize: 11,
                          width: 48
                        }}
                      >
                        {i + 1}
                      </td>
                      <td style={{ padding: '10px 16px', width: 160, whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#93c5fd' }}>
                          {row.name}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          color: 'var(--c-text-2)',
                          maxWidth: 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {row.activity}
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          color: 'var(--c-text-3)',
                          width: 180,
                          whiteSpace: 'nowrap',
                          fontSize: 12
                        }}
                      >
                        {row.date}
                      </td>
                    </tr>
                  ))}
                  {loadingMore && (
                    <tr>
                      <td colSpan={4}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            padding: '14px 0',
                            color: 'var(--c-text-3)',
                            fontSize: 12
                          }}
                        >
                          <Loader2 size={14} style={{ animation: 'spinSlow 1s linear infinite' }} />
                          Loading more…
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </PageContainer>
    </Layout>
  )
}
