import { useState, useEffect } from 'react'
import { Modal } from '../../components/ui/Modal'
import { FormField, Input, Select, TextArea } from '../../components/ui/FormField'
import { FileUploadField } from '../../components/ui/FileUploadField'
import { Spinner } from '../../components/ui/Spinner'
import { addDocumentWithFile, updateDocumentWithFile } from '../../lib/firebase'
import type { Ordinance } from '../../types'
import { notify } from '../../lib/notify'
import { toInputDate } from '../../lib/utils'
import { useOfficialsForForm } from '../../hooks/useOfficialsForForm'

const ACTION_SP_OPTIONS = [
  { value: 'Approved', label: 'Approved' },
  { value: 'Disapproved', label: 'Disapproved' },
  { value: 'Others', label: 'Others' }
]
const ACTION_MAYOR_OPTIONS = [
  { value: 'Approved', label: 'Approved' },
  { value: 'Disapproved', label: 'Disapproved' },
  { value: 'Vetoed', label: 'Vetoed' },
  { value: 'Returned', label: 'Returned' },
  { value: 'Others', label: 'Others' }
]
const CATEGORIES = [
  { value: 'General Ordinance', label: 'General Ordinance' },
  { value: 'Appropriation', label: 'Appropriation' },
  { value: 'Tax Ordinance', label: 'Tax Ordinance' }
]

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  logActivity: (activity: string) => Promise<void>
  ordinance?: Ordinance
}

export function OrdinanceFormModal({ open, onClose, onSuccess, logActivity, ordinance }: Props) {
  const isEdit = !!ordinance
  const [saving, setSaving] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const { loadingOfficials, selectedTerm, setSelectedTerm, termOptions, officialNames, authorOptions } =
    useOfficialsForForm(open)

  const [form, setForm] = useState({
    ordinanceNumber: '',
    series: '',
    category: 'General Ordinance',
    title: '',
    author: '',
    coSponsors: [] as string[],
    tag: '',
    dateApprovedSp: '',
    actionSp: '',
    actionSpOther: '',
    transmittedDateMayor: '',
    actionMayor: '',
    actionMayorOther: '',
    transmittedDateSP: '',
    actionTSp: '',
    actionTSpOther: '',
    dateReceived: '',
    postingDate: '',
    publicationDate: ''
  })

  useEffect(() => {
    if (open) {
      if (ordinance) {
        setForm({
          ordinanceNumber: ordinance.ordinanceNumber ?? '',
          series: ordinance.series ?? '',
          category: ordinance.category ?? 'General Ordinance',
          title: ordinance.title ?? '',
          author: ordinance.author ?? '',
          coSponsors: Array.isArray(ordinance.coSponsors) ? ordinance.coSponsors : ordinance.coSponsors ? ordinance.coSponsors.split(', ').filter(Boolean) : [],
          tag: ordinance.tag ?? '',
          dateApprovedSp: toInputDate(ordinance.dateApprovedSp),
          actionSp: ordinance.actionSp ?? '',
          actionSpOther: '',
          transmittedDateMayor: toInputDate(ordinance.transmittedDateMayor),
          actionMayor: ordinance.actionMayor ?? '',
          actionMayorOther: '',
          transmittedDateSP: toInputDate(ordinance.transmittedDateSP),
          actionTSp: ordinance.actionTSp ?? '',
          actionTSpOther: '',
          dateReceived: toInputDate(ordinance.dateReceived),
          postingDate: toInputDate(ordinance.postingDate),
          publicationDate: toInputDate(ordinance.publicationDate)
        })
      } else {
        setForm({
          ordinanceNumber: '',
          series: '',
          category: 'General Ordinance',
          title: '',
          author: '',
          coSponsors: [],
          tag: '',
          dateApprovedSp: '',
          actionSp: '',
          actionSpOther: '',
          transmittedDateMayor: '',
          actionMayor: '',
          actionMayorOther: '',
          transmittedDateSP: '',
          actionTSp: '',
          actionTSpOther: '',
          dateReceived: '',
          postingDate: '',
          publicationDate: ''
        })
      }
      setFile(null)
    }
  }, [open, ordinance])

  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const coSponsorList = form.coSponsors
  const toggleCoSponsor = (name: string) => {
    const updated = coSponsorList.includes(name)
      ? coSponsorList.filter((n) => n !== name)
      : [...coSponsorList, name]
    setForm((f) => ({ ...f, coSponsors: updated }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.ordinanceNumber.trim() || !form.title.trim() || !form.author.trim()) {
      notify.error('Ordinance Number, Title, and Author are required')
      return
    }
    setSaving(true)
    try {
      const finalActionSp = form.actionSp === 'Others' ? form.actionSpOther : form.actionSp
      const finalActionMayor = form.actionMayor === 'Others' ? form.actionMayorOther : form.actionMayor
      const finalActionTSp = form.actionTSp === 'Others' ? form.actionTSpOther : form.actionTSp

      const data = {
        ordinanceNumber: form.ordinanceNumber,
        series: form.series,
        category: form.category,
        title: form.title,
        author: form.author,
        coSponsors: form.coSponsors,
        tag: form.tag,
        dateApprovedSp: form.dateApprovedSp,
        actionSp: finalActionSp,
        transmittedDateMayor: form.transmittedDateMayor,
        actionMayor: finalActionMayor,
        transmittedDateSP: form.transmittedDateSP,
        actionTSp: finalActionTSp,
        dateReceived: form.dateReceived,
        postingDate: form.postingDate,
        publicationDate: form.publicationDate,
        created: isEdit ? ordinance!.created : new Date().toLocaleDateString(),
        updated: new Date().toLocaleDateString(),
        size: file ? `${(file.size / 1024).toFixed(0)} KB` : (ordinance?.created ?? '')
      }

      if (isEdit) {
        await updateDocumentWithFile(
          'santa_ordinances',
          ordinance!.id,
          data,
          'GeneralOrdinances',
          `OrdinanceNo._${form.ordinanceNumber}`,
          file,
          ordinance?.fileUrl ?? '',
          ordinance?.fileType ?? ''
        )
        await logActivity(`Updated Ordinance Number ${form.ordinanceNumber}`)
      } else {
        await addDocumentWithFile(
          'santa_ordinances',
          data,
          'GeneralOrdinances',
          `OrdinanceNo._${form.ordinanceNumber}`,
          file
        )
        await logActivity(`Created Ordinance Number ${form.ordinanceNumber}`)
      }
      notify.success(isEdit ? 'Ordinance updated' : 'Ordinance created')
      onSuccess()
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Ordinance' : 'Add New Ordinance'}
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
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : isEdit ? (
              'Update'
            ) : (
              'Create'
            )}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <FormField label="Ordinance Number" required>
          <Input type="number" min="1" value={form.ordinanceNumber} onChange={set('ordinanceNumber')} placeholder="e.g. 1" />
        </FormField>
        <FormField label="Series">
          <Input value={form.series} onChange={set('series')} placeholder="e.g. Series of 2024" />
        </FormField>
        <FormField label="Category" required>
          <Select options={CATEGORIES} value={form.category} onChange={set('category')} />
        </FormField>
        <FormField label="Title" required className="col-span-2">
          <TextArea value={form.title} onChange={set('title')} rows={3} placeholder="Ordinance title" />
        </FormField>

        {/* Legislative Term filter */}
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

        <FormField label="Author" required>
          {loadingOfficials ? (
            <div className="input-field flex items-center justify-center"><Spinner size="sm" /></div>
          ) : (
            <Select
              options={authorOptions}
              value={form.author}
              onChange={set('author')}
              placeholder="Select author"
            />
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
                      checked={coSponsorList.includes(name)}
                      onChange={() => toggleCoSponsor(name)}
                    />
                    {name}
                  </label>
                ))
              )}
            </div>
          )}
        </FormField>

        <FormField label="Tag" className="col-span-2">
          <Input value={form.tag} onChange={set('tag')} placeholder="Keywords/tags" />
        </FormField>

        <div className="col-span-2 border-t border-slate-100 pt-3 mt-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
            Sangguniang Bayan
          </p>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date Approved (S.B.)">
              <Input type="date" value={form.dateApprovedSp} onChange={set('dateApprovedSp')} />
            </FormField>
            <FormField label="Action of S.B.">
              <Select options={ACTION_SP_OPTIONS} value={form.actionSp} onChange={set('actionSp')} />
            </FormField>
            {form.actionSp === 'Others' && (
              <FormField label="Specify Action" className="col-span-2">
                <Input value={form.actionSpOther} onChange={set('actionSpOther')} placeholder="Specify action" />
              </FormField>
            )}
          </div>
        </div>

        <div className="col-span-2 border-t border-slate-100 pt-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
            Mayor&apos;s Office
          </p>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date Transmitted to Mayor">
              <Input type="date" value={form.transmittedDateMayor} onChange={set('transmittedDateMayor')} />
            </FormField>
            <FormField label="Action of Mayor">
              <Select options={ACTION_MAYOR_OPTIONS} value={form.actionMayor} onChange={set('actionMayor')} />
            </FormField>
            {form.actionMayor === 'Others' && (
              <FormField label="Specify Action" className="col-span-2">
                <Input value={form.actionMayorOther} onChange={set('actionMayorOther')} placeholder="Specify action" />
              </FormField>
            )}
          </div>
        </div>

        <div className="col-span-2 border-t border-slate-100 pt-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
            Return from S.B.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date Transmitted to S.B.">
              <Input type="date" value={form.transmittedDateSP} onChange={set('transmittedDateSP')} />
            </FormField>
            <FormField label="Action of S.B.">
              <Select options={ACTION_MAYOR_OPTIONS} value={form.actionTSp} onChange={set('actionTSp')} />
            </FormField>
            {form.actionTSp === 'Others' && (
              <FormField label="Specify Action" className="col-span-2">
                <Input value={form.actionTSpOther} onChange={set('actionTSpOther')} placeholder="Specify action" />
              </FormField>
            )}
          </div>
        </div>

        <div className="col-span-2 border-t border-slate-100 pt-3">
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Date Received">
              <Input type="date" value={form.dateReceived} onChange={set('dateReceived')} />
            </FormField>
            <FormField label="Date of Posting">
              <Input type="date" value={form.postingDate} onChange={set('postingDate')} />
            </FormField>
            <FormField label="Date of Publication">
              <Input type="date" value={form.publicationDate} onChange={set('publicationDate')} />
            </FormField>
          </div>
        </div>

        <div className="col-span-2 border-t border-slate-100 pt-3">
          <FileUploadField value={file} onChange={setFile} />
          {isEdit && ordinance?.fileUrl && !file && (
            <p className="text-xs text-slate-500 mt-1.5">
              Current file:{' '}
              <a href={ordinance.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                View attached file
              </a>
            </p>
          )}
        </div>
      </form>
    </Modal>
  )
}
