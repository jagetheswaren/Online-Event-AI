import { Router } from 'express';
import { paymentsService } from '../services/paymentsService.js';

export const paymentsRouter = Router();

const getCreateIntentErrorPayload = (error) => {
  if (!(error instanceof Error)) {
    return {
      status: 500,
      payload: { error: 'Unknown error' },
    };
  }

  if (error.message.includes('not configured')) {
    return {
      status: 503,
      payload: {
        error: error.message,
        code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
      },
    };
  }

  if (error.message.startsWith('Unsupported provider')) {
    return {
      status: 400,
      payload: {
        error: error.message,
        code: 'UNSUPPORTED_PAYMENT_PROVIDER',
      },
    };
  }

  return {
    status: 500,
    payload: { error: error.message },
  };
};

paymentsRouter.post('/create-intent', async (req, res) => {
  try {
    const { provider = 'stripe', amount, currency = 'INR', bookingId, description = '' } = req.body || {};

    if (!amount || !bookingId) {
      return res.status(400).json({ error: 'amount and bookingId are required' });
    }

    const result = await paymentsService.createIntent({
      provider,
      amount: Number(amount),
      currency,
      bookingId,
      description,
    });
    return res.status(200).json(result);
  } catch (error) {
    const { status, payload } = getCreateIntentErrorPayload(error);
    return res.status(status).json(payload);
  }
});

paymentsRouter.get('/webhook-status/:referenceId', async (req, res) => {
  try {
    const { referenceId } = req.params;
    const result = await paymentsService.getWebhookStatus(referenceId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});
