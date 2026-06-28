import { useState, useMemo, useEffect } from 'react'
import { useListData } from '../../hooks/useListData'
import { useDebounce } from '../../hooks/useDebounce'
import { GitMerge, Plus, RefreshCw, Pencil, Trash2, ExternalLink } from 'lucide-react'
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
import type { Review } from '../../types'
import { formatDate, getFullName, toInputDate, sortByField } from '../../lib/utils'

const CATEGORIES = [
  { value: 'Ordinance', label: 'Ordinance' },
  { value: 'Resolution', label: 'Resolution' }
]

const columns: Column<Review>[] = [
  { key: 'reviewNo', header: 'Review No.', width: 'w-28' },
  {
    key: 'category',
    header: 'Category',
    width: 'w-28',
    render: (r) => <Badge variant="blue">{r.category}</Badge>
  },
  { key: 'title', header: 'Title' },
  { key: 'districtCouncilor', header: 'District Councilor', width: 'w-40' },
  { key: 'sessionNo', header: 'Session No.', width: 'w-28' },
  { key: 'tag', header: 'Tag', width: 'w-32' },
  {
    key: 'dateReceived',
    header: 'Date Received',
    width: 'w-28',
    render: (r) => <span className="text-xs">{formatDate(r.dateReceived)}</span>
  }
]

const EMPTY_FORM = {
  reviewNo: '',
  title: '',
  description: '',
  districtCouncilor: '',
  sessionNo: '',
  tag: '',
  dateReceived: '',
  timeReceived: '',
  category: 'Ordinance'
}

function ReviewFormModal({
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
  record?: Review
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
              reviewNo: record.reviewNo ?? '',
              title: record.title ?? '',
              description: record.description ?? '',
              districtCouncilor: record.districtCouncilor ?? '',
              sessionNo: record.sessionNo ?? '',
              tag: record.tag ?? '',
              dateReceived: toInputDate(record.dateReceived),
              timeReceived: record.timeReceived ?? '',
              category: record.category ?? 'Ordinance'
            }
          : EMPTY_FORM
      )
      setFile(null)
    }
  }, [open, record])

  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.reviewNo.trim() || !form.title.trim()) {
      notify.error('Review Number and Title are required')
      return
    }
    setSaving(true)
    try {
      const data = {
        reviewNo: form.reviewNo,
        title: form.title,
        description: form.description,
        districtCouncilor: form.districtCouncilor,
        sessionNo: form.sessionNo,
        tag: form.tag,
        dateReceived: form.dateReceived,
        timeReceived: form.timeReceived,
        category: form.category
      }

      if (isEdit)
        await updateDocumentWithFile(
          'santa_review',
          record!.id,
          data,
          'Review',
          form.reviewNo,
          file,
          record?.fileUrl ?? '',
          record?.fileType ?? ''
        )
      else
        await addDocumentWithFile('santa_review', data, 'Review', form.reviewNo, file)
      await logActivity(`${isEdit ? 'Updated' : 'Created'} Barangay Review's Number ${form.reviewNo}`)
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
      title={isEdit ? 'Edit Barangay Review' : 'Add Barangay Review'}
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
        <FormField label="Barangay Review Number" required>
          <Input type="number" min="1" value={form.reviewNo} onChange={set('reviewNo')} placeholder="e.g. 1" />
        </FormField>
        <FormField label="Category">
          <Select options={CATEGORIES} value={form.category} onChange={set('category')} />
        </FormField>
        <FormField label="Title" required className="col-span-2">
          <TextArea value={form.title} onChange={set('title')} rows={3} />
        </FormField>
        <FormField label="Description" className="col-span-2">
          <TextArea value={form.description} onChange={set('description')} rows={3} />
        </FormField>
        <FormField label="District Councilor">
          <Input value={form.districtCouncilor} onChange={set('districtCouncilor')} />
        </FormField>
        <FormField label="Session Number">
          <SessionSelect value={form.sessionNo} onChange={(v) => setForm((f) => ({ ...f, sessionNo: v }))} />
        </FormField>
        <FormField label="Tag">
          <Input value={form.tag} onChange={set('tag')} placeholder="Keywords/tags" />
        </FormField>
        <FormField label="Date Received">
          <Input type="date" value={form.dateReceived} onChange={set('dateReceived')} />
        </FormField>
        <FormField label="Time Received">
          <Input type="time" value={form.timeReceived} onChange={set('timeReceived')} />
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

export function ReviewPage() {
  const { hiddenColumns, toggleColumn } = useColumnVisibility(columns)
  const user = useAuthStore((s) => s.user)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { items, loading, loadingMore, hasMore, reload, loadMore, sortField, sortDirection } = useListData<
    Record<string, unknown>
  >({
    endpoint: 'santa_review',
    sortParam: 'reviewNo|desc',
    dataKey: 'review',
    searchQuery: debouncedSearch
  })
  const [selected, setSelected] = useState<Review | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const filtered = useMemo(() => {
    const arr = items as unknown as Review[]
    const q = debouncedSearch.toLowerCase()
    const result = !debouncedSearch.trim() ? arr : arr.filter((r) =>
      Object.values(r as unknown as Record<string, unknown>).some((v) =>
        String(v ?? '')
          .toLowerCase()
          .includes(q)
      )
    )
    return sortByField(result as unknown as Record<string, unknown>[], sortField, sortDirection) as unknown as Review[]
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
      await deleteDocumentWithFile('santa_review', selected.id, 'Review', selected.reviewNo)
      await logActivity(`Deleted Barangay Review's Number ${selected.reviewNo}`)
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
          title="Barangay Review"
          subtitle={`${filtered.length} records`}
          icon={<GitMerge size={20} />}
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
            placeholder="Search by review no., title, district councilor..."
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
            emptyMessage="No review records found"
            loadingMore={loadingMore}
            onEndReached={hasMore ? loadMore : undefined}
          />
        </div>
        <ReviewFormModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false)
            reload()
          }}
          logActivity={logActivity}
        />
        {selected && (
          <ReviewFormModal
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
          title="Delete Review"
          message={`Delete Review ${selected?.reviewNo}?`}
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
