import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  increment,
  where,
  type WhereFilterOp,
  type QueryDocumentSnapshot,
  type OrderByDirection
} from 'firebase/firestore'
import { FIREBASE_CONFIG } from './api'

const app = initializeApp(FIREBASE_CONFIG)
export const auth = getAuth(app)
export const storage = getStorage(app)
export const db = getFirestore(app)

// Singleton auth promise — avoids concurrent sign-in attempts
let _authReady: Promise<void> | null = null

export async function ensureAuth(): Promise<void> {
  if (auth.currentUser) return
  if (!_authReady) {
    _authReady = signInWithEmailAndPassword(
      auth,
      FIREBASE_CONFIG.serviceEmail,
      FIREBASE_CONFIG.servicePassword
    ).then(() => {
      _authReady = null
    })
  }
  await _authReady
}

// ── Counter helpers ──────────────────────────────────────────────────────────
// All counters live in a single `counters` collection.
// Document ID = camelCase key, field = `value`.

const COUNTER_KEY_MAP: Record<string, string> = {
  santa_users: 'usersCount',
  santa_ordinances: 'ordinancesCount',
  santa_resolutions: 'resolutionsCount',
  santa_minutes: 'minutesCount',
  santa_logs: 'logsCount',
  santa_officials: 'officialsCount',
  santa_draft_ordinance: 'draftOrdinanceCount',
  santa_draft_resolution: 'draftResolutionCount',
  santa_tricy: 'tricyCount',
  santa_communication: 'communicationCount',
  santa_brgy: 'brgyCount',
  santa_transcript: 'transcriptCount',
  santa_committee: 'committeeCount',
  santa_committee_reports: 'committeeReportsCount',
  santa_review: 'reviewCount',
  santa_correction: 'correctionCount',
  santa_incoming_communications: 'incomingCommunicationsCount',
  santa_other_matters: 'otherMattersCount',
  santa_judicial: 'judicialCount'
}

function counterRef(collectionName: string) {
  const key = COUNTER_KEY_MAP[collectionName] ?? `${collectionName.replace(/^santa_/, '')}Count`
  return doc(db, 'counters', key)
}

// ── Firestore CRUD ───────────────────────────────────────────────────────────

export interface FetchResult<T> {
  items: (T & { id: string })[]
  lastDoc: QueryDocumentSnapshot | null
  hasMore: boolean
}

export interface FetchFilter {
  field: string
  op: WhereFilterOp
  value: unknown
}

export async function fetchDocs<T>(
  collectionName: string,
  opts: {
    orderByField: string
    direction?: OrderByDirection
    pageSize?: number
    after?: QueryDocumentSnapshot | null
    filters?: FetchFilter[]
  }
): Promise<FetchResult<T>> {
  await ensureAuth()
  const { orderByField, direction = 'desc', pageSize, after = null, filters = [] } = opts
  const col = collection(db, collectionName)
  const constraints = [
    ...filters.map((f) => where(f.field, f.op, f.value)),
    orderBy(orderByField, direction),
    ...(pageSize ? [limit(pageSize)] : []),
    ...(after ? [startAfter(after)] : [])
  ]
  const snap = await getDocs(query(col, ...constraints))
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as (T & { id: string })[]
  return {
    items,
    lastDoc: snap.docs.at(-1) ?? null,
    hasMore: pageSize ? snap.docs.length >= pageSize : false
  }
}

export async function addDocument(
  collectionName: string,
  data: Record<string, unknown>
): Promise<string> {
  await ensureAuth()
  const newDocRef = doc(collection(db, collectionName))
  await setDoc(newDocRef, { ...data, id: newDocRef.id })
  return newDocRef.id
}

export async function updateDocument(
  collectionName: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  await ensureAuth()
  await updateDoc(doc(db, collectionName, id), data)
}

export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  await ensureAuth()
  await deleteDoc(doc(db, collectionName, id))
}

export async function queryDocuments<T>(
  collectionName: string,
  field: string,
  value: string
): Promise<(T & { id: string })[]> {
  await ensureAuth()
  const snap = await getDocs(query(collection(db, collectionName), where(field, '==', value)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as (T & { id: string })[]
}

// ── Storage ──────────────────────────────────────────────────────────────────

export async function uploadFile(folder: string, filename: string, file: File): Promise<string> {
  await ensureAuth()
  const storageRef = ref(storage, `${folder}/${filename}`)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

export async function deleteFile(folder: string, filename: string): Promise<void> {
  await ensureAuth()
  const storageRef = ref(storage, `${folder}/${filename}`)
  await deleteObject(storageRef)
}

export async function addDocumentWithFile(
  collectionName: string,
  data: Record<string, unknown>,
  storageFolder: string,
  storageFilename: string,
  file: File | null
): Promise<string> {
  await ensureAuth()
  let fileUrl = ''
  let fileType = ''
  if (file) {
    const ext = file.name.split('.').pop() ?? ''
    fileUrl = await uploadFile(storageFolder, storageFilename, file)
    fileType = `.${ext}`
  }
  const newDocRef = doc(collection(db, collectionName))
  const fullData = { ...data, fileUrl, fileType, id: newDocRef.id }
  const batch = writeBatch(db)
  batch.set(newDocRef, fullData)
  batch.set(counterRef(collectionName), { value: increment(1) }, { merge: true })
  try {
    await batch.commit()
    return newDocRef.id
  } catch (err) {
    if (file) {
      try {
        await deleteFile(storageFolder, storageFilename)
      } catch {}
    }
    throw err
  }
}

export async function updateDocumentWithFile(
  collectionName: string,
  id: string,
  data: Record<string, unknown>,
  storageFolder: string,
  storageFilename: string,
  file: File | null,
  existingFilePath: string,
  existingFileType: string
): Promise<void> {
  if (file) {
    const ext = file.name.split('.').pop() ?? ''
    const fileUrl = await uploadFile(storageFolder, storageFilename, file)
    const fileType = `.${ext}`
    try {
      await updateDocument(collectionName, id, { ...data, fileUrl, fileType })
    } catch (err) {
      try {
        await deleteFile(storageFolder, storageFilename)
      } catch {}
      throw err
    }
    if (existingFilePath) {
      try {
        await deleteObject(ref(storage, existingFilePath))
      } catch {}
    }
  } else {
    await updateDocument(collectionName, id, {
      ...data,
      fileUrl: existingFilePath,
      fileType: existingFileType
    })
  }
}

export async function deleteDocumentWithFile(
  collectionName: string,
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _storageFolder: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _storageFilename: string
): Promise<void> {
  await ensureAuth()
  const docRef = doc(db, collectionName, id)
  const docSnap = await getDoc(docRef)
  const fileUrl = docSnap.exists() ? (docSnap.data().fileUrl as string) : ''
  const batch = writeBatch(db)
  batch.delete(docRef)
  batch.set(counterRef(collectionName), { value: increment(-1) }, { merge: true })
  await batch.commit()
  if (fileUrl) {
    try {
      await deleteObject(ref(storage, fileUrl))
    } catch {}
  }
}

export async function addDocumentWithCount(
  collectionName: string,
  data: Record<string, unknown>
): Promise<string> {
  await ensureAuth()
  const batch = writeBatch(db)
  const newDocRef = doc(collection(db, collectionName))
  batch.set(newDocRef, { ...data, id: newDocRef.id })
  batch.set(counterRef(collectionName), { value: increment(1) }, { merge: true })
  await batch.commit()
  return newDocRef.id
}

export async function deleteDocumentWithCount(collectionName: string, id: string): Promise<void> {
  await ensureAuth()
  const batch = writeBatch(db)
  batch.delete(doc(db, collectionName, id))
  batch.set(counterRef(collectionName), { value: increment(-1) }, { merge: true })
  await batch.commit()
}

export async function getAllCounters(): Promise<Record<string, number>> {
  await ensureAuth()
  const snap = await getDocs(collection(db, 'counters'))
  const result: Record<string, number> = {}
  snap.forEach((d) => {
    const data = d.data()
    result[d.id] = typeof data.value === 'number' ? data.value : 0
  })
  return result
}

export async function getCollectionCounts(collectionName: string): Promise<Record<string, number>> {
  await ensureAuth()
  const cRef = counterRef(collectionName)
  const snap = await getDoc(cRef)
  if (snap.exists()) {
    const data = snap.data()
    return { count: typeof data.value === 'number' ? data.value : 0 }
  }
  // Counter doc doesn't exist yet — build from existing documents
  const allSnap = await getDocs(collection(db, collectionName))
  const result = { value: allSnap.docs.length }
  await setDoc(cRef, result)
  return { count: result.value }
}
