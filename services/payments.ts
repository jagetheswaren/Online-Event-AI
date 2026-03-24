import config, { logIfDev } from '@/config';
import { PaymentIntentResponse } from '@/types';

interface CreatePaymentInput {
  amount: number;
  currency?: string;
  bookingId: string;
  description: string;
}

const fallbackPaymentIntent = (bookingId: string): PaymentIntentResponse => ({
  provider: config.paymentProvider,
  referenceId: `offline_${bookingId}_${Date.now()}`,
  status: 'pending',
});

export const paymentService = {
  async createPaymentIntent(input: CreatePaymentInput): Promise<PaymentIntentResponse> {
    try {
      const response = await fetch(`${config.apiBaseUrl}/payments/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: config.paymentProvider,
          amount: input.amount,
          currency: input.currency || 'INR',
          bookingId: input.bookingId,
          description: input.description,
        }),
      });

      if (!response.ok) {
        throw new Error(`Payment create intent failed: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      logIfDev('Using fallback payment intent due to error:', error);
      return fallbackPaymentIntent(input.bookingId);
    }
  },

  async getWebhookStatus(referenceId: string): Promise<'pending' | 'confirmed' | 'failed'> {
    try {
      const response = await fetch(`${config.apiBaseUrl}/payments/webhook-status/${referenceId}`);
      if (!response.ok) throw new Error('status fetch failed');
      const data = await response.json();
      return data.status || 'pending';
    } catch (error) {
      logIfDev('Webhook status fallback to pending:', error);
      return 'pending';
    }
  },
};
