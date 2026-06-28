import { useMemo, useState } from 'react'
import { ScrollText, Plus, RefreshCw, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { notify } from '../../lib/notify'
import { addDocumentWithCount, deleteDocumentWithFile } from '../../lib/firebase'
import { useAuthStore } from '../../store/authStore'
import { Layout, PageContainer } from '../../components/layout/Layout'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable, Column, useColumnVisibility, ColumnsButton } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import type { Ordinance } from '../../types'
import { formatDate, getFullName, sortByField } from '../../lib/utils'
import { OrdinanceFormModal } from './OrdinanceFormModal'
import { useListData } from '../../hooks/useListData'
import { useDebounce } from '../../hooks/useDebounce'

const CATEGORIES = ['General Ordinance', 'Appropriation', 'Tax Ordinance']

const categoryColor = (c: string) => {
  if (c === 'General Ordinance') return 'blue'
  if (c === 'Appropriation') return 'green'
  if (c === 'Tax Ordinance') return 'yellow'
  return 'gray'
}

const columns: Column<Ordinance>[] = [
  { key: 'ordinanceNumber', header: 'Ord. No.', width: 'w-28' },
  { key: 'series', header: 'Series', width: 'w-32' },
  {
    key: 'category',
    header: 'Category',
    width: 'w-36',
    render: (row) => (
      <Badge variant={categoryColor(row.category) as 'blue' | 'green' | 'yellow' | 'gray'}>
        {row.category}
      </Badge>
    )
  },
  { key: 'title', header: 'Title' },
  { key: 'author', header: 'Author', width: 'w-36' },
  { key: 'tag', header: 'Tag', width: 'w-28' },
  {
    key: 'dateApprovedSp',
    header: 'Date Approved (SB)',
    width: 'w-36',
    render: (row) => <span className="text-xs">{formatDate(row.dateApprovedSp)}</span>
  },
  { key: 'actionSp', header: 'Action (SB)', width: 'w-32' },
  {
    key: 'dateReceived',
    header: 'Date Received',
    width: 'w-32',
    render: (row) => <span className="text-xs">{formatDate(row.dateReceived)}</span>
  }
]

export function OrdinancesPage() {
  const { hiddenColumns, toggleColumn } = useColumnVisibility(columns)
  const user = useAuthStore((s) => s.user)
  const [category, setCategory] = useState('General Ordinance')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const filters = useMemo(
    () => [{ field: 'category', op: '==' as const, value: category }],
    [category]
  )
  const { items, loading, loadingMore, hasMore, reload, loadMore, sortField, sortDirection } =
    useListData<Record<string, unknown>>({
      endpoint: 'santa_ordinances',
      sortParam: 'ordinanceNumber|desc',
      dataKey: 'ordinance',
      limit: 100,
      filters,
      searchQuery: debouncedSearch
    })

  const [selected, setSelected] = useState<Ordinance | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => {
    const base = items as unknown as Ordinance[]
    const q = debouncedSearch.toLowerCase()
    const result = !debouncedSearch.trim()
      ? base
      : base.filter((o) =>
          Object.values(o as unknown as Record<string, unknown>).some((v) =>
            String(v ?? '')
              .toLowerCase()
              .includes(q)
          )
        )
    return sortByField(
      result as unknown as Record<string, unknown>[],
      sortField,
      sortDirection
    ) as unknown as Ordinance[]
  }, [items, debouncedSearch, sortField, sortDirection])

  async function handleDelete() {
    if (!selected) return
    setDeleting(true)
    try {
      await deleteDocumentWithFile(
        'santa_ordinances',
        selected.id,
        'GeneralOrdinances',
        `OrdinanceNo._${selected.ordinanceNumber}`
      )
      await logActivity(`Deleted Ordinance Number ${selected.ordinanceNumber}`)
      notify.success('Ordinance deleted')
      setShowDelete(false)
      setSelected(null)
      reload()
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Failed to delete ordinance')
    } finally {
      setDeleting(false)
    }
  }

  async function logActivity(activity: string) {
    if (!user) return
    const name = getFullName(user.firstName, user.middleName, user.lastName)
    const date =
      new Date().toLocaleDateString('en-PH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) +
      ' ' +
      new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
    await addDocumentWithCount('santa_logs', {
      name,
      activity,
      date,
      year: new Date().getFullYear()
    })
  }

  function openFile() {
    if (selected?.fileUrl) window.open(selected.fileUrl, '_blank')
    else notify.error('No file attached')
  }

  return (
    <Layout>
      <PageContainer>
        <PageHeader
          title="Ordinances"
          subtitle={`${filtered.length} records`}
          icon={<ScrollText size={20} />}
          actions={
            <>
              <ColumnsButton columns={columns} hiddenColumns={hiddenColumns} onToggle={toggleColumn} />
              <button className="btn-ghost" onClick={reload}>
                <RefreshCw size={15} />
                Refresh
              </button>
              {selected && (
                <>
                  <button className="btn-ghost" onClick={openFile}>
                    <ExternalLink size={15} />
                    Open File
                  </button>
                  <button className="btn-secondary" onClick={() => setShowEdit(true)}>
                    <Pencil size={15} />
                    Edit
                  </button>
                  <button className="btn-danger" onClick={() => setShowDelete(true)}>
                    <Trash2 size={15} />
                    Delete
                  </button>
                </>
              )}
              <button className="btn-primary" onClick={() => setShowAdd(true)}>
                <Plus size={15} />
                Add Ordinance
              </button>
            </>
          }
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 14,
            flexShrink: 0
          }}
        >
          <div
            style={{
              display: 'flex',
              background: 'var(--c-surface)',
              border: '1px solid var(--c-border)',
              borderRadius: 12,
              padding: 4,
              gap: 4
            }}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat)
                  setSelected(null)
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background:
                    category === cat ? 'linear-gradient(135deg,#2563eb,#4f46e5)' : 'transparent',
                  color: category === cat ? '#fff' : 'var(--c-text-3)',
                  boxShadow: category === cat ? '0 2px 8px rgba(37,99,235,0.35)' : 'none'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search by number, title, author, tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{
              marginLeft: 'auto',
              width: 280,
              paddingTop: 8,
              paddingBottom: 8,
              fontSize: 13
            }}
          />
        </div>

        <div className="card flex flex-col flex-1 min-h-0">
          <DataTable
            columns={columns}
            data={filtered}
            hiddenColumns={hiddenColumns}
            selectedId={selected?.id}
            onRowClick={(row) => setSelected(row as unknown as Ordinance)}
            onRowDoubleClick={openFile}
            loading={loading}
            loadingMore={loadingMore}
            onEndReached={hasMore ? loadMore : undefined}
            emptyMessage="No ordinances found for this category"
          />
        </div>

        <OrdinanceFormModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false)
            reload()
          }}
          logActivity={logActivity}
        />
        {selected && (
          <OrdinanceFormModal
            open={showEdit}
            onClose={() => setShowEdit(false)}
            onSuccess={() => {
              setShowEdit(false)
              setSelected(null)
              reload()
            }}
            logActivity={logActivity}
            ordinance={selected}
          />
        )}
        <ConfirmDialog
          open={showDelete}
          title="Delete Ordinance"
          message={`Are you sure you want to delete Ordinance No. ${selected?.ordinanceNumber}? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      </PageContainer>
    </Layout>
  )
}
