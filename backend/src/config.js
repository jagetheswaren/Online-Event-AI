import dotenv from 'dotenv';

dotenv.config();

const parseOrigins = (raw) =>
  (raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export const config = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: parseOrigins(process.env.ALLOWED_ORIGINS),
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
};

export const isStripeEnabled = () =>
  Boolean(config.stripeSecretKey && config.stripeWebhookSecret);

export const isRazorpayEnabled = () =>
  Boolean(config.razorpayKeyId && config.razorpayKeySecret && config.razorpayWebhookSecret);

export const isSupabaseEnabled = () =>
  Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);
