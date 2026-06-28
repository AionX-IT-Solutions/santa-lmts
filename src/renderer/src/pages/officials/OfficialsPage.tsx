import { useState, useMemo, useEffect } from 'react'
import { useListData } from '../../hooks/useListData'
import { useDebounce } from '../../hooks/useDebounce'
import { Users, Plus, RefreshCw, Pencil, Trash2 } from 'lucide-react'
import { notify } from '../../lib/notify'
import { addDocument, addDocumentWithCount, updateDocument, deleteDocument } from '../../lib/firebase'
import { useAuthStore } from '../../store/authStore'
import { Layout, PageContainer } from '../../components/layout/Layout'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable, Column, useColumnVisibility, ColumnsButton } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { FormField, Input, Select } from '../../components/ui/FormField'
import { Spinner } from '../../components/ui/Spinner'
import type { Official } from '../../types'
import { getFullName, sortByField } from '../../lib/utils'

const TERMS = Array.from({ length: 12 }, (_, i) => {
  const n = 12 - i
  const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'
  const label = `${n}${suffix}`
  return { value: label, label }
})

const LEGISLATIVE_BODIES = [
  { value: 'Sangguniang Bayan', label: 'Sangguniang Bayan' },
  { value: 'Sangguniang Panlungsod', label: 'Sangguniang Panlungsod' },
  { value: 'Sangguniang Panlalawigan', label: 'Sangguniang Panlalawigan' }
]

const POSITIONS = [
  { value: 'Vice Mayor / Presiding Officer', label: 'Vice Mayor / Presiding Officer' },
  { value: '1st Councilor', label: '1st Councilor' },
  { value: '2nd Councilor', label: '2nd Councilor' },
  { value: '3rd Councilor', label: '3rd Councilor' },
  { value: '4th Councilor', label: '4th Councilor' },
  { value: '5th Councilor', label: '5th Councilor' },
  { value: '6th Councilor', label: '6th Councilor' },
  { value: '7th Councilor', label: '7th Councilor' },
  { value: '8th Councilor', label: '8th Councilor' },
  { value: '9th Councilor', label: '9th Councilor' },
  { value: '10th Councilor', label: '10th Councilor' },
  { value: 'Ex-Officio - LnB President', label: 'Ex-Officio - LnB President' },
  { value: 'Ex-Officio - PPSK President', label: 'Ex-Officio - PPSK President' }
]

const columns: Column<Official>[] = [
  { key: 'title', header: 'Title', width: 'w-20' },
  { key: 'firstName', header: 'First Name', width: 'w-28' },
  { key: 'middleName', header: 'Middle Name', width: 'w-28' },
  { key: 'lastName', header: 'Last Name', width: 'w-28' },
  { key: 'suffix', header: 'Suffix', width: 'w-16' },
  {
    key: 'position',
    header: 'Position',
    width: 'w-36',
    render: (r) => <Badge variant="blue">{r.position}</Badge>
  },
  { key: 'term', header: 'Term', width: 'w-24' }
]

function OfficialFormModal({
  open,
  onClose,
  onSuccess,
  logActivity,
  record
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  logActivity: (a: string) => Promise<void>
  record?: Official
}) {
  const isEdit = !!record
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    position: '1st Councilor',
    term: '',
    legislativeBody: ''
  })

  useEffect(() => {
    if (open) {
      setForm(
        record
          ? {
              title: record.title ?? '',
              firstName: record.firstName ?? '',
              middleName: record.middleName ?? '',
              lastName: record.lastName ?? '',
              suffix: record.suffix ?? '',
              position: record.position ?? 'Councilor',
              term: record.term ?? '',
              legislativeBody: record.legislativeBody ?? ''
            }
          : {
              title: '',
              firstName: '',
              middleName: '',
              lastName: '',
              suffix: '',
              position: '1st Councilor',
              term: '12th',
              legislativeBody: 'Sangguniang Bayan'
            }
      )
    }
  }, [open, record])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim()) {
      notify.error('First name and Last name are required')
      return
    }
    setSaving(true)
    try {
      if (isEdit) await updateDocument('santa_officials', record!.id, { ...form })
      else await addDocument('santa_officials', { ...form })
      await logActivity(
        `${isEdit ? 'Updated' : 'Added'} Official ${form.firstName} ${form.lastName}`
      )
      notify.success(isEdit ? 'Updated' : 'Added')
      onSuccess()
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Official' : 'Add Official'}
      size="md"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Spinner size="sm" className="text-white" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
        </>
      }
    >
      <form className="grid grid-cols-2 gap-4">
        <FormField label="Title">
          <Input value={form.title} onChange={set('title')} placeholder="e.g. Atty., Dr., Hon." />
        </FormField>
        <div />
        <FormField label="First Name" required>
          <Input value={form.firstName} onChange={set('firstName')} />
        </FormField>
        <FormField label="Middle Name">
          <Input value={form.middleName} onChange={set('middleName')} />
        </FormField>
        <FormField label="Last Name" required>
          <Input value={form.lastName} onChange={set('lastName')} />
        </FormField>
        <FormField label="Suffix">
          <Input value={form.suffix} onChange={set('suffix')} placeholder="Jr., Sr., III" />
        </FormField>
        <FormField label="Position" className="col-span-2">
          <Select options={POSITIONS} value={form.position} onChange={set('position')} />
        </FormField>
        <FormField label="Legislative Term">
          <Select options={TERMS} value={form.term || '12th'} onChange={set('term')} />
        </FormField>
        <FormField label="Legislative Body">
          <Select options={LEGISLATIVE_BODIES} value={form.legislativeBody || 'Sangguniang Bayan'} onChange={set('legislativeBody')} />
        </FormField>
      </form>
    </Modal>
  )
}

export function OfficialsPage() {
  const { hiddenColumns, toggleColumn } = useColumnVisibility(columns)
  const user = useAuthStore((s) => s.user)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { items, loading, loadingMore, hasMore, reload, loadMore, sortField, sortDirection } = useListData<
    Record<string, unknown>
  >({
    endpoint: 'santa_officials',
    sortParam: 'lastName|desc',
    dataKey: 'official',
    searchQuery: debouncedSearch
  })
  const [selected, setSelected] = useState<Official | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const filtered = useMemo(() => {
    const base = items as unknown as Official[]
    const q = debouncedSearch.toLowerCase()
    const result = !debouncedSearch.trim() ? base : base.filter(
      (r) =>
        r.firstName?.toLowerCase().includes(q) ||
        r.lastName?.toLowerCase().includes(q) ||
        r.position?.toLowerCase().includes(q) ||
        r.term?.toLowerCase().includes(q) ||
        r.legislativeBody?.toLowerCase().includes(q)
    )
    return sortByField(result as unknown as Record<string, unknown>[], sortField, sortDirection) as unknown as Official[]
  }, [items, debouncedSearch, sortField, sortDirection])

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
    await addDocumentWithCount('santa_logs', { name, activity, date, year: new Date().getFullYear() })
  }

  async function handleDelete() {
    if (!selected) return
    setDeleting(true)
    try {
      await deleteDocument('santa_officials', selected.id)
      await logActivity(`Deleted Official ${selected.firstName} ${selected.lastName}`)
      notify.success('Deleted')
      setShowDelete(false)
      setSelected(null)
      reload()
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
          title="S.B. Members / Officials"
          subtitle={`${filtered.length} records`}
          icon={<Users size={20} />}
          actions={
            <>
              <ColumnsButton columns={columns} hiddenColumns={hiddenColumns} onToggle={toggleColumn} />
              <button className="btn-ghost" onClick={reload}>
                <RefreshCw size={15} />
                Refresh
              </button>
              {selected && (
                <>
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
                Add Official
              </button>
            </>
          }
        />
        <div className="flex justify-end mb-4 shrink-0">
          <input
            type="text"
            placeholder="Search by name, position, term..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field w-56! py-2!"
          />
        </div>
        <div className="card flex flex-col flex-1 min-h-0">
          <DataTable
            columns={columns}
            data={filtered}
            hiddenColumns={hiddenColumns}
            selectedId={selected?.id}
            onRowClick={setSelected}
            loading={loading}
            emptyMessage="No official records found"
            loadingMore={loadingMore}
            onEndReached={hasMore ? loadMore : undefined}
          />
        </div>
        <OfficialFormModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false)
            reload()
          }}
          logActivity={logActivity}
        />
        {selected && (
          <OfficialFormModal
            open={showEdit}
            onClose={() => setShowEdit(false)}
            onSuccess={() => {
              setShowEdit(false)
              setSelected(null)
              reload()
            }}
            logActivity={logActivity}
            record={selected}
          />
        )}
        <ConfirmDialog
          open={showDelete}
          title="Delete Official"
          message={`Delete ${selected?.firstName} ${selected?.lastName}?`}
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
