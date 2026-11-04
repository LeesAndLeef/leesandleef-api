export type PaymentInstructions =
  | { method: 'stripe'; clientSecret: string }
  | { method: 'bank'; beneficiary: string; iban: string; bic?: string; reference: string; amount: number }
  | { method: 'none' }
