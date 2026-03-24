import AsyncStorage from '@react-native-async-storage/async-storage';
import config, { logIfDev } from '@/config';

const SESSION_KEY = 'supabase_session';

interface SupabaseAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
}

const isSupabaseAuthEnabled = () =>
  config.backendProvider === 'supabase' &&
  !!config.supabaseUrl &&
  !!config.supabaseAnonKey;

const authRequest = async (path: string, body: Record<string, unknown>) => {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error('Supabase auth config missing');
  }

  const response = await fetch(`${config.supabaseUrl}/auth/v1/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.supabaseAnonKey,
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = (payload?.error_description || payload?.msg || payload?.error || 'Auth failed') as string;
    throw new Error(message);
  }
  return payload as SupabaseAuthResponse;
};

export const authService = {
  isSupabaseAuthEnabled,

  async signUp(email: string, password: string, metadata?: Record<string, unknown>) {
    if (!isSupabaseAuthEnabled()) {
      throw new Error('Supabase auth is not configured');
    }
    const result = await authRequest('signup', {
      email,
      password,
      data: metadata || {},
    });
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(result));
    return result;
  },

  async signIn(email: string, password: string) {
    if (!isSupabaseAuthEnabled()) {
      throw new Error('Supabase auth is not configured');
    }
    const result = await authRequest('token?grant_type=password', {
      email,
      password,
    });
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(result));
    return result;
  },

  async signOut() {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
    } catch (error) {
      logIfDev('Error clearing auth session:', error);
    }
  },

  async getSession(): Promise<SupabaseAuthResponse | null> {
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as SupabaseAuthResponse) : null;
    } catch (error) {
      logIfDev('Error reading auth session:', error);
      return null;
    }
  },

  async getAccessToken(): Promise<string | null> {
    const session = await this.getSession();
    return session?.access_token || null;
  },
};
