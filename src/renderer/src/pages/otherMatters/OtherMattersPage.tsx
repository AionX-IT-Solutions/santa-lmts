import { useState, useMemo, useEffect } from 'react'
import { useListData } from '../../hooks/useListData'
import { useDebounce } from '../../hooks/useDebounce'
import { Scroll, Plus, RefreshCw, Pencil, Trash2, ExternalLink } from 'lucide-react'
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
import { SessionSelect } from '../../components/ui/SessionSelect'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { FormField, Input, TextArea } from '../../components/ui/FormField'
import { FileUploadField } from '../../components/ui/FileUploadField'
import { Spinner } from '../../components/ui/Spinner'
import type { OtherMatter } from '../../types'
import { formatDate, getFullName, toInputDate, sortByField } from '../../lib/utils'

const columns: Column<OtherMatter>[] = [
  { key: 'otherMattersNo', header: "Other Matter's No.", width: 'w-32' },
  { key: 'title', header: 'Title' },
  { key: 'author', header: 'Author', width: 'w-32' },
  { key: 'sessionNo', header: 'Session No.', width: 'w-24' },
  { key: 'status', header: 'Status', width: 'w-24' },
  {
    key: 'dateReceived',
    header: 'Date Received',
    width: 'w-28',
    render: (r) => <span className="text-xs">{formatDate(r.dateReceived)}</span>
  }
]

function OtherMatterFormModal({
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
  record?: OtherMatter
}) {
  const isEdit = !!record
  const [saving, setSaving] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    otherMattersNo: '',
    title: '',
    sessionNo: '',
    dateReceived: '',
    timeReceived: '',
    status: '',
    author: '',
    tag: ''
  })

  useEffect(() => {
    if (open) {
      setForm(
        record
          ? {
              otherMattersNo: record.otherMattersNo ?? '',
              title: record.title ?? '',
              sessionNo: record.sessionNo ?? '',
              dateReceived: toInputDate(record.dateReceived),
              timeReceived: record.timeReceived ?? '',
              status: record.status ?? '',
              author: record.author ?? '',
              tag: record.tag ?? ''
            }
          : {
              otherMattersNo: '',
              title: '',
              sessionNo: '',
              dateReceived: '',
              timeReceived: '',
              status: '',
              author: '',
              tag: ''
            }
      )
      setFile(null)
    }
  }, [open, record])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.otherMattersNo.trim() || !form.title.trim() || !form.author.trim()) {
      notify.error("Other Matter's Number, Title, and Author are required")
      return
    }
    setSaving(true)
    try {
      if (isEdit)
        await updateDocumentWithFile(
          'matters',
          record!.id,
          { ...form },
          'otherMatters',
          `Matter_${form.otherMattersNo}`,
          file,
          record?.fileUrl ?? '',
          record?.fileType ?? ''
        )
      else
        await addDocumentWithFile(
          'matters',
          { ...form },
          'otherMatters',
          `Matter_${form.otherMattersNo}`,
          file
        )
      await logActivity(`${isEdit ? 'Updated' : 'Created'} Other Matter ${form.otherMattersNo}`)
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
      title={isEdit ? 'Edit Other Matter' : 'Add Other Matter'}
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
        <FormField label="Other Matter's Number" required>
          <Input type="number" min="1" value={form.otherMattersNo} onChange={set('otherMattersNo')} placeholder="e.g. 1" />
        </FormField>
        <FormField label="Date Received">
          <Input type="date" value={form.dateReceived} onChange={set('dateReceived')} />
        </FormField>
        <FormField label="Title" required className="col-span-2">
          <TextArea value={form.title} onChange={set('title')} rows={3} />
        </FormField>
        <FormField label="Session Number">
          <SessionSelect value={form.sessionNo} onChange={(v) => setForm((f) => ({ ...f, sessionNo: v }))} />
        </FormField>
        <FormField label="Status">
          <Input value={form.status} onChange={set('status')} />
        </FormField>
        <FormField label="Time Received">
          <Input type="time" value={form.timeReceived} onChange={set('timeReceived')} />
        </FormField>
        <FormField label="Author" required>
          <Input value={form.author} onChange={set('author')} />
        </FormField>
        <FormField label="Tag">
          <Input value={form.tag} onChange={set('tag')} />
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

export function OtherMattersPage() {
  const { hiddenColumns, toggleColumn } = useColumnVisibility(columns)
  const user = useAuthStore((s) => s.user)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { items, loading, loadingMore, hasMore, reload, loadMore, sortField, sortDirection } = useListData<
    Record<string, unknown>
  >({
    endpoint: 'santa_other_matters',
    sortParam: 'otherMattersNo|desc',
    dataKey: 'matters',
    limit: 100,
    searchQuery: debouncedSearch
  })
  const [selected, setSelected] = useState<OtherMatter | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const filtered = useMemo(() => {
    const base = items as unknown as OtherMatter[]
    const q = debouncedSearch.toLowerCase()
    const result = !debouncedSearch.trim() ? base : base.filter(
      (r) =>
        r.title?.toLowerCase().includes(q) ||
        r.otherMattersNo?.toLowerCase().includes(q) ||
        r.author?.toLowerCase().includes(q)
    )
    return sortByField(result as unknown as Record<string, unknown>[], sortField, sortDirection) as unknown as OtherMatter[]
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
        'matters',
        selected.id,
        'otherMatters',
        `OtherMattersNo._${selected.otherMattersNo}`
      )
      await logActivity(`Deleted Other Matter ${selected.otherMattersNo}`)
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
          title="Other Matters"
          subtitle={`${filtered.length} records`}
          icon={<Scroll size={20} />}
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
            placeholder="Search by number, title, author..."
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
            emptyMessage="No other matter records found"
            loadingMore={loadingMore}
            onEndReached={hasMore ? loadMore : undefined}
          />
        </div>
        <OtherMatterFormModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false)
            reload()
          }}
          logActivity={logActivity}
        />
        {selected && (
          <OtherMatterFormModal
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
          title="Delete Other Matter"
          message={`Delete ${selected?.otherMattersNo}?`}
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
