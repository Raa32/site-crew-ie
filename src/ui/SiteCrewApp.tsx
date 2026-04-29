import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCheck,
  CircleAlert,
  FileUp,
  Flag,
  HandCoins,
  IdCard,
  MapPin,
  MessageSquareText,
  Phone,
  Search,
  ShieldCheck,
  ShieldX,
  Star,
  UserRound,
  UserRoundCheck,
  Users,
} from 'lucide-react'
import { calculateNetPay, isSafePassValid } from '../utils/ireland_compliance'

type Role = 'worker' | 'client'
type RateType = 'hourly' | 'fixed'
type JobDuration = 'one-off' | 'short-term' | 'ongoing'
type JobStatus = 'open' | 'applied' | 'hired' | 'in progress' | 'complete'
type ReportTarget = 'listing' | 'user'

type WorkerProfile = {
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

type ClientProfile = {
  id: string
  companyName: string
  location: string
  jobHistory: string[]
  identityVerified: boolean
  rating: number
}

type JobPosting = {
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

type MessageThread = {
  id: string
  peer: string
  messages: string[]
}

type Review = {
  id: string
  from: string
  to: string
  stars: number
  note: string
  dispute: 'none' | 'no-show' | 'non-payment'
}

type ReportItem = {
  id: string
  target: ReportTarget
  reason: string
  status: 'open' | 'resolved'
}

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

const RATE_HINTS: Record<string, string> = {
  'Electrical-Dublin': 'Typical range: EUR35-EUR50/hr',
  'Carpentry-Cork City': 'Typical range: EUR220-EUR320/day',
  'General Labour-Galway': 'Typical range: EUR18-EUR24/hr',
}

function triggerHaptic(duration = 20) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(duration)
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getRenewalCountdown(expiryDate: Date) {
  const daysLeft = Math.max(
    0,
    Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
  )
  const months = Math.floor(daysLeft / 30)
  const days = daysLeft % 30
  return { daysLeft, label: `${months}m ${days}d` }
}

function averageScore(reviews: Review[], targetId: string) {
  const scoped = reviews.filter((r) => r.to === targetId)
  if (!scoped.length) return 0
  return Math.round((scoped.reduce((sum, r) => sum + r.stars, 0) / scoped.length) * 10) / 10
}

function statusBadge(status: JobStatus) {
  return status.replace('in progress', 'in-progress')
}

export default function SiteCrewApp() {
  const [activeTab, setActiveTab] = useState<
    'profiles' | 'jobs' | 'messaging' | 'reviews' | 'safety' | 'admin'
  >('profiles')
  const [role, setRole] = useState<Role>('worker')
  const [worker, setWorker] = useState<WorkerProfile>(INITIAL_WORKER)
  const [client] = useState<ClientProfile>(INITIAL_CLIENT)
  const [jobs, setJobs] = useState<JobPosting[]>(INITIAL_JOBS)
  const [threads, setThreads] = useState<MessageThread[]>([
    { id: 'm1', peer: 'Emerald Build Ltd', messages: ['Can you start Monday?'] },
  ])
  const [reviews, setReviews] = useState<Review[]>([
    { id: 'r1', from: client.id, to: worker.id, stars: 5, note: 'Solid spark, on time.', dispute: 'none' },
    { id: 'r2', from: worker.id, to: client.id, stars: 4, note: 'Paid quickly.', dispute: 'none' },
  ])
  const [reports, setReports] = useState<ReportItem[]>([])
  const [savedWorkers, setSavedWorkers] = useState<string[]>([])
  const [blockedUsers, setBlockedUsers] = useState<string[]>([])
  const [showNet, setShowNet] = useState(false)
  const [query, setQuery] = useState('')
  const [filterTrade, setFilterTrade] = useState('All')
  const [rateMax, setRateMax] = useState(5000)
  const [negotiationRate, setNegotiationRate] = useState(40)
  const [quoteAccepted, setQuoteAccepted] = useState(false)
  const [hoursLogged, setHoursLogged] = useState(8)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [safePassVerified, setSafePassVerified] = useState(false)
  const [tradeCertVerified, setTradeCertVerified] = useState(false)
  const [notifications, setNotifications] = useState<string[]>([
    'New match in Dublin 4',
    'Message from Emerald Build Ltd',
  ])
  const [newReviewStars, setNewReviewStars] = useState(4)
  const [newReviewText, setNewReviewText] = useState('')
  const [newDispute, setNewDispute] = useState<'none' | 'no-show' | 'non-payment'>('none')
  const [postForm, setPostForm] = useState({
    trade: 'Electrical',
    location: 'Dublin 4',
    startDate: '2026-05-20',
    duration: 'one-off' as JobDuration,
    rateType: 'hourly' as RateType,
    rateValue: 40,
  })

  const renewal = useMemo(() => getRenewalCountdown(worker.safePassExpiry), [worker.safePassExpiry])
  const safePassActive = isSafePassValid(worker.safePassExpiry)
  const workerScore = averageScore(reviews, worker.id)
  const clientScore = averageScore(reviews, client.id)
  const rateHint = RATE_HINTS[`${postForm.trade}-${postForm.location}`] ?? 'No hint yet for this trade/city.'

  const filteredJobs = jobs.filter((job) => {
    const byQuery = `${job.title} ${job.location}`.toLowerCase().includes(query.toLowerCase())
    const byTrade = filterTrade === 'All' ? true : job.trade === filterTrade
    const byRate = job.rateValue <= rateMax
    return byQuery && byTrade && byRate
  })

  const pricingPreview = postForm.rateType === 'hourly' ? postForm.rateValue * hoursLogged : postForm.rateValue
  const workerNetPreview =
    postForm.rateType === 'hourly'
      ? calculateNetPay(postForm.rateValue * hoursLogged, worker.rctRate)
      : calculateNetPay(postForm.rateValue, worker.rctRate)

  const uploadDocument = (target: 'safepass' | 'tradecert') => {
    triggerHaptic(35)
    setUploadProgress(0)
    const timer = window.setInterval(() => {
      setUploadProgress((p) => {
        const next = Math.min(100, p + 20)
        if (next === 100) {
          window.clearInterval(timer)
          if (target === 'safepass') setSafePassVerified(true)
          if (target === 'tradecert') setTradeCertVerified(true)
        }
        return next
      })
    }, 220)
  }

  const postJob = () => {
    const id = `j${jobs.length + 1}`
    setJobs((prev) => [
      {
        id,
        title: `${postForm.trade} Role`,
        trade: postForm.trade,
        location: postForm.location,
        startDate: postForm.startDate,
        duration: postForm.duration,
        rateType: postForm.rateType,
        rateValue: postForm.rateValue,
        status: 'open',
        expiresAt: '2026-05-30',
        applicants: [],
      },
      ...prev,
    ])
    setNotifications((n) => [`Job posted in ${postForm.location}`, ...n])
  }

  const applyToJob = (jobId: string) => {
    if (!quoteAccepted) return
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? {
              ...job,
              status: 'applied',
              applicants: job.applicants.includes(worker.name)
                ? job.applicants
                : [...job.applicants, worker.name],
            }
          : job,
      ),
    )
    setNotifications((n) => [`Applied to ${jobId}`, ...n])
  }

  const updateStatus = (jobId: string) => {
    const flow: JobStatus[] = ['open', 'applied', 'hired', 'in progress', 'complete']
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId) return job
        const next = flow[Math.min(flow.indexOf(job.status) + 1, flow.length - 1)]
        return { ...job, status: next }
      }),
    )
  }

  const repostJob = (jobId: string) => {
    setJobs((prev) =>
      prev.map((job) => (job.id === jobId ? { ...job, status: 'open', expiresAt: '2026-06-15' } : job)),
    )
  }

  const sendMessage = (peer: string) => {
    const text = `Rate proposal: ${formatCurrency(negotiationRate)} / hr`
    setThreads((prev) => {
      const found = prev.find((t) => t.peer === peer)
      if (found) return prev.map((t) => (t.peer === peer ? { ...t, messages: [...t.messages, text] } : t))
      return [{ id: `m${prev.length + 1}`, peer, messages: [text] }, ...prev]
    })
    setNotifications((n) => [`Message sent to ${peer}`, ...n])
  }

  const addReview = () => {
    setReviews((prev) => [
      {
        id: `r${prev.length + 1}`,
        from: role === 'worker' ? worker.id : client.id,
        to: role === 'worker' ? client.id : worker.id,
        stars: newReviewStars,
        note: newReviewText || 'Completed as agreed.',
        dispute: newDispute,
      },
      ...prev,
    ])
    setNewReviewText('')
    setNewDispute('none')
  }

  const reportItem = (target: ReportTarget) => {
    setReports((prev) => [
      { id: `rep${prev.length + 1}`, target, reason: 'Suspicious behavior', status: 'open' },
      ...prev,
    ])
  }

  return (
    <section className="mx-auto min-h-screen w-full max-w-6xl bg-[#111111] p-4 text-white sm:p-6">
      <header className="mb-4 rounded-2xl border border-white/10 bg-[#1A1A1A] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black">SiteCrew IE - MVP</h1>
            <p className="text-sm text-white/70">Irish construction hiring and trust platform</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRole('worker')}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${role === 'worker' ? 'bg-[#FF8C00] text-[#1A1A1A]' : 'bg-white/10'}`}
            >
              Worker View
            </button>
            <button
              type="button"
              onClick={() => setRole('client')}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${role === 'client' ? 'bg-[#FF8C00] text-[#1A1A1A]' : 'bg-white/10'}`}
            >
              Client View
            </button>
          </div>
        </div>
      </header>

      <nav className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-[#1A1A1A] p-2 md:grid-cols-6">
        {[
          ['profiles', <UserRound key="i1" size={15} />, 'Profiles'],
          ['jobs', <BriefcaseBusiness key="i2" size={15} />, 'Jobs'],
          ['messaging', <MessageSquareText key="i3" size={15} />, 'Messaging'],
          ['reviews', <Star key="i4" size={15} />, 'Reviews'],
          ['safety', <ShieldCheck key="i5" size={15} />, 'Trust & Safety'],
          ['admin', <Users key="i6" size={15} />, 'Admin'],
        ].map(([key, icon, label]) => (
          <button
            key={String(key)}
            type="button"
            onClick={() => {
              triggerHaptic()
              setActiveTab(key as typeof activeTab)
            }}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold sm:text-sm ${
              activeTab === key ? 'bg-[#FF8C00] text-[#1A1A1A]' : 'bg-white/5 text-white/80'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        {activeTab === 'profiles' && (
          <motion.div key="profiles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold">Worker Profile</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-xs">
                  <IdCard size={13} /> {worker.identityVerified ? 'Identity Verified' : 'Pending ID'}
                </span>
              </div>
              <p className="text-sm text-white/75">{worker.tradeType} • {worker.yearsExperience} years</p>
              <p className="mt-1 text-sm text-white/75">{worker.skills.join(', ')}</p>
              <p className="mt-2 inline-flex items-center gap-2 text-sm"><MapPin size={14} /> {worker.location}</p>
              <p className="mt-2 text-sm">Availability calendar</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {WEEK_DAYS.map((day) => {
                  const active = worker.availableDays.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        setWorker((w) => ({
                          ...w,
                          availableDays: active ? w.availableDays.filter((d) => d !== day) : [...w.availableDays, day],
                        }))
                      }
                      className={`rounded-lg px-2 py-1 text-xs ${active ? 'bg-[#FF8C00] text-[#1A1A1A]' : 'bg-white/10'}`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 text-sm">Portfolio</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {worker.portfolio.map((item) => (
                  <div key={item} className="rounded-lg bg-white/10 p-2 text-center text-xs">{item}</div>
                ))}
              </div>
              <p className="mt-3 text-sm">
                Preferred rate: {formatCurrency(worker.preferredRate)}
                {worker.preferredRateType === 'hourly' ? '/hr' : ' fixed'}
              </p>
              <p className="mt-2 text-sm">
                Next Safe Pass renewal: <span className="text-[#FFB257]">{renewal.label}</span> ({renewal.daysLeft} days)
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-bold">Client Profile</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-xs">
                  <Building2 size={13} /> {client.identityVerified ? 'Verified Company' : 'Pending'}
                </span>
              </div>
              <p className="inline-flex items-center gap-2 text-sm"><Building2 size={14} /> {client.companyName}</p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm"><MapPin size={14} /> {client.location}</p>
              <p className="mt-3 text-sm">Recent job history</p>
              <ul className="mt-2 space-y-2 text-sm text-white/75">
                {client.jobHistory.map((job) => (
                  <li key={job} className="rounded-lg bg-white/10 p-2">{job}</li>
                ))}
              </ul>
              <p className="mt-4 text-sm">Overall score: <span className="font-semibold text-[#FFB257]">{clientScore || client.rating}</span>/5</p>
            </article>
          </motion.div>
        )}

        {activeTab === 'jobs' && (
          <motion.div key="jobs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <article className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-4">
              <h2 className="text-lg font-bold">Post a Job</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <input className="rounded-lg bg-white/10 p-2 text-sm" value={postForm.trade} onChange={(e) => setPostForm((p) => ({ ...p, trade: e.target.value }))} placeholder="Trade" />
                <input className="rounded-lg bg-white/10 p-2 text-sm" value={postForm.location} onChange={(e) => setPostForm((p) => ({ ...p, location: e.target.value }))} placeholder="Location" />
                <input className="rounded-lg bg-white/10 p-2 text-sm" type="date" value={postForm.startDate} onChange={(e) => setPostForm((p) => ({ ...p, startDate: e.target.value }))} />
                <select className="rounded-lg bg-white/10 p-2 text-sm" value={postForm.duration} onChange={(e) => setPostForm((p) => ({ ...p, duration: e.target.value as JobDuration }))}>
                  <option value="one-off">One-off</option><option value="short-term">Short-term</option><option value="ongoing">Ongoing</option>
                </select>
                <select className="rounded-lg bg-white/10 p-2 text-sm" value={postForm.rateType} onChange={(e) => setPostForm((p) => ({ ...p, rateType: e.target.value as RateType }))}>
                  <option value="hourly">Hourly</option><option value="fixed">Fixed</option>
                </select>
                <input className="rounded-lg bg-white/10 p-2 text-sm" type="number" value={postForm.rateValue} onChange={(e) => setPostForm((p) => ({ ...p, rateValue: Number(e.target.value) }))} />
              </div>
              <p className="mt-2 text-xs text-[#FFB257]">{rateHint}</p>
              <button type="button" onClick={postJob} className="mt-3 rounded-xl bg-[#FF8C00] px-4 py-2 text-sm font-bold text-[#1A1A1A]">Post Job</button>
            </article>

            <article className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-4">
              <h3 className="text-base font-bold">Search and filter</h3>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <label className="flex items-center gap-2 rounded-lg bg-white/10 px-2 text-sm"><Search size={14} /><input className="w-full bg-transparent p-2" placeholder="Search location or title" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
                <select className="rounded-lg bg-white/10 p-2 text-sm" value={filterTrade} onChange={(e) => setFilterTrade(e.target.value)}>
                  <option>All</option><option>Electrical</option><option>Carpentry</option><option>General Labour</option>
                </select>
                <label className="rounded-lg bg-white/10 p-2 text-xs">Max rate: {formatCurrency(rateMax)}<input className="mt-2 w-full" type="range" min={25} max={5000} value={rateMax} onChange={(e) => setRateMax(Number(e.target.value))} /></label>
              </div>
            </article>

            <article className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-4">
              <h3 className="text-base font-bold">Pricing engine + quote acceptance</h3>
              <div className="mt-2 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-white/10 p-3 text-sm">
                  <p>Client pricing preview: <span className="font-semibold">{formatCurrency(pricingPreview)}</span></p>
                  <p className="mt-1">Worker net preview (RCT 20%): <span className="font-semibold">{formatCurrency(workerNetPreview)}</span></p>
                  {postForm.rateType === 'hourly' && (
                    <label className="mt-2 block text-xs">Logged hours: {hoursLogged}
                      <input className="mt-2 w-full" type="range" min={1} max={12} value={hoursLogged} onChange={(e) => setHoursLogged(Number(e.target.value))} />
                    </label>
                  )}
                </div>
                <div className="rounded-xl bg-white/10 p-3 text-sm">
                  <p className="inline-flex items-center gap-2"><HandCoins size={14} /> In-app rate negotiation</p>
                  <label className="mt-2 block text-xs">Proposal: {formatCurrency(negotiationRate)}/hr
                    <input className="mt-2 w-full" type="range" min={20} max={70} value={negotiationRate} onChange={(e) => setNegotiationRate(Number(e.target.value))} />
                  </label>
                  <button type="button" onClick={() => sendMessage(client.companyName)} className="mt-2 rounded-lg bg-[#FF8C00] px-3 py-1 text-xs font-bold text-[#1A1A1A]">Send Negotiation Message</button>
                  <label className="mt-3 flex items-center gap-2 text-xs"><input type="checkbox" checked={quoteAccepted} onChange={(e) => setQuoteAccepted(e.target.checked)} /> Formal quote accepted before work starts</label>
                </div>
              </div>
            </article>

            <AnimatePresence>
              <div className="grid gap-3">
                {filteredJobs.map((job) => (
                  <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-lg font-bold">{job.title}</p>
                        <p className="text-sm text-white/75">{job.trade} • {job.location}</p>
                      </div>
                      <span className="rounded-full bg-[#FF8C00]/20 px-2 py-1 text-xs font-semibold text-[#FFB257]">{statusBadge(job.status)}</span>
                    </div>
                    <p className="mt-2 text-sm">
                      {job.rateType === 'hourly' ? 'Hourly' : 'Fixed'}: {formatCurrency(showNet ? calculateNetPay(job.rateValue, worker.rctRate) : job.rateValue)}
                      {job.rateType === 'hourly' ? '/hr' : ''}
                    </p>
                    <p className="mt-1 text-xs text-white/65">Start {job.startDate} • Duration {job.duration} • Expires {job.expiresAt}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <button type="button" className="rounded-lg bg-white/10 px-2 py-1" onClick={() => setShowNet((v) => !v)}>Tax Calculator: {showNet ? 'Net' : 'Gross'}</button>
                      <button type="button" className="rounded-lg bg-[#FF8C00] px-2 py-1 font-semibold text-[#1A1A1A]" onClick={() => applyToJob(job.id)}>Apply</button>
                      <button type="button" className="rounded-lg bg-white/10 px-2 py-1" onClick={() => updateStatus(job.id)}>Advance status</button>
                      <button type="button" className="rounded-lg bg-white/10 px-2 py-1" onClick={() => repostJob(job.id)}>Repost</button>
                      <button type="button" className="rounded-lg bg-white/10 px-2 py-1" onClick={() => setSavedWorkers((s) => (s.includes(worker.id) ? s : [...s, worker.id]))}>Shortlist worker</button>
                    </div>
                    <p className="mt-2 text-xs text-white/65">Applicants: {job.applicants.length ? job.applicants.join(', ') : 'None yet'}</p>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          </motion.div>
        )}

        {activeTab === 'messaging' && (
          <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-4">
              <h3 className="text-base font-bold">In-app messaging (phone hidden)</h3>
              <p className="mt-1 inline-flex items-center gap-2 text-xs text-white/70"><Phone size={13} /> Phone numbers are never exposed</p>
              <div className="mt-3 space-y-3">
                {threads.map((thread) => (
                  <div key={thread.id} className="rounded-xl bg-white/10 p-3">
                    <p className="text-sm font-semibold">{thread.peer}</p>
                    {thread.messages.map((m) => (
                      <p key={`${thread.id}-${m}`} className="mt-1 text-xs text-white/75">{m}</p>
                    ))}
                  </div>
                ))}
              </div>
            </article>
            <article className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-4">
              <h3 className="text-base font-bold">Match notifications</h3>
              <p className="mt-1 inline-flex items-center gap-2 text-xs text-white/70"><Bell size={13} /> Push notification stream</p>
              <ul className="mt-3 space-y-2">
                {notifications.map((n) => (
                  <li key={n} className="rounded-lg bg-white/10 p-2 text-sm">{n}</li>
                ))}
              </ul>
            </article>
          </motion.div>
        )}

        {activeTab === 'reviews' && (
          <motion.div key="reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-4">
              <h3 className="text-base font-bold">Ratings and written reviews</h3>
              <p className="mt-1 text-sm">Worker overall: <span className="text-[#FFB257]">{workerScore}/5</span></p>
              <p className="text-sm">Client overall: <span className="text-[#FFB257]">{clientScore}/5</span></p>
              <div className="mt-3 grid gap-2">
                <label className="text-xs">Stars: {newReviewStars}
                  <input className="w-full" type="range" min={1} max={5} value={newReviewStars} onChange={(e) => setNewReviewStars(Number(e.target.value))} />
                </label>
                <textarea className="rounded-lg bg-white/10 p-2 text-sm" rows={3} placeholder="Short written review" value={newReviewText} onChange={(e) => setNewReviewText(e.target.value)} />
                <select className="rounded-lg bg-white/10 p-2 text-sm" value={newDispute} onChange={(e) => setNewDispute(e.target.value as typeof newDispute)}>
                  <option value="none">No dispute</option>
                  <option value="no-show">Flag no-show</option>
                  <option value="non-payment">Flag non-payment</option>
                </select>
                <button type="button" className="rounded-lg bg-[#FF8C00] px-3 py-2 text-sm font-bold text-[#1A1A1A]" onClick={addReview}>Submit review</button>
              </div>
            </article>
            <article className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-4">
              <h3 className="text-base font-bold">Recent reviews</h3>
              <div className="mt-3 space-y-2">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-xl bg-white/10 p-3 text-sm">
                    <p className="font-semibold">{r.stars}★ • {r.note}</p>
                    {r.dispute !== 'none' && (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-red-300"><CircleAlert size={12} /> Dispute: {r.dispute}</p>
                    )}
                  </div>
                ))}
              </div>
            </article>
          </motion.div>
        )}

        {activeTab === 'safety' && (
          <motion.div key="safety" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-4">
              <h3 className="text-base font-bold">Verification and cert uploads</h3>
              <button type="button" onClick={() => setWorker((w) => ({ ...w, phoneVerified: !w.phoneVerified }))} className="mt-2 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm">
                <Phone size={14} />
                {worker.phoneVerified ? 'Phone verified' : 'Verify phone number'}
              </button>
              <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-[#FF8C00]" style={{ width: `${uploadProgress}%` }} />
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <button type="button" onClick={() => uploadDocument('safepass')} className="rounded-lg bg-[#FF8C00] px-2 py-1 font-semibold text-[#1A1A1A]">
                  <FileUp size={13} className="mr-1 inline" /> Upload Safe Pass
                </button>
                <button type="button" onClick={() => uploadDocument('tradecert')} className="rounded-lg bg-white/10 px-2 py-1">
                  <FileUp size={13} className="mr-1 inline" /> Upload Trade Cert
                </button>
              </div>
              <p className="mt-2 text-xs">{safePassActive || safePassVerified ? 'Safe Pass active' : 'Safe Pass expired'}</p>
              <p className="text-xs">{tradeCertVerified ? 'Trade cert verified' : 'Trade cert optional'}</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-4">
              <h3 className="text-base font-bold">Report and block controls</h3>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <button type="button" onClick={() => reportItem('listing')} className="rounded-lg bg-white/10 px-2 py-1"><Flag size={13} className="mr-1 inline" /> Report listing</button>
                <button type="button" onClick={() => reportItem('user')} className="rounded-lg bg-white/10 px-2 py-1"><Flag size={13} className="mr-1 inline" /> Report user</button>
                <button type="button" onClick={() => setBlockedUsers((prev) => (prev.includes(client.id) ? prev : [...prev, client.id]))} className="rounded-lg bg-red-500/20 px-2 py-1 text-red-200"><ShieldX size={13} className="mr-1 inline" /> Block user</button>
              </div>
              <p className="mt-3 text-sm">Blocked users: {blockedUsers.length}</p>
              <p className="text-sm">Saved workers: {savedWorkers.length}</p>
            </article>
          </motion.div>
        )}

        {activeTab === 'admin' && (
          <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-4">
            <h3 className="text-base font-bold">Admin moderation dashboard</h3>
            <p className="mt-1 text-sm text-white/70">Review reports, resolve trust incidents, and track platform health.</p>
            <div className="mt-4 space-y-2">
              {reports.length === 0 && <p className="text-sm text-white/70">No open reports.</p>}
              {reports.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/10 p-3 text-sm">
                  <p>{r.id} • {r.target} • {r.reason}</p>
                  <button
                    type="button"
                    onClick={() => setReports((prev) => prev.map((p) => (p.id === r.id ? { ...p, status: 'resolved' } : p)))}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/30 px-2 py-1 text-xs"
                  >
                    <CheckCheck size={13} /> Mark resolved
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3 text-xs">
              <div className="rounded-lg bg-white/10 p-2"><UserRoundCheck size={14} className="mb-1" /> Verified users: {worker.identityVerified && client.identityVerified ? 2 : 1}</div>
              <div className="rounded-lg bg-white/10 p-2"><CalendarDays size={14} className="mb-1" /> Active jobs: {jobs.filter((j) => j.status !== 'complete').length}</div>
              <div className="rounded-lg bg-white/10 p-2"><ShieldCheck size={14} className="mb-1" /> Open reports: {reports.filter((r) => r.status === 'open').length}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
