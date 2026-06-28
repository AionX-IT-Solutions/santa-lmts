import { useState, useMemo, useEffect } from 'react'
import { useListData } from '../../hooks/useListData'
import { useDebounce } from '../../hooks/useDebounce'
import { BookOpen, Plus, RefreshCw, Pencil, Trash2, ExternalLink } from 'lucide-react'
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
import { Badge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { FormField, Input, Select, TextArea } from '../../components/ui/FormField'
import { useOfficialsForForm } from '../../hooks/useOfficialsForForm'
import { FileUploadField } from '../../components/ui/FileUploadField'
import { Spinner } from '../../components/ui/Spinner'
import type { Minutes } from '../../types'
import { getFullName, toInputDate } from '../../lib/utils'

const CATEGORIES = ['Regular Session', 'Special Session']

const parseSessionNo = (sessionNo?: string) => {
  const m = /^(\d+)SP_(\d+)/i.exec(sessionNo ?? '')
  if (m) return { group: 0, primary: parseInt(m[1], 10), secondary: parseInt(m[2], 10) }
  return { group: 1, primary: parseInt(sessionNo ?? '', 10) || 0, secondary: 0 }
}

const compareSessionNoDesc = (a?: string, b?: string) => {
  const pa = parseSessionNo(a)
  const pb = parseSessionNo(b)
  if (pa.group !== pb.group) return pa.group - pb.group
  if (pa.primary !== pb.primary) return pb.primary - pa.primary
  return pb.secondary - pa.secondary
}

const SESSION_TYPES = [
  { value: 'Regular Session', label: 'Regular Session' },
  { value: 'Special Session', label: 'Special Session' }
]

const columns: Column<Minutes>[] = [
  { key: 'sessionNo', header: 'Session No.', width: 'w-32' },
  {
    key: 'category',
    header: 'Category',
    width: 'w-36',
    render: (r) => <Badge variant="blue">{r.category}</Badge>
  },
  {
    key: 'date',
    header: 'Date',
    width: 'w-52',
    render: (r) => {
      if (!r.date) return <span>—</span>
      const d = new Date(r.date)
      if (isNaN(d.getTime())) return <span>{r.date}</span>
      return (
        <span>
          {d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      )
    }
  },
  { key: 'time', header: 'Time', width: 'w-24' },
  { key: 'title', header: 'Title', width: 'w-48' },
  { key: 'agenda', header: 'Agenda' },
  { key: 'tag', header: 'Tag', width: 'w-24' },
  { key: 'adjournmentTime', header: 'Adj. Time', width: 'w-24' }
]

const EMPTY_FORM = {
  sessionNo: '',
  date: '',
  category: 'Regular Session',
  time: '',
  callOrder: '',
  title: '',
  agenda: '',
  tag: '',
  present: '',
  absent: '',
  adjournmentTime: '',
  prayer: '',
  rollCall: ''
}

function MinutesFormModal({
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
  record?: Minutes
}) {
  const isEdit = !!record
  const [saving, setSaving] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const { loadingOfficials, selectedTerm, setSelectedTerm, termOptions, officialNames } = useOfficialsForForm(open)

  useEffect(() => {
    if (open) {
      setForm(
        record
          ? {
              sessionNo: record.sessionNo ?? '',
              date: toInputDate(record.date),
              category: record.category ?? 'Regular Session',
              time: record.time ?? '',
              callOrder: record.callOrder ?? '',
              title: record.title ?? '',
              agenda: record.agenda ?? '',
              tag: record.tag ?? '',
              present: Array.isArray(record.present) ? record.present.join(', ') : (record.present ?? ''),
              absent: Array.isArray(record.absent) ? record.absent.join(', ') : (record.absent ?? ''),
              adjournmentTime: record.adjournmentTime ?? '',
              prayer: record.prayer ?? '',
              rollCall: record.rollCall ?? ''
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

  const presentList = form.present ? form.present.split(', ').filter(Boolean) : []
  const absentList = form.absent ? form.absent.split(', ').filter(Boolean) : []

  const togglePresent = (name: string) => {
    if (presentList.includes(name)) {
      setForm((f) => ({ ...f, present: presentList.filter((n) => n !== name).join(', ') }))
    } else {
      setForm((f) => ({
        ...f,
        present: [...presentList, name].join(', '),
        absent: absentList.filter((n) => n !== name).join(', ')
      }))
    }
  }

  const toggleAbsent = (name: string) => {
    if (absentList.includes(name)) {
      setForm((f) => ({ ...f, absent: absentList.filter((n) => n !== name).join(', ') }))
    } else {
      setForm((f) => ({
        ...f,
        absent: [...absentList, name].join(', '),
        present: presentList.filter((n) => n !== name).join(', ')
      }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.sessionNo.trim()) {
      notify.error('Session number is required')
      return
    }
    setSaving(true)
    try {
      const presentArr = form.present
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const absentArr = form.absent
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const data = {
        sessionNo: form.sessionNo,
        date: form.date,
        category: form.category,
        time: form.time,
        callOrder: form.callOrder,
        title: form.title,
        agenda: form.agenda,
        tag: form.tag,
        present: presentArr,
        absent: absentArr,
        adjournmentTime: form.adjournmentTime,
        prayer: form.prayer,
        rollCall: form.rollCall
      }

      if (isEdit)
        await updateDocumentWithFile(
          'santa_minutes',
          record!.id,
          data,
          'minutes',
          `minutesNo._${form.sessionNo}`,
          file,
          record?.fileUrl ?? '',
          record?.fileType ?? ''
        )
      else
        await addDocumentWithFile(
          'santa_minutes',
          data,
          'minutes',
          `minutesNo._${form.sessionNo}`,
          file
        )
      await logActivity(`${isEdit ? 'Updated' : 'Created'} Minutes Session ${form.sessionNo}`)
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
      title={isEdit ? 'Edit Minutes' : 'Add Minutes'}
      size="xl"
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
          <Input value={form.sessionNo} onChange={set('sessionNo')} placeholder="e.g. 13SP_15th" />
        </FormField>
        <FormField label="Session Type">
          <Select options={SESSION_TYPES} value={form.category} onChange={set('category')} />
        </FormField>
        <FormField label="Date">
          <Input type="date" value={form.date} onChange={set('date')} />
        </FormField>
        <FormField label="Time">
          <Input type="time" value={form.time} onChange={set('time')} />
        </FormField>
        <FormField label="Agenda" className="col-span-2">
          <TextArea
            value={form.agenda}
            onChange={set('agenda')}
            placeholder="Agenda of the session"
            rows={3}
          />
        </FormField>
        <FormField label="Title" className="col-span-2">
          <Input
            value={form.title}
            onChange={set('title')}
            placeholder="e.g. Minutes of the 24th Regular Session of the Sangguniang Bayan"
          />
        </FormField>
        <FormField label="Call to Order">
          <Input value={form.callOrder} onChange={set('callOrder')} placeholder="e.g. The 24th Regular Session" />
        </FormField>
        <FormField label="Adjournment Time">
          <Input type="time" value={form.adjournmentTime} onChange={set('adjournmentTime')} />
        </FormField>
        <FormField label="Tag" className="col-span-2">
          <Input value={form.tag} onChange={set('tag')} placeholder="Keywords/tags" />
        </FormField>
        <FormField label="Invocation" className="col-span-2">
          <Input value={form.prayer} onChange={set('prayer')} placeholder="e.g. Hon. Jesus B. Bueno Jr. lead the opening prayer." />
        </FormField>
        <FormField label="Roll Call" className="col-span-2">
          <TextArea value={form.rollCall} onChange={set('rollCall')} placeholder="e.g. The roll was called and all members of the Sanggunian Bayan were present, thus the presiding officer declared the presence of a quorum." rows={3} />
        </FormField>

        {/* Legislative Term for Present/Absent */}
        <FormField label="Legislative Term" className="col-span-2">
          {loadingOfficials ? (
            <div className="input-field flex items-center justify-center"><Spinner size="sm" /></div>
          ) : (
            <Select
              options={termOptions}
              value={selectedTerm}
              onChange={(e) => {
                setSelectedTerm(e.target.value)
                setForm((f) => ({ ...f, present: '', absent: '' }))
              }}
            />
          )}
        </FormField>

        <FormField label="Members Present" className="col-span-2">
          {loadingOfficials ? (
            <div className="input-field flex items-center justify-center"><Spinner size="sm" /></div>
          ) : (
            <div className="border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto grid grid-cols-2 gap-1.5">
              {officialNames.length === 0 ? (
                <p className="text-xs text-slate-400 col-span-2">No officials for selected term</p>
              ) : (
                officialNames.map((name) => (
                  <label key={name} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={presentList.includes(name)}
                      onChange={() => togglePresent(name)}
                    />
                    {name}
                  </label>
                ))
              )}
            </div>
          )}
        </FormField>

        <FormField label="Members Absent" className="col-span-2">
          {loadingOfficials ? (
            <div className="input-field flex items-center justify-center"><Spinner size="sm" /></div>
          ) : (
            <div className="border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto grid grid-cols-2 gap-1.5">
              {officialNames.length === 0 ? (
                <p className="text-xs text-slate-400 col-span-2">No officials for selected term</p>
              ) : (
                officialNames.map((name) => (
                  <label key={name} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={absentList.includes(name)}
                      onChange={() => toggleAbsent(name)}
                    />
                    {name}
                  </label>
                ))
              )}
            </div>
          )}
        </FormField>
        <div className="col-span-2 border-t border-slate-100 pt-3">
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

export function MinutesPage() {
  const { hiddenColumns, toggleColumn } = useColumnVisibility(columns)
  const user = useAuthStore((s) => s.user)
  const [category, setCategory] = useState('Regular Session')
  const filters = useMemo(
    () => [{ field: 'category', op: '==' as const, value: category }],
    [category]
  )
  const { items, loading, loadingMore, hasMore, reload, loadMore } = useListData<
    Record<string, unknown>
  >({
    endpoint: 'santa_minutes',
    sortParam: 'sessionNo|desc',
    dataKey: 'minutes',
    limit: 100,
    filters
  })
  const [selected, setSelected] = useState<Minutes | null>(null)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  const filtered = useMemo(() => {
    let arr = items as unknown as Minutes[]
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      arr = arr.filter((m) =>
        Object.values(m as unknown as Record<string, unknown>).some((v) =>
          String(v ?? '')
            .toLowerCase()
            .includes(q)
        )
      )
    }
    return [...arr].sort((a, b) => compareSessionNoDesc(a.sessionNo, b.sessionNo))
  }, [items, debouncedSearch])

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
        'santa_minutes',
        selected.id,
        'minutes',
        `minutesNo._${selected.sessionNo}`
      )
      await logActivity(`Deleted Minutes Session ${selected.sessionNo}`)
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
          title="Calendar of Business / Minutes"
          subtitle={`${filtered.length} records`}
          icon={<BookOpen size={20} />}
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
                Add Minutes
              </button>
            </>
          }
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 14,
            flexShrink: 0
          }}
        >
          <div
            style={{
              display: 'flex',
              background: 'var(--c-surface)',
              border: '1px solid var(--c-border)',
              borderRadius: 12,
              padding: 4,
              gap: 4
            }}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat)
                  setSelected(null)
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background:
                    category === cat ? 'linear-gradient(135deg,#2563eb,#4f46e5)' : 'transparent',
                  color: category === cat ? '#fff' : 'var(--c-text-3)',
                  boxShadow: category === cat ? '0 2px 8px rgba(37,99,235,0.35)' : 'none'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search by session no., title, agenda..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{
              marginLeft: 'auto',
              width: 280,
              paddingTop: 8,
              paddingBottom: 8,
              fontSize: 13
            }}
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

        <MinutesFormModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false)
            reload()
          }}
          logActivity={logActivity}
        />
        {selected && (
          <MinutesFormModal
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
          title="Delete Minutes"
          message={`Delete minutes for Session ${selected?.sessionNo}?`}
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
