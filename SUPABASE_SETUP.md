# Supabase Production Setup

1. Create a Supabase project.
2. In SQL Editor, run `supabase/schema.sql`.
3. Enable Email/Password auth in Supabase Auth settings.
4. Configure environment variables in `.env` from `.env.example`:

```env
EXPO_PUBLIC_BACKEND_PROVIDER=supabase
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
EXPO_PUBLIC_API_URL=https://YOUR_BACKEND_API
```

5. Restart the app:

```bash
npm run start-web-dev
```

## Required backend endpoints (for payment/webhooks)

- `POST /payments/create-intent`
- `GET /payments/webhook-status/:referenceId`

These endpoints should call Stripe/Razorpay server SDKs and update payment status in your DB.
