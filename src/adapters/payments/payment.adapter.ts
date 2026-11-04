export interface CreatePaymentInput {
  orderId: string
  orderNumber: string
  amountCents: number
}

export type PaymentStatus = 'succeeded' | 'canceled' | 'pending'

export interface Payment {
  id: string
  clientSecret: string | null
  status: PaymentStatus
}

export type PaymentEvent =
  | { type: 'succeeded'; paymentId: string; amountCents: number }
  | { type: 'canceled'; paymentId: string }
  | { type: 'failed'; paymentId: string; reason?: string }

export interface PaymentProvider {
  name: 'stripe' | 'fake'
  createPayment(input: CreatePaymentInput): Promise<Payment>
  retrievePayment(paymentId: string): Promise<Payment & { amountCents: number }>
  parseWebhook(payload: Buffer, signature: string): PaymentEvent | null
}
