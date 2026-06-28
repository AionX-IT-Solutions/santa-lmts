import { useState, useMemo, useEffect } from 'react'
import { useListData } from '../../hooks/useListData'
import { useDebounce } from '../../hooks/useDebounce'
import { BarChart2, Plus, RefreshCw, Pencil, Trash2 } from 'lucide-react'
import { notify } from '../../lib/notify'
import { addDocument, addDocumentWithCount, updateDocument, deleteDocument, fetchDocs } from '../../lib/firebase'
import { useAuthStore } from '../../store/authStore'
import { Layout, PageContainer } from '../../components/layout/Layout'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable, Column } from '../../components/ui/DataTable'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { FormField, Input, Select, TextArea } from '../../components/ui/FormField'
import { Spinner } from '../../components/ui/Spinner'
import type { Committee, Official } from '../../types'
import { getFullName, sortByField } from '../../lib/utils'
import { LEGISLATIVE_TERM_OPTIONS } from '../../hooks/useOfficialsForForm'

const columns: Column<Committee>[] = [
  { key: 'title', header: 'Title' },
  { key: 'batch', header: 'Batch', width: 'w-28' },
  { key: 'chairman', header: 'Chairman', width: 'w-44' },
  { key: 'viceChairman', header: 'Vice Chairman', width: 'w-44' },
  {
    key: 'members',
    header: 'Members',
    render: (r) => <span className="text-xs">{(r.members ?? []).join(', ')}</span>
  }
]

const EMPTY_FORM = {
  title: '',
  batch: '',
  description: '',
  chairman: '',
  viceChairman: '',
  members: [] as string[]
}

function CommitteeFormModal({
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
  record?: Committee
}) {
  const isEdit = !!record
  const [saving, setSaving] = useState(false)
  const [allOfficials, setAllOfficials] = useState<Official[]>([])
  const [loadingOfficials, setLoadingOfficials] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState('12th')
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (open) {
      setForm(
        record
          ? {
              title: record.title ?? '',
              batch: record.batch ?? '',
              description: record.description ?? '',
              chairman: record.chairman ?? '',
              viceChairman: record.viceChairman ?? '',
              members: record.members ?? []
            }
          : EMPTY_FORM
      )

      setLoadingOfficials(true)
      fetchDocs<Official>('santa_officials', { orderByField: 'lastName', direction: 'asc', pageSize: 500 })
        .then((res) => {
          setAllOfficials(res.items)
        })
        .catch((err) => notify.error(err instanceof Error ? err.message : 'Failed to load officials'))
        .finally(() => setLoadingOfficials(false))
    }
  }, [open, record])

  const termOptions = LEGISLATIVE_TERM_OPTIONS

  const officials = useMemo(
    () => (selectedTerm ? allOfficials.filter((o) => o.term === selectedTerm) : allOfficials),
    [allOfficials, selectedTerm]
  )

  const officialNames = useMemo(
    () => officials.map((o) => getFullName(o.firstName, o.middleName, o.lastName, o.suffix)),
    [officials]
  )
  const officialOptions = useMemo(
    () => officialNames.map((name) => ({ value: name, label: name })),
    [officialNames]
  )

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const toggleMember = (name: string) =>
    setForm((f) => ({
      ...f,
      members: f.members.includes(name)
        ? f.members.filter((m) => m !== name)
        : [...f.members, name]
    }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.chairman.trim() || !form.viceChairman.trim()) {
      notify.error('Title, Chairman, and Vice Chairman are required')
      return
    }
    setSaving(true)
    try {
      if (isEdit) await updateDocument('santa_committee', record!.id, { ...form })
      else await addDocument('santa_committee', { ...form })
      await logActivity(`${isEdit ? 'Updated' : 'Created'} Committee ${form.title}`)
      notify.success(isEdit ? 'Updated' : 'Created')
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
      title={isEdit ? 'Edit Committee' : 'Add Committee'}
      size="lg"
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
        <FormField label="Committee Title" required className="col-span-2">
          <Input value={form.title} onChange={set('title')} placeholder="e.g. Committee on Finance" />
        </FormField>
        <FormField label="Batch">
          <Input value={form.batch} onChange={set('batch')} placeholder="e.g. 2022-2025" />
        </FormField>
        <FormField label="Description" className="col-span-2">
          <TextArea value={form.description} onChange={set('description')} rows={3} />
        </FormField>
        <FormField label="Legislative Term" className="col-span-2">
          {loadingOfficials ? (
            <div className="input-field flex items-center justify-center"><Spinner size="sm" /></div>
          ) : (
            <Select
              options={termOptions}
              value={selectedTerm}
              onChange={(e) => {
                setSelectedTerm(e.target.value)
                setForm((f) => ({ ...f, chairman: '', viceChairman: '', members: [] }))
              }}
            />
          )}
        </FormField>
        <FormField label="Chairman" required>
          {loadingOfficials ? (
            <div className="input-field flex items-center justify-center">
              <Spinner size="sm" />
            </div>
          ) : (
            <Select
              options={officialOptions}
              value={form.chairman}
              onChange={set('chairman')}
              placeholder="Select chairman"
            />
          )}
        </FormField>
        <FormField label="Vice Chairman" required>
          {loadingOfficials ? (
            <div className="input-field flex items-center justify-center">
              <Spinner size="sm" />
            </div>
          ) : (
            <Select
              options={officialOptions}
              value={form.viceChairman}
              onChange={set('viceChairman')}
              placeholder="Select vice chairman"
            />
          )}
        </FormField>
        <FormField label="Members" className="col-span-2">
          {loadingOfficials ? (
            <div className="input-field flex items-center justify-center">
              <Spinner size="sm" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3">
              {officialNames.map((name) => (
                <label key={name} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.members.includes(name)}
                    onChange={() => toggleMember(name)}
                  />
                  {name}
                </label>
              ))}
            </div>
          )}
        </FormField>
      </form>
    </Modal>
  )
}

export function CommitteesPage() {
  const user = useAuthStore((s) => s.user)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { items, loading, loadingMore, hasMore, reload, loadMore, sortField, sortDirection } = useListData<
    Record<string, unknown>
  >({
    endpoint: 'santa_committee',
    sortParam: 'title|desc',
    dataKey: 'committee',
    searchQuery: debouncedSearch
  })
  const [selected, setSelected] = useState<Committee | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const filtered = useMemo(() => {
    const arr = items as unknown as Committee[]
    const q = debouncedSearch.toLowerCase()
    const result = !debouncedSearch.trim() ? arr : arr.filter((r) =>
      Object.values(r as unknown as Record<string, unknown>).some((v) =>
        String(Array.isArray(v) ? v.join(', ') : (v ?? ''))
          .toLowerCase()
          .includes(q)
      )
    )
    return sortByField(result as unknown as Record<string, unknown>[], sortField, sortDirection) as unknown as Committee[]
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
      await deleteDocument('santa_committee', selected.id)
      await logActivity(`Deleted Committee ${selected.title}`)
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
          title="Standing Committees"
          subtitle={`${filtered.length} records`}
          icon={<BarChart2 size={20} />}
          actions={
            <>
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
                Add Committee
              </button>
            </>
          }
        />
        <div className="flex justify-end mb-4 flex-shrink-0">
          <input
            type="text"
            placeholder="Search by title, chairman, members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field !w-56 !py-2"
          />
        </div>
        <div className="card flex flex-col flex-1 min-h-0">
          <DataTable
            columns={columns}
            data={filtered}
            selectedId={selected?.id}
            onRowClick={setSelected}
            loading={loading}
            emptyMessage="No committee records found"
            loadingMore={loadingMore}
            onEndReached={hasMore ? loadMore : undefined}
          />
        </div>
        <CommitteeFormModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false)
            reload()
          }}
          logActivity={logActivity}
        />
        {selected && (
          <CommitteeFormModal
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
          title="Delete Committee"
          message={`Delete Committee ${selected?.title}?`}
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
