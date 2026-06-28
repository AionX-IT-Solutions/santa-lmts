import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { fetchDocs } from '../../lib/firebase'

interface SessionRecord {
  sessionNo: string
  category: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function SessionSelect({ value, onChange, placeholder = 'e.g. 1', disabled }: Props) {
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchDocs<SessionRecord>('santa_minutes', {
      orderByField: 'sessionNo',
      direction: 'desc',
      pageSize: 100
    })
      .then((res) =>
        setSessions(
          res.items.map((item) => ({
            sessionNo: String((item as Record<string, unknown>).sessionNo ?? ''),
            category: String((item as Record<string, unknown>).category ?? '')
          }))
        )
      )
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const filtered = query.trim()
    ? sessions.filter((s) => s.sessionNo.toLowerCase().includes(query.toLowerCase()))
    : sessions.slice(0, 5)

  function handleSelect(sessionNo: string) {
    onChange(sessionNo)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Display / trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid var(--c-border)',
          background: disabled ? 'var(--c-row-hover)' : 'var(--c-surface)',
          color: value ? 'var(--c-text-1)' : 'var(--c-text-3)',
          fontSize: 13,
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          gap: 8,
          outline: 'none'
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || placeholder}
        </span>
        <ChevronDown size={14} style={{ flexShrink: 0, color: 'var(--c-text-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          zIndex: 200,
          background: 'var(--c-surface)',
          border: '1px solid var(--c-border)',
          borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          overflow: 'hidden'
        }}>
          {/* Search input */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--c-divider)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Search size={13} style={{ color: 'var(--c-text-3)', flexShrink: 0 }} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search session..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 13,
                color: 'var(--c-text-1)'
              }}
            />
          </div>

          {/* Options list */}
          <ul style={{ margin: 0, padding: '4px 0', listStyle: 'none', maxHeight: 200, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <li style={{ padding: '10px 14px', fontSize: 13, color: 'var(--c-text-3)' }}>
                No sessions found
              </li>
            ) : (
              filtered.map((s) => (
                <li
                  key={s.sessionNo}
                  onClick={() => handleSelect(s.sessionNo)}
                  style={{
                    padding: '8px 14px',
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    background: value === s.sessionNo ? 'var(--c-accent-light, rgba(37,99,235,0.08))' : 'transparent',
                    color: value === s.sessionNo ? 'var(--c-accent)' : 'var(--c-text-1)',
                    fontWeight: value === s.sessionNo ? 600 : 400
                  }}
                  onMouseEnter={(e) => { if (value !== s.sessionNo) (e.currentTarget as HTMLElement).style.background = 'var(--c-row-hover)' }}
                  onMouseLeave={(e) => { if (value !== s.sessionNo) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <span>Session {s.sessionNo}</span>
                  <span style={{ fontSize: 11, color: 'var(--c-text-3)', flexShrink: 0 }}>{s.category}</span>
                </li>
              ))
            )}
          </ul>

          {!query && sessions.length > 5 && (
            <div style={{ padding: '6px 14px', borderTop: '1px solid var(--c-divider)', fontSize: 11, color: 'var(--c-text-3)' }}>
              Showing last 5 — search to see more
            </div>
          )}
        </div>
      )}
    </div>
  )
}
