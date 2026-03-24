# EventAI Backend API Spec

Base URL: `http://localhost:4000`

## Health

### `GET /health`

Response:

```json
{
  "status": "ok",
  "service": "eventai-backend",
  "env": "development",
  "time": "2026-02-15T00:00:00.000Z"
}
```

## Payments

### `POST /payments/create-intent`

Creates a Stripe PaymentIntent or Razorpay Order.

Request body:

```json
{
  "provider": "stripe",
  "amount": 250000,
  "currency": "INR",
  "bookingId": "booking_123",
  "description": "Booking for Premium Wedding Package"
}
```

Response (Stripe):

```json
{
  "provider": "stripe",
  "referenceId": "pi_123",
  "status": "pending",
  "clientSecret": "pi_123_secret_abc"
}
```

Response (Razorpay):

```json
{
  "provider": "razorpay",
  "referenceId": "order_123",
  "status": "pending",
  "checkoutUrl": ""
}
```

### `GET /payments/webhook-status/:referenceId`

Reads latest normalized webhook state from storage.

Response:

```json
{
  "status": "confirmed"
}
```

## Webhooks

### `POST /webhooks/stripe`

Headers:
- `stripe-signature`: Stripe signature header

Raw body verification is applied using `STRIPE_WEBHOOK_SECRET`.
Supported events:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

### `POST /webhooks/razorpay`

Headers:
- `x-razorpay-signature`: Razorpay signature header

Raw body verification is applied using `RAZORPAY_WEBHOOK_SECRET`.
Supported events include:
- `payment.captured`
- `payment.failed`
- `order.paid`

## Status normalization

Provider statuses are normalized to:
- `pending`
- `confirmed`
- `failed`

These are persisted in `payment_transactions.status` and reflected in app booking rows via `booking_requests.paymentWebhookStatus`.
