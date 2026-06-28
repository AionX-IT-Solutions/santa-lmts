import { useState, useMemo, useEffect } from 'react'
import { useListData } from '../../hooks/useListData'
import { useDebounce } from '../../hooks/useDebounce'
import { ClipboardList, Plus, RefreshCw, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { notify } from '../../lib/notify'
import { addDocument, addDocumentWithCount, deleteDocumentWithFile, addDocumentWithFile, updateDocumentWithFile } from '../../lib/firebase'
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
import type { CommitteeReport } from '../../types'
import { formatDate, getFullName, toInputDate, sortByField } from '../../lib/utils'
import { useOfficialsForForm } from '../../hooks/useOfficialsForForm'

const columns: Column<CommitteeReport>[] = [
  { key: 'committeeReportsNo', header: "Report's No.", width: 'w-32' },
  { key: 'committee', header: 'Committee', width: 'w-48' },
  { key: 'title', header: 'Title' },
  { key: 'sessionNo', header: 'Session No.', width: 'w-28' },
  { key: 'author', header: 'Author', width: 'w-36' },
  { key: 'tag', header: 'Tag', width: 'w-32' },
  {
    key: 'dateReceived',
    header: 'Date Received',
    width: 'w-32',
    render: (r) => <span className="text-xs">{formatDate(r.dateReceived)}</span>
  }
]

const EMPTY_FORM = {
  committeeReportsNo: '',
  committee: '',
  title: '',
  author: '',
  coSponsors: [] as string[],
  sessionNo: '',
  tag: '',
  dateReceived: '',
  timeReceived: ''
}

function CommitteeReportFormModal({
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
  record?: CommitteeReport
}) {
  const isEdit = !!record
  const [saving, setSaving] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const { loadingOfficials, selectedTerm, setSelectedTerm, termOptions, officialNames, authorOptions } =
    useOfficialsForForm(open)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (open) {
      setForm(
        record
          ? {
              committeeReportsNo: record.committeeReportsNo ?? '',
              committee: record.committee ?? '',
              title: record.title ?? '',
              author: record.author ?? '',
              coSponsors: Array.isArray(record.coSponsors) ? record.coSponsors : record.coSponsors ? (record.coSponsors as unknown as string).split(', ').filter(Boolean) : [],
              sessionNo: record.sessionNo ?? '',
              tag: record.tag ?? '',
              dateReceived: toInputDate(record.dateReceived),
              timeReceived: record.timeReceived ?? ''
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
    if (!form.committeeReportsNo.trim() || !form.title.trim()) {
      notify.error("Report's Number and Title are required")
      return
    }
    setSaving(true)
    try {
      const data = {
        committeeReportsNo: form.committeeReportsNo,
        committee: form.committee,
        title: form.title,
        author: form.author,
        coSponsors: form.coSponsors,
        sessionNo: form.sessionNo,
        tag: form.tag,
        dateReceived: form.dateReceived,
        timeReceived: form.timeReceived
      }

      if (isEdit)
        await updateDocumentWithFile(
          'santa_committee_reports',
          record!.id,
          data,
          'CommitteeReports',
          `CommitteeReportsNo._${form.committeeReportsNo}`,
          file,
          record?.fileUrl ?? '',
          record?.fileType ?? ''
        )
      else
        await addDocumentWithFile(
          'santa_committee_reports',
          data,
          'CommitteeReports',
          `CommitteeReportsNo._${form.committeeReportsNo}`,
          file
        )
      await logActivity(
        `${isEdit ? 'Updated' : 'Created'} Committee Report's Number ${form.committeeReportsNo}`
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
      title={isEdit ? 'Edit Committee Report' : 'Add Committee Report'}
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
        <FormField label="Committee Report's Number" required>
          <Input type="number" min="1" value={form.committeeReportsNo} onChange={set('committeeReportsNo')} placeholder="e.g. 1" />
        </FormField>
        <FormField label="Committee">
          <Input value={form.committee} onChange={set('committee')} />
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

export function CommitteeReportsPage() {
  const { hiddenColumns, toggleColumn } = useColumnVisibility(columns)
  const user = useAuthStore((s) => s.user)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { items, loading, loadingMore, hasMore, reload, loadMore, sortField, sortDirection } = useListData<
    Record<string, unknown>
  >({
    endpoint: 'santa_committee_reports',
    sortParam: 'committeeReportsNo|desc',
    dataKey: 'committeeReports',
    limit: 100,
    searchQuery: debouncedSearch
  })
  const [selected, setSelected] = useState<CommitteeReport | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const filtered = useMemo(() => {
    const arr = items as unknown as CommitteeReport[]
    const q = debouncedSearch.toLowerCase()
    const result = !debouncedSearch.trim() ? arr : arr.filter((r) =>
      Object.values(r as unknown as Record<string, unknown>).some((v) =>
        String(v ?? '')
          .toLowerCase()
          .includes(q)
      )
    )
    return sortByField(result as unknown as Record<string, unknown>[], sortField, sortDirection) as unknown as CommitteeReport[]
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
        'santa_committee_reports',
        selected.id,
        'CommitteeReports',
        `CommitteeReportsNo._${selected.committeeReportsNo}`
      )
      await logActivity(`Deleted Committee Report's Number ${selected.committeeReportsNo}`)
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
          title="Committee Reports"
          subtitle={`${filtered.length} records`}
          icon={<ClipboardList size={20} />}
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
                Add Report
              </button>
            </>
          }
        />
        <div className="flex justify-end mb-4 shrink-0">
          <input
            type="text"
            placeholder="Search by report no., committee, title..."
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
            emptyMessage="No committee report records found"
            loadingMore={loadingMore}
            onEndReached={hasMore ? loadMore : undefined}
          />
        </div>
        <CommitteeReportFormModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false)
            reload()
          }}
          logActivity={logActivity}
        />
        {selected && (
          <CommitteeReportFormModal
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
          title="Delete Report"
          message={`Delete Report ${selected?.committeeReportsNo}?`}
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
