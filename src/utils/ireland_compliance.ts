/**
 * Safe Pass expires after 4 years in Ireland.
 * Check validity against today's date at runtime.
 */
export function isSafePassValid(expiryDate: Date): boolean {
  return expiryDate > new Date();
}

/**
 * RCT (Relevant Contracts Tax) deducted at source by principal contractor.
 * Rates: 0% (verified subcontractor), 20% (registered), 35% (unregistered).
 */
export function calculateNetPay(grossAmount: number, rctRate: 0 | 20 | 35): number {
  const deduction = grossAmount * (rctRate / 100);
  return grossAmount - deduction;
}
