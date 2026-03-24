/**
 * Environment Configuration
 * Store sensitive data here (never commit .env file to git)
 */

interface Config {
  rorkAIApiKey: string | null;
  apiBaseUrl: string;
  environment: 'development' | 'staging' | 'production';
  enableLogging: boolean;
  imageTimeoutMs: number;
  maxRetries: number;
  backendProvider: 'supabase' | 'firebase' | 'local';
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  firebaseProjectId: string | null;
  firebaseApiKey: string | null;
  paymentProvider: 'stripe' | 'razorpay';
  stripePublishableKey: string | null;
  razorpayKeyId: string | null;
}

const config: Config = {
  rorkAIApiKey: process.env.EXPO_PUBLIC_RORK_AI_KEY || null,
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.eventai.com',
  environment: (process.env.NODE_ENV as any) || 'development',
  enableLogging: process.env.NODE_ENV !== 'production',
  imageTimeoutMs: 8000,
  maxRetries: 3,
  backendProvider: (process.env.EXPO_PUBLIC_BACKEND_PROVIDER as Config['backendProvider']) || 'local',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || null,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || null,
  firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || null,
  firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || null,
  paymentProvider: (process.env.EXPO_PUBLIC_PAYMENT_PROVIDER as Config['paymentProvider']) || 'stripe',
  stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || null,
  razorpayKeyId: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || null,
};

export default config;

export const getConfig = (): Config => {
  return config;
};

export const isDevelopment = (): boolean => {
  return config.environment === 'development';
};

export const isProduction = (): boolean => {
  return config.environment === 'production';
};

export const logIfDev = (message: string, ...args: any[]): void => {
  if (config.enableLogging) {
    console.log(`[EventAI] ${message}`, ...args);
  }
};

export const errorLog = (error: Error, context: string): void => {
  console.error(`[EventAI Error] ${context}:`, error.message);
  if (isDevelopment()) {
    console.error(error);
  }
};
