# EventAI Backend Starter (Node + Express)

This service implements payment intent creation and webhook processing for Stripe and Razorpay, with Supabase persistence.

## 1) Install

```bash
cd backend
npm install
```

## 2) Configure env

Copy `.env.example` to `.env` and fill:
- Supabase URL + service role key
- Stripe keys
- Razorpay keys

## 3) Prepare database

Run these SQL files in Supabase SQL editor:
1. `../supabase/schema.sql`
2. `sql/payment_schema.sql`

## 4) Start server

```bash
npm run dev
```

Server runs on `http://localhost:4000` by default.

## 5) Connect app frontend

In app `.env`, set:

```env
EXPO_PUBLIC_API_URL=http://localhost:4000
```

## API

See `API_SPEC.md`.

## Webhook setup

### Stripe

- Endpoint: `POST https://YOUR_BACKEND/webhooks/stripe`
- Events:
1. `payment_intent.succeeded`
2. `payment_intent.payment_failed`

### Razorpay

- Endpoint: `POST https://YOUR_BACKEND/webhooks/razorpay`
- Set `RAZORPAY_WEBHOOK_SECRET` in backend env.
