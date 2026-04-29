export function isSafePassValid(expiryDate: Date): boolean {
  return expiryDate > new Date()
}

export function calculateNetPay(grossAmount: number, rctRate: 0 | 20 | 35): number {
  const deduction = grossAmount * (rctRate / 100)
  return grossAmount - deduction
}
