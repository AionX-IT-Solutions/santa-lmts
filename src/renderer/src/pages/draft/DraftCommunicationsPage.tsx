import { useState, useMemo, useEffect } from 'react'
import { useListData } from '../../hooks/useListData'
import { useDebounce } from '../../hooks/useDebounce'
import { MessageSquare, Plus, RefreshCw, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { notify } from '../../lib/notify'
import {
  addDocumentWithCount,
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
import { FormField, Input, Select, TextArea } from '../../components/ui/FormField'
import { FileUploadField } from '../../components/ui/FileUploadField'
import { Spinner } from '../../components/ui/Spinner'
import type { DraftCommunication } from '../../types'
import { formatDate, getFullName, toInputDate, sortByField } from '../../lib/utils'
import { useOfficialsForForm } from '../../hooks/useOfficialsForForm'

const ACTION_OPTIONS = [
  { value: 'First Reading', label: 'First Reading' },
  { value: 'Second Reading', label: 'Second Reading' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Disapproved', label: 'Disapproved' }
]

const columns: Column<DraftCommunication>[] = [
  { key: 'draftCommunicationNumber', header: 'Comm. No.', width: 'w-28' },
  { key: 'sessionNo', header: 'Session No.', width: 'w-28' },
  { key: 'series', header: 'Series', width: 'w-28' },
  { key: 'tag', header: 'Tag', width: 'w-28' },
  { key: 'title', header: 'Title' },
  { key: 'author', header: 'Author', width: 'w-32' },
  { key: 'action', header: 'Action', width: 'w-32' },
  {
    key: 'dateReceived',
    header: 'Date',
    width: 'w-28',
    render: (r) => <span className="text-xs">{formatDate(r.dateReceived)}</span>
  }
]

function DraftCommFormModal({
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
  record?: DraftCommunication
  existingItems: DraftCommunication[]
}) {
  const isEdit = !!record
  const [saving, setSaving] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const { loadingOfficials, selectedTerm, setSelectedTerm, termOptions, officialNames, authorOptions } =
    useOfficialsForForm(open)
  const [form, setForm] = useState({
    draftCommunicationNumber: '',
    series: '',
    sessionNo: '',
    committee: '',
    title: '',
    author: '',
    coSponsors: [] as string[],
    tag: '',
    dateReceived: '',
    action: 'First Reading',
    remarks: ''
  })

  useEffect(() => {
    if (open) {
      setForm(
        record
          ? {
              draftCommunicationNumber: record.draftCommunicationNumber ?? '',
              series: record.series ?? '',
              sessionNo: record.sessionNo ?? '',
              committee: record.committee ?? '',
              title: record.title ?? '',
              author: record.author ?? '',
              coSponsors: Array.isArray(record.coSponsors) ? record.coSponsors : record.coSponsors ? record.coSponsors.split(', ').filter(Boolean) : [],
              tag: record.tag ?? '',
              dateReceived: toInputDate(record.dateReceived),
              action: record.action ?? 'First Reading',
              remarks: record.remarks ?? ''
            }
          : {
              draftCommunicationNumber: '',
              series: '',
              sessionNo: '',
              committee: '',
              title: '',
              author: '',
              coSponsors: [],
              tag: '',
              dateReceived: '',
              action: 'First Reading',
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
    if (!form.draftCommunicationNumber.trim() || !form.title.trim() || !form.sessionNo.trim()) {
      notify.error('Draft number, Session number, and Title are required')
      return
    }
    if (!isEdit && existingItems.some((item) => item.draftCommunicationNumber === form.draftCommunicationNumber)) {
      notify.error(`Communication No. ${form.draftCommunicationNumber} already exists`)
      return
    }
    setSaving(true)
    try {
      if (isEdit)
        await updateDocumentWithFile(
          'santa_draft_communication',
          record!.id,
          { ...form },
          'draftCommunications',
          `DraftComm_${form.draftCommunicationNumber}`,
          file,
          record?.fileUrl ?? '',
          record?.fileType ?? ''
        )
      else
        await addDocumentWithFile(
          'santa_draft_communication',
          { ...form },
          'draftCommunications',
          `DraftComm_${form.draftCommunicationNumber}`,
          file
        )
      await logActivity(
        `${isEdit ? 'Updated' : 'Created'} Draft Communication ${form.draftCommunicationNumber}`
      )
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
      title={isEdit ? 'Edit Communication' : 'Add Communication'}
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
        <FormField label="Communication Number" required>
          <Input type="number" min="1" value={form.draftCommunicationNumber} onChange={set('draftCommunicationNumber')} placeholder="e.g. 1" />
        </FormField>
        <FormField label="Session Number" required>
          <SessionSelect value={form.sessionNo} onChange={(v) => setForm((f) => ({ ...f, sessionNo: v }))} />
        </FormField>
        <FormField label="Series">
          <Input value={form.series} onChange={set('series')} placeholder="e.g. Series of 2024" />
        </FormField>
        <FormField label="Committee">
          <Input value={form.committee} onChange={set('committee')} placeholder="e.g. Committee on Finance" />
        </FormField>
        <FormField label="Title" required className="col-span-2">
          <TextArea value={form.title} onChange={set('title')} rows={3} />
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
                setForm((f) => ({ ...f, author: '', coSponsors: [] }))
              }}
            />
          )}
        </FormField>
        <FormField label="Author">
          {loadingOfficials ? (
            <div className="input-field flex items-center justify-center"><Spinner size="sm" /></div>
          ) : (
            <Select options={authorOptions} value={form.author} onChange={set('author')} placeholder="Select author" />
          )}
        </FormField>
        <FormField label="Co-Sponsors">
          {loadingOfficials ? (
            <div className="input-field flex items-center justify-center"><Spinner size="sm" /></div>
          ) : (
            <div className="border border-slate-200 rounded-lg p-3 max-h-36 overflow-y-auto grid grid-cols-1 gap-1.5">
              {officialNames.length === 0 ? (
                <p className="text-xs text-slate-400">No officials for selected term</p>
              ) : (
                officialNames.map((name) => (
                  <label key={name} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.coSponsors.includes(name)}
                      onChange={() => {
                        const updated = form.coSponsors.includes(name)
                          ? form.coSponsors.filter((n) => n !== name)
                          : [...form.coSponsors, name]
                        setForm((f) => ({ ...f, coSponsors: updated }))
                      }}
                    />
                    {name}
                  </label>
                ))
              )}
            </div>
          )}
        </FormField>
        <FormField label="Tag" className="col-span-2">
          <Input value={form.tag} onChange={set('tag')} />
        </FormField>
        <FormField label="Date Received">
          <Input type="date" value={form.dateReceived} onChange={set('dateReceived')} />
        </FormField>
        <FormField label="Action">
          <Select options={ACTION_OPTIONS} value={form.action} onChange={set('action')} />
        </FormField>
        <FormField label="Remarks" className="col-span-2">
          <TextArea value={form.remarks} onChange={set('remarks')} rows={3} />
        </FormField>
        <div className="col-span-2">
          <FileUploadField value={file} onChange={setFile} />
          {isEdit && record?.fileUrl && !file && (
            <p className="text-xs text-slate-500 mt-1.5">
              Current file:{' '}
              <a href={record.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                View attached file
              </a>
            </p>
          )}
        </div>
      </form>
    </Modal>
  )
}

export function DraftCommunicationsPage() {
  const { hiddenColumns, toggleColumn } = useColumnVisibility(columns)
  const user = useAuthStore((s) => s.user)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { items, loading, loadingMore, hasMore, reload, loadMore, sortField, sortDirection } =
    useListData<Record<string, unknown>>({
      endpoint: 'santa_draft_communication',
      sortParam: 'draftCommunicationNumber|desc',
      dataKey: 'draftCommunication',
      limit: 100,
      searchQuery: debouncedSearch
    })
  const [selected, setSelected] = useState<DraftCommunication | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const filtered = useMemo(() => {
    const base = items as unknown as DraftCommunication[]
    const q = debouncedSearch.toLowerCase()
    const result = !debouncedSearch.trim()
      ? base
      : base.filter(
          (r) =>
            r.title?.toLowerCase().includes(q) || r.draftCommunicationNumber?.toLowerCase().includes(q)
        )
    return sortByField(result, sortField, sortDirection)
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
        'santa_draft_communication',
        selected.id,
        'draftCommunications',
        `DraftComm_${selected.draftCommunicationNumber}`
      )
      await logActivity(`Deleted Draft Communication ${selected.draftCommunicationNumber}`)
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
          title="Communications"
          subtitle={`${filtered.length} records`}
          icon={<MessageSquare size={20} />}
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
            placeholder="Search by comm. no., title..."
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
            emptyMessage="No draft communication records found"
            loadingMore={loadingMore}
            onEndReached={hasMore ? loadMore : undefined}
          />
        </div>
        <DraftCommFormModal
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
          <DraftCommFormModal
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
          title="Delete Draft Communication"
          message={`Delete Draft Communication ${selected?.draftCommunicationNumber}?`}
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
