import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter, useRootNavigationState } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Calendar,
  Users,
  Sparkles,
  ClipboardList,
  Circle,
  CheckCircle,
  CheckSquare,
  XCircle,
  Clock,
  TrendingUp,
  Settings,
  LogOut,
  Shield,
  BarChart3,
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
} from 'lucide-react-native';
import { useAdmin } from '@/providers/AdminProvider';
import { useEvents } from '@/providers/EventProvider';
import { BookingRequest, Event, EventCategory, UserEvent, Vendor, VendorBooking } from '@/types';
import ScreenFrame from '@/components/ScreenFrame';
import { theme } from '@/constants/theme';

type EventFormState = {
  title: string;
  category: EventCategory;
  description: string;
  image: string;
  price: string;
  duration: string;
  rating: string;
  reviewCount: string;
  features: string;
};

type VendorFormState = {
  name: string;
  category: Vendor['category'];
  description: string;
  image: string;
  priceRange: string;
  rating: string;
  reviewCount: string;
  services: string;
  portfolio: string;
  contactPhone: string;
  contactEmail: string;
  contactWhatsapp: string;
};

const EVENT_CATEGORY_OPTIONS: { value: EventCategory; label: string }[] = [
  { value: 'birthday', label: 'Birthday' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'reception', label: 'Reception' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'babyshower', label: 'Baby Shower' },
  { value: 'housewarming', label: 'Housewarming' },
  { value: 'graduation', label: 'Graduation' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'festival', label: 'Festival' },
];

const VENDOR_CATEGORY_OPTIONS: { value: Vendor['category']; label: string }[] = [
  { value: 'caterer', label: 'Caterer' },
  { value: 'decorator', label: 'Decorator' },
  { value: 'photographer', label: 'Photographer' },
  { value: 'music', label: 'Music' },
  { value: 'other', label: 'Other' },
];

const EVENT_FORM_INITIAL: EventFormState = {
  title: '',
  category: 'birthday',
  description: '',
  image: '',
  price: '',
  duration: '',
  rating: '4.5',
  reviewCount: '0',
  features: '',
};

const VENDOR_FORM_INITIAL: VendorFormState = {
  name: '',
  category: 'caterer',
  description: '',
  image: '',
  priceRange: '',
  rating: '4.5',
  reviewCount: '0',
  services: '',
  portfolio: '',
  contactPhone: '',
  contactEmail: '',
  contactWhatsapp: '',
};

const getCategoryLabel = (category: EventCategory) =>
  EVENT_CATEGORY_OPTIONS.find(option => option.value === category)?.label || category;

const getVendorCategoryLabel = (category: Vendor['category']) =>
  VENDOR_CATEGORY_OPTIONS.find(option => option.value === category)?.label || category;

export default function AdminDashboardScreen() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const {
    admin,
    isLoading,
    logoutAdmin,
    bookingRequests,
    vendorBookings,
    approveBooking,
    rejectBooking,
    updateVendorBooking,
    getStats,
    getAnalyticsSummary,
    defaultAnalytics,
  } = useAdmin();
  const {
    events,
    userEvents,
    vendors,
    updateUserEvent,
    bulkUpdateUserEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    addVendor,
    updateVendor,
    deleteVendor,
  } = useEvents();
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'vendors' | 'events' | 'analytics'>('overview');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState<'all' | UserEvent['status']>('all');
  const [isBulkSelectingEvents, setIsBulkSelectingEvents] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [isEventModalVisible, setIsEventModalVisible] = useState(false);
  const [editingCatalogEvent, setEditingCatalogEvent] = useState<Event | null>(null);
  const [eventForm, setEventForm] = useState<EventFormState>(EVENT_FORM_INITIAL);
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const [isVendorModalVisible, setIsVendorModalVisible] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorForm, setVendorForm] = useState<VendorFormState>(VENDOR_FORM_INITIAL);

  useEffect(() => {
    if (activeTab !== 'events') {
      setIsBulkSelectingEvents(false);
      setSelectedEventIds([]);
    }
  }, [activeTab]);

  const stats = getStats();
  const analytics = getAnalyticsSummary?.() || defaultAnalytics;
  const eventSummary = useMemo(() => ({
    all: userEvents.length,
    registered: userEvents.filter(event => event.status === 'registered').length,
    booked: userEvents.filter(event => event.status === 'booked').length,
    completed: userEvents.filter(event => event.status === 'completed').length,
    cancelled: userEvents.filter(event => event.status === 'cancelled').length,
  }), [userEvents]);

  const eventFilters: {
    id: 'all' | UserEvent['status'];
    label: string;
    count: number;
  }[] = [
      { id: 'all', label: 'All', count: eventSummary.all },
      { id: 'registered', label: 'Registered', count: eventSummary.registered },
      { id: 'booked', label: 'Booked', count: eventSummary.booked },
      { id: 'completed', label: 'Completed', count: eventSummary.completed },
      { id: 'cancelled', label: 'Cancelled', count: eventSummary.cancelled },
    ];

  const filteredEvents = useMemo(() => {
    const query = eventSearchQuery.trim().toLowerCase();
    return userEvents
      .filter(event => eventStatusFilter === 'all' || event.status === eventStatusFilter)
      .filter(event => {
        if (!query) return true;
        return (
          event.event.title.toLowerCase().includes(query) ||
          event.date.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [eventSearchQuery, eventStatusFilter, userEvents]);
  const filteredVendors = useMemo(() => {
    const query = vendorSearchQuery.trim().toLowerCase();
    if (!query) return vendors;
    return vendors.filter(vendor =>
      vendor.name.toLowerCase().includes(query) ||
      vendor.category.toLowerCase().includes(query) ||
      vendor.description.toLowerCase().includes(query)
    );
  }, [vendorSearchQuery, vendors]);
  const allVisibleEventsSelected =
    filteredEvents.length > 0 &&
    filteredEvents.every(event => selectedEventIds.includes(event.id));
  const selectedActiveEventCount = userEvents.filter(event =>
    selectedEventIds.includes(event.id) &&
    (event.status === 'registered' || event.status === 'booked')
  ).length;
  const activeCatalogBookingIds = useMemo(
    () =>
      new Set(
        userEvents
          .filter(event => event.status === 'registered' || event.status === 'booked')
          .map(event => event.eventId)
      ),
    [userEvents]
  );
  const activeVendorBookingIds = useMemo(
    () =>
      new Set(
        vendorBookings
          .filter(booking => booking.status === 'pending' || booking.status === 'approved')
          .map(booking => booking.vendorId)
      ),
    [vendorBookings]
  );

  const sortedVendorBookings = useMemo(() => {
    const statusOrder: Record<VendorBooking['status'], number> = {
      pending: 0,
      approved: 1,
      rejected: 2,
    };
    return [...vendorBookings].sort((a, b) => {
      const byStatus = statusOrder[a.status] - statusOrder[b.status];
      if (byStatus !== 0) return byStatus;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [vendorBookings]);

  if (!rootNavigationState?.key || isLoading) {
    return null;
  }

  if (!admin) {
    return <Redirect href="/admin-login" />;
  }

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logoutAdmin();
            router.replace('/auth');
          }
        }
      ]
    );
  };

  const handleApproveBooking = async (bookingId: string) => {
    await approveBooking(bookingId);
    Alert.alert('Success', 'Booking approved successfully');
  };

  const handleRejectBooking = async (bookingId: string) => {
    Alert.alert(
      'Reject Booking',
      'Are you sure you want to reject this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            await rejectBooking(bookingId);
            Alert.alert('Success', 'Booking rejected');
          }
        }
      ]
    );
  };

  const handleUpdateManagedEvent = (event: UserEvent, nextStatus: UserEvent['status']) => {
    const actionLabel =
      nextStatus === 'completed'
        ? 'mark as completed'
        : nextStatus === 'cancelled'
          ? 'cancel'
          : 'reopen';

    Alert.alert(
      'Update Event Status',
      `Do you want to ${actionLabel} "${event.event.title}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => {
            updateUserEvent(event.id, { status: nextStatus });
            Alert.alert('Status Updated', `Event marked as ${nextStatus}.`);
          },
        },
      ]
    );
  };

  const toggleBulkSelectionMode = () => {
    setIsBulkSelectingEvents(prev => {
      const next = !prev;
      if (!next) {
        setSelectedEventIds([]);
      }
      return next;
    });
  };

  const toggleEventSelection = (eventId: string) => {
    setSelectedEventIds(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const toggleSelectAllVisibleEvents = () => {
    const visibleIds = filteredEvents.map(event => event.id);
    setSelectedEventIds(prev => {
      if (visibleIds.length > 0 && visibleIds.every(id => prev.includes(id))) {
        return prev.filter(id => !visibleIds.includes(id));
      }
      return Array.from(new Set([...prev, ...visibleIds]));
    });
  };

  const handleBulkUpdateEvents = (nextStatus: 'completed' | 'cancelled') => {
    if (!selectedEventIds.length) {
      Alert.alert('No Events Selected', 'Select at least one event to run a bulk action.');
      return;
    }

    const eligibleIds = userEvents
      .filter(event =>
        selectedEventIds.includes(event.id) &&
        (event.status === 'registered' || event.status === 'booked')
      )
      .map(event => event.id);

    if (!eligibleIds.length) {
      Alert.alert(
        'No Eligible Events',
        'Bulk complete/cancel only works for registered or booked events.'
      );
      return;
    }

    const skippedCount = selectedEventIds.length - eligibleIds.length;
    const actionLabel = nextStatus === 'completed' ? 'complete' : 'cancel';

    Alert.alert(
      'Run Bulk Action',
      `Do you want to ${actionLabel} ${eligibleIds.length} selected event(s)?${skippedCount > 0
        ? `\n${skippedCount} selected event(s) are already completed/cancelled and will be skipped.`
        : ''
      }`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => {
            bulkUpdateUserEvents(eligibleIds, { status: nextStatus });
            setIsBulkSelectingEvents(false);
            setSelectedEventIds([]);
            Alert.alert('Bulk Update Complete', `${eligibleIds.length} event(s) updated.`);
          },
        },
      ]
    );
  };

  const updateEventFormField = <K extends keyof EventFormState>(key: K, value: EventFormState[K]) => {
    setEventForm(prev => ({ ...prev, [key]: value }));
  };

  const openCreateEventModal = () => {
    setEditingCatalogEvent(null);
    setEventForm(EVENT_FORM_INITIAL);
    setIsEventModalVisible(true);
  };

  const openEditEventModal = (event: Event) => {
    setEditingCatalogEvent(event);
    setEventForm({
      title: event.title,
      category: event.category,
      description: event.description,
      image: event.image,
      price: String(event.price),
      duration: event.duration,
      rating: String(event.rating),
      reviewCount: String(event.reviewCount),
      features: event.features.join(', '),
    });
    setIsEventModalVisible(true);
  };

  const closeEventModal = () => {
    setIsEventModalVisible(false);
    setEditingCatalogEvent(null);
    setEventForm(EVENT_FORM_INITIAL);
  };

  const saveCatalogEvent = () => {
    const title = eventForm.title.trim();
    const description = eventForm.description.trim();
    const image = eventForm.image.trim();
    const duration = eventForm.duration.trim();
    const features = eventForm.features
      .split(/,|\n/)
      .map(feature => feature.trim())
      .filter(Boolean);

    const price = Number.parseInt(eventForm.price, 10);
    const rating = Number.parseFloat(eventForm.rating);
    const reviewCount = Number.parseInt(eventForm.reviewCount, 10);

    if (!title || !description || !image || !duration) {
      Alert.alert('Validation Error', 'Title, description, image URL, and duration are required.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      Alert.alert('Validation Error', 'Price must be a positive number.');
      return;
    }
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      Alert.alert('Validation Error', 'Rating must be between 0 and 5.');
      return;
    }
    if (!Number.isFinite(reviewCount) || reviewCount < 0) {
      Alert.alert('Validation Error', 'Review count must be 0 or more.');
      return;
    }
    if (!features.length) {
      Alert.alert('Validation Error', 'Add at least one feature.');
      return;
    }

    if (editingCatalogEvent) {
      updateEvent(editingCatalogEvent.id, {
        title,
        category: eventForm.category,
        description,
        image,
        price,
        duration,
        rating,
        reviewCount,
        features,
      });
      Alert.alert('Updated', `"${title}" has been updated.`);
    } else {
      addEvent({
        id: `event_${Date.now()}`,
        title,
        category: eventForm.category,
        description,
        image,
        price,
        duration,
        rating,
        reviewCount,
        features,
      });
      Alert.alert('Created', `"${title}" has been added to the catalog.`);
    }

    closeEventModal();
  };

  const updateVendorFormField = <K extends keyof VendorFormState>(key: K, value: VendorFormState[K]) => {
    setVendorForm(prev => ({ ...prev, [key]: value }));
  };

  const openCreateVendorModal = () => {
    setEditingVendor(null);
    setVendorForm(VENDOR_FORM_INITIAL);
    setIsVendorModalVisible(true);
  };

  const openEditVendorModal = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setVendorForm({
      name: vendor.name,
      category: vendor.category,
      description: vendor.description,
      image: vendor.image,
      priceRange: vendor.priceRange,
      rating: String(vendor.rating),
      reviewCount: String(vendor.reviewCount),
      services: vendor.services.join(', '),
      portfolio: vendor.portfolio.join(', '),
      contactPhone: vendor.contactPhone || '',
      contactEmail: vendor.contactEmail || '',
      contactWhatsapp: vendor.contactWhatsapp || '',
    });
    setIsVendorModalVisible(true);
  };

  const closeVendorModal = () => {
    setIsVendorModalVisible(false);
    setEditingVendor(null);
    setVendorForm(VENDOR_FORM_INITIAL);
  };

  const saveVendor = () => {
    const name = vendorForm.name.trim();
    const description = vendorForm.description.trim();
    const image = vendorForm.image.trim();
    const priceRange = vendorForm.priceRange.trim();
    const services = vendorForm.services
      .split(/,|\n/)
      .map(service => service.trim())
      .filter(Boolean);
    const portfolio = vendorForm.portfolio
      .split(/,|\n/)
      .map(imageUrl => imageUrl.trim())
      .filter(Boolean);

    const rating = Number.parseFloat(vendorForm.rating);
    const reviewCount = Number.parseInt(vendorForm.reviewCount, 10);

    if (!name || !description || !image || !priceRange) {
      Alert.alert('Validation Error', 'Name, description, image URL, and price range are required.');
      return;
    }
    if (!services.length) {
      Alert.alert('Validation Error', 'Add at least one service.');
      return;
    }
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      Alert.alert('Validation Error', 'Rating must be between 0 and 5.');
      return;
    }
    if (!Number.isFinite(reviewCount) || reviewCount < 0) {
      Alert.alert('Validation Error', 'Review count must be 0 or more.');
      return;
    }

    const payload: Vendor = {
      id: editingVendor ? editingVendor.id : `vendor_${Date.now()}`,
      name,
      category: vendorForm.category,
      description,
      image,
      priceRange,
      rating,
      reviewCount,
      services,
      portfolio,
      contactPhone: vendorForm.contactPhone.trim() || undefined,
      contactEmail: vendorForm.contactEmail.trim() || undefined,
      contactWhatsapp: vendorForm.contactWhatsapp.trim() || undefined,
    };

    if (editingVendor) {
      updateVendor(editingVendor.id, payload);
      Alert.alert('Updated', `"${name}" has been updated.`);
    } else {
      addVendor(payload);
      Alert.alert('Created', `"${name}" has been added to the marketplace.`);
    }

    closeVendorModal();
  };

  const handleDeleteCatalogEvent = (event: Event) => {
    if (activeCatalogBookingIds.has(event.id)) {
      Alert.alert(
        'Delete Blocked',
        'This event has active bookings. Complete or cancel those bookings before deleting the catalog item.'
      );
      return;
    }

    Alert.alert(
      'Delete Event',
      `Delete "${event.title}" from catalog?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteEvent(event.id);
            Alert.alert('Deleted', `"${event.title}" was removed.`);
          },
        },
      ]
    );
  };

  const handleDeleteVendor = (vendor: Vendor) => {
    if (activeVendorBookingIds.has(vendor.id)) {
      Alert.alert(
        'Delete Blocked',
        'This vendor has active booking requests. Resolve them before deleting the vendor.'
      );
      return;
    }

    Alert.alert(
      'Delete Vendor',
      `Delete "${vendor.name}" from the marketplace?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteVendor(vendor.id);
            Alert.alert('Deleted', `"${vendor.name}" was removed.`);
          },
        },
      ]
    );
  };

  const handleVendorBookingStatus = (booking: VendorBooking, status: VendorBooking['status']) => {
    const actionLabel =
      status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : 'mark as pending';

    Alert.alert(
      'Update Vendor Request',
      `Do you want to ${actionLabel} this vendor request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            await updateVendorBooking(booking.id, status);
            Alert.alert('Updated', `Vendor request marked as ${status}.`);
          },
        },
      ]
    );
  };

  return (
    <ScreenFrame>
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push('/home')}
            >
              <ChevronLeft size={22} color="#E2E8F0" />
            </TouchableOpacity>
            <View>
              <View style={styles.headerTop}>
                <Shield size={24} color="#3B82F6" />
                <Text style={styles.headerTitle}>Admin Panel</Text>
              </View>
              <Text style={styles.headerSubtitle}>
                {admin.name} • {admin.role.replace('_', ' ')}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <LogOut size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          style={styles.tabs}
          contentContainerStyle={styles.tabsContent}
          showsHorizontalScrollIndicator={false}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
            onPress={() => setActiveTab('overview')}
          >
            <TrendingUp size={18} color={activeTab === 'overview' ? '#3B82F6' : '#94A3B8'} />
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'bookings' && styles.tabActive]}
            onPress={() => setActiveTab('bookings')}
          >
            <ClipboardList size={18} color={activeTab === 'bookings' ? '#3B82F6' : '#94A3B8'} />
            <Text style={[styles.tabText, activeTab === 'bookings' && styles.tabTextActive]}>
              Bookings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'vendors' && styles.tabActive]}
            onPress={() => setActiveTab('vendors')}
          >
            <Users size={18} color={activeTab === 'vendors' ? '#3B82F6' : '#94A3B8'} />
            <Text style={[styles.tabText, activeTab === 'vendors' && styles.tabTextActive]}>
              Vendors
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'events' && styles.tabActive]}
            onPress={() => setActiveTab('events')}
          >
            <Calendar size={18} color={activeTab === 'events' ? '#3B82F6' : '#94A3B8'} />
            <Text style={[styles.tabText, activeTab === 'events' && styles.tabTextActive]}>
              Events
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'analytics' && styles.tabActive]}
            onPress={() => setActiveTab('analytics')}
          >
            <BarChart3 size={18} color={activeTab === 'analytics' ? '#3B82F6' : '#94A3B8'} />
            <Text style={[styles.tabText, activeTab === 'analytics' && styles.tabTextActive]}>
              Analytics
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {activeTab === 'overview' && (
            <>
              <View style={styles.statsGrid}>
                <StatCard
                  icon={<Calendar size={24} color="#3B82F6" />}
                  title="Total Events"
                  value={stats.totalEvents.toString()}
                  color="#3B82F6"
                />
                <StatCard
                  icon={<ClipboardList size={24} color="#10B981" />}
                  title="Bookings"
                  value={stats.totalBookings.toString()}
                  color="#10B981"
                />
                <StatCard
                  icon={<Users size={24} color="#F59E0B" />}
                  title="Users"
                  value={stats.totalUsers.toString()}
                  color="#F59E0B"
                />
                <StatCard
                  icon={<Sparkles size={24} color="#8B5CF6" />}
                  title="AI Generations"
                  value={stats.totalAiGenerations.toString()}
                  color="#8B5CF6"
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pending Bookings</Text>
                {bookingRequests.filter(b => b.status === 'pending').length === 0 ? (
                  <View style={styles.emptyState}>
                    <Clock size={48} color="#64748B" />
                    <Text style={styles.emptyText}>No pending bookings</Text>
                  </View>
                ) : (
                  bookingRequests.filter(b => b.status === 'pending').slice(0, 3).map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onApprove={handleApproveBooking}
                      onReject={handleRejectBooking}
                    />
                  ))
                )}
              </View>

              <View style={styles.quickActions}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsGrid}>
                  <ActionButton
                    icon={<Settings size={24} color="#3B82F6" />}
                    title="Settings"
                    onPress={() => router.push('/admin-settings')}
                  />
                  <ActionButton
                    icon={<ClipboardList size={24} color="#10B981" />}
                    title="Bookings"
                    onPress={() => setActiveTab('bookings')}
                  />
                  <ActionButton
                    icon={<Users size={24} color="#F59E0B" />}
                    title="Vendor Requests"
                    onPress={() => setActiveTab('vendors')}
                  />
                  <ActionButton
                    icon={<Calendar size={24} color="#8B5CF6" />}
                    title="Manage Events"
                    onPress={() => setActiveTab('events')}
                  />
                  <ActionButton
                    icon={<Sparkles size={24} color="#F59E0B" />}
                    title="AI Transform"
                    onPress={() => router.push('/ai-transform')}
                  />
                </View>
              </View>
            </>
          )}

          {activeTab === 'bookings' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Booking Requests</Text>
              {bookingRequests.length === 0 ? (
                <View style={styles.emptyState}>
                  <ClipboardList size={48} color="#64748B" />
                  <Text style={styles.emptyText}>No bookings yet</Text>
                </View>
              ) : (
                bookingRequests.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onApprove={handleApproveBooking}
                    onReject={handleRejectBooking}
                  />
                ))
              )}
            </View>
          )}

          {activeTab === 'events' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Event Management</Text>

              <View style={styles.catalogHeader}>
                <Text style={styles.subSectionTitle}>Catalog Events</Text>
                <TouchableOpacity style={styles.addCatalogButton} onPress={openCreateEventModal}>
                  <Plus size={16} color="#FFF" />
                  <Text style={styles.addCatalogButtonText}>Add Event</Text>
                </TouchableOpacity>
              </View>

              {events.length === 0 ? (
                <View style={styles.emptyState}>
                  <Calendar size={48} color="#64748B" />
                  <Text style={styles.emptyText}>No catalog events. Add your first event.</Text>
                </View>
              ) : (
                events.map(catalogEvent => (
                  <CatalogEventCard
                    key={catalogEvent.id}
                    event={catalogEvent}
                    isDeleteBlocked={activeCatalogBookingIds.has(catalogEvent.id)}
                    onEdit={openEditEventModal}
                    onDelete={handleDeleteCatalogEvent}
                  />
                ))
              )}

              <Text style={styles.subSectionTitle}>Booking Operations</Text>
              <View style={styles.eventSummaryGrid}>
                <View style={styles.eventSummaryCard}>
                  <Text style={styles.eventSummaryValue}>{events.length}</Text>
                  <Text style={styles.eventSummaryLabel}>Catalog Events</Text>
                </View>
                <View style={styles.eventSummaryCard}>
                  <Text style={styles.eventSummaryValue}>{eventSummary.booked + eventSummary.registered}</Text>
                  <Text style={styles.eventSummaryLabel}>Active Bookings</Text>
                </View>
                <View style={styles.eventSummaryCard}>
                  <Text style={styles.eventSummaryValue}>{eventSummary.completed}</Text>
                  <Text style={styles.eventSummaryLabel}>Completed</Text>
                </View>
                <View style={styles.eventSummaryCard}>
                  <Text style={styles.eventSummaryValue}>{eventSummary.cancelled}</Text>
                  <Text style={styles.eventSummaryLabel}>Cancelled</Text>
                </View>
              </View>

              <View style={styles.eventSearchBox}>
                <Search size={18} color="#94A3B8" />
                <TextInput
                  style={styles.eventSearchInput}
                  placeholder="Search by event title or date..."
                  placeholderTextColor="#64748B"
                  value={eventSearchQuery}
                  onChangeText={setEventSearchQuery}
                />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.eventFiltersScroll}
                contentContainerStyle={styles.eventFiltersContent}
              >
                {eventFilters.map(filter => (
                  <TouchableOpacity
                    key={filter.id}
                    style={[
                      styles.eventFilterChip,
                      eventStatusFilter === filter.id && styles.eventFilterChipActive,
                    ]}
                    onPress={() => setEventStatusFilter(filter.id)}
                  >
                    <Text
                      style={[
                        styles.eventFilterText,
                        eventStatusFilter === filter.id && styles.eventFilterTextActive,
                      ]}
                    >
                      {filter.label}
                    </Text>
                    <View style={styles.eventFilterCount}>
                      <Text style={styles.eventFilterCountText}>{filter.count}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.bulkToolbar}>
                <TouchableOpacity
                  style={[
                    styles.bulkToggleButton,
                    isBulkSelectingEvents && styles.bulkToggleButtonActive,
                  ]}
                  onPress={toggleBulkSelectionMode}
                >
                  <CheckSquare size={16} color={isBulkSelectingEvents ? '#3B82F6' : '#94A3B8'} />
                  <Text
                    style={[
                      styles.bulkToggleButtonText,
                      isBulkSelectingEvents && styles.bulkToggleButtonTextActive,
                    ]}
                  >
                    {isBulkSelectingEvents ? 'Exit Multi-Select' : 'Multi-Select'}
                  </Text>
                </TouchableOpacity>

                {isBulkSelectingEvents && (
                  <TouchableOpacity
                    style={styles.bulkSecondaryButton}
                    onPress={toggleSelectAllVisibleEvents}
                  >
                    <Text style={styles.bulkSecondaryButtonText}>
                      {allVisibleEventsSelected ? 'Unselect Visible' : 'Select Visible'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {isBulkSelectingEvents && (
                <View style={styles.bulkActionPanel}>
                  <Text style={styles.bulkActionLabel}>
                    {selectedEventIds.length} selected • {selectedActiveEventCount} eligible
                  </Text>
                  <View style={styles.bulkActionButtons}>
                    <TouchableOpacity
                      style={[
                        styles.bulkActionButton,
                        styles.bulkCompleteButton,
                        selectedActiveEventCount === 0 && styles.bulkActionButtonDisabled,
                      ]}
                      onPress={() => handleBulkUpdateEvents('completed')}
                      disabled={selectedActiveEventCount === 0}
                    >
                      <CheckCircle size={16} color="#FFF" />
                      <Text style={styles.bulkActionButtonText}>Bulk Complete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.bulkActionButton,
                        styles.bulkCancelButton,
                        selectedActiveEventCount === 0 && styles.bulkActionButtonDisabled,
                      ]}
                      onPress={() => handleBulkUpdateEvents('cancelled')}
                      disabled={selectedActiveEventCount === 0}
                    >
                      <XCircle size={16} color="#FFF" />
                      <Text style={styles.bulkActionButtonText}>Bulk Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {filteredEvents.length === 0 ? (
                <View style={styles.emptyState}>
                  <Calendar size={48} color="#64748B" />
                  <Text style={styles.emptyText}>No events match this filter</Text>
                </View>
              ) : (
                filteredEvents.map(event => (
                  <ManagedEventCard
                    key={event.id}
                    event={event}
                    onUpdateStatus={handleUpdateManagedEvent}
                    isBulkSelecting={isBulkSelectingEvents}
                    isSelected={selectedEventIds.includes(event.id)}
                    onToggleSelect={() => toggleEventSelection(event.id)}
                  />
                ))
              )}
            </View>
          )}

          {activeTab === 'vendors' && (
            <>
              <View style={styles.section}>
                <View style={styles.catalogHeader}>
                  <Text style={styles.subSectionTitle}>Vendor Management</Text>
                  <TouchableOpacity style={styles.addCatalogButton} onPress={openCreateVendorModal}>
                    <Plus size={16} color="#FFF" />
                    <Text style={styles.addCatalogButtonText}>Add Vendor</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.eventSearchBox}>
                  <Search size={18} color="#94A3B8" />
                  <TextInput
                    style={styles.eventSearchInput}
                    placeholder="Search vendors by name, category, or service..."
                    placeholderTextColor="#64748B"
                    value={vendorSearchQuery}
                    onChangeText={setVendorSearchQuery}
                  />
                </View>

                {filteredVendors.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Users size={48} color="#64748B" />
                    <Text style={styles.emptyText}>No vendors found</Text>
                  </View>
                ) : (
                  filteredVendors.map(vendor => (
                    <VendorCatalogCard
                      key={vendor.id}
                      vendor={vendor}
                      isDeleteBlocked={activeVendorBookingIds.has(vendor.id)}
                      onEdit={openEditVendorModal}
                      onDelete={handleDeleteVendor}
                    />
                  ))
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Vendor Booking Requests</Text>
                {sortedVendorBookings.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Users size={48} color="#64748B" />
                    <Text style={styles.emptyText}>No vendor booking requests</Text>
                  </View>
                ) : (
                  sortedVendorBookings.map((booking) => (
                    <View key={booking.id} style={styles.bookingCard}>
                      <View style={styles.bookingHeader}>
                        <View style={styles.bookingInfo}>
                          <Text style={styles.bookingTitle}>{booking.vendor.name}</Text>
                          <Text style={styles.bookingSubtitle}>
                            {booking.user.name} • {booking.eventDate}
                          </Text>
                        </View>
                        <View style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              booking.status === 'approved'
                                ? '#10B98120'
                                : booking.status === 'rejected'
                                  ? '#EF444420'
                                  : '#F59E0B20',
                          },
                        ]}>
                          <Text style={[
                            styles.statusText,
                            {
                              color:
                                booking.status === 'approved'
                                  ? '#10B981'
                                  : booking.status === 'rejected'
                                    ? '#EF4444'
                                    : '#F59E0B',
                            },
                          ]}>
                            {booking.status}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.bookingDetails}>
                        <Text style={styles.bookingDetailText}>Guests: {booking.guestCount}</Text>
                        {typeof booking.budget === 'number' && (
                          <Text style={styles.bookingDetailText}>Budget: ₹{booking.budget.toLocaleString()}</Text>
                        )}
                        {booking.notes && (
                          <Text style={styles.bookingDetailText}>Notes: {booking.notes}</Text>
                        )}
                      </View>
                      {booking.status === 'pending' && (
                        <View style={styles.bookingActions}>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.approveBtn]}
                            onPress={() => handleVendorBookingStatus(booking, 'approved')}
                          >
                            <CheckCircle size={16} color="#FFF" />
                            <Text style={styles.actionBtnText}>Approve</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.rejectBtn]}
                            onPress={() => handleVendorBookingStatus(booking, 'rejected')}
                          >
                            <XCircle size={16} color="#FFF" />
                            <Text style={styles.actionBtnText}>Reject</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      {booking.status !== 'pending' && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.restoreBtn]}
                          onPress={() => handleVendorBookingStatus(booking, 'pending')}
                        >
                          <Clock size={16} color="#FFF" />
                          <Text style={styles.actionBtnText}>Move to Pending</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                )}
              </View>
            </>
          )}

          {activeTab === 'analytics' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Analytics & Reports</Text>

              {/* Key Metrics Row */}
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: '#1E293B' }]}>
                  <Text style={styles.statTitle}>Total Revenue</Text>
                  <Text style={[styles.statValue, { color: '#10B981', fontSize: 24 }]}>
                    ₹{analytics.totalRevenue.toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#1E293B' }]}>
                  <Text style={styles.statTitle}>Bookings</Text>
                  <Text style={[styles.statValue, { color: '#3B82F6', fontSize: 24 }]}>
                    {analytics.totalBookings}
                  </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#1E293B' }]}>
                  <Text style={styles.statTitle}>Avg. Value</Text>
                  <Text style={[styles.statValue, { color: '#F59E0B', fontSize: 24 }]}>
                    ₹{analytics.averageBookingValue.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Monthly Revenue Chart */}
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsTitle}>Monthly Revenue Trend</Text>
                {analytics.monthlyRevenue.length === 0 ? (
                  <Text style={styles.emptyText}>No monthly data yet</Text>
                ) : (
                  analytics.monthlyRevenue.map((monthRow) => (
                    <BarRow
                      key={monthRow.month}
                      label={monthRow.month}
                      value={monthRow.value}
                      total={Math.max(...analytics.monthlyRevenue.map(m => m.value), 1)}
                      color="#3B82F6"
                      currency
                    />
                  ))
                )}
              </View>

              <View style={styles.analyticsRowTwo}>
                {/* Category Popularity */}
                <View style={[styles.analyticsCard, { flex: 1 }]}>
                  <Text style={styles.analyticsTitle}>Most Booked Categories</Text>
                  {analytics.categoryPopularity.length === 0 ? (
                    <Text style={styles.emptyText}>No data</Text>
                  ) : (
                    analytics.categoryPopularity.map((item) => (
                      <BarRow
                        key={item.category}
                        label={getCategoryLabel(item.category as EventCategory)}
                        value={item.count}
                        total={Math.max(...analytics.categoryPopularity.map(c => c.count), 1)}
                        color="#8B5CF6"
                      />
                    ))
                  )}
                </View>

                {/* Vendor Earnings */}
                <View style={[styles.analyticsCard, { flex: 1 }]}>
                  <Text style={styles.analyticsTitle}>Top Vendors (Earnings)</Text>
                  {analytics.vendorEarnings.length === 0 ? (
                    <Text style={styles.emptyText}>No data</Text>
                  ) : (
                    analytics.vendorEarnings.map((item) => (
                      <View key={item.vendorId} style={styles.vendorEarningRow}>
                        <Text style={styles.vendorNameTruncate} numberOfLines={1}>{item.vendorName}</Text>
                        <Text style={styles.vendorEarningValue}>₹{item.earnings.toLocaleString()}</Text>
                      </View>
                    ))
                  )}
                </View>
              </View>

              {/* Booking Heatmap (Simplified List for now) */}
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsTitle}>Booking Season Heatmap (Top Dates)</Text>
                <View style={styles.chipContainer}>
                  {analytics.bookingHeatmap
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 8)
                    .map((item) => (
                      <View key={item.date} style={styles.heatmapChip}>
                        <Text style={styles.heatmapDate}>{new Date(item.date).toLocaleDateString()}</Text>
                        <View style={styles.heatmapCountBadge}>
                          <Text style={styles.heatmapCountText}>{item.count}</Text>
                        </View>
                      </View>
                    ))}
                  {analytics.bookingHeatmap.length === 0 && <Text style={styles.emptyText}>No bookings yet</Text>}
                </View>
              </View>

              {/* Trending Styles */}
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsTitle}>Trending This Month</Text>
                <View style={styles.trendingGrid}>
                  {analytics.trendingStyles.map((item, index) => (
                    <View key={index} style={styles.trendingCard}>
                      <Text style={styles.trendingType}>{item.type.toUpperCase()}</Text>
                      <Text style={styles.trendingName}>{item.name}</Text>
                      <Text style={styles.trendingCount}>{item.count} bookings</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Booking Status Breakdown */}
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsTitle}>Booking Status Breakdown</Text>
                <BarRow
                  label="Pending"
                  value={analytics.bookingStatusBreakdown.pending}
                  total={analytics.totalBookings}
                  color="#F59E0B"
                />
                <BarRow
                  label="Approved"
                  value={analytics.bookingStatusBreakdown.approved}
                  total={analytics.totalBookings}
                  color="#10B981"
                />
                <BarRow
                  label="Rejected"
                  value={analytics.bookingStatusBreakdown.rejected}
                  total={analytics.totalBookings}
                  color="#EF4444"
                />
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        <Modal
          visible={isVendorModalVisible}
          animationType="slide"
          transparent
          onRequestClose={closeVendorModal}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {editingVendor ? 'Edit Vendor' : 'Add Vendor'}
              </Text>

              <ScrollView
                style={styles.modalScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
              >
                <Text style={styles.modalLabel}>Vendor Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={vendorForm.name}
                  onChangeText={text => updateVendorFormField('name', text)}
                  placeholder="Royal Caterers"
                  placeholderTextColor="#64748B"
                />

                <Text style={styles.modalLabel}>Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.modalCategoryRow}
                >
                  {VENDOR_CATEGORY_OPTIONS.map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.modalCategoryChip,
                        vendorForm.category === option.value && styles.modalCategoryChipActive,
                      ]}
                      onPress={() => updateVendorFormField('category', option.value)}
                    >
                      <Text
                        style={[
                          styles.modalCategoryChipText,
                          vendorForm.category === option.value && styles.modalCategoryChipTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.modalLabel}>Description</Text>
                <TextInput
                  style={styles.modalTextArea}
                  value={vendorForm.description}
                  onChangeText={text => updateVendorFormField('description', text)}
                  placeholder="Describe this vendor's specialties..."
                  placeholderTextColor="#64748B"
                  multiline
                  numberOfLines={4}
                />

                <Text style={styles.modalLabel}>Image URL</Text>
                <TextInput
                  style={styles.modalInput}
                  value={vendorForm.image}
                  onChangeText={text => updateVendorFormField('image', text)}
                  placeholder="https://images.unsplash.com/..."
                  placeholderTextColor="#64748B"
                  autoCapitalize="none"
                />

                <Text style={styles.modalLabel}>Price Range</Text>
                <TextInput
                  style={styles.modalInput}
                  value={vendorForm.priceRange}
                  onChangeText={text => updateVendorFormField('priceRange', text)}
                  placeholder="₹20,000-80,000"
                  placeholderTextColor="#64748B"
                />

                <View style={styles.modalTwoColumn}>
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>Rating</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={vendorForm.rating}
                      onChangeText={text => updateVendorFormField('rating', text)}
                      keyboardType="decimal-pad"
                      placeholder="4.7"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>Review Count</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={vendorForm.reviewCount}
                      onChangeText={text => updateVendorFormField('reviewCount', text)}
                      keyboardType="number-pad"
                      placeholder="120"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>

                <Text style={styles.modalLabel}>Services (comma separated)</Text>
                <TextInput
                  style={styles.modalTextArea}
                  value={vendorForm.services}
                  onChangeText={text => updateVendorFormField('services', text)}
                  placeholder="Catering, Live Counters, Dessert Bar"
                  placeholderTextColor="#64748B"
                  multiline
                  numberOfLines={3}
                />

                <Text style={styles.modalLabel}>Portfolio URLs (comma separated)</Text>
                <TextInput
                  style={styles.modalTextArea}
                  value={vendorForm.portfolio}
                  onChangeText={text => updateVendorFormField('portfolio', text)}
                  placeholder="https://images.unsplash.com/..., https://images.unsplash.com/..."
                  placeholderTextColor="#64748B"
                  multiline
                  numberOfLines={3}
                />

                <Text style={styles.modalLabel}>Contact Phone</Text>
                <TextInput
                  style={styles.modalInput}
                  value={vendorForm.contactPhone}
                  onChangeText={text => updateVendorFormField('contactPhone', text)}
                  placeholder="+91 9876543210"
                  placeholderTextColor="#64748B"
                  keyboardType="phone-pad"
                />

                <Text style={styles.modalLabel}>Contact Email</Text>
                <TextInput
                  style={styles.modalInput}
                  value={vendorForm.contactEmail}
                  onChangeText={text => updateVendorFormField('contactEmail', text)}
                  placeholder="vendor@example.com"
                  placeholderTextColor="#64748B"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <Text style={styles.modalLabel}>WhatsApp</Text>
                <TextInput
                  style={styles.modalInput}
                  value={vendorForm.contactWhatsapp}
                  onChangeText={text => updateVendorFormField('contactWhatsapp', text)}
                  placeholder="+91 9876543210"
                  placeholderTextColor="#64748B"
                  keyboardType="phone-pad"
                />
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalSecondaryButton} onPress={closeVendorModal}>
                  <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalPrimaryButton} onPress={saveVendor}>
                  <Text style={styles.modalPrimaryButtonText}>
                    {editingVendor ? 'Update Vendor' : 'Create Vendor'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={isEventModalVisible}
          animationType="slide"
          transparent
          onRequestClose={closeEventModal}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {editingCatalogEvent ? 'Edit Catalog Event' : 'Add Catalog Event'}
              </Text>

              <ScrollView
                style={styles.modalScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
              >
                <Text style={styles.modalLabel}>Title</Text>
                <TextInput
                  style={styles.modalInput}
                  value={eventForm.title}
                  onChangeText={text => updateEventFormField('title', text)}
                  placeholder="Wedding Celebration"
                  placeholderTextColor="#64748B"
                />

                <Text style={styles.modalLabel}>Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.modalCategoryRow}
                >
                  {EVENT_CATEGORY_OPTIONS.map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.modalCategoryChip,
                        eventForm.category === option.value && styles.modalCategoryChipActive,
                      ]}
                      onPress={() => updateEventFormField('category', option.value)}
                    >
                      <Text
                        style={[
                          styles.modalCategoryChipText,
                          eventForm.category === option.value && styles.modalCategoryChipTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.modalLabel}>Description</Text>
                <TextInput
                  style={styles.modalTextArea}
                  value={eventForm.description}
                  onChangeText={text => updateEventFormField('description', text)}
                  placeholder="Describe what this event includes..."
                  placeholderTextColor="#64748B"
                  multiline
                  numberOfLines={4}
                />

                <Text style={styles.modalLabel}>Image URL</Text>
                <TextInput
                  style={styles.modalInput}
                  value={eventForm.image}
                  onChangeText={text => updateEventFormField('image', text)}
                  placeholder="https://images.unsplash.com/..."
                  placeholderTextColor="#64748B"
                  autoCapitalize="none"
                />

                <View style={styles.modalTwoColumn}>
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>Price (INR)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={eventForm.price}
                      onChangeText={text => updateEventFormField('price', text)}
                      keyboardType="number-pad"
                      placeholder="25000"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>Duration</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={eventForm.duration}
                      onChangeText={text => updateEventFormField('duration', text)}
                      placeholder="4-6 hours"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>

                <View style={styles.modalTwoColumn}>
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>Rating</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={eventForm.rating}
                      onChangeText={text => updateEventFormField('rating', text)}
                      keyboardType="decimal-pad"
                      placeholder="4.7"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>Review Count</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={eventForm.reviewCount}
                      onChangeText={text => updateEventFormField('reviewCount', text)}
                      keyboardType="number-pad"
                      placeholder="120"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>

                <Text style={styles.modalLabel}>Features (comma separated)</Text>
                <TextInput
                  style={styles.modalTextArea}
                  value={eventForm.features}
                  onChangeText={text => updateEventFormField('features', text)}
                  placeholder="Lighting Design, Stage Setup, Guest Flow"
                  placeholderTextColor="#64748B"
                  multiline
                  numberOfLines={3}
                />
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalSecondaryButton} onPress={closeEventModal}>
                  <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalPrimaryButton} onPress={saveCatalogEvent}>
                  <Text style={styles.modalPrimaryButtonText}>
                    {editingCatalogEvent ? 'Update Event' : 'Create Event'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        </SafeAreaView>
      </View>
    </ScreenFrame>
  );
}

function StatCard({ icon, title, value, color }: { icon: ReactNode; title: string; value: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

function BookingCard({
  booking,
  onApprove,
  onReject
}: {
  booking: BookingRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const statusColors = {
    pending: '#F59E0B',
    approved: '#10B981',
    rejected: '#EF4444',
  };

  return (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.bookingInfo}>
          <Text style={styles.bookingTitle}>{booking.contactName}</Text>
          <Text style={styles.bookingSubtitle}>{booking.email}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[booking.status] + '20' }]}>
          <Text style={[styles.statusText, { color: statusColors[booking.status] }]}>
            {booking.status}
          </Text>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <Text style={styles.bookingDetailText}>Event: {booking.event?.title || 'N/A'}</Text>
        <Text style={styles.bookingDetailText}>Date: {booking.date}</Text>
        <Text style={styles.bookingDetailText}>Guests: {booking.guestCount}</Text>
        <Text style={styles.bookingDetailText}>Venue: {booking.venue}</Text>
        {booking.paymentWebhookStatus && (
          <Text style={styles.bookingDetailText}>
            Payment webhook: {booking.paymentWebhookStatus}
          </Text>
        )}
      </View>

      {booking.status === 'pending' && (
        <View style={styles.bookingActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={() => onApprove(booking.id)}
          >
            <CheckCircle size={16} color="#FFF" />
            <Text style={styles.actionBtnText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => onReject(booking.id)}
          >
            <XCircle size={16} color="#FFF" />
            <Text style={styles.actionBtnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function VendorCatalogCard({
  vendor,
  isDeleteBlocked,
  onEdit,
  onDelete,
}: {
  vendor: Vendor;
  isDeleteBlocked: boolean;
  onEdit: (vendor: Vendor) => void;
  onDelete: (vendor: Vendor) => void;
}) {
  const servicesPreview = vendor.services.slice(0, 3).join(', ');
  const servicesSuffix = vendor.services.length > 3 ? ` +${vendor.services.length - 3} more` : '';

  return (
    <View style={styles.catalogEventCard}>
      <View style={styles.catalogEventHeader}>
        <View style={styles.catalogEventInfo}>
          <Text style={styles.catalogEventTitle}>{vendor.name}</Text>
          <View style={styles.catalogCategoryBadge}>
            <Text style={styles.catalogCategoryText}>{getVendorCategoryLabel(vendor.category)}</Text>
          </View>
        </View>
        <Text style={styles.catalogEventPrice}>{vendor.priceRange}</Text>
      </View>

      <Text style={styles.catalogEventMeta}>
        {vendor.rating.toFixed(1)} stars • {vendor.reviewCount} reviews
      </Text>
      <Text style={styles.catalogEventDescription} numberOfLines={2}>
        {vendor.description}
      </Text>
      {vendor.services.length > 0 && (
        <Text style={styles.catalogEventMeta}>
          Services: {servicesPreview}{servicesSuffix}
        </Text>
      )}

      <View style={styles.catalogEventActions}>
        <TouchableOpacity style={[styles.actionBtn, styles.restoreBtn]} onPress={() => onEdit(vendor)}>
          <Pencil size={16} color="#FFF" />
          <Text style={styles.actionBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            styles.rejectBtn,
            isDeleteBlocked && styles.catalogDeleteButtonDisabled,
          ]}
          onPress={() => onDelete(vendor)}
          disabled={isDeleteBlocked}
        >
          <Trash2 size={16} color="#FFF" />
          <Text style={styles.actionBtnText}>{isDeleteBlocked ? 'Blocked' : 'Delete'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CatalogEventCard({
  event,
  isDeleteBlocked,
  onEdit,
  onDelete,
}: {
  event: Event;
  isDeleteBlocked: boolean;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
}) {
  return (
    <View style={styles.catalogEventCard}>
      <View style={styles.catalogEventHeader}>
        <View style={styles.catalogEventInfo}>
          <Text style={styles.catalogEventTitle}>{event.title}</Text>
          <View style={styles.catalogCategoryBadge}>
            <Text style={styles.catalogCategoryText}>{getCategoryLabel(event.category)}</Text>
          </View>
        </View>
        <Text style={styles.catalogEventPrice}>₹{event.price.toLocaleString()}</Text>
      </View>

      <Text style={styles.catalogEventMeta}>
        {event.duration} • {event.rating.toFixed(1)} stars • {event.reviewCount} reviews
      </Text>
      <Text style={styles.catalogEventDescription} numberOfLines={2}>
        {event.description}
      </Text>

      <View style={styles.catalogEventActions}>
        <TouchableOpacity style={[styles.actionBtn, styles.restoreBtn]} onPress={() => onEdit(event)}>
          <Pencil size={16} color="#FFF" />
          <Text style={styles.actionBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            styles.rejectBtn,
            isDeleteBlocked && styles.catalogDeleteButtonDisabled,
          ]}
          onPress={() => onDelete(event)}
          disabled={isDeleteBlocked}
        >
          <Trash2 size={16} color="#FFF" />
          <Text style={styles.actionBtnText}>{isDeleteBlocked ? 'In Use' : 'Delete'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ManagedEventCard({
  event,
  onUpdateStatus,
  isBulkSelecting,
  isSelected,
  onToggleSelect,
}: {
  event: UserEvent;
  onUpdateStatus: (event: UserEvent, nextStatus: UserEvent['status']) => void;
  isBulkSelecting: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  const statusColor = getManagedEventStatusColor(event.status);
  const eventDate = new Date(event.date);
  const isValidDate = !Number.isNaN(eventDate.getTime());
  const isOverdue = isValidDate && eventDate.getTime() < Date.now() && (
    event.status === 'registered' || event.status === 'booked'
  );
  const displayDate = isValidDate ? eventDate.toLocaleDateString() : event.date;

  return (
    <TouchableOpacity
      style={[
        styles.managedEventCard,
        isBulkSelecting && styles.managedEventCardSelectable,
        isSelected && styles.managedEventCardSelected,
      ]}
      onPress={isBulkSelecting ? onToggleSelect : undefined}
      disabled={!isBulkSelecting}
      activeOpacity={0.85}
    >
      <View style={styles.bookingHeader}>
        <View style={styles.bookingInfo}>
          <Text style={styles.bookingTitle}>{event.event.title}</Text>
          <Text style={styles.bookingSubtitle}>
            {displayDate} • {event.guestCount} guests
          </Text>
        </View>
        <View style={styles.managedEventHeaderRight}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {event.status}
            </Text>
          </View>
          {isBulkSelecting && (
            <View style={styles.selectionIndicator}>
              {isSelected ? (
                <CheckCircle size={18} color="#10B981" />
              ) : (
                <Circle size={18} color="#64748B" />
              )}
            </View>
          )}
        </View>
      </View>

      {event.bookingDetails && (
        <View style={styles.bookingDetails}>
          <Text style={styles.bookingDetailText}>
            Contact: {event.bookingDetails.contactName}
          </Text>
          <Text style={styles.bookingDetailText}>
            Payment: ₹{event.bookingDetails.amountPaid.toLocaleString()} / ₹{event.bookingDetails.totalAmount.toLocaleString()}
          </Text>
          <Text style={styles.bookingDetailText}>
            Venue: {event.bookingDetails.venue}
          </Text>
        </View>
      )}

      {isOverdue && (
        <View style={styles.overdueBadge}>
          <Clock size={14} color="#F59E0B" />
          <Text style={styles.overdueText}>Past date and still active</Text>
        </View>
      )}

      {isBulkSelecting ? (
        <Text style={styles.bulkSelectionHint}>
          {isSelected ? 'Selected for bulk action' : 'Tap card to select'}
        </Text>
      ) : event.status === 'registered' || event.status === 'booked' ? (
        <View style={styles.bookingActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={() => onUpdateStatus(event, 'completed')}
          >
            <CheckCircle size={16} color="#FFF" />
            <Text style={styles.actionBtnText}>Complete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => onUpdateStatus(event, 'cancelled')}
          >
            <XCircle size={16} color="#FFF" />
            <Text style={styles.actionBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.actionBtn, styles.restoreBtn]}
          onPress={() => onUpdateStatus(event, 'booked')}
        >
          <Clock size={16} color="#FFF" />
          <Text style={styles.actionBtnText}>Reopen as Booked</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

function getManagedEventStatusColor(status: UserEvent['status']): string {
  switch (status) {
    case 'registered':
      return '#3B82F6';
    case 'booked':
      return '#10B981';
    case 'completed':
      return '#8B5CF6';
    case 'cancelled':
      return '#EF4444';
    default:
      return '#64748B';
  }
}

function BarRow({
  label,
  value,
  total,
  color,
  currency = false,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  currency?: boolean;
}) {
  const safeTotal = total > 0 ? total : 1;
  const widthPercent = Math.max(8, Math.round((value / safeTotal) * 100));
  return (
    <View style={styles.barRow}>
      <View style={styles.barLabelRow}>
        <Text style={styles.analyticsLabel}>{label}</Text>
        <Text style={styles.analyticsValue}>
          {currency ? `₹${value.toLocaleString()}` : value.toLocaleString()}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${widthPercent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function ActionButton({ icon, title, onPress }: { icon: ReactNode; title: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <View style={styles.actionIcon}>{icon}</View>
      <Text style={styles.actionTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  logoutButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    maxHeight: 46,
    marginBottom: 20,
  },
  tabsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 104,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
  },
  tabText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500' as const,
  },
  tabTextActive: {
    color: '#3B82F6',
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    minWidth: 150,
    flexGrow: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    color: '#FFF',
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 13,
    color: '#94A3B8',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  catalogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  subSectionTitle: {
    flex: 1,
    fontSize: 16,
    color: '#CBD5E1',
    fontWeight: '700' as const,
  },
  addCatalogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 36,
  },
  addCatalogButtonText: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '700' as const,
  },
  catalogEventCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
    gap: 8,
    marginBottom: 10,
  },
  catalogEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  catalogEventInfo: {
    flex: 1,
    gap: 6,
  },
  analyticsRowTwo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  vendorEarningRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vendorNameTruncate: {
    fontSize: 13,
    color: '#94A3B8',
    flex: 1,
    marginRight: 8,
  },
  vendorEarningValue: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heatmapChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  heatmapDate: {
    fontSize: 12,
    color: '#E2E8F0',
  },
  heatmapCountBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  heatmapCountText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: 'bold',
  },
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  trendingCard: {
    width: '48%',
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 12,
  },
  trendingType: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 4,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  trendingName: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  trendingCount: {
    fontSize: 12,
    color: '#10B981',
  },

  catalogEventTitle: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '700' as const,
  },
  catalogCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#172554',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  catalogCategoryText: {
    fontSize: 11,
    color: '#BFDBFE',
    fontWeight: '700' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  catalogEventPrice: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '700' as const,
  },
  catalogEventMeta: {
    fontSize: 13,
    color: '#CBD5E1',
  },
  catalogEventDescription: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  catalogEventActions: {
    flexDirection: 'row',
    gap: 8,
  },
  catalogDeleteButtonDisabled: {
    backgroundColor: '#475569',
  },
  eventSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  eventSummaryCard: {
    width: '48%',
    minWidth: 150,
    flexGrow: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
  },
  eventSummaryValue: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: '700' as const,
  },
  eventSummaryLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  eventSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 12,
  },
  eventSearchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
  },
  eventFiltersScroll: {
    marginBottom: 12,
  },
  eventFiltersContent: {
    gap: 8,
    paddingRight: 4,
  },
  eventFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  eventFilterChipActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
  },
  eventFilterText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600' as const,
  },
  eventFilterTextActive: {
    color: '#3B82F6',
  },
  eventFilterCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
  },
  eventFilterCountText: {
    fontSize: 11,
    color: '#E2E8F0',
    fontWeight: '700' as const,
  },
  bulkToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  bulkToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  bulkToggleButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  bulkToggleButtonText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600' as const,
  },
  bulkToggleButtonTextActive: {
    color: '#3B82F6',
  },
  bulkSecondaryButton: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  bulkSecondaryButtonText: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '600' as const,
  },
  bulkActionPanel: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  bulkActionLabel: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '600' as const,
  },
  bulkActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bulkCompleteButton: {
    backgroundColor: '#10B981',
  },
  bulkCancelButton: {
    backgroundColor: '#EF4444',
  },
  bulkActionButtonDisabled: {
    opacity: 0.4,
  },
  bulkActionButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700' as const,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
  bookingCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  managedEventCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  managedEventCardSelectable: {
    borderColor: '#3B82F6',
  },
  managedEventCardSelected: {
    backgroundColor: '#172554',
    borderColor: '#3B82F6',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  bookingSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  managedEventHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectionIndicator: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  bookingDetails: {
    gap: 6,
    marginBottom: 12,
  },
  bookingDetailText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  bookingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#F59E0B20',
    borderWidth: 1,
    borderColor: '#F59E0B40',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 12,
  },
  overdueText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600' as const,
  },
  bulkSelectionHint: {
    fontSize: 13,
    color: '#93C5FD',
    fontWeight: '600' as const,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  approveBtn: {
    backgroundColor: '#10B981',
  },
  rejectBtn: {
    backgroundColor: '#EF4444',
  },
  restoreBtn: {
    backgroundColor: '#3B82F6',
  },
  actionBtnText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600' as const,
  },
  quickActions: {
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '48%',
    minWidth: 148,
    flexGrow: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600' as const,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.78)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    maxHeight: '90%',
    backgroundColor: '#111827',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  modalScroll: {
    maxHeight: 520,
  },
  modalScrollContent: {
    paddingBottom: 8,
  },
  modalLabel: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    color: '#FFF',
    marginBottom: 12,
  },
  modalTextArea: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    minHeight: 88,
    textAlignVertical: 'top',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFF',
    marginBottom: 12,
  },
  modalCategoryRow: {
    gap: 8,
    paddingRight: 4,
    marginBottom: 12,
  },
  modalCategoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalCategoryChipActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#172554',
  },
  modalCategoryChipText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600' as const,
  },
  modalCategoryChipTextActive: {
    color: '#BFDBFE',
  },
  modalTwoColumn: {
    flexDirection: 'row',
    gap: 10,
  },
  modalField: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  modalSecondaryButton: {
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalSecondaryButtonText: {
    color: '#E2E8F0',
    fontWeight: '600' as const,
  },
  modalPrimaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalPrimaryButtonText: {
    color: '#FFF',
    fontWeight: '700' as const,
  },
  infoText: {
    fontSize: 15,
    color: '#94A3B8',
    marginBottom: 8,
  },
  analyticsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  analyticsTitle: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  analyticsLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  analyticsValue: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600' as const,
  },
  barRow: {
    gap: 8,
    marginBottom: 12,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barTrack: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
});
