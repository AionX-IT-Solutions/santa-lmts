import { useState, useMemo, useEffect } from 'react'
import { useListData } from '../../hooks/useListData'
import { useDebounce } from '../../hooks/useDebounce'
import { Mic, Plus, RefreshCw, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { notify } from '../../lib/notify'
import { addDocument, addDocumentWithCount, deleteDocumentWithFile, addDocumentWithFile, updateDocumentWithFile } from '../../lib/firebase'
import { useAuthStore } from '../../store/authStore'
import { Layout, PageContainer } from '../../components/layout/Layout'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable, Column, useColumnVisibility, ColumnsButton } from '../../components/ui/DataTable'
import { SessionSelect } from '../../components/ui/SessionSelect'
import { Badge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { FormField, Input, Select, TextArea } from '../../components/ui/FormField'
import { FileUploadField } from '../../components/ui/FileUploadField'
import { Spinner } from '../../components/ui/Spinner'
import type { Transcript } from '../../types'
import { getFullName, sortByField } from '../../lib/utils'

const SESSION_TYPES = [
  { value: 'Regular Session', label: 'Regular Session' },
  { value: 'Special Session', label: 'Special Session' }
]

const columns: Column<Transcript>[] = [
  { key: 'transcriptNo', header: 'Minutes No.', width: 'w-28' },
  { key: 'sessionNo', header: 'Session No.', width: 'w-28' },
  {
    key: 'sessionCategory',
    header: 'Session Type',
    width: 'w-32',
    render: (r) => <Badge variant="indigo">{r.sessionCategory}</Badge>
  },
  { key: 'title', header: 'Title' },
  { key: 'previousSessionNo', header: 'Prev. Session No.', width: 'w-32' },
  { key: 'dateOfPreviousSession', header: 'Date of Prev. Session', width: 'w-44' },
  { key: 'tag', header: 'Tag', width: 'w-32' }
]

const EMPTY_FORM = {
  sessionNo: '',
  sessionCategory: 'Regular Session',
  previousSessionNo: '',
  dateOfPreviousSession: '',
  transcriptNo: '',
  title: '',
  tag: ''
}

function TranscriptFormModal({
  open,
  onClose,
  onSuccess,
  logActivity,
  record,
  existingItems
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  logActivity: (a: string) => Promise<void>
  record?: Transcript
  existingItems: Transcript[]
}) {
  const isEdit = !!record
  const [saving, setSaving] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (open) {
      setForm(
        record
          ? {
              sessionNo: record.sessionNo ?? '',
              sessionCategory: record.sessionCategory ?? 'Regular Session',
              previousSessionNo: record.previousSessionNo ?? '',
              dateOfPreviousSession: record.dateOfPreviousSession ?? '',
              transcriptNo: record.transcriptNo ?? '',
              title: record.title ?? '',
              tag: record.tag ?? ''
            }
          : EMPTY_FORM
      )
      setFile(null)
    }
  }, [open, record])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.sessionNo.trim()) {
      notify.error('Session number is required')
      return
    }
    if (!isEdit && existingItems.some((item) => item.sessionNo === form.sessionNo)) {
      notify.error(`Session No. ${form.sessionNo} already exists`)
      return
    }
    setSaving(true)
    try {
      if (isEdit)
        await updateDocumentWithFile(
          'santa_transcript',
          record!.id,
          { ...form },
          'TranscriptOfProceedings',
          `TranscriptNo._${form.sessionNo}`,
          file,
          record?.fileUrl ?? '',
          record?.fileType ?? ''
        )
      else
        await addDocumentWithFile(
          'santa_transcript',
          { ...form },
          'TranscriptOfProceedings',
          `TranscriptNo._${form.sessionNo}`,
          file
        )
      await logActivity(`${isEdit ? 'Updated' : 'Created'} Transcript Session ${form.sessionNo}`)
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
      title={isEdit ? 'Edit Minutes Record' : 'Add Minutes Record'}
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
        <FormField label="Session Number" required>
          <SessionSelect value={form.sessionNo} onChange={(v) => setForm((f) => ({ ...f, sessionNo: v }))} />
        </FormField>
        <FormField label="Session Type">
          <Select options={SESSION_TYPES} value={form.sessionCategory} onChange={set('sessionCategory')} />
        </FormField>
        <FormField label="Previous Session No.">
          <Input
            value={form.previousSessionNo}
            onChange={set('previousSessionNo')}
            placeholder="e.g. 70th"
          />
        </FormField>
        <FormField label="Date of Previous Session">
          <Input
            value={form.dateOfPreviousSession}
            onChange={set('dateOfPreviousSession')}
            placeholder="e.g. Tuesday, December 5, 2023"
          />
        </FormField>
        <FormField label="Minutes No.">
          <Input type="number" min="1" value={form.transcriptNo} onChange={set('transcriptNo')} placeholder="e.g. 1" />
        </FormField>
        <FormField label="Title" className="col-span-2">
          <TextArea value={form.title} onChange={set('title')} rows={3} placeholder="e.g. Transcribed Record of the 24th Regular Session" />
        </FormField>
        <FormField label="Tag" className="col-span-2">
          <Input value={form.tag} onChange={set('tag')} placeholder="Keywords/tags" />
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

export function TranscriptPage() {
  const { hiddenColumns, toggleColumn } = useColumnVisibility(columns)
  const user = useAuthStore((s) => s.user)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { items, loading, loadingMore, hasMore, reload, loadMore, sortField, sortDirection } = useListData<
    Record<string, unknown>
  >({
    endpoint: 'santa_transcript',
    sortParam: 'transcriptNo|desc',
    dataKey: 'transcript',
    searchQuery: debouncedSearch
  })
  const [selected, setSelected] = useState<Transcript | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const filtered = useMemo(() => {
    const arr = items as unknown as Transcript[]
    const q = debouncedSearch.toLowerCase()
    const result = !debouncedSearch.trim() ? arr : arr.filter((r) =>
      Object.values(r as unknown as Record<string, unknown>).some((v) =>
        String(v ?? '')
          .toLowerCase()
          .includes(q)
      )
    )
    return sortByField(result as unknown as Record<string, unknown>[], sortField, sortDirection) as unknown as Transcript[]
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
        'santa_transcript',
        selected.id,
        'TranscriptOfProceedings',
        `TranscriptNo._${selected.sessionNo}`
      )
      await logActivity(`Deleted Transcript Session ${selected.sessionNo}`)
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
          title="Reading and Approval of the Minutes of the Previous Regular Session"
          subtitle={`${filtered.length} records`}
          icon={<Mic size={20} />}
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
            placeholder="Search by session no., minutes no., title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field w-64! py-2!"
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
            emptyMessage="No minutes records found"
            loadingMore={loadingMore}
            onEndReached={hasMore ? loadMore : undefined}
          />
        </div>
        <TranscriptFormModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false)
            reload()
          }}
          logActivity={logActivity}
          existingItems={filtered}
        />
        {selected && (
          <TranscriptFormModal
            open={showEdit}
            onClose={() => setShowEdit(false)}
            onSuccess={() => {
              setShowEdit(false)
              setSelected(null)
              reload()
            }}
            logActivity={logActivity}
            existingItems={filtered}
            record={selected}
          />
        )}
        <ConfirmDialog
          open={showDelete}
          title="Delete Minutes Record"
          message={`Delete minutes record for Session ${selected?.sessionNo}?`}
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
