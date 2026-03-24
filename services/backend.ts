import config, { logIfDev } from '@/config';
import { BookingRequest, Review, User, UserEvent, VendorBooking } from '@/types';
import { authService } from '@/services/auth';

interface EventStatePayload {
  reviews: Review[];
  userEvents: UserEvent[];
  vendorBookings: VendorBooking[];
}

interface AdminStatePayload {
  bookingRequests: BookingRequest[];
  vendorBookings: VendorBooking[];
}

const isSupabaseConfigured = () =>
  config.backendProvider === 'supabase' &&
  !!config.supabaseUrl &&
  !!config.supabaseAnonKey;

const requestSupabase = async (
  path: string,
  init?: RequestInit,
  extraHeaders?: Record<string, string>
) => {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error('Supabase config is missing');
  }

  const accessToken = await authService.getAccessToken();

  const response = await fetch(`${config.supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${accessToken || config.supabaseAnonKey}`,
      ...extraHeaders,
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase error (${response.status}): ${text}`);
  }

  if (response.status === 204) return null;
  return response.json();
};

const upsertSupabaseTable = async <T extends { id: string }>(
  table: string,
  rows: T[]
) => {
  if (!rows.length) return;
  await requestSupabase(table, {
    method: 'POST',
    body: JSON.stringify(rows),
  }, {
    Prefer: 'resolution=merge-duplicates',
  });
};

const requestApi = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  if (!response.ok) {
    throw new Error(`API error (${response.status})`);
  }
  return response.json();
};

const backendMode = () => {
  if (isSupabaseConfigured()) return 'supabase';
  if (config.backendProvider === 'firebase' && config.apiBaseUrl) return 'firebase';
  return 'local';
};

export const backendService = {
  mode: backendMode,

  async syncUser(user: User): Promise<void> {
    if (backendMode() === 'local') return;
    try {
      if (isSupabaseConfigured()) {
        await upsertSupabaseTable('users', [user]);
        return;
      }

      await requestApi('/users/upsert', {
        method: 'POST',
        body: JSON.stringify({ user, provider: backendMode() }),
      });
    } catch (error) {
      logIfDev('syncUser fallback to local due to error:', error);
    }
  },

  async loadEventState(): Promise<EventStatePayload | null> {
    if (backendMode() === 'local') return null;
    try {
      if (isSupabaseConfigured()) {
        const [reviews, userEvents, vendorBookings] = await Promise.all([
          requestSupabase('reviews?select=*'),
          requestSupabase('user_events?select=*'),
          requestSupabase('vendor_bookings?select=*'),
        ]);
        return {
          reviews: (reviews || []) as Review[],
          userEvents: (userEvents || []) as UserEvent[],
          vendorBookings: (vendorBookings || []) as VendorBooking[],
        };
      }

      return requestApi<EventStatePayload>('/event-state');
    } catch (error) {
      logIfDev('loadEventState fallback to local due to error:', error);
      return null;
    }
  },

  async saveEventState(payload: EventStatePayload): Promise<void> {
    if (backendMode() === 'local') return;
    try {
      if (isSupabaseConfigured()) {
        await Promise.all([
          upsertSupabaseTable('reviews', payload.reviews),
          upsertSupabaseTable('user_events', payload.userEvents),
          upsertSupabaseTable('vendor_bookings', payload.vendorBookings),
        ]);
        return;
      }

      await requestApi('/event-state', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    } catch (error) {
      logIfDev('saveEventState fallback to local due to error:', error);
    }
  },

  async loadAdminState(): Promise<AdminStatePayload | null> {
    if (backendMode() === 'local') return null;
    try {
      if (isSupabaseConfigured()) {
        const [bookingRequests, vendorBookings] = await Promise.all([
          requestSupabase('booking_requests?select=*'),
          requestSupabase('vendor_bookings?select=*'),
        ]);
        return {
          bookingRequests: (bookingRequests || []) as BookingRequest[],
          vendorBookings: (vendorBookings || []) as VendorBooking[],
        };
      }
      return requestApi<AdminStatePayload>('/admin/state');
    } catch (error) {
      logIfDev('loadAdminState fallback to local due to error:', error);
      return null;
    }
  },

  async saveAdminState(payload: AdminStatePayload): Promise<void> {
    if (backendMode() === 'local') return;
    try {
      if (isSupabaseConfigured()) {
        await Promise.all([
          upsertSupabaseTable('booking_requests', payload.bookingRequests),
          upsertSupabaseTable('vendor_bookings', payload.vendorBookings),
        ]);
        return;
      }
      await requestApi('/admin/state', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    } catch (error) {
      logIfDev('saveAdminState fallback to local due to error:', error);
    }
  },
};
