import { useState, useMemo, useEffect } from 'react'
import { useListData } from '../../hooks/useListData'
import { useDebounce } from '../../hooks/useDebounce'
import { Building2, Plus, RefreshCw, Pencil, Trash2, ExternalLink } from 'lucide-react'
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
import { FileUploadField } from '../../components/ui/FileUploadField'
import { Spinner } from '../../components/ui/Spinner'
import type { BrgyAction } from '../../types'
import { formatDate, getFullName, toInputDate, sortByField } from '../../lib/utils'

const BARANGAYS = [
  'AMPANDULA',
  'BANAOANG',
  'BASUG',
  'BUCALAG',
  'CABANGARAN',
  'CALUNGBOYAN',
  'CASIBER',
  'DAMMAY',
  'LABUT NORTE',
  'LABUT SUR',
  'MAB. NORTE',
  'MABILBILA SUR',
  'MAGSAYSAY',
  'MARCOS',
  'MANUEVA',
  'NAGPANAOAN',
  'NAMALANGAN',
  'ORIBI',
  'PASUNGOL',
  'QUEZON',
  'QUIRINO',
  'RANCHO',
  'RIZAL',
  'SAC. NORTE',
  'SACUYYA SUR',
  'TABUCOLAN',
]

const BARANGAY_OPTIONS = BARANGAYS.map((b) => ({ value: b, label: b }))

const CATEGORIES = [
  { value: 'Ordinance', label: 'Ordinance' },
  { value: 'Resolution', label: 'Resolution' }
]
const ACTION_OPTIONS = [
  { value: 'Valid', label: 'Valid' },
  { value: 'Returned', label: 'Returned' },
  { value: 'Invalid', label: 'Invalid' },
  { value: 'Others', label: 'Others' }
]

const columns: Column<BrgyAction>[] = [
  { key: 'brgy', header: 'Barangay', width: 'w-40' },
  {
    key: 'category',
    header: 'Category',
    width: 'w-28',
    render: (r) => <Badge variant="blue">{r.category}</Badge>
  },
  { key: 'measuresNo', header: 'Measures No.', width: 'w-32' },
  { key: 'measuresTitle', header: 'Measures Title' },
  { key: 'resolutionNumber', header: 'Resolution/Ordinance No.', width: 'w-44' },
  { key: 'action', header: 'Action', width: 'w-24' },
  { key: 'tag', header: 'Tag', width: 'w-32' },
  {
    key: 'dateApproved',
    header: 'Date Approved',
    width: 'w-28',
    render: (r) => <span className="text-xs">{formatDate(r.dateApproved)}</span>
  }
]

const EMPTY_FORM = {
  brgy: BARANGAYS[0],
  category: 'Ordinance',
  measuresNo: '',
  measuresTitle: '',
  resolutionNumber: '',
  action: 'Valid',
  actionOther: '',
  tag: '',
  dateApproved: '',
  dateReceived: '',
  timeReceived: '',
  dateReleased: '',
  timeReleased: ''
}

function BrgyFormModal({
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
  record?: BrgyAction
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
              brgy: record.brgy ?? '',
              category: record.category ?? 'Ordinance',
              measuresNo: record.measuresNo ?? '',
              measuresTitle: record.measuresTitle ?? '',
              resolutionNumber: record.resolutionNumber ?? '',
              action: ACTION_OPTIONS.some((o) => o.value === record.action)
                ? record.action
                : record.action
                  ? 'Others'
                  : 'Valid',
              actionOther: ACTION_OPTIONS.some((o) => o.value === record.action)
                ? ''
                : (record.action ?? ''),
              tag: record.tag ?? '',
              dateApproved: toInputDate(record.dateApproved),
              dateReceived: toInputDate(record.dateReceived),
              timeReceived: record.timeReceived ?? '',
              dateReleased: toInputDate(record.dateReleased),
              timeReleased: record.timeReleased ?? ''
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
    if (!form.brgy.trim() || !form.measuresTitle.trim()) {
      notify.error('Barangay and Measures Title are required')
      return
    }
    setSaving(true)
    try {
      const data = {
        brgy: form.brgy,
        category: form.category,
        measuresNo: form.measuresNo,
        measuresTitle: form.measuresTitle,
        resolutionNumber: form.resolutionNumber,
        action: form.action === 'Others' ? form.actionOther : form.action,
        tag: form.tag,
        dateApproved: form.dateApproved,
        dateReceived: form.dateReceived,
        timeReceived: form.timeReceived,
        dateReleased: form.dateReleased,
        timeReleased: form.timeReleased
      }

      if (isEdit)
        await updateDocumentWithFile(
          'santa_brgy',
          record!.id,
          data,
          'BrgyActions',
          `${form.brgy}_${form.measuresNo || form.resolutionNumber}`,
          file,
          record?.fileUrl ?? '',
          record?.fileType ?? ''
        )
      else
        await addDocumentWithFile(
          'santa_brgy',
          data,
          'BrgyActions',
          `${form.brgy}_${form.measuresNo || form.resolutionNumber}`,
          file
        )
      await logActivity(
        `${isEdit ? 'Updated' : 'Created'} Barangay Action ${form.measuresNo || form.resolutionNumber}`
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
      title={isEdit ? 'Edit Barangay Action' : 'Add Barangay Action'}
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
        <FormField label="Barangay" required>
          <Select options={BARANGAY_OPTIONS} value={form.brgy} onChange={set('brgy')} />
        </FormField>
        <FormField label="Category">
          <Select options={CATEGORIES} value={form.category} onChange={set('category')} />
        </FormField>
        <FormField label="Measures No.">
          <Input
            value={form.measuresNo}
            onChange={set('measuresNo')}
            placeholder="e.g. R13-2025-047"
          />
        </FormField>
        <FormField label="Resolution/Ordinance No.">
          <Input
            value={form.resolutionNumber}
            onChange={set('resolutionNumber')}
            placeholder="e.g. APPROPRIATION ORDINANCE NO. 2025-01"
          />
        </FormField>
        <FormField label="Measures Title" required className="col-span-2">
          <TextArea value={form.measuresTitle} onChange={set('measuresTitle')} rows={3} />
        </FormField>
        <FormField label="Tag">
          <Input
            value={form.tag}
            onChange={set('tag')}
            placeholder="e.g. APPROPRIATIONS AND FINANCE"
          />
        </FormField>
        <FormField label="Action">
          <Select options={ACTION_OPTIONS} value={form.action} onChange={set('action')} />
        </FormField>
        {form.action === 'Others' && (
          <FormField label="Specify Action" className="col-span-2">
            <Input
              value={form.actionOther}
              onChange={set('actionOther')}
              placeholder="Specify action"
            />
          </FormField>
        )}
        <FormField label="Date Approved">
          <Input type="date" value={form.dateApproved} onChange={set('dateApproved')} />
        </FormField>
        <FormField label="Date Received">
          <Input type="date" value={form.dateReceived} onChange={set('dateReceived')} />
        </FormField>
        <FormField label="Time Received">
          <Input type="time" value={form.timeReceived} onChange={set('timeReceived')} />
        </FormField>
        <FormField label="Date Released">
          <Input type="date" value={form.dateReleased} onChange={set('dateReleased')} />
        </FormField>
        <FormField label="Time Released">
          <Input type="time" value={form.timeReleased} onChange={set('timeReleased')} />
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

export function BarangayPage() {
  const { hiddenColumns, toggleColumn } = useColumnVisibility(columns)
  const user = useAuthStore((s) => s.user)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { items, loading, loadingMore, hasMore, reload, loadMore, sortField, sortDirection } = useListData<
    Record<string, unknown>
  >({
    endpoint: 'santa_brgy',
    sortParam: 'brgy|desc',
    dataKey: 'brgy',
    limit: 100,
    searchQuery: debouncedSearch
  })
  const [selected, setSelected] = useState<BrgyAction | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => {
    const arr = items as unknown as BrgyAction[]
    const q = debouncedSearch.toLowerCase()
    const result = !debouncedSearch.trim() ? arr : arr.filter((r) =>
      Object.values(r as unknown as Record<string, unknown>).some((v) =>
        String(v ?? '')
          .toLowerCase()
          .includes(q)
      )
    )
    return sortByField(result as unknown as Record<string, unknown>[], sortField, sortDirection) as unknown as BrgyAction[]
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
        'santa_brgy',
        selected.id,
        'BrgyActions',
        `${selected.brgy}_${selected.measuresNo || selected.resolutionNumber}`
      )
      await logActivity(
        `Deleted Barangay Action ${selected.measuresNo || selected.resolutionNumber}`
      )
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
          title="Barangay Actions"
          subtitle={`${filtered.length} records`}
          icon={<Building2 size={20} />}
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
            placeholder="Search by barangay, measure no., title..."
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
            loadingMore={loadingMore}
            onEndReached={hasMore ? loadMore : undefined}
            emptyMessage="No barangay action records found"
          />
        </div>
        <BrgyFormModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false)
            reload()
          }}
          logActivity={logActivity}
        />
        {selected && (
          <BrgyFormModal
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
          title="Delete Barangay Action"
          message={`Delete ${selected?.measuresNo || selected?.resolutionNumber}?`}
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
