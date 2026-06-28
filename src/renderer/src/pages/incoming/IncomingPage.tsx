import { useState, useMemo, useEffect } from 'react'
import { useListData } from '../../hooks/useListData'
import { useDebounce } from '../../hooks/useDebounce'
import { ArrowDownToLine, Plus, RefreshCw, Pencil, Trash2, ExternalLink } from 'lucide-react'
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
import { FormField, Input, TextArea } from '../../components/ui/FormField'
import { FileUploadField } from '../../components/ui/FileUploadField'
import { Spinner } from '../../components/ui/Spinner'
import type { Incoming } from '../../types'
import { formatDate, getFullName, toInputDate, sortByField } from '../../lib/utils'

const columns: Column<Incoming>[] = [
  { key: 'iONumber', header: 'I/O Number', width: 'w-28' },
  { key: 'incomingDescription', header: 'Description' },
  { key: 'tags', header: 'Tags', width: 'w-28' },
  {
    key: 'dateReceived',
    header: 'Date Received',
    width: 'w-32',
    render: (r) => <span className="text-xs">{formatDate(r.dateReceived)}</span>
  },
  { key: 'timeReceived', header: 'Time Received', width: 'w-28' },
  { key: 'remarks', header: 'Remarks', width: 'w-36' }
]

function IncomingFormModal({
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
  record?: Incoming
}) {
  const isEdit = !!record
  const [saving, setSaving] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    iONumber: '',
    incomingDescription: '',
    dateReceived: '',
    timeReceived: '',
    tags: '',
    remarks: ''
  })

  useEffect(() => {
    if (open) {
      setForm(
        record
          ? {
              iONumber: record.iONumber ?? '',
              incomingDescription: record.incomingDescription ?? '',
              dateReceived: toInputDate(record.dateReceived),
              timeReceived: record.timeReceived ?? '',
              tags: record.tags ?? '',
              remarks: record.remarks ?? ''
            }
          : {
              iONumber: '',
              incomingDescription: '',
              dateReceived: '',
              timeReceived: '',
              tags: '',
              remarks: ''
            }
      )
      setFile(null)
    }
  }, [open, record])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.iONumber.trim() || !form.incomingDescription.trim()) {
      notify.error('I/O Number and Description are required')
      return
    }
    setSaving(true)
    try {
      if (isEdit)
        await updateDocumentWithFile(
          'santa_incoming_communications',
          record!.id,
          { ...form },
          'Incoming',
          `Incoming_${form.iONumber}`,
          file,
          record?.fileUrl ?? '',
          record?.fileType ?? ''
        )
      else
        await addDocumentWithFile(
          'santa_incoming_communications',
          { ...form },
          'Incoming',
          `Incoming_${form.iONumber}`,
          file
        )
      await logActivity(`${isEdit ? 'Updated' : 'Created'} Incoming ${form.iONumber}`)
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
      title={isEdit ? 'Edit Incoming' : 'Add Incoming'}
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
        <FormField label="I/O Number" required>
          <Input type="number" min="1" value={form.iONumber} onChange={set('iONumber')} placeholder="e.g. 1" />
        </FormField>
        <FormField label="Tags">
          <Input value={form.tags} onChange={set('tags')} />
        </FormField>
        <FormField label="Description" required className="col-span-2">
          <Input value={form.incomingDescription} onChange={set('incomingDescription')} />
        </FormField>
        <FormField label="Date Received">
          <Input type="date" value={form.dateReceived} onChange={set('dateReceived')} />
        </FormField>
        <FormField label="Time Received">
          <Input type="time" value={form.timeReceived} onChange={set('timeReceived')} />
        </FormField>
        <FormField label="Remarks" className="col-span-2">
          <TextArea value={form.remarks} onChange={set('remarks')} rows={3} />
        </FormField>
        <div className="col-span-2">
          <FileUploadField value={file} onChange={setFile} />
        </div>
      </form>
    </Modal>
  )
}

export function IncomingPage() {
  const { hiddenColumns, toggleColumn } = useColumnVisibility(columns)
  const user = useAuthStore((s) => s.user)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { items, loading, loadingMore, hasMore, reload, loadMore, sortField, sortDirection } = useListData<
    Record<string, unknown>
  >({
    endpoint: 'santa_incoming_communications',
    sortParam: 'iONumber|desc',
    dataKey: 'incoming',
    limit: 100,
    searchQuery: debouncedSearch
  })
  const [selected, setSelected] = useState<Incoming | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const filtered = useMemo(() => {
    const base = items as unknown as Incoming[]
    const q = debouncedSearch.toLowerCase()
    const result = !debouncedSearch.trim() ? base : base.filter(
      (r) =>
        r.iONumber?.toLowerCase().includes(q) ||
        r.incomingDescription?.toLowerCase().includes(q) ||
        r.tags?.toLowerCase().includes(q)
    )
    return sortByField(result as unknown as Record<string, unknown>[], sortField, sortDirection) as unknown as Incoming[]
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
        'santa_incoming_communications',
        selected.id,
        'Incoming',
        `Incoming_${selected.iONumber}`
      )
      await logActivity(`Deleted Incoming ${selected.iONumber}`)
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
          title="Incoming Documents"
          subtitle={`${filtered.length} records`}
          icon={<ArrowDownToLine size={20} />}
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
            placeholder="Search by I/O number, description, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field w-72! py-2!"
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
            emptyMessage="No incoming document records found"
            loadingMore={loadingMore}
            onEndReached={hasMore ? loadMore : undefined}
          />
        </div>
        <IncomingFormModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false)
            reload()
          }}
          logActivity={logActivity}
        />
        {selected && (
          <IncomingFormModal
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
          title="Delete Incoming"
          message={`Delete Incoming ${selected?.iONumber}?`}
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
