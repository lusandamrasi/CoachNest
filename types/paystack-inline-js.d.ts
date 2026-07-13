declare module '@paystack/inline-js' {
    interface PaystackTransactionOptions {
        key: string
        email: string
        amount: number
        currency?: string
        reference?: string
        metadata?: Record<string, unknown>
        onSuccess?: (transaction: { reference: string }) => void
        onCancel?: () => void
        onError?: (error: { message: string }) => void
    }

    export default class PaystackPop {
        newTransaction(options: PaystackTransactionOptions): void
    }
}
