import { useState, useMemo, useEffect } from 'react'
import { useListData } from '../../hooks/useListData'
import { useDebounce } from '../../hooks/useDebounce'
import { Scale, Plus, RefreshCw, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { notify } from '../../lib/notify'
import {
  addDocument, addDocumentWithCount,
  deleteDocumentWithFile,
  addDocumentWithFile,
  updateDocumentWithFile
} from '../../lib/firebase'
import { useAuthStore } from '../../store/authStore'
import { Layout, PageContainer } from '../../components/layout/Layout'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable, Column, useColumnVisibility, ColumnsButton } from '../../components/ui/DataTable'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { FormField, Input, Select, TextArea } from '../../components/ui/FormField'
import { FileUploadField } from '../../components/ui/FileUploadField'
import { Spinner } from '../../components/ui/Spinner'
import type { Judicial } from '../../types'
import { formatDate, getFullName, toInputDate, sortByField } from '../../lib/utils'

const ACTION_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Dismissed', label: 'Dismissed' },
  { value: 'Referred', label: 'Referred' }
]

const columns: Column<Judicial>[] = [
  { key: 'caseNumber', header: 'Case No.', width: 'w-28' },
  { key: 'title', header: 'Title' },
  { key: 'petitioner', header: 'Petitioner', width: 'w-32' },
  { key: 'respondent', header: 'Respondent', width: 'w-32' },
  { key: 'action', header: 'Action', width: 'w-28' },
  {
    key: 'date',
    header: 'Date',
    width: 'w-28',
    render: (r) => <span className="text-xs">{formatDate(r.date)}</span>
  }
]

function JudicialFormModal({
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
  record?: Judicial
}) {
  const isEdit = !!record
  const [saving, setSaving] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    caseNumber: '',
    title: '',
    petitioner: '',
    respondent: '',
    date: '',
    action: 'Pending'
  })

  useEffect(() => {
    if (open) {
      setForm(
        record
          ? {
              caseNumber: record.caseNumber ?? '',
              title: record.title ?? '',
              petitioner: record.petitioner ?? '',
              respondent: record.respondent ?? '',
              date: toInputDate(record.date),
              action: record.action ?? 'Pending'
            }
          : {
              caseNumber: '',
              title: '',
              petitioner: '',
              respondent: '',
              date: '',
              action: 'Pending'
            }
      )
      setFile(null)
    }
  }, [open, record])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.caseNumber.trim() || !form.title.trim()) {
      notify.error('Case number and Title are required')
      return
    }
    setSaving(true)
    try {
      if (isEdit)
        await updateDocumentWithFile(
          'santa_judicial',
          record!.id,
          { ...form },
          'Judicial',
          `Case_${form.caseNumber}`,
          file,
          record?.fileUrl ?? '',
          record?.fileType ?? ''
        )
      else
        await addDocumentWithFile(
          'santa_judicial',
          { ...form },
          'Judicial',
          `Case_${form.caseNumber}`,
          file
        )
      await logActivity(`${isEdit ? 'Updated' : 'Created'} Judicial Case ${form.caseNumber}`)
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
      title={isEdit ? 'Edit Judicial Case' : 'Add Judicial Case'}
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
        <FormField label="Case Number" required>
          <Input type="number" min="1" value={form.caseNumber} onChange={set('caseNumber')} disabled={isEdit} placeholder="e.g. 1" />
        </FormField>
        <FormField label="Date">
          <Input type="date" value={form.date} onChange={set('date')} />
        </FormField>
        <FormField label="Title" required className="col-span-2">
          <TextArea value={form.title} onChange={set('title')} rows={3} />
        </FormField>
        <FormField label="Petitioner">
          <Input value={form.petitioner} onChange={set('petitioner')} />
        </FormField>
        <FormField label="Respondent">
          <Input value={form.respondent} onChange={set('respondent')} />
        </FormField>
        <FormField label="Action" className="col-span-2">
          <Select options={ACTION_OPTIONS} value={form.action} onChange={set('action')} />
        </FormField>
        <div className="col-span-2">
          <FileUploadField value={file} onChange={setFile} />
          {isEdit && record?.fileUrl && !file && (
            <p className="text-xs text-slate-500 mt-1.5">
              Current file:{' '}
              <a
                href={record.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View attached file
              </a>
            </p>
          )}
        </div>
      </form>
    </Modal>
  )
}

export function JudicialPage() {
  const { hiddenColumns, toggleColumn } = useColumnVisibility(columns)
  const user = useAuthStore((s) => s.user)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { items, loading, loadingMore, hasMore, reload, loadMore, sortField, sortDirection } = useListData<
    Record<string, unknown>
  >({
    endpoint: 'santa_judicial',
    sortParam: 'caseNumber|desc',
    dataKey: 'santa_judicial',
    limit: 100,
    searchQuery: debouncedSearch
  })
  const [selected, setSelected] = useState<Judicial | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const filtered = useMemo(() => {
    const base = items as unknown as Judicial[]
    const q = debouncedSearch.toLowerCase()
    const result = !debouncedSearch.trim() ? base : base.filter(
      (r) => r.title?.toLowerCase().includes(q) || r.caseNumber?.toLowerCase().includes(q)
    )
    return sortByField(result as unknown as Record<string, unknown>[], sortField, sortDirection) as unknown as Judicial[]
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
      await deleteDocumentWithFile(
        'santa_judicial',
        selected.id,
        'Judicial',
        `Case_${selected.caseNumber}`
      )
      await logActivity(`Deleted Judicial Case ${selected.caseNumber}`)
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
          title="Quasi-Judicial Function"
          subtitle={`${filtered.length} records`}
          icon={<Scale size={20} />}
          actions={
            <>
              <ColumnsButton columns={columns} hiddenColumns={hiddenColumns} onToggle={toggleColumn} />
              <button className="btn-ghost" onClick={reload}>
                <RefreshCw size={15} />
                Refresh
              </button>
              {selected && (
                <>
                  {selected.fileUrl && (
                    <button
                      className="btn-ghost"
                      onClick={() => window.open(selected.fileUrl, '_blank')}
                    >
                      <ExternalLink size={15} />
                      Open
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
        <div className="flex justify-end mb-4 shrink-0">
          <input
            type="text"
            placeholder="Search by case no., title, petitioner, respondent..."
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
            onRowDoubleClick={() => selected?.fileUrl && window.open(selected.fileUrl, '_blank')}
            loading={loading}
            emptyMessage="No judicial records found"
            loadingMore={loadingMore}
            onEndReached={hasMore ? loadMore : undefined}
          />
        </div>
        <JudicialFormModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false)
            reload()
          }}
          logActivity={logActivity}
        />
        {selected && (
          <JudicialFormModal
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
          title="Delete Judicial Case"
          message={`Delete Case ${selected?.caseNumber}?`}
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
