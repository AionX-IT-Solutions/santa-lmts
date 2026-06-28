import { useState, useEffect, useMemo } from 'react'
import { fetchDocs } from '../lib/firebase'
import { getFullName } from '../lib/utils'
import type { Official } from '../types'
import { notify } from '../lib/notify'

export const LEGISLATIVE_TERM_OPTIONS = [
  { value: '1st', label: '1st Legislative Term' },
  { value: '2nd', label: '2nd Legislative Term' },
  { value: '3rd', label: '3rd Legislative Term' },
  { value: '4th', label: '4th Legislative Term' },
  { value: '5th', label: '5th Legislative Term' },
  { value: '6th', label: '6th Legislative Term' },
  { value: '7th', label: '7th Legislative Term' },
  { value: '8th', label: '8th Legislative Term' },
  { value: '9th', label: '9th Legislative Term' },
  { value: '10th', label: '10th Legislative Term' },
  { value: '11th', label: '11th Legislative Term' },
  { value: '12th', label: '12th Legislative Term' },
]

export function useOfficialsForForm(open: boolean) {
  const [allOfficials, setAllOfficials] = useState<Official[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState('12th')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetchDocs<Official>('santa_officials', {
      orderByField: 'lastName',
      direction: 'asc',
      pageSize: 500
    })
      .then((res) => {
        setAllOfficials(res.items)
      })
      .catch((err) => notify.error(err instanceof Error ? err.message : 'Failed to load officials'))
      .finally(() => setLoading(false))
  }, [open])

  const termOptions = LEGISLATIVE_TERM_OPTIONS

  const officials = useMemo(
    () => (selectedTerm ? allOfficials.filter((o) => o.term === selectedTerm) : allOfficials),
    [allOfficials, selectedTerm]
  )

  const officialNames = useMemo(
    () => officials.map((o) => getFullName(o.firstName, o.middleName, o.lastName, o.suffix)),
    [officials]
  )

  const authorOptions = useMemo(
    () => officialNames.map((name) => ({ value: name, label: name })),
    [officialNames]
  )

  return { loadingOfficials: loading, selectedTerm, setSelectedTerm, termOptions, officialNames, authorOptions }
}
