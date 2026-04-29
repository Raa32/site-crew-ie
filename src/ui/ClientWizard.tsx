import { useState } from 'react'
import { CircleAlert, HandCoins, MapPin, Star } from 'lucide-react'
import { calculateNetPay } from '../utils/ireland_compliance'
import type { ClientProfile, DisputeType, JobPostForm, JobPosting, Review, WorkerProfile } from './types'

type ClientTab = 'post' | 'listings' | 'applicants' | 'reviews'

type ClientWizardProps = {
  client: ClientProfile
  worker: WorkerProfile
  jobs: JobPosting[]
  setJobs: React.Dispatch<React.SetStateAction<JobPosting[]>>
  quoteAccepted: boolean
  setQuoteAccepted: React.Dispatch<React.SetStateAction<boolean>>
  setSavedWorkers: React.Dispatch<React.SetStateAction<string[]>>
  setNotifications: React.Dispatch<React.SetStateAction<string[]>>
  reviews: Review[]
  setReviews: React.Dispatch<React.SetStateAction<Review[]>>
  formatCurrency: (amount: number) => string
}

const RATE_HINTS: Record<string, string> = {
  'Electrical-Dublin 4': 'Typical range: €35–€50/hr',
  'Carpentry-Cork City': 'Typical range: €220–€320/day',
  'General Labour-Galway': 'Typical range: €18–€24/hr',
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

export default function ClientWizard({
  client,
  worker,
  jobs,
  setJobs,
  quoteAccepted,
  setQuoteAccepted,
  setSavedWorkers,
  setNotifications,
  reviews,
  setReviews,
  formatCurrency,
}: ClientWizardProps) {
  const [tab, setTab] = useState<ClientTab>('post')
  const [postForm, setPostForm] = useState<JobPostForm>({
    trade: 'Electrical',
    location: 'Dublin 4',
    startDate: '2026-05-20',
    duration: 'one-off',
    rateType: 'hourly',
    rateValue: 40,
  })
  const [postTitle, setPostTitle] = useState('')
  const [negotiationRate, setNegotiationRate] = useState(40)
  const [hoursLogged, setHoursLogged] = useState(8)
  const [newReviewStars, setNewReviewStars] = useState(4)
  const [newReviewText, setNewReviewText] = useState('')
  const [newDispute, setNewDispute] = useState<DisputeType>('none')
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [posted, setPosted] = useState(false)

  const rateHint = RATE_HINTS[`${postForm.trade}-${postForm.location}`] ?? 'No rate hint for this trade/location.'
  const pricingPreview = postForm.rateType === 'hourly' ? postForm.rateValue * hoursLogged : postForm.rateValue
  const workerNetPreview = calculateNetPay(pricingPreview, worker.rctRate)

  const postJob = () => {
    const id = `j${jobs.length + 1}`
    const title = postTitle.trim() || `${postForm.trade} Role`
    setJobs((prev) => [
      {
        id,
        title,
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
    setNotifications((n) => [`Job posted: ${title} in ${postForm.location}`, ...n])
    setPosted(true)
    setTimeout(() => setPosted(false), 3000)
    setTab('listings')
  }

  const advanceStatus = (jobId: string) => {
    const flow: JobPosting['status'][] = ['open', 'applied', 'hired', 'in progress', 'complete']
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
      prev.map((job) =>
        job.id === jobId ? { ...job, status: 'open', applicants: [], expiresAt: '2026-06-15' } : job,
      ),
    )
  }

  const addReview = () => {
    setReviews((prev) => [
      {
        id: `r${prev.length + 1}`,
        from: client.id,
        to: worker.id,
        stars: newReviewStars,
        note: newReviewText.trim() || 'Completed as agreed.',
        dispute: newDispute,
      },
      ...prev,
    ])
    setNewReviewText('')
    setNewDispute('none')
  }

  const jobsWithApplicants = jobs.filter((j) => j.applicants.length > 0)

  const TABS: { key: ClientTab; label: string; badge?: number }[] = [
    { key: 'post', label: 'Post a Job' },
    { key: 'listings', label: 'My Listings', badge: jobs.length },
    { key: 'applicants', label: 'Applicants', badge: jobsWithApplicants.reduce((s, j) => s + j.applicants.length, 0) },
    { key: 'reviews', label: 'Reviews' },
  ]

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
            {t.badge != null && t.badge > 0 && (
              <span className="ml-1.5 rounded-full bg-white/10 px-1.5 py-0.5 text-xs text-white/60">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── POST A JOB ── */}
      {tab === 'post' && (
        <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-5">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">{client.companyName}</p>
            {client.identityVerified && (
              <span className="rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs text-green-400">
                Verified employer
              </span>
            )}
          </div>
          <p className="mb-5 text-xs text-white/40">{client.location} · ★ {client.rating}/5</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-white/50">Job title</label>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/20"
                placeholder={`${postForm.trade} Role`}
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/50">Trade</label>
              <select
                className="w-full rounded-lg border border-white/10 bg-[#111] p-2.5 text-sm text-white outline-none"
                value={postForm.trade}
                onChange={(e) => setPostForm((p) => ({ ...p, trade: e.target.value }))}
              >
                <option>Electrical</option>
                <option>Carpentry</option>
                <option>General Labour</option>
                <option>Plumbing</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/50">Location</label>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/20"
                value={postForm.location}
                onChange={(e) => setPostForm((p) => ({ ...p, location: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/50">Start date</label>
              <input
                type="date"
                className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm text-white outline-none focus:border-white/20"
                value={postForm.startDate}
                onChange={(e) => setPostForm((p) => ({ ...p, startDate: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/50">Duration</label>
              <select
                className="w-full rounded-lg border border-white/10 bg-[#111] p-2.5 text-sm text-white outline-none"
                value={postForm.duration}
                onChange={(e) =>
                  setPostForm((p) => ({ ...p, duration: e.target.value as JobPostForm['duration'] }))
                }
              >
                <option value="one-off">One-off</option>
                <option value="short-term">Short-term</option>
                <option value="ongoing">Ongoing</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/50">Pay type</label>
              <select
                className="w-full rounded-lg border border-white/10 bg-[#111] p-2.5 text-sm text-white outline-none"
                value={postForm.rateType}
                onChange={(e) =>
                  setPostForm((p) => ({ ...p, rateType: e.target.value as JobPostForm['rateType'] }))
                }
              >
                <option value="hourly">Hourly rate</option>
                <option value="fixed">Fixed price</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/50">
                {postForm.rateType === 'hourly' ? 'Rate (€/hr)' : 'Fixed price (€)'}
              </label>
              <input
                type="number"
                className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm text-white outline-none focus:border-white/20"
                value={postForm.rateValue}
                onChange={(e) => setPostForm((p) => ({ ...p, rateValue: Number(e.target.value) }))}
              />
            </div>
          </div>

          {rateHint && (
            <p className="mt-3 text-xs text-[#FFB257]">{rateHint}</p>
          )}

          {postForm.rateType === 'hourly' && (
            <div className="mt-4 rounded-lg bg-white/5 p-3">
              <label className="block text-xs text-white/50">
                Estimated hours: {hoursLogged}
              </label>
              <input
                type="range"
                min={1}
                max={12}
                value={hoursLogged}
                onChange={(e) => setHoursLogged(Number(e.target.value))}
                className="mt-2 w-full accent-[#FF8C00]"
              />
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-white/50">Client total</span>
                <span className="font-semibold text-white">{formatCurrency(pricingPreview)}</span>
              </div>
              <div className="mt-1 flex justify-between text-xs">
                <span className="text-white/50">Worker net (after {worker.rctRate}% RCT)</span>
                <span className="text-[#FFB257]">{formatCurrency(workerNetPreview)}</span>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-white/50">
              <input
                type="checkbox"
                checked={quoteAccepted}
                onChange={(e) => setQuoteAccepted(e.target.checked)}
                className="accent-[#FF8C00]"
              />
              Formal quote accepted
            </label>

            <div className="flex items-center gap-2">
              {posted && <span className="text-xs text-green-400">Posted ✓</span>}
              <button
                type="button"
                onClick={postJob}
                className="rounded-lg bg-[#FF8C00] px-5 py-2 text-sm font-bold text-[#1A1A1A] transition-opacity hover:opacity-90"
              >
                Post Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MY LISTINGS ── */}
      {tab === 'listings' && (
        <div className="space-y-3">
          {jobs.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-8 text-center">
              <p className="text-sm text-white/40">No listings yet.</p>
              <button
                type="button"
                onClick={() => setTab('post')}
                className="mt-3 rounded-full bg-[#FF8C00] px-4 py-2 text-sm font-bold text-[#1A1A1A]"
              >
                Post your first job
              </button>
            </div>
          )}
          {jobs.map((job) => (
            <div key={job.id} className="rounded-xl border border-white/10 bg-[#1A1A1A] p-4">
              <div className="flex items-start justify-between gap-2">
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
                {job.trade} · {job.duration} · Start {job.startDate} · Expires {job.expiresAt}
              </p>
              <p className="mt-1 text-xs text-white/40">
                {job.applicants.length} applicant{job.applicants.length !== 1 ? 's' : ''}
              </p>

              {/* Negotiation */}
              <div className="mt-3 rounded-lg bg-white/5 p-3">
                <label className="flex items-center gap-1 text-xs text-white/50">
                  <HandCoins size={12} /> Propose rate: {formatCurrency(negotiationRate)}/hr
                </label>
                <input
                  type="range"
                  min={20}
                  max={70}
                  value={negotiationRate}
                  onChange={(e) => setNegotiationRate(Number(e.target.value))}
                  className="mt-1.5 w-full accent-[#FF8C00]"
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => advanceStatus(job.id)}
                  className="rounded-lg bg-[#FF8C00] px-3 py-1.5 text-xs font-semibold text-[#1A1A1A] transition-opacity hover:opacity-90"
                >
                  Advance status
                </button>
                <button
                  type="button"
                  onClick={() => repostJob(job.id)}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white hover:border-white/20"
                >
                  Repost
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── APPLICANTS ── */}
      {tab === 'applicants' && (
        <div className="space-y-4">
          {jobsWithApplicants.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-8 text-center">
              <p className="text-sm text-white/40">No applicants yet.</p>
            </div>
          ) : (
            jobsWithApplicants.map((job) => (
              <div key={job.id} className="rounded-xl border border-white/10 bg-[#1A1A1A] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-bold text-white">{job.title}</p>
                  <StatusBadge status={job.status} />
                </div>
                {job.applicants.map((name) => (
                  <div
                    key={name}
                    className="mb-2 flex items-center justify-between rounded-lg bg-white/5 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF8C00]/20 text-sm font-bold text-[#FF8C00]">
                        {name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{name}</p>
                        <p className="text-xs text-white/40">
                          {job.trade} · {job.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSavedWorkers((s) => (s.includes(worker.id) ? s : [...s, worker.id]))
                        }
                        className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-white hover:border-white/20"
                      >
                        Shortlist
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedJobId(job.id)
                          advanceStatus(job.id)
                        }}
                        className="rounded-lg bg-[#FF8C00] px-2.5 py-1 text-xs font-semibold text-[#1A1A1A]"
                      >
                        Hire
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
          {selectedJobId && (
            <p className="text-xs text-green-400/70">✓ Status advanced for selected job.</p>
          )}
        </div>
      )}

      {/* ── REVIEWS ── */}
      {tab === 'reviews' && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-4">
            <p className="mb-4 text-sm font-semibold text-white">Rate a worker</p>

            <label className="block text-xs text-white/50">
              Stars: {newReviewStars} / 5
            </label>
            <div className="mt-1.5 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNewReviewStars(n)}
                  className={`text-lg transition-colors ${n <= newReviewStars ? 'text-[#FFB257]' : 'text-white/20'}`}
                >
                  <Star size={20} fill={n <= newReviewStars ? '#FFB257' : 'none'} />
                </button>
              ))}
            </div>

            <textarea
              className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/20"
              rows={3}
              placeholder="Short written review"
              value={newReviewText}
              onChange={(e) => setNewReviewText(e.target.value)}
            />

            <select
              className="mt-2 w-full rounded-lg border border-white/10 bg-[#111] p-2.5 text-sm text-white outline-none"
              value={newDispute}
              onChange={(e) => setNewDispute(e.target.value as DisputeType)}
            >
              <option value="none">No dispute</option>
              <option value="no-show">Flag: no-show</option>
              <option value="non-payment">Flag: non-payment</option>
            </select>

            <button
              type="button"
              onClick={addReview}
              className="mt-3 rounded-lg bg-[#FF8C00] px-4 py-2 text-sm font-bold text-[#1A1A1A] transition-opacity hover:opacity-90"
            >
              Submit review
            </button>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-4">
            <p className="mb-3 text-sm font-semibold text-white">Recent reviews</p>
            {reviews.length === 0 ? (
              <p className="text-xs text-white/40">No reviews yet.</p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="mb-2 rounded-lg bg-white/5 p-2.5">
                  <span className="text-sm text-[#FFB257]">{'★'.repeat(r.stars)}</span>
                  <p className="mt-0.5 text-xs text-white/70">{r.note}</p>
                  {r.dispute !== 'none' && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                      <CircleAlert size={11} /> {r.dispute}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
