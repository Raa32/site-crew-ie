import { useMemo, useState } from 'react'
import { ChevronLeft, FileUp, MapPin, MessageSquareText, Search } from 'lucide-react'
import { calculateNetPay, isSafePassValid } from '../utils/ireland_compliance'
import type { ClientProfile, JobPosting, MessageThread, Review, WorkerProfile } from './types'

type WorkerTab = 'jobs' | 'applied' | 'profile' | 'messages'

type WorkerWizardProps = {
  weekDays: string[]
  worker: WorkerProfile
  setWorker: React.Dispatch<React.SetStateAction<WorkerProfile>>
  jobs: JobPosting[]
  setJobs: React.Dispatch<React.SetStateAction<JobPosting[]>>
  threads: MessageThread[]
  reviews: Review[]
  client: ClientProfile
  quoteAccepted: boolean
  setQuoteAccepted: React.Dispatch<React.SetStateAction<boolean>>
  formatCurrency: (amount: number) => string
}

function StatusBadge({ status }: { status: JobPosting['status'] }) {
  const colors: Record<JobPosting['status'], string> = {
    open: 'bg-green-500/20 text-green-400',
    applied: 'bg-blue-500/20 text-blue-400',
    hired: 'bg-[#FF8C00]/20 text-[#FF8C00]',
    'in progress': 'bg-yellow-500/20 text-yellow-400',
    complete: 'bg-white/10 text-white/50',
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${colors[status]}`}>
      {status}
    </span>
  )
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

export default function WorkerWizard({
  weekDays,
  worker,
  setWorker,
  jobs,
  setJobs,
  threads,
  reviews,
  quoteAccepted,
  setQuoteAccepted,
  formatCurrency,
}: WorkerWizardProps) {
  const [tab, setTab] = useState<WorkerTab>('jobs')
  const [query, setQuery] = useState('')
  const [filterTrade, setFilterTrade] = useState('All')
  const [filterDuration, setFilterDuration] = useState('All')
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null)
  const [showNet, setShowNet] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [safePassVerified, setSafePassVerified] = useState(false)
  const [tradeCertVerified, setTradeCertVerified] = useState(false)

  const renewal = useMemo(() => getRenewalCountdown(worker.safePassExpiry), [worker.safePassExpiry])
  const workerScore = averageScore(reviews, worker.id)

  const filteredJobs = jobs.filter((job) => {
    const byQuery = `${job.title} ${job.location} ${job.trade}`.toLowerCase().includes(query.toLowerCase())
    const byTrade = filterTrade === 'All' || job.trade === filterTrade
    const byDuration = filterDuration === 'All' || job.duration === filterDuration
    return byQuery && byTrade && byDuration
  })

  const applyToJob = (jobId: string) => {
    setQuoteAccepted(true)
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
    setSelectedJob((prev) =>
      prev?.id === jobId ? { ...prev, status: 'applied', applicants: [...(prev.applicants ?? []), worker.name] } : prev,
    )
  }

  const uploadDocument = (target: 'safepass' | 'tradecert') => {
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

  const TABS: { key: WorkerTab; label: string }[] = [
    { key: 'jobs', label: 'Find Jobs' },
    { key: 'applied', label: 'Applied' },
    { key: 'profile', label: 'Profile' },
    { key: 'messages', label: 'Messages' },
  ]

  const appliedJobs = jobs.filter((j) => j.applicants.includes(worker.name))

  return (
    <div>
      {/* Tab nav */}
      <div className="mb-5 flex border-b border-white/10">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t.key
                ? 'border-[#FF8C00] text-white'
                : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            {t.label}
            {t.key === 'applied' && appliedJobs.length > 0 && (
              <span className="ml-1.5 rounded-full bg-[#FF8C00] px-1.5 py-0.5 text-xs text-[#1A1A1A]">
                {appliedJobs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── FIND JOBS ── */}
      {tab === 'jobs' && (
        <div>
          {/* Search bar */}
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <label className="flex flex-1 items-center gap-2 rounded-full border border-white/10 bg-[#1A1A1A] px-4 py-2.5">
              <Search size={15} className="shrink-0 text-white/40" />
              <input
                className="w-full bg-transparent text-sm text-white placeholder-white/40 outline-none"
                placeholder="Job title, trade, or keyword"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label className="flex flex-1 items-center gap-2 rounded-full border border-white/10 bg-[#1A1A1A] px-4 py-2.5">
              <MapPin size={15} className="shrink-0 text-white/40" />
              <input
                className="w-full bg-transparent text-sm text-white placeholder-white/40 outline-none"
                placeholder="Location"
                defaultValue={worker.location}
              />
            </label>
            <button
              type="button"
              className="rounded-full bg-[#FF8C00] px-6 py-2.5 text-sm font-bold text-[#1A1A1A] transition-opacity hover:opacity-90"
            >
              Search
            </button>
          </div>

          {/* Filter chips */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <select
              className="rounded-full border border-white/10 bg-[#1A1A1A] px-3 py-1.5 text-xs text-white outline-none"
              value={filterTrade}
              onChange={(e) => setFilterTrade(e.target.value)}
            >
              <option value="All">All trades</option>
              <option>Electrical</option>
              <option>Carpentry</option>
              <option>General Labour</option>
            </select>
            <select
              className="rounded-full border border-white/10 bg-[#1A1A1A] px-3 py-1.5 text-xs text-white outline-none"
              value={filterDuration}
              onChange={(e) => setFilterDuration(e.target.value)}
            >
              <option value="All">Any duration</option>
              <option value="one-off">One-off</option>
              <option value="short-term">Short-term</option>
              <option value="ongoing">Ongoing</option>
            </select>
            <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-xs text-white/50">
              <input
                type="checkbox"
                checked={showNet}
                onChange={(e) => setShowNet(e.target.checked)}
                className="accent-[#FF8C00]"
              />
              Show net pay
            </label>
          </div>

          <p className="mb-3 text-xs text-white/40">
            {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
          </p>

          {/* Split layout */}
          <div className="flex gap-4">
            {/* Job list */}
            <div className={`space-y-2 ${selectedJob ? 'hidden md:block md:w-2/5 md:shrink-0' : 'w-full'}`}>
              {filteredJobs.length === 0 && (
                <p className="text-sm text-white/40">No jobs match your filters.</p>
              )}
              {filteredJobs.map((job) => {
                const alreadyApplied = job.applicants.includes(worker.name)
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => setSelectedJob(job)}
                    className={`w-full rounded-xl border p-4 text-left transition-colors ${
                      selectedJob?.id === job.id
                        ? 'border-[#FF8C00] bg-[#FF8C00]/5'
                        : 'border-white/10 bg-[#1A1A1A] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold leading-tight text-white">{job.title}</p>
                      {alreadyApplied && <StatusBadge status={job.status} />}
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-xs text-white/50">
                      <MapPin size={11} />
                      {job.location}
                    </p>
                    <p className="mt-2 text-base font-black text-white">
                      {formatCurrency(
                        showNet ? calculateNetPay(job.rateValue, worker.rctRate) : job.rateValue,
                      )}
                      <span className="text-xs font-normal text-white/50">
                        {job.rateType === 'hourly' ? '/hr' : ' fixed'}
                        {showNet && worker.rctRate > 0 ? ' net' : ''}
                      </span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                        {job.trade}
                      </span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs capitalize text-white/60">
                        {job.duration}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Job detail panel */}
            {selectedJob && (
              <div className="flex-1 self-start rounded-xl border border-white/10 bg-[#1A1A1A] p-5 md:sticky md:top-4">
                <button
                  type="button"
                  className="mb-4 flex items-center gap-1 text-xs text-white/50 hover:text-white md:hidden"
                  onClick={() => setSelectedJob(null)}
                >
                  <ChevronLeft size={14} /> Back to results
                </button>

                <h2 className="text-xl font-black text-white">{selectedJob.title}</h2>
                <p className="mt-1 flex items-center gap-1 text-sm text-white/50">
                  <MapPin size={13} />
                  {selectedJob.location}
                </p>

                <p className="mt-4 text-3xl font-black text-white">
                  {formatCurrency(selectedJob.rateValue)}
                  <span className="text-sm font-normal text-white/50">
                    {selectedJob.rateType === 'hourly' ? '/hr' : ' fixed'}
                  </span>
                </p>
                {worker.rctRate > 0 && (
                  <p className="mt-0.5 text-xs text-[#FFB257]">
                    {formatCurrency(calculateNetPay(selectedJob.rateValue, worker.rctRate))}
                    {selectedJob.rateType === 'hourly' ? '/hr' : ''} after {worker.rctRate}% RCT
                  </p>
                )}

                <div className="mt-4 flex gap-2">
                  {selectedJob.applicants.includes(worker.name) ? (
                    <span className="rounded-lg bg-green-500/20 px-4 py-2 text-sm font-semibold text-green-400">
                      Applied ✓
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => applyToJob(selectedJob.id)}
                      className="rounded-lg bg-[#FF8C00] px-5 py-2 text-sm font-bold text-[#1A1A1A] transition-opacity hover:opacity-90"
                    >
                      Apply Now
                    </button>
                  )}
                  <button
                    type="button"
                    className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white hover:border-white/20"
                    onClick={() => setTab('messages')}
                  >
                    Message
                  </button>
                </div>

                <div className="mt-5 grid gap-2 border-t border-white/10 pt-4">
                  {[
                    { label: 'Trade', value: selectedJob.trade },
                    { label: 'Duration', value: selectedJob.duration },
                    { label: 'Start date', value: selectedJob.startDate },
                    { label: 'Expires', value: selectedJob.expiresAt },
                    { label: 'Applicants', value: String(selectedJob.applicants.length) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span className="text-white/50">{label}</span>
                      <span className="capitalize text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── APPLIED ── */}
      {tab === 'applied' && (
        <div className="space-y-3">
          {appliedJobs.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-8 text-center">
              <p className="text-sm text-white/40">No applications yet.</p>
              <button
                type="button"
                onClick={() => setTab('jobs')}
                className="mt-3 rounded-full bg-[#FF8C00] px-4 py-2 text-sm font-bold text-[#1A1A1A]"
              >
                Find jobs
              </button>
            </div>
          ) : (
            appliedJobs.map((job) => (
              <div key={job.id} className="rounded-xl border border-white/10 bg-[#1A1A1A] p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-white">{job.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-white/50">
                      <MapPin size={11} /> {job.location}
                    </p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
                <p className="mt-2 text-sm font-semibold text-white">
                  {formatCurrency(job.rateValue)}
                  {job.rateType === 'hourly' ? '/hr' : ' fixed'}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  {job.trade} · {job.duration} · Start {job.startDate}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── PROFILE ── */}
      {tab === 'profile' && (
        <div className="space-y-3">
          {/* Profile card */}
          <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FF8C00] text-lg font-black text-[#1A1A1A]">
                {worker.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-white">{worker.name}</p>
                <p className="text-xs text-white/50">
                  {worker.tradeType} · {worker.yearsExperience} yrs exp · {worker.location}
                </p>
                <p className="mt-0.5 text-xs text-[#FFB257]">★ {workerScore}/5</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {worker.skills.map((s) => (
                <span key={s} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/70">
                  {s}
                </span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1 text-xs text-white/40">
              Portfolio:
              {worker.portfolio.map((p) => (
                <span key={p} className="ml-1 text-white/60">
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-4">
            <p className="mb-3 text-sm font-semibold text-white">Availability</p>
            <div className="flex flex-wrap gap-2">
              {weekDays.map((day) => {
                const active = worker.availableDays.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() =>
                      setWorker((w) => ({
                        ...w,
                        availableDays: active
                          ? w.availableDays.filter((d) => d !== day)
                          : [...w.availableDays, day],
                      }))
                    }
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active ? 'bg-[#FF8C00] text-[#1A1A1A]' : 'bg-white/10 text-white hover:bg-white/15'
                    }`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Compliance */}
          <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-4">
            <p className="mb-4 text-sm font-semibold text-white">Compliance & Verification</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Safe Pass</p>
                  <p className="text-xs text-white/40">
                    {isSafePassValid(worker.safePassExpiry) || safePassVerified
                      ? `Active · Renewal in ${renewal.label} (${renewal.daysLeft}d)`
                      : 'Expired'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => uploadDocument('safepass')}
                  className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white hover:border-white/20"
                >
                  <FileUp size={12} /> Upload
                </button>
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="h-1.5 w-full rounded-full bg-white/10">
                  <div
                    className="h-1.5 rounded-full bg-[#FF8C00] transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Trade Certificate</p>
                  <p className="text-xs text-white/40">{tradeCertVerified ? 'Verified ✓' : 'Not uploaded'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => uploadDocument('tradecert')}
                  className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white hover:border-white/20"
                >
                  <FileUp size={12} /> Upload
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Phone</p>
                  <p className="text-xs text-white/40">
                    {worker.phoneVerified ? 'Verified' : 'Not verified'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWorker((w) => ({ ...w, phoneVerified: !w.phoneVerified }))}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    worker.phoneVerified
                      ? 'bg-green-500/20 text-green-400'
                      : 'border border-white/10 text-white hover:border-white/20'
                  }`}
                >
                  {worker.phoneVerified ? 'Verified ✓' : 'Verify'}
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-3">
                <div>
                  <p className="text-sm font-medium text-white">RCT Rate</p>
                  <p className="text-xs text-white/40">
                    {worker.rctRate === 0
                      ? 'Zero-rated (registered sub-contractor)'
                      : `${worker.rctRate}% deduction applies`}
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white">
                  {worker.rctRate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MESSAGES ── */}
      {tab === 'messages' && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-4">
            <p className="mb-3 text-sm font-semibold text-white">Messages</p>
            {threads.length === 0 ? (
              <p className="text-xs text-white/40">No messages yet.</p>
            ) : (
              threads.map((thread) => (
                <div key={thread.id} className="mb-2 rounded-lg bg-white/5 p-3">
                  <p className="text-xs font-semibold text-white">{thread.peer}</p>
                  {thread.messages.map((msg) => (
                    <p key={msg} className="mt-1 text-xs text-white/60">
                      {msg}
                    </p>
                  ))}
                </div>
              ))
            )}
            <p className="mt-3 flex items-center gap-1.5 text-xs text-white/30">
              <MessageSquareText size={11} /> Keep all comms in-app.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-4">
            <p className="mb-3 text-sm font-semibold text-white">Reviews</p>
            <p className="mb-3 text-2xl font-black text-white">
              ★ {workerScore}
              <span className="text-sm font-normal text-white/50">/5</span>
            </p>
            {reviews
              .filter((r) => r.to === worker.id)
              .map((r) => (
                <div key={r.id} className="mb-2 rounded-lg bg-white/5 p-2.5 text-xs">
                  <span className="text-[#FFB257]">{'★'.repeat(r.stars)}</span>
                  <p className="mt-0.5 text-white/70">{r.note}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {quoteAccepted && (
        <p className="mt-4 text-xs text-green-400/70">✓ Quote accepted — applications are live.</p>
      )}
    </div>
  )
}
