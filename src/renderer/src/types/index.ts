export interface AuthUser {
  token: string
  firstName: string
  middleName: string
  lastName: string
  role: string
  privileges: string[]
  fileUrl: string
}

export interface LoginRequest {
  data: { username: string; password: string }
}

export interface LoginResponse {
  status: number
  message: string
  data: {
    success: string
    privileges: string[]
    role: string
    firstName: string
    middleName: string
    lastName: string
    fileUrl: string
  }
}

// Ordinance
export interface Ordinance {
  id: string
  ordinanceNumber: string
  series: string
  category: string
  title: string
  author: string
  coSponsors: string[]
  tag: string
  fileType: string
  fileUrl: string
  dateApprovedSp: string
  actionSp: string
  transmittedDateMayor: string
  actionMayor: string
  transmittedDateSP: string
  actionTSp: string
  dateReceived: string
  postingDate: string
  publicationDate: string
  created?: string
  updated?: string
}

export interface OrdinanceListResponse {
  status: number
  message: string
  data: { ordinance: Ordinance[]; last: string }
}

// Resolution
export interface Resolution {
  id: string
  resolutionNumber: string
  series: string
  category: string
  title: string
  author: string
  coSponsors: string[]
  tag: string
  fileType: string
  fileUrl: string
  dateApprovedSp: string
  actionSp: string
  transmittedDateMayor: string
  actionMayor: string
  transmittedDateSP: string
  actionTSp: string
  dateReceived: string
  postingDate: string
  publicationDate: string
  created?: string
  updated?: string
}

export interface ResolutionListResponse {
  status: number
  message: string
  data: { resolution: Resolution[]; last: string }
}

// Tricycle
export interface Tricycle {
  id: string
  name: string
  address: string
  make: string
  motorNo: string
  chassisNo: string
  plateNo: string
  franchiseNo: string
  expiration: string
  dateReceived: string
  timeReceived: string
  fileType: string
  fileUrl: string
  natureOfFranchise: string
  category: string
  action: string
}

export interface TricycleListResponse {
  status: number
  message: string
  data: { tricy: Tricycle[]; last: string }
}

// Minutes
export interface Minutes {
  id: string
  sessionNo: string
  date: string
  category: string
  time?: string
  callOrder?: string
  title?: string
  agenda?: string
  tag?: string
  present?: string[]
  absent?: string[]
  adjournmentTime?: string
  prayer?: string
  rollCall?: string
  fileType: string
  fileUrl: string
  created?: string
  updated?: string
}

export interface MinutesListResponse {
  status: number
  message: string
  data: { minutes: Minutes[]; last: string }
}

// Communication
export interface Communication {
  id: string
  author: string
  communicationNo: string
  title: string
  sessionNo: string
  status: string
  tag: string
  dateReceived: string
  timeReceived: string
  fileType: string
  fileUrl: string
  created?: string
}

export interface CommunicationListResponse {
  status: number
  message: string
  data: { communication: Communication[]; last: string }
}

// Barangay Action
export interface BrgyAction {
  id: string
  brgy: string
  category: string
  measuresNo: string
  measuresTitle: string
  resolutionNumber: string
  action: string
  tag: string
  dateApproved: string
  dateReceived: string
  timeReceived: string
  dateReleased: string
  timeReleased: string
  fileType: string
  fileUrl: string
  created?: string
}

export interface BrgyActionListResponse {
  status: number
  message: string
  data: { brgy: BrgyAction[]; last: string }
}

// Transcript
export interface Transcript {
  id: string
  sessionNo: string
  sessionCategory: string
  previousSessionNo: string
  dateOfPreviousSession: string
  transcriptNo: string
  title: string
  tag: string
  fileType: string
  fileUrl: string
  created?: string
}

export interface TranscriptListResponse {
  status: number
  message: string
  data: { transcript: Transcript[]; last: string }
}

// Committee
export interface Committee {
  id: string
  title: string
  batch: string
  description: string
  chairman: string
  viceChairman: string
  members: string[]
  created?: string
}

export interface CommitteeListResponse {
  status: number
  message: string
  data: { committee: Committee[]; last: string }
}

// Committee Reports
export interface CommitteeReport {
  id: string
  committeeReportsNo: string
  committee: string
  title: string
  author: string
  coSponsors: string[]
  sessionNo: string
  tag: string
  dateReceived: string
  timeReceived: string
  fileType: string
  fileUrl: string
  created?: string
}

export interface CommitteeReportListResponse {
  status: number
  message: string
  data: { committeeReport: CommitteeReport[]; last: string }
}

// Draft Ordinance
export interface DraftOrdinance {
  id: string
  draftOrdinanceNumber: string
  series: string
  sessionNo: string
  category: string
  title: string
  author: string
  coSponsors: string[]
  tag: string
  fileType: string
  fileUrl: string
  dateReceived: string
  action: string
  remarks: string
  created?: string
}

export interface DraftOrdinanceListResponse {
  status: number
  message: string
  data: { draftOrdinance: DraftOrdinance[]; last: string }
}

// Draft Resolution
export interface DraftResolution {
  id: string
  draftResolutionNumber: string
  series: string
  sessionNo: string
  category: string
  title: string
  author: string
  coSponsors: string[]
  tag: string
  fileType: string
  fileUrl: string
  dateReceived: string
  action: string
  remarks: string
  created?: string
}

export interface DraftResolutionListResponse {
  status: number
  message: string
  data: { draftResolution: DraftResolution[]; last: string }
}

// Draft Communication
export interface DraftCommunication {
  id: string
  draftCommunicationNumber: string
  series: string
  sessionNo: string
  committee: string
  title: string
  author: string
  coSponsors: string[]
  tag: string
  fileType: string
  fileUrl: string
  dateReceived: string
  action: string
  remarks: string
  created?: string
}

// Draft Petition
export interface DraftPetition {
  id: string
  draftPetitionNumber: string
  series: string
  sessionNo: string
  committee: string
  title: string
  author: string
  coSponsors: string[]
  tag: string
  fileType: string
  fileUrl: string
  dateReceived: string
  action: string
  remarks: string
  created?: string
}

// Draft Messages and Memorials
export interface DraftMessagesMemorials {
  id: string
  draftMessageNumber: string
  series: string
  sessionNo: string
  committee: string
  title: string
  author: string
  coSponsors: string[]
  tag: string
  fileType: string
  fileUrl: string
  dateReceived: string
  action: string
  remarks: string
  created?: string
}

// Judicial
export interface Judicial {
  id: string
  caseNumber: string
  title: string
  petitioner: string
  respondent: string
  date: string
  action: string
  fileType: string
  fileUrl: string
  created?: string
}

export interface JudicialListResponse {
  status: number
  message: string
  data: { judicial: Judicial[]; last: string }
}

// Review
export interface Review {
  id: string
  reviewNo: string
  title: string
  description: string
  districtCouncilor: string
  sessionNo: string
  tag: string
  dateReceived: string
  timeReceived: string
  category: string
  fileType: string
  fileUrl: string
  created?: string
}

export interface ReviewListResponse {
  status: number
  message: string
  data: { review: Review[]; last: string }
}

// Correction
export interface Correction {
  id: string
  addendumNo: string
  sessionNo: string
  title: string
  category: string
  fileType: string
  fileUrl: string
  created?: string
}

export interface EditCorrection {
  id: string
  orNo: string
  sessionNo: string
  content: string
}

export interface CorrectionListResponse {
  status: number
  message: string
  data: { correction: Correction[]; last: string }
}

// Incoming
export interface Incoming {
  id: string
  iONumber: string
  incomingDescription: string
  dateReceived: string
  timeReceived: string
  tags: string
  remarks: string
  fileType: string
  fileUrl: string
  created?: string
}

export interface IncomingListResponse {
  status: number
  message: string
  data: { incoming: Incoming[]; last: string }
}

// Other Matters
export interface OtherMatter {
  id: string
  otherMattersNo: string
  title: string
  sessionNo: string
  dateReceived: string
  timeReceived: string
  status: string
  author: string
  tag: string
  fileType: string
  fileUrl: string
  created?: string
}

export interface OtherMatterListResponse {
  status: number
  message: string
  data: { matters: OtherMatter[]; last: string }
}

// Account
export interface Account {
  id: string
  username: string
  firstName: string
  middleName: string
  lastName: string
  suffix: string
  role: string
  privileges: string[]
  contactNumber: string
  birthday: string
  gender: string
  address: string
  fileUrl: string
}

export interface AccountListResponse {
  status: number
  message: string
  data: { accounts: Account[]; last: string }
}

// Officials
export interface Official {
  id: string
  title: string
  firstName: string
  middleName: string
  lastName: string
  suffix: string
  position: string
  term: string
  legislativeBody: string
  created?: string
}

export interface OfficialListResponse {
  status: number
  message: string
  data: { official: Official[]; last: string }
}

// Logs
export interface Log {
  id?: string
  name: string
  activity: string
  date: string
}

export interface LogsListResponse {
  status: number
  message: string
  data: { logs: Log[]; last: string }
}

// API wrapper
export interface ApiResponse<T = unknown> {
  status: number
  message: string
  data: T
}

