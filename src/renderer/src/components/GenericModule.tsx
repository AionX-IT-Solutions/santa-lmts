import { useEffect, useState, useCallback } from 'react'
import { Plus, RefreshCw, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { notify } from '../lib/notify'
import { api } from '../lib/api'
import { deleteFile } from '../lib/firebase'
import { useAuthStore } from '../store/authStore'
import { Layout, PageContainer } from './layout/Layout'
import { PageHeader } from './ui/PageHeader'
import { DataTable, Column } from './ui/DataTable'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { getFullName } from '../lib/utils'

interface GenericRecord {
  id?: string
  fileUrl?: string
  fileType?: string
  [key: string]: unknown
}

interface GenericModuleProps<T extends GenericRecord> {
  title: string
  subtitle?: string
  icon: React.ReactNode
  endpoint: string // e.g. '/minutes'
  idField?: string
  storageFolder?: string
  storageFileKey?: string
  columns: Column<T>[]
  FormModal: React.ComponentType<{
    open: boolean
    onClose: () => void
    onSuccess: () => void
    logActivity: (a: string) => Promise<void>
    record?: T
  }>
  searchFields?: { value: string; label: string }[]
  emptyMessage?: string
}

export function GenericModule<T extends GenericRecord>({
  title,
  icon,
  endpoint,
  storageFolder,
  storageFileKey,
  columns,
  FormModal,
  searchFields,
  emptyMessage
}: GenericModuleProps<T>) {
  const user = useAuthStore((s) => s.user)
  const [data, setData] = useState<T[]>([])
  const [filtered, setFiltered] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<T | null>(null)
  const [search, setSearch] = useState('')
  const [searchField, setSearchField] = useState(searchFields?.[0]?.value ?? 'id')
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setSelected(null)
    try {
      const res = await api.get(`${endpoint}/all?limit=1500&sort=id|desc&last=`)
      const raw = res.data?.data
      const arr = raw ? ((Object.values(raw).find((v) => Array.isArray(v)) as T[]) ?? []) : []
      setData(arr)
    } catch (err) {
      notify.error(err instanceof Error ? err.message : `Failed to load ${title}`)
    } finally {
      setLoading(false)
    }
  }, [endpoint, title])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(data)
      return
    }
    const q = search.toLowerCase()
    setFiltered(
      data.filter((r) =>
        String(r[searchField] ?? '')
          .toLowerCase()
          .includes(q)
      )
    )
  }, [data, search, searchField])

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
    await api.post('/logs/create', { data: { name, activity, date } })
  }

  async function handleDelete() {
    if (!selected?.id) return
    setDeleting(true)
    try {
      if (storageFolder && storageFileKey && selected[storageFileKey]) {
        try {
          await deleteFile(storageFolder, String(selected[storageFileKey]))
        } catch {}
      }
      await api.put(`${endpoint}/delete?id=${selected.id}`, selected)
      await logActivity(`Deleted record from ${title}`)
      notify.success('Record deleted')
      setShowDelete(false)
      setSelected(null)
      load()
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Layout>
      <PageContainer>
        <PageHeader
          title={title}
          subtitle={`${filtered.length} records`}
          icon={icon}
          actions={
            <>
              <button className="btn-ghost" onClick={load}>
                <RefreshCw size={15} />
                Refresh
              </button>
              {selected && (
                <>
                  {selected.fileUrl && (
                    <button
                      className="btn-ghost"
                      onClick={() => window.open(String(selected.fileUrl), '_blank')}
                    >
                      <ExternalLink size={15} />
                      Open File
                    </button>
                  )}
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
                Add
              </button>
            </>
          }
        />
        {searchFields && searchFields.length > 0 && (
          <div className="flex items-center gap-2 mb-4 flex-shrink-0 justify-end">
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="input-field !w-36 !py-2"
            >
              {searchFields.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field !w-56 !py-2"
            />
          </div>
        )}
        <div className="card flex flex-col flex-1 min-h-0">
          <DataTable
            columns={columns}
            data={filtered}
            selectedId={selected?.id}
            onRowClick={setSelected}
            onRowDoubleClick={() =>
              selected?.fileUrl && window.open(String(selected.fileUrl), '_blank')
            }
            loading={loading}
            emptyMessage={emptyMessage ?? `No ${title} records found`}
          />
        </div>
        <FormModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false)
            load()
          }}
          logActivity={logActivity}
        />
        {selected && (
          <FormModal
            open={showEdit}
            onClose={() => setShowEdit(false)}
            onSuccess={() => {
              setShowEdit(false)
              load()
            }}
            logActivity={logActivity}
            record={selected}
          />
        )}
        <ConfirmDialog
          open={showDelete}
          title={`Delete ${title} Record`}
          message="Are you sure you want to delete this record? This cannot be undone."
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
