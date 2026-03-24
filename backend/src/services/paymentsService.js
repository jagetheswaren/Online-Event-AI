import Stripe from 'stripe';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config, isRazorpayEnabled, isStripeEnabled } from '../config.js';
import { paymentsRepository } from '../repositories/paymentsRepository.js';

const stripe = isStripeEnabled() ? new Stripe(config.stripeSecretKey) : null;
const razorpay = isRazorpayEnabled()
  ? new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpayKeySecret,
    })
  : null;

const normalizeStatus = (status) => {
  if (status === 'succeeded' || status === 'captured' || status === 'paid') return 'confirmed';
  if (status === 'failed' || status === 'payment_failed') return 'failed';
  return 'pending';
};

export const paymentsService = {
  async createIntent({ provider, amount, currency, bookingId, description }) {
    if (provider === 'stripe') {
      if (!stripe) throw new Error('Stripe is not configured');
      const intent = await stripe.paymentIntents.create({
        amount,
        currency: (currency || 'INR').toLowerCase(),
        description,
        metadata: { bookingId },
      });

      await paymentsRepository.upsertPayment({
        reference_id: intent.id,
        provider: 'stripe',
        booking_id: bookingId,
        amount,
        currency: (currency || 'INR').toUpperCase(),
        status: normalizeStatus(intent.status),
        raw_payload: intent,
      });

      return {
        provider: 'stripe',
        referenceId: intent.id,
        status: intent.status === 'succeeded' ? 'paid' : 'pending',
        clientSecret: intent.client_secret,
      };
    }

    if (provider === 'razorpay') {
      if (!razorpay) throw new Error('Razorpay is not configured');

      const order = await razorpay.orders.create({
        amount,
        currency: (currency || 'INR').toUpperCase(),
        receipt: bookingId,
        notes: { description },
      });

      await paymentsRepository.upsertPayment({
        reference_id: order.id,
        provider: 'razorpay',
        booking_id: bookingId,
        amount,
        currency: (currency || 'INR').toUpperCase(),
        status: 'pending',
        raw_payload: order,
      });

      return {
        provider: 'razorpay',
        referenceId: order.id,
        status: 'pending',
        checkoutUrl: '',
      };
    }

    throw new Error(`Unsupported provider: ${provider}`);
  },

  async getWebhookStatus(referenceId) {
    const payment = await paymentsRepository.getPaymentByReference(referenceId);
    if (!payment) return { status: 'pending' };
    return { status: payment.status };
  },

  verifyStripeSignature(rawBodyBuffer, signature) {
    if (!stripe || !config.stripeWebhookSecret) throw new Error('Stripe webhook is not configured');
    return stripe.webhooks.constructEvent(rawBodyBuffer, signature, config.stripeWebhookSecret);
  },

  verifyRazorpaySignature(rawBody, signature) {
    const digest = crypto
      .createHmac('sha256', config.razorpayWebhookSecret)
      .update(rawBody)
      .digest('hex');
    return digest === signature;
  },

  async recordWebhookResult({ provider, referenceId, status, eventType, payload }) {
    const webhookStatus = normalizeStatus(status);

    await paymentsRepository.upsertPayment({
      reference_id: referenceId,
      provider,
      booking_id: payload?.metadata?.bookingId || payload?.notes?.bookingId || payload?.receipt || '',
      amount: payload?.amount || 0,
      currency: payload?.currency || 'INR',
      status: webhookStatus,
      last_event_type: eventType,
      raw_payload: payload,
    });

    await paymentsRepository.updateBookingRequestStatusByReference(referenceId, webhookStatus);

    return webhookStatus;
  },
};
