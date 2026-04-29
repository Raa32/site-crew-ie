import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AdminPanel from './AdminPanel'
import ClientWizard from './ClientWizard'
import RoleEntry from './RoleEntry'
import WorkerWizard from './WorkerWizard'
import type {
  AppRole,
  ClientProfile,
  JobPosting,
  MessageThread,
  ReportItem,
  Review,
  WorkerProfile,
} from './types'

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const INITIAL_WORKER: WorkerProfile = {
  id: 'w1',
  name: 'Seamus O Connor',
  tradeType: 'Electrical',
  skills: ['First Fix', 'Testing', 'Safe Isolation'],
  yearsExperience: 9,
  location: 'Dublin 4',
  availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  portfolio: ['Apartment Rewire', 'School Refit', 'Data Centre Install'],
  preferredRateType: 'hourly',
  preferredRate: 38,
  rctRate: 20,
  safePassExpiry: new Date('2026-10-14'),
  phoneVerified: false,
  identityVerified: true,
}

const INITIAL_CLIENT: ClientProfile = {
  id: 'c1',
  companyName: 'Emerald Build Ltd',
  location: 'Dublin',
  jobHistory: ['Office Retrofit', 'Retail Shell-and-Core'],
  identityVerified: true,
  rating: 4.2,
}

const INITIAL_JOBS: JobPosting[] = [
  {
    id: 'j1',
    title: 'Commercial Site Electrician',
    trade: 'Electrical',
    location: 'Dublin 4',
    startDate: '2026-05-04',
    duration: 'short-term',
    rateType: 'hourly',
    rateValue: 42,
    status: 'open',
    expiresAt: '2026-05-08',
    applicants: [],
  },
  {
    id: 'j2',
    title: 'Shuttering Carpenter Crew',
    trade: 'Carpentry',
    location: 'Cork City',
    startDate: '2026-05-10',
    duration: 'ongoing',
    rateType: 'fixed',
    rateValue: 3600,
    status: 'open',
    expiresAt: '2026-05-14',
    applicants: ['Seamus O Connor'],
  },
]

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function SiteCrewApp() {
  const [role, setRole] = useState<AppRole | null>(null)
  const [worker, setWorker] = useState<WorkerProfile>(INITIAL_WORKER)
  const [client] = useState<ClientProfile>(INITIAL_CLIENT)
  const [jobs, setJobs] = useState<JobPosting[]>(INITIAL_JOBS)
  const [threads] = useState<MessageThread[]>([
    { id: 'm1', peer: 'Emerald Build Ltd', messages: ['Can you start Monday?'] },
  ])
  const [reviews, setReviews] = useState<Review[]>([
    { id: 'r1', from: client.id, to: worker.id, stars: 5, note: 'Solid spark, on time.', dispute: 'none' },
    { id: 'r2', from: worker.id, to: client.id, stars: 4, note: 'Paid quickly.', dispute: 'none' },
  ])
  const [reports, setReports] = useState<ReportItem[]>([])
  const [savedWorkers, setSavedWorkers] = useState<string[]>([])
  const [notifications, setNotifications] = useState<string[]>([
    'New match in Dublin 4',
    'Message from Emerald Build Ltd',
  ])
  const [quoteAccepted, setQuoteAccepted] = useState(false)

  return (
    <section className="mx-auto min-h-screen w-full max-w-5xl bg-[#111111] p-4 text-white sm:p-6">
      <header className="mb-5 flex items-center justify-between rounded-2xl border border-white/10 bg-[#1A1A1A] px-5 py-4">
        <div>
          <h1 className="text-xl font-black tracking-tight">SiteCrew IE</h1>
          <p className="text-xs text-white/40">Construction jobs across Ireland</p>
        </div>
        <div className="flex items-center gap-3">
          {notifications.length > 0 && (
            <span className="rounded-full bg-[#FF8C00]/20 px-2.5 py-1 text-xs text-[#FF8C00]">
              {notifications.length} alerts
            </span>
          )}
          {role && (
            <button
              type="button"
              onClick={() => setRole(null)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:border-white/20"
            >
              Switch role
            </button>
          )}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {!role ? (
          <motion.div key="role-entry" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <RoleEntry onSelectRole={setRole} />
          </motion.div>
        ) : role === 'worker' ? (
          <motion.div key="worker-flow" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <WorkerWizard
              weekDays={WEEK_DAYS}
              worker={worker}
              setWorker={setWorker}
              jobs={jobs}
              setJobs={setJobs}
              threads={threads}
              reviews={reviews}
              client={client}
              quoteAccepted={quoteAccepted}
              setQuoteAccepted={setQuoteAccepted}
              formatCurrency={formatCurrency}
            />
          </motion.div>
        ) : role === 'client' ? (
          <motion.div key="client-flow" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ClientWizard
              client={client}
              worker={worker}
              jobs={jobs}
              setJobs={setJobs}
              quoteAccepted={quoteAccepted}
              setQuoteAccepted={setQuoteAccepted}
              setSavedWorkers={setSavedWorkers}
              setNotifications={setNotifications}
              reviews={reviews}
              setReviews={setReviews}
              formatCurrency={formatCurrency}
            />
            <p className="mt-3 text-xs text-white/30">
              Saved workers: {savedWorkers.length}
            </p>
          </motion.div>
        ) : (
          <motion.div key="admin-flow" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <AdminPanel reports={reports} setReports={setReports} worker={worker} client={client} jobs={jobs} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
