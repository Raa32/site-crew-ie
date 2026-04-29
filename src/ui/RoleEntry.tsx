import { BriefcaseBusiness, HardHat, ShieldCheck } from 'lucide-react'
import type { AppRole } from './types'

type RoleEntryProps = {
  onSelectRole: (role: AppRole) => void
}

export default function RoleEntry({ onSelectRole }: RoleEntryProps) {
  return (
    <div>
      {/* Hero */}
      <div className="mb-8 text-center">
        <div className="mb-3 flex justify-center">
          <HardHat size={40} className="text-[#FF8C00]" />
        </div>
        <h2 className="text-3xl font-black text-white">Find the right trade job</h2>
        <p className="mt-2 text-sm text-white/50">
          Connecting skilled tradespeople with Irish construction sites.
        </p>
      </div>

      {/* Role cards */}
      <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-white/30">
        Who are you?
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <button
          type="button"
          onClick={() => onSelectRole('worker')}
          className="group rounded-2xl border border-white/10 bg-[#1A1A1A] p-5 text-left transition-all hover:border-[#FF8C00]/40 hover:bg-[#FF8C00]/5"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF8C00]/20">
            <HardHat size={20} className="text-[#FF8C00]" />
          </div>
          <p className="font-bold text-white">Tradesperson</p>
          <p className="mt-1 text-xs text-white/50">
            Search jobs, manage your profile, track applications
          </p>
          <p className="mt-3 text-xs font-semibold text-[#FF8C00] opacity-0 transition-opacity group-hover:opacity-100">
            Find jobs →
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSelectRole('client')}
          className="group rounded-2xl border border-white/10 bg-[#1A1A1A] p-5 text-left transition-all hover:border-[#FF8C00]/40 hover:bg-[#FF8C00]/5"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF8C00]/20">
            <BriefcaseBusiness size={20} className="text-[#FF8C00]" />
          </div>
          <p className="font-bold text-white">Employer</p>
          <p className="mt-1 text-xs text-white/50">
            Post jobs, review applicants, manage your site crew
          </p>
          <p className="mt-3 text-xs font-semibold text-[#FF8C00] opacity-0 transition-opacity group-hover:opacity-100">
            Post a job →
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSelectRole('admin')}
          className="group rounded-2xl border border-white/10 bg-[#1A1A1A] p-5 text-left transition-all hover:border-white/20"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
            <ShieldCheck size={20} className="text-white/50" />
          </div>
          <p className="font-bold text-white">Admin</p>
          <p className="mt-1 text-xs text-white/50">
            Trust controls, moderation, dispute resolution
          </p>
          <p className="mt-3 text-xs font-semibold text-white/40 opacity-0 transition-opacity group-hover:opacity-100">
            Open panel →
          </p>
        </button>
      </div>

      {/* Trust signals */}
      <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-white/30">
        <span>✓ SafePass verified workers</span>
        <span>✓ RCT compliant</span>
        <span>✓ CSCS card tracking</span>
        <span>✓ Ireland-specific</span>
      </div>
    </div>
  )
}
