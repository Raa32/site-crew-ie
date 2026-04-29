type WizardStepperProps = {
  title: string
  step: number
  total: number
}

export default function WizardStepper({ title, step, total }: WizardStepperProps) {
  const width = `${(step / total) * 100}%`
  return (
    <div className="mb-4 rounded-2xl border border-white/10 bg-[#1A1A1A] p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="text-xs font-semibold text-[#FFB257]">
          Step {step} of {total}
        </p>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-[#FF8C00]" style={{ width }} />
      </div>
    </div>
  )
}
