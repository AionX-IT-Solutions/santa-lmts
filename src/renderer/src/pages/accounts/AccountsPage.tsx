import { useState, useMemo, useEffect } from 'react'
import { useListData } from '../../hooks/useListData'
import { useDebounce } from '../../hooks/useDebounce'
import { UserCog, Plus, RefreshCw, Pencil, Trash2 } from 'lucide-react'
import { notify } from '../../lib/notify'
import bcrypt from 'bcryptjs'
import {
  addDocument,
  updateDocument,
  addDocumentWithCount,
  deleteDocumentWithCount,
  uploadFile
} from '../../lib/firebase'
import { useAuthStore } from '../../store/authStore'
import { Layout, PageContainer } from '../../components/layout/Layout'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable, Column, useColumnVisibility, ColumnsButton } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { FormField, Input, Select } from '../../components/ui/FormField'
import { FileUploadField } from '../../components/ui/FileUploadField'
import { Spinner } from '../../components/ui/Spinner'
import type { Account } from '../../types'
import { getFullName, toInputDate, sortByField } from '../../lib/utils'

const ALL_PRIVILEGES = [
  'Ordinances',
  'Resolutions',
  'Draft Ordinance/s and Draft Resolutions',
  'Calendar of Business',
  'Tricycle Franchise',
  'Send File to Email',
  'Account Management',
  'Barangay Actions',
  'Other Communications',
  'Transcript of Proceedings',
  'S.B. Members',
  'Committee Reports',
]
const ROLES = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Secretary', label: 'Secretary' },
  { value: 'Staff', label: 'Staff' },
  { value: 'S.B. Official', label: 'S.B. Official' },
  { value: 'View Only', label: 'View Only' }
]
const GENDERS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' }
]

const columns: Column<Account>[] = [
  { key: 'username', header: 'Username', width: 'w-36' },
  { key: 'firstName', header: 'First Name', width: 'w-28' },
  { key: 'middleName', header: 'Middle Name', width: 'w-28' },
  { key: 'lastName', header: 'Last Name', width: 'w-28' },
  {
    key: 'role',
    header: 'Role',
    width: 'w-24',
    render: (r) => (
      <Badge variant={r.role === 'Admin' ? 'red' : r.role === 'Secretary' ? 'blue' : 'gray'}>
        {r.role}
      </Badge>
    )
  },
  { key: 'contactNumber', header: 'Contact No.', width: 'w-32' },
  { key: 'address', header: 'Address' }
]

function AccountFormModal({
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
  record?: Account
}) {
  const isEdit = !!record
  const [saving, setSaving] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [privileges, setPrivileges] = useState<string[]>([])
  const [form, setForm] = useState({
    username: '',
    password: '',
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    role: 'Staff',
    contactNumber: '',
    birthday: '',
    gender: 'Male',
    address: ''
  })

  useEffect(() => {
    if (open) {
      if (record) {
        setForm({
          username: record.username ?? '',
          password: '',
          firstName: record.firstName ?? '',
          middleName: record.middleName ?? '',
          lastName: record.lastName ?? '',
          suffix: record.suffix ?? '',
          role: record.role ?? 'Staff',
          contactNumber: record.contactNumber ?? '',
          birthday: toInputDate(record.birthday),
          gender: record.gender ?? 'Male',
          address: record.address ?? ''
        })
        setPrivileges(record.privileges ?? [])
      } else {
        setForm({
          username: '',
          password: '',
          firstName: '',
          middleName: '',
          lastName: '',
          suffix: '',
          role: 'Staff',
          contactNumber: '',
          birthday: '',
          gender: 'Male',
          address: ''
        })
        setPrivileges([])
      }
      setFile(null)
    }
  }, [open, record])

  const previewUrl = useMemo(() => {
    if (file) return URL.createObjectURL(file)
    return record?.fileUrl || null
  }, [file, record?.fileUrl])

  useEffect(() => {
    return () => {
      if (file && previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [file, previewUrl])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))
  const togglePrivilege = (p: string) =>
    setPrivileges((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.username.trim() || (!isEdit && !form.password.trim())) {
      notify.error('Username and password are required')
      return
    }
    setSaving(true)
    try {
      let fileUrl = record?.fileUrl ?? ''
      if (file) {
        fileUrl = await uploadFile('Users', form.username, file)
      }
      if (isEdit) {
        const update: Record<string, unknown> = { ...form, privileges, fileUrl }
        if (form.password.trim()) {
          update.password = await bcrypt.hash(form.password, 10)
        } else {
          delete update.password
        }
        await updateDocument('santa_users', record!.id, update)
      } else {
        const hashedPassword = await bcrypt.hash(form.password, 10)
        await addDocumentWithCount('santa_users', {
          ...form,
          password: hashedPassword,
          privileges,
          fileUrl
        })
      }
      await logActivity(`${isEdit ? 'Updated' : 'Created'} Account ${form.username}`)
      notify.success(isEdit ? 'Account updated' : 'Account created')
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
      title={isEdit ? 'Edit Account' : 'Create Account'}
      size="2xl"
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
        <FormField label="Username" required>
          <Input value={form.username} onChange={set('username')} />
        </FormField>
        <FormField
          label={isEdit ? 'New Password (leave blank to keep)' : 'Password'}
          required={!isEdit}
        >
          <Input type="password" value={form.password} onChange={set('password')} />
        </FormField>
        <FormField label="First Name" required>
          <Input value={form.firstName} onChange={set('firstName')} />
        </FormField>
        <FormField label="Middle Name">
          <Input value={form.middleName} onChange={set('middleName')} />
        </FormField>
        <FormField label="Last Name" required>
          <Input value={form.lastName} onChange={set('lastName')} />
        </FormField>
        <FormField label="Suffix">
          <Input value={form.suffix} onChange={set('suffix')} placeholder="Jr., Sr., III" />
        </FormField>
        <FormField label="Role">
          <Select options={ROLES} value={form.role} onChange={set('role')} />
        </FormField>
        <FormField label="Contact Number">
          <Input value={form.contactNumber} onChange={set('contactNumber')} />
        </FormField>
        <FormField label="Birthday">
          <Input type="date" value={form.birthday} onChange={set('birthday')} />
        </FormField>
        <FormField label="Gender">
          <Select options={GENDERS} value={form.gender} onChange={set('gender')} />
        </FormField>
        <FormField label="Address" className="col-span-2">
          <Input value={form.address} onChange={set('address')} />
        </FormField>
        <div className="col-span-2">
          <FormField label="Profile Picture">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                {previewUrl ? (
                  <img src={previewUrl} alt="Profile preview" className="w-full h-full object-cover" />
                ) : (
                  <UserCog size={28} className="text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <FileUploadField value={file} onChange={setFile} accept="image/*" />
              </div>
            </div>
          </FormField>
        </div>
        <div className="col-span-2 border-t border-slate-100 pt-4">
          <p className="label mb-3">Privileges</p>
          <div className="grid grid-cols-2 gap-2">
            {ALL_PRIVILEGES.map((p) => (
              <label key={p} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privileges.includes(p)}
                  onChange={() => togglePrivilege(p)}
                  className="rounded accent-blue-600"
                />
                <span className="text-sm text-slate-700">{p}</span>
              </label>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}

export function AccountsPage() {
  const { hiddenColumns, toggleColumn } = useColumnVisibility(columns)
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'Admin'
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { items, loading, loadingMore, hasMore, reload, loadMore, sortField, sortDirection } = useListData<
    Record<string, unknown>
  >({
    endpoint: 'santa_users',
    sortParam: 'username|desc',
    dataKey: 'accounts',
    searchQuery: debouncedSearch
  })
  const [selected, setSelected] = useState<Account | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const filtered = useMemo(() => {
    const base = items as unknown as Account[]
    const q = debouncedSearch.toLowerCase()
    const result = !debouncedSearch.trim() ? base : base.filter(
      (r) =>
        r.username?.toLowerCase().includes(q) ||
        r.firstName?.toLowerCase().includes(q) ||
        r.lastName?.toLowerCase().includes(q)
    )
    return sortByField(result as unknown as Record<string, unknown>[], sortField, sortDirection) as unknown as Account[]
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
      await deleteDocumentWithCount('santa_users', selected.id)
      await logActivity(`Deleted Account ${selected.username}`)
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
          title="Account Management"
          subtitle={`${filtered.length} accounts`}
          icon={<UserCog size={20} />}
          actions={
            <>
              <ColumnsButton columns={columns} hiddenColumns={hiddenColumns} onToggle={toggleColumn} />
              <button className="btn-ghost" onClick={reload}>
                <RefreshCw size={15} />
                Refresh
              </button>
              {selected && (
                <>
                  {isAdmin && (
                    <button className="btn-secondary" onClick={() => setShowEdit(true)}>
                      <Pencil size={15} />
                      Edit
                    </button>
                  )}
                  {isAdmin && (
                    <button className="btn-danger" onClick={() => setShowDelete(true)}>
                      <Trash2 size={15} />
                      Delete
                    </button>
                  )}
                </>
              )}
              {isAdmin && (
                <button className="btn-primary" onClick={() => setShowAdd(true)}>
                  <Plus size={15} />
                  Create Account
                </button>
              )}
            </>
          }
        />
        <div className="flex justify-end mb-4 shrink-0">
          <input
            type="text"
            placeholder="Search by name or username..."
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
            loading={loading}
            emptyMessage="No accounts found"
            loadingMore={loadingMore}
            onEndReached={hasMore ? loadMore : undefined}
          />
        </div>
        {isAdmin && (
          <AccountFormModal
            open={showAdd}
            onClose={() => setShowAdd(false)}
            onSuccess={() => {
              setShowAdd(false)
              reload()
            }}
            logActivity={logActivity}
          />
        )}
        {isAdmin && selected && (
          <AccountFormModal
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
        {isAdmin && (
          <ConfirmDialog
            open={showDelete}
            title="Delete Account"
            message={`Delete account for ${selected?.username}?`}
            confirmLabel="Delete"
            danger
            loading={deleting}
            onConfirm={handleDelete}
            onCancel={() => setShowDelete(false)}
          />
        )}
      </PageContainer>
    </Layout>
  )
}
