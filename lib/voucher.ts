export interface VoucherTier {
  minScore: number
  value: number
  label: string
}

export const VOUCHER_TIERS: VoucherTier[] = [
  { minScore: 30, value: 150000, label: '150K' },
  { minScore: 20, value: 100000, label: '100K' },
  { minScore: 10, value: 50000, label: '50K' },
]

export function getVoucherByScore(score: number): VoucherTier | null {
  for (const tier of VOUCHER_TIERS) {
    if (score >= tier.minScore) {
      return tier
    }
  }
  return null
}

export function generateVoucherCode(): string {
  const prefix = 'MKTD'
  const random = Math.random().toString(36).substring(2, 10).toUpperCase()
  return `${prefix}-${random}`
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value)
}
