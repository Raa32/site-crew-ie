export type AppRole = 'worker' | 'client' | 'admin'
export type RateType = 'hourly' | 'fixed'
export type JobDuration = 'one-off' | 'short-term' | 'ongoing'
export type JobStatus = 'open' | 'applied' | 'hired' | 'in progress' | 'complete'
export type ReportTarget = 'listing' | 'user'
export type DisputeType = 'none' | 'no-show' | 'non-payment'

export type WorkerProfile = {
  id: string
  name: string
  tradeType: string
  skills: string[]
  yearsExperience: number
  location: string
  availableDays: string[]
  portfolio: string[]
  preferredRateType: RateType
  preferredRate: number
  rctRate: 0 | 20 | 35
  safePassExpiry: Date
  phoneVerified: boolean
  identityVerified: boolean
}

export type ClientProfile = {
  id: string
  companyName: string
  location: string
  jobHistory: string[]
  identityVerified: boolean
  rating: number
}

export type JobPosting = {
  id: string
  title: string
  trade: string
  location: string
  startDate: string
  duration: JobDuration
  rateType: RateType
  rateValue: number
  status: JobStatus
  expiresAt: string
  applicants: string[]
}

export type MessageThread = {
  id: string
  peer: string
  messages: string[]
}

export type Review = {
  id: string
  from: string
  to: string
  stars: number
  note: string
  dispute: DisputeType
}

export type ReportItem = {
  id: string
  target: ReportTarget
  reason: string
  status: 'open' | 'resolved'
}

export type JobPostForm = {
  trade: string
  location: string
  startDate: string
  duration: JobDuration
  rateType: RateType
  rateValue: number
}
