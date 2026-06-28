import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Inbox, ChevronsUpDown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
}

interface DataTableProps<T extends { id?: string }> {
  columns: Column<T>[]
  data: T[]
  hiddenColumns?: Set<string>
  selectedId?: string | null
  onRowClick?: (row: T) => void
  onRowDoubleClick?: (row: T) => void
  loading?: boolean
  loadingMore?: boolean
  onEndReached?: () => void
  emptyMessage?: string
}

const PAGE_SIZE_OPTIONS = [25, 50, 100]

// ─── Hook ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useColumnVisibility<T>(_columns: Column<T>[]) {
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set())

  const toggleColumn = useCallback((key: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  return { hiddenColumns, toggleColumn }
}

// ─── Columns Button ───────────────────────────────────────────────────────────

export function ColumnsButton<T>({
  columns,
  hiddenColumns,
  onToggle
}: {
  columns: Column<T>[]
  hiddenColumns: Set<string>
  onToggle: (key: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className={cn('btn-ghost', open && 'bg-[var(--c-accent)] text-white')}
        onClick={() => setOpen((v) => !v)}
        style={{ gap: 6 }}
      >
        <SlidersHorizontal size={14} />
        Columns
        {hiddenColumns.size > 0 && (
          <span style={{
            background: open ? 'rgba(255,255,255,0.3)' : 'var(--c-accent)',
            color: '#fff',
            borderRadius: 10,
            padding: '0 5px',
            fontSize: 10,
            fontWeight: 700,
            lineHeight: '16px',
            minWidth: 16,
            textAlign: 'center'
          }}>
            {hiddenColumns.size}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 'calc(100% + 4px)',
          zIndex: 200,
          background: 'var(--c-surface)',
          border: '1px solid var(--c-border)',
          borderRadius: 10,
          padding: '6px 0',
          minWidth: 190,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }}>
          <p style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--c-text-3)',
            padding: '4px 14px 8px'
          }}>
            Toggle Columns
          </p>
          {columns.map((col) => {
            const key = String(col.key)
            const visible = !hiddenColumns.has(key)
            return (
              <label
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 14px',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: 'var(--c-text-1)',
                  transition: 'background 0.1s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c-row-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={() => onToggle(key)}
                  style={{ accentColor: 'var(--c-accent)', width: 14, height: 14 }}
                />
                {col.header}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── DataTable ────────────────────────────────────────────────────────────────

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  hiddenColumns,
  selectedId,
  onRowClick,
  onRowDoubleClick,
  loading,
  emptyMessage = 'No records found'
}: DataTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)

  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  useEffect(() => { setPage(1) }, [data, sortKey, pageSize])

  function handleSort(key: string) {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        return key
      }
      setSortDir('asc')
      return key
    })
  }

  const sortedData = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const aVal = String((a as Record<string, unknown>)[sortKey] ?? '')
      const bVal = String((b as Record<string, unknown>)[sortKey] ?? '')
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  const visibleColumns = useMemo(
    () => hiddenColumns ? columns.filter((col) => !hiddenColumns.has(String(col.key))) : columns,
    [columns, hiddenColumns]
  )

  const totalCount = sortedData.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1
  const end = Math.min(safePage * pageSize, totalCount)
  const pageData = sortedData.slice((safePage - 1) * pageSize, safePage * pageSize)

  if (loading) {
    return (
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 40, borderRadius: 8, opacity: 1 - i * 0.1 }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Table area */}
      <div ref={containerRef} className="scrollbar-thin" style={{ overflow: 'auto', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr style={{ background: 'var(--c-thead-bg)', borderBottom: '2px solid var(--c-divider)' }}>
              {visibleColumns.map((col, i) => {
                const sortable = col.sortable !== false
                const isActive = sortKey === String(col.key)
                return (
                  <th
                    key={String(col.key)}
                    className={cn(col.width)}
                    onClick={sortable ? () => handleSort(String(col.key)) : undefined}
                    style={{
                      padding: '11px 16px',
                      textAlign: col.align === 'right' ? 'right' : col.align === 'center' ? 'center' : 'left',
                      fontSize: 10,
                      fontWeight: 700,
                      color: isActive ? 'var(--c-accent)' : 'var(--c-text-3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      whiteSpace: 'nowrap',
                      borderRight: i < visibleColumns.length - 1 ? '1px solid var(--c-divider)' : 'none',
                      cursor: sortable ? 'pointer' : 'default',
                      userSelect: 'none',
                      transition: 'color 0.15s',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {col.header}
                      {sortable && (
                        <span style={{ opacity: isActive ? 1 : 0.35, flexShrink: 0, lineHeight: 0 }}>
                          {isActive
                            ? sortDir === 'asc'
                              ? <ChevronUp size={11} />
                              : <ChevronDown size={11} />
                            : <ChevronsUpDown size={11} />
                          }
                        </span>
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '56px 0', color: 'var(--c-text-3)' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--c-row-hover)', border: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Inbox size={22} color="var(--c-text-3)" strokeWidth={1.5} />
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--c-text-3)', fontWeight: 500 }}>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              pageData.map((row, i) => (
                <tr
                  key={row.id ?? i}
                  className={cn('table-row-hover', row.id && selectedId === row.id && 'table-row-selected')}
                  style={{ borderBottom: '1px solid var(--c-divider)', cursor: onRowClick ? 'pointer' : 'default' }}
                  onClick={() => onRowClick?.(row)}
                  onDoubleClick={() => onRowDoubleClick?.(row)}
                >
                  {visibleColumns.map((col, ci) => {
                    const rawVal = (row as Record<string, unknown>)[String(col.key)]
                    const val = col.render ? col.render(row) : String(rawVal ?? '-')
                    return (
                      <td
                        key={String(col.key)}
                        style={{
                          padding: '11px 16px',
                          color: 'var(--c-text-2)',
                          textAlign: col.align === 'right' ? 'right' : col.align === 'center' ? 'center' : 'left',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 240,
                          borderRight: ci < visibleColumns.length - 1 ? '1px solid var(--c-divider)' : 'none',
                          fontSize: 13
                        }}
                        title={typeof val === 'string' ? val : undefined}
                      >
                        {val}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderTop: '1px solid var(--c-divider)',
        background: 'var(--c-thead-bg)',
        flexShrink: 0,
        gap: 12,
        fontSize: 12,
        color: 'var(--c-text-3)'
      }}>
        <span style={{ whiteSpace: 'nowrap' }}>
          Showing <b style={{ color: 'var(--c-text-2)' }}>{start}–{end}</b> of <b style={{ color: 'var(--c-text-2)' }}>{totalCount}</b>
        </span>

        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          style={{
            padding: '3px 8px',
            borderRadius: 6,
            border: '1px solid var(--c-border)',
            background: 'var(--c-surface)',
            color: 'var(--c-text-2)',
            fontSize: 12,
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          {PAGE_SIZE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s} / page</option>
          ))}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
          <span>
            Page <b style={{ color: 'var(--c-text-2)' }}>{safePage}</b> of <b style={{ color: 'var(--c-text-2)' }}>{totalPages}</b>
          </span>
          <button
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{
              width: 26, height: 26,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 6, border: '1px solid var(--c-border)',
              background: 'var(--c-surface)',
              color: safePage <= 1 ? 'var(--c-text-3)' : 'var(--c-text-2)',
              cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
              opacity: safePage <= 1 ? 0.45 : 1, padding: 0
            }}
          >
            <ChevronLeft size={13} />
          </button>
          <button
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            style={{
              width: 26, height: 26,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 6, border: '1px solid var(--c-border)',
              background: 'var(--c-surface)',
              color: safePage >= totalPages ? 'var(--c-text-3)' : 'var(--c-text-2)',
              cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
              opacity: safePage >= totalPages ? 0.45 : 1, padding: 0
            }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
