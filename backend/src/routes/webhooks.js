import { Router } from 'express';
import { paymentsService } from '../services/paymentsService.js';

export const webhooksRouter = Router();

webhooksRouter.post('/stripe', async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    if (!signature || typeof signature !== 'string') {
      return res.status(400).send('Missing stripe-signature');
    }

    const event = paymentsService.verifyStripeSignature(req.body, signature);
    const type = event.type;

    if (type === 'payment_intent.succeeded' || type === 'payment_intent.payment_failed') {
      const intent = event.data.object;
      await paymentsService.recordWebhookResult({
        provider: 'stripe',
        referenceId: intent.id,
        status: intent.status,
        eventType: type,
        payload: intent,
      });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid stripe webhook' });
  }
});

webhooksRouter.post('/razorpay', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature || typeof signature !== 'string') {
      return res.status(400).send('Missing x-razorpay-signature');
    }

    const rawBody = req.rawBody || '';
    const isValid = paymentsService.verifyRazorpaySignature(rawBody, signature);
    if (!isValid) return res.status(400).json({ error: 'Invalid signature' });

    const event = req.body;
    const eventType = event?.event || '';
    const paymentEntity = event?.payload?.payment?.entity;
    const orderEntity = event?.payload?.order?.entity;
    const referenceId = paymentEntity?.order_id || orderEntity?.id || paymentEntity?.id;

    if (referenceId) {
      await paymentsService.recordWebhookResult({
        provider: 'razorpay',
        referenceId,
        status: paymentEntity?.status || orderEntity?.status || 'pending',
        eventType,
        payload: paymentEntity || orderEntity || event,
      });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid razorpay webhook' });
  }
});
