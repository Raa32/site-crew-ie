import { CalendarDays, CheckCheck, ShieldCheck, UserRoundCheck } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import type { ClientProfile, JobPosting, ReportItem, WorkerProfile } from './types'

type AdminPanelProps = {
  reports: ReportItem[]
  setReports: Dispatch<SetStateAction<ReportItem[]>>
  worker: WorkerProfile
  client: ClientProfile
  jobs: JobPosting[]
}

export default function AdminPanel({
  reports,
  setReports,
  worker,
  client,
  jobs,
}: AdminPanelProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-4 text-white">
      <h3 className="text-base font-bold">Admin moderation dashboard</h3>
      <p className="mt-1 text-sm text-white/70">Reports and safety health.</p>
      <div className="mt-4 space-y-2">
        {reports.length === 0 && <p className="text-sm text-white/70">No open reports.</p>}
        {reports.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/10 p-3 text-sm">
            <p>
              {r.id} - {r.target} - {r.reason}
            </p>
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
        <div className="rounded-lg bg-white/10 p-2">
          <UserRoundCheck size={14} className="mb-1" /> Verified users:{' '}
          {worker.identityVerified && client.identityVerified ? 2 : 1}
        </div>
        <div className="rounded-lg bg-white/10 p-2">
          <CalendarDays size={14} className="mb-1" /> Active jobs:{' '}
          {jobs.filter((j) => j.status !== 'complete').length}
        </div>
        <div className="rounded-lg bg-white/10 p-2">
          <ShieldCheck size={14} className="mb-1" /> Open reports:{' '}
          {reports.filter((r) => r.status === 'open').length}
        </div>
      </div>
    </div>
  )
}
