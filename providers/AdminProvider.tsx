import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Admin, BookingRequest, AIRoomTransformation, AnalyticsSummary, VendorBooking } from '@/types';
import { backendService } from '@/services/backend';
import { notificationService } from '@/services/notifications';
import { paymentService } from '@/services/payments';

const defaultAnalytics: AnalyticsSummary = {
  totalRevenue: 0,
  totalBookings: 0,
  averageBookingValue: 0,
  bookingStatusBreakdown: {
    pending: 0,
    approved: 0,
    rejected: 0,
  },
  monthlyRevenue: [],
  categoryPopularity: [],
  vendorEarnings: [],
  bookingHeatmap: [],
  trendingStyles: [],
};

export const [AdminProvider, useAdmin] = createContextHook(() => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [vendorBookings, setVendorBookings] = useState<VendorBooking[]>([]);
  const [aiGenerations, setAiGenerations] = useState<AIRoomTransformation[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);

  const persistAdminState = async (
    nextBookings: BookingRequest[],
    nextVendorBookings: VendorBooking[]
  ) => {
    try {
      await Promise.all([
        AsyncStorage.setItem('admin_bookings', JSON.stringify(nextBookings)),
        AsyncStorage.setItem('admin_vendor_bookings', JSON.stringify(nextVendorBookings)),
      ]);
    } catch (error) {
      console.log('Error saving admin data:', error);
    }
    backendService.saveAdminState({
      bookingRequests: nextBookings,
      vendorBookings: nextVendorBookings,
    });
  };

  const refreshPaymentWebhookStatuses = useCallback(async () => {
    const pendingWebhookBookings = bookingRequests.filter(
      b => b.paymentReferenceId && b.paymentWebhookStatus === 'pending'
    );
    if (!pendingWebhookBookings.length) return;

    const resolved = await Promise.all(
      pendingWebhookBookings.map(async booking => {
        const status = await paymentService.getWebhookStatus(booking.paymentReferenceId as string);
        return { bookingId: booking.id, status };
      })
    );

    setBookingRequests(prev => {
      const next = prev.map(booking => {
        const match = resolved.find(r => r.bookingId === booking.id);
        if (!match) return booking;
        return { ...booking, paymentWebhookStatus: match.status };
      });
      persistAdminState(next, vendorBookings);
      return next;
    });
  }, [bookingRequests, vendorBookings]);

  useEffect(() => {
    loadAdmin();
    loadAdminData();
  }, []);

  useEffect(() => {
    if (!bookingRequests.length) return;
    refreshPaymentWebhookStatuses();
  }, [bookingRequests.length, refreshPaymentWebhookStatuses]);

  const loadAdmin = async () => {
    try {
      const stored = await AsyncStorage.getItem('admin');
      if (stored) {
        setAdmin(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading admin:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      const remote = await backendService.loadAdminState();
      if (remote) {
        setBookingRequests(remote.bookingRequests || []);
        setVendorBookings(remote.vendorBookings || []);
      } else {
        const bookingsData = await AsyncStorage.getItem('admin_bookings');
        if (bookingsData) setBookingRequests(JSON.parse(bookingsData));

        const vendorBookingsData = await AsyncStorage.getItem('admin_vendor_bookings');
        if (vendorBookingsData) setVendorBookings(JSON.parse(vendorBookingsData));
      }

      const aiData = await AsyncStorage.getItem('admin_ai_generations');
      if (aiData) setAiGenerations(JSON.parse(aiData));

      const usersData = await AsyncStorage.getItem('admin_users_count');
      if (usersData) setTotalUsers(parseInt(usersData));

      const eventsData = await AsyncStorage.getItem('admin_events_count');
      if (eventsData) setTotalEvents(parseInt(eventsData));
    } catch (error) {
      console.log('Error loading admin data:', error);
    }
  };

  const loginAdmin = async (email: string, password: string) => {
    try {
      if (email === 'admin@eventai.com' && password === 'admin123') {
        const adminData: Admin = {
          id: 'admin_1',
          name: 'Admin User',
          email,
          role: 'super_admin',
          createdAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem('admin', JSON.stringify(adminData));
        setAdmin(adminData);
        return { success: true };
      }
      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      console.log('Error logging in admin:', error);
      return { success: false, error: 'Login failed' };
    }
  };

  const signupAdmin = async (name: string, email: string, _password: string, role: Admin['role']) => {
    try {
      const adminData: Admin = {
        id: `admin_${Date.now()}`,
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem('admin', JSON.stringify(adminData));
      setAdmin(adminData);
      return { success: true };
    } catch (error) {
      console.log('Error signing up admin:', error);
      return { success: false, error: 'Signup failed' };
    }
  };

  const logoutAdmin = async () => {
    try {
      await AsyncStorage.removeItem('admin');
      setAdmin(null);
    } catch (error) {
      console.log('Error logging out admin:', error);
    }
  };

  const approveBooking = async (bookingId: string) => {
    setBookingRequests(prev => {
      const next = prev.map(b => (b.id === bookingId ? { ...b, status: 'approved' as const } : b));
      persistAdminState(next, vendorBookings);
      const approved = next.find(b => b.id === bookingId);
      if (approved) {
        notificationService.sendBookingStatusNotification(approved.contactName, 'approved');
      }
      return next;
    });
  };

  const rejectBooking = async (bookingId: string) => {
    setBookingRequests(prev => {
      const next = prev.map(b => (b.id === bookingId ? { ...b, status: 'rejected' as const } : b));
      persistAdminState(next, vendorBookings);
      const rejected = next.find(b => b.id === bookingId);
      if (rejected) {
        notificationService.sendBookingStatusNotification(rejected.contactName, 'rejected');
      }
      return next;
    });
  };

  const createBookingRequest = async (booking: BookingRequest) => {
    setBookingRequests(prev => {
      const next = [booking, ...prev];
      persistAdminState(next, vendorBookings);
      return next;
    });
  };

  const createVendorBooking = async (booking: VendorBooking) => {
    setVendorBookings(prev => {
      const next = [booking, ...prev];
      persistAdminState(bookingRequests, next);
      return next;
    });
  };

  const updateVendorBooking = async (id: string, status: VendorBooking['status']) => {
    setVendorBookings(prev => {
      const next = prev.map(v => (v.id === id ? { ...v, status } : v));
      persistAdminState(bookingRequests, next);
      return next;
    });
  };

  const getAnalyticsSummary = (): AnalyticsSummary => {
    const approvedBookings = bookingRequests.filter(b => b.status === 'approved');

    // Revenue & Basic Stats
    const totalRevenue = approvedBookings.reduce((sum, booking) => sum + (booking.event?.price || 0), 0);
    const totalBookings = bookingRequests.length;
    const averageBookingValue = totalBookings > 0 ? Math.round(totalRevenue / Math.max(approvedBookings.length, 1)) : 0;

    const breakdown = bookingRequests.reduce(
      (acc, booking) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 }
    );

    // Monthly Revenue
    const monthlyMap = new Map<string, number>();
    approvedBookings.forEach(booking => {
      const date = new Date(booking.createdAt);
      if (!isNaN(date.getTime())) {
        const month = date.toLocaleString('en-US', { month: 'short' });
        monthlyMap.set(month, (monthlyMap.get(month) || 0) + (booking.event?.price || 0));
      }
    });

    // Category Popularity
    const categoryMap = new Map<string, number>();
    bookingRequests.forEach(booking => {
      if (booking.event?.category) {
        categoryMap.set(booking.event.category, (categoryMap.get(booking.event.category) || 0) + 1);
      }
    });
    const categoryPopularity = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Vendor Earnings
    const vendorMap = new Map<string, { name: string; earnings: number }>();
    vendorBookings
      .filter(v => v.status === 'approved')
      .forEach(vendorBooking => {
        const current = vendorMap.get(vendorBooking.vendorId) || { name: vendorBooking.vendor.name, earnings: 0 };
        current.earnings += vendorBooking.budget || 0;
        vendorMap.set(vendorBooking.vendorId, current);
      });
    const vendorEarnings = Array.from(vendorMap.entries())
      .map(([vendorId, data]) => ({ vendorId, vendorName: data.name, earnings: data.earnings }))
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 5);

    // Booking Heatmap
    const heatmapMap = new Map<string, number>();
    bookingRequests.forEach(booking => {
      const date = booking.date;
      if (date) {
        heatmapMap.set(date, (heatmapMap.get(date) || 0) + 1);
      }
    });
    const bookingHeatmap = Array.from(heatmapMap.entries())
      .map(([date, count]) => ({ date, count }));

    // Trending Styles (Mock/Derived)
    const trendingStyles = [
      { name: 'Boho Chic', type: 'decor' as const, count: 120 },
      { name: 'Emerald Green', type: 'color' as const, count: 85 },
      { name: 'Neon Cyber', type: 'decor' as const, count: 64 },
      { name: 'Rose Gold', type: 'color' as const, count: 50 },
      { name: 'Vintage Glam', type: 'decor' as const, count: 42 },
    ];

    return {
      totalRevenue,
      totalBookings,
      averageBookingValue,
      bookingStatusBreakdown: breakdown,
      monthlyRevenue: Array.from(monthlyMap.entries()).map(([month, value]) => ({ month, value })),
      categoryPopularity,
      vendorEarnings,
      bookingHeatmap,
      trendingStyles,
    };
  };

  const getStats = () => ({
    totalEvents: totalEvents || 10,
    totalBookings: bookingRequests.length || 0,
    totalUsers: totalUsers || 150,
    totalAiGenerations: aiGenerations.length || 0,
    pendingBookings: bookingRequests.filter(b => b.status === 'pending').length || 0,
    pendingVendorBookings: vendorBookings.filter(v => v.status === 'pending').length || 0,
  });

  return {
    admin,
    isLoading,
    bookingRequests,
    vendorBookings,
    aiGenerations,
    loginAdmin,
    signupAdmin,
    logoutAdmin,
    approveBooking,
    rejectBooking,
    createBookingRequest,
    createVendorBooking,
    updateVendorBooking,
    refreshPaymentWebhookStatuses,
    getStats,
    getAnalyticsSummary,
    defaultAnalytics,
  };
});
