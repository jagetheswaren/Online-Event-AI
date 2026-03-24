import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { X, Calendar, Users, User, Mail, Phone, MapPin, CreditCard, Sparkles, CheckCircle } from 'lucide-react-native';
import { useEvents } from '@/providers/EventProvider';
import { useUser } from '@/providers/UserProvider';
import { useAdmin } from '@/providers/AdminProvider';
import { validateBookingForm, sanitizeInput } from '@/utils/validation';
import config from '@/config';
import { paymentService } from '@/services/payments';
import { notificationService } from '@/services/notifications';
import ScreenFrame from '@/components/ScreenFrame';

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getNextSaturday = () => {
  const now = new Date();
  const date = new Date(now);
  const day = date.getDay();
  const diff = (6 - day + 7) % 7 || 7;
  date.setDate(date.getDate() + diff);
  return date;
};

const getSingleParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const toRoundedPositiveInt = (value: string | undefined) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.round(parsed);
};

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { getEventById, addUserEvent } = useEvents();
  const { user } = useUser();
  const { createBookingRequest } = useAdmin();

  const eventIdParam = getSingleParam(params.eventId as string | string[] | undefined) || '';
  const prefGuestCount = toRoundedPositiveInt(
    getSingleParam(params.prefGuestCount as string | string[] | undefined)
  );
  const prefEstimateAmount = toRoundedPositiveInt(
    getSingleParam(params.estimateAmount as string | string[] | undefined)
  );
  const prefHasCustomizationParam = getSingleParam(
    params.hasCustomization as string | string[] | undefined
  );
  const prefDecorLevel = toRoundedPositiveInt(
    getSingleParam(params.decorLevel as string | string[] | undefined)
  );
  const prefEntertainmentLevel = toRoundedPositiveInt(
    getSingleParam(params.entertainmentLevel as string | string[] | undefined)
  );
  const prefPackageTier = getSingleParam(params.packageTier as string | string[] | undefined) || '';
  const prefVenueTheme = getSingleParam(params.venueTheme as string | string[] | undefined) || '';
  const prefLightingMode = getSingleParam(params.lightingMode as string | string[] | undefined) || '';
  const prefTableLayout = getSingleParam(params.tableLayout as string | string[] | undefined) || '';

  const event = getEventById(eventIdParam);

  const hasCustomizationPrefill =
    prefHasCustomizationParam !== undefined
      ? prefHasCustomizationParam === '1' || prefHasCustomizationParam === 'true'
      : prefEstimateAmount > 0 ||
      prefGuestCount > 0 ||
      prefDecorLevel > 0 ||
      prefEntertainmentLevel > 0 ||
      Boolean(prefPackageTier);

  const packageTierLabel =
    prefPackageTier === 'basic'
      ? 'Basic'
      : prefPackageTier === 'premium'
        ? 'Premium'
        : prefPackageTier === 'luxury'
          ? 'Luxury'
          : prefPackageTier;

  const venueThemeLabel =
    prefVenueTheme === 'classic'
      ? 'Classic Gold'
      : prefVenueTheme === 'garden'
        ? 'Garden Fresh'
        : prefVenueTheme === 'modern'
          ? 'Modern Luxe'
          : prefVenueTheme;

  const lightingLabel = prefLightingMode === 'night' ? 'Night' : prefLightingMode === 'day' ? 'Day' : prefLightingMode;
  const tableLayoutLabel =
    prefTableLayout === 'round'
      ? 'Round tables'
      : prefTableLayout === 'banquet'
        ? 'Banquet rows'
        : prefTableLayout === 'uShape'
          ? 'U-shape setup'
          : prefTableLayout;

  const customizationLines = [
    packageTierLabel ? `Package: ${packageTierLabel}` : '',
    prefGuestCount > 0 ? `Guest target: ${prefGuestCount}` : '',
    prefDecorLevel > 0 ? `Decor level: ${prefDecorLevel}/10` : '',
    prefEntertainmentLevel > 0 ? `Entertainment level: ${prefEntertainmentLevel}/10` : '',
    venueThemeLabel || lightingLabel || tableLayoutLabel
      ? `Venue style: ${[venueThemeLabel, lightingLabel, tableLayoutLabel].filter(Boolean).join(' / ')}`
      : '',
  ].filter(Boolean);

  const prefilledSpecialRequests = customizationLines.length
    ? `Selected customization:\n${customizationLines.join('\n')}`
    : '';



  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);

  const AVAILABLE_ADDONS: { id: string; name: string; price: number; icon: any; description: string }[] = [
    { id: 'photobooth', name: 'Premium Photo Booth', price: 15000, icon: <Users size={20} color="#3B82F6" />, description: 'Unlimited prints & props' },
    { id: 'fireworks', name: 'Grand Fireworks', price: 25000, icon: <Sparkles size={20} color="#3B82F6" />, description: '3-minute pyrotechnic show' },
    { id: 'drone', name: 'Drone Photography', price: 12000, icon: <Users size={20} color="#3B82F6" />, description: 'Aerial layout & video shots' },
    { id: 'dessert', name: 'Luxury Dessert Bar', price: 18000, icon: <Users size={20} color="#3B82F6" />, description: 'Gourmet sweets & styling' },
  ];

  const toggleAddOn = (id: string) => {
    setSelectedAddOnIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const addOnsTotal = selectedAddOnIds.reduce((sum, id) => {
    const addon = AVAILABLE_ADDONS.find(a => a.id === id);
    return sum + (addon?.price || 0);
  }, 0);

  const effectiveTotalAmount = (event
    ? hasCustomizationPrefill && prefEstimateAmount > 0
      ? prefEstimateAmount
      : event.price
    : 0) + addOnsTotal;
  const minimumAdvanceAmount = Math.ceil(effectiveTotalAmount * 0.5);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [date, setDate] = useState('');
  const [guestCount, setGuestCount] = useState(
    hasCustomizationPrefill && prefGuestCount > 0 ? String(prefGuestCount) : ''
  );
  const [venue, setVenue] = useState('');
  const [specialRequests, setSpecialRequests] = useState(
    hasCustomizationPrefill ? prefilledSpecialRequests : ''
  );
  const [paymentAmount, setPaymentAmount] = useState(
    hasCustomizationPrefill && minimumAdvanceAmount > 0 ? String(minimumAdvanceAmount) : ''
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!event) {
    return (
      <ScreenFrame>
        <View style={styles.container}>
          <Text style={styles.errorText}>Event not found</Text>
        </View>
      </ScreenFrame>
    );
  }

  const handleBooking = async () => {
    if (isSubmitting) return;

    const validationErrors = validateBookingForm({
      name,
      email,
      phone,
      date,
      guestCount,
      venue,
      paymentAmount,
    });

    if (validationErrors.length > 0) {
      const errorMap = validationErrors.reduce((acc, err) => {
        acc[err.field] = err.message;
        return acc;
      }, {} as { [key: string]: string });
      setErrors(errorMap);
      Alert.alert('Validation Error', validationErrors[0].message);
      return;
    }

    const guests = parseInt(guestCount);
    const payment = parseInt(paymentAmount);
    const minPayment = minimumAdvanceAmount;

    if (payment < minPayment) {
      Alert.alert('Error', `Minimum payment is ₹${minPayment.toLocaleString()} (50% of total)`);
      return;
    }

    const cleanName = sanitizeInput(name);
    const cleanEmail = sanitizeInput(email);
    const cleanPhone = sanitizeInput(phone);
    const cleanVenue = sanitizeInput(venue);
    const cleanSpecialRequests = specialRequests ? sanitizeInput(specialRequests) : undefined;
    const bookingId = `booking_${Date.now()}`;
    const fallbackUserId = `guest_${Date.now()}`;
    const bookingUserId = user?.id || fallbackUserId;

    const selectedAddOns = AVAILABLE_ADDONS.filter(a => selectedAddOnIds.includes(a.id)).map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      price: a.price,
      icon: 'star', // Placeholder string for icon in DB
    }));

    setIsSubmitting(true);
    try {
      const paymentIntent = await paymentService.createPaymentIntent({
        amount: payment,
        bookingId,
        description: `Booking for ${event.title}${packageTierLabel ? ` (${packageTierLabel})` : ''}`,
      });

      addUserEvent({
        id: Date.now().toString(),
        eventId: event.id,
        event: event,
        status: 'booked',
        date: date,
        guestCount: guests,
        specialRequests: cleanSpecialRequests,
        addOns: selectedAddOns,
        bookingDetails: {
          contactName: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          venue: cleanVenue,
          paymentStatus: payment >= effectiveTotalAmount ? 'paid' : 'partial',
          amountPaid: payment,
          totalAmount: effectiveTotalAmount,
          paymentGateway: paymentIntent.provider || config.paymentProvider,
          paymentWebhookStatus: paymentIntent.status === 'paid' ? 'confirmed' : 'pending',
          paymentReferenceId: paymentIntent.referenceId,
        },
      });

      await createBookingRequest({
        id: bookingId,
        eventId: event.id,
        event,
        userId: bookingUserId,
        user: {
          id: bookingUserId,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          avatar: user?.avatar,
          nickname: user?.nickname,
          role: user?.role || 'customer',
        },
        status: 'pending',
        date,
        guestCount: guests,
        venue: cleanVenue,
        contactName: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        specialRequests: cleanSpecialRequests,
        addOns: selectedAddOns,
        createdAt: new Date().toISOString(),
        paymentGateway: paymentIntent.provider,
        paymentReferenceId: paymentIntent.referenceId,
        paymentWebhookStatus: paymentIntent.status === 'paid' ? 'confirmed' : 'pending',
      });

      notificationService.scheduleEventReminder(event.title, date);

      Alert.alert(
        'Booking Confirmed!',
        `Your event is booked. Payment of ₹${payment.toLocaleString()} created via ${paymentIntent.provider}.`,
        [
          {
            text: 'View My Events',
            onPress: () => {
              router.dismiss();
              router.push('/my-events');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Booking failed:', error);
      Alert.alert('Booking Failed', 'We could not complete your booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenFrame>
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Book Event</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.dismiss()}
          >
            <X size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.eventCard}>
            <Image
              source={{ uri: event.image }}
              style={styles.eventImage}
              contentFit="cover"
            />
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventPrice}>
                ₹{(hasCustomizationPrefill ? effectiveTotalAmount : event.price).toLocaleString()}
              </Text>
              {hasCustomizationPrefill && (
                <Text style={styles.prefillTag}>
                  Prefilled from Event Customization{packageTierLabel ? ` (${packageTierLabel})` : ''}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <View style={styles.inputWrapper}>
                <User size={20} color="#64748B" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor="#64748B"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                <Mail size={20} color={errors.email ? '#EF4444' : '#64748B'} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#64748B"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setErrors({ ...errors, email: '' });
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {errors.email && <Text style={styles.errorMessage}>{errors.email}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone *</Text>
              <View style={styles.inputWrapper}>
                <Phone size={20} color="#64748B" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone"
                  placeholderTextColor="#64748B"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Event Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Date *</Text>
              <View style={styles.inputWrapper}>
                <Calendar size={20} color="#64748B" />
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#64748B"
                  value={date}
                  onChangeText={(text) => {
                    setDate(text);
                    setErrors({ ...errors, date: '' });
                  }}
                />
              </View>
              <View style={styles.dateQuickPicks}>
                <TouchableOpacity
                  style={styles.quickPickButton}
                  onPress={() => {
                    setDate(formatDateForInput(new Date()));
                    setErrors({ ...errors, date: '' });
                  }}
                >
                  <Text style={styles.quickPickText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickPickButton}
                  onPress={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setDate(formatDateForInput(tomorrow));
                    setErrors({ ...errors, date: '' });
                  }}
                >
                  <Text style={styles.quickPickText}>Tomorrow</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickPickButton}
                  onPress={() => {
                    setDate(formatDateForInput(getNextSaturday()));
                    setErrors({ ...errors, date: '' });
                  }}
                >
                  <Text style={styles.quickPickText}>Next Weekend</Text>
                </TouchableOpacity>
              </View>
              {errors.date && <Text style={styles.errorMessage}>{errors.date}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Guest Count *</Text>
              <View style={styles.inputWrapper}>
                <Users size={20} color="#64748B" />
                <TextInput
                  style={styles.input}
                  placeholder="Number of guests"
                  placeholderTextColor="#64748B"
                  value={guestCount}
                  onChangeText={setGuestCount}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Venue Address *</Text>
              <View style={styles.inputWrapper}>
                <MapPin size={20} color="#64748B" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter venue address"
                  placeholderTextColor="#64748B"
                  value={venue}
                  onChangeText={setVenue}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Special Requests</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Any special requirements or notes..."
                placeholderTextColor="#64748B"
                value={specialRequests}
                onChangeText={setSpecialRequests}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Smart Upgrades</Text>
            <View style={styles.addonsGrid}>
              {AVAILABLE_ADDONS.map((addon) => {
                const isSelected = selectedAddOnIds.includes(addon.id);
                return (
                  <TouchableOpacity
                    key={addon.id}
                    style={[styles.addonCard, isSelected && styles.addonCardSelected]}
                    onPress={() => toggleAddOn(addon.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.addonIcon}>
                      {addon.icon}
                    </View>
                    <View style={styles.addonInfo}>
                      <Text style={styles.addonName}>{addon.name}</Text>
                      <Text style={styles.addonDescription} numberOfLines={2}>
                        {addon.description}
                      </Text>
                      <Text style={styles.addonPrice}>+₹{addon.price.toLocaleString()}</Text>
                    </View>
                    <View style={[styles.addonCheck, isSelected && styles.addonCheckActive]}>
                      {isSelected && <CheckCircle size={16} color="#FFF" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment</Text>

            <View style={styles.paymentInfo}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Base Price</Text>
                <Text style={styles.paymentValue}>₹{event.price.toLocaleString()}</Text>
              </View>
              {hasCustomizationPrefill && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Customization Upgrade</Text>
                  <Text style={styles.paymentValue}>
                    +₹{Math.max(effectiveTotalAmount - event.price - addOnsTotal, 0).toLocaleString()}
                  </Text>
                </View>
              )}
              {addOnsTotal > 0 && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Smart Upgrades</Text>
                  <Text style={styles.paymentValue}>+₹{addOnsTotal.toLocaleString()}</Text>
                </View>
              )}
              <View style={styles.divider} />
              <View style={styles.paymentRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{effectiveTotalAmount.toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Payment Amount *</Text>
              <View style={styles.inputWrapper}>
                <CreditCard size={20} color="#64748B" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter amount to pay"
                  placeholderTextColor="#64748B"
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  keyboardType="numeric"
                />
              </View>
              <Text style={styles.hint}>Minimum 50% advance payment required</Text>
              {hasCustomizationPrefill && (
                <Text style={styles.prefillHint}>
                  Prefilled minimum advance: ₹{minimumAdvanceAmount.toLocaleString()}
                </Text>
              )}
            </View>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        <SafeAreaView style={styles.footer} edges={['bottom']}>
          <TouchableOpacity
            style={[styles.bookButton, isSubmitting && styles.bookButtonDisabled]}
            onPress={handleBooking}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={isSubmitting ? ['#475569', '#64748B'] : ['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bookButtonGradient}
            >
              <Text style={styles.bookButtonText}>
                {isSubmitting ? 'Processing...' : 'Confirm Booking'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
        </SafeAreaView>
      </View>
    </ScreenFrame>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: '700' as const,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  eventImage: {
    width: 100,
    height: 100,
  },
  eventInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  eventPrice: {
    fontSize: 20,
    color: '#10B981',
    fontWeight: '700' as const,
  },
  prefillTag: {
    marginTop: 6,
    fontSize: 12,
    color: '#93C5FD',
    fontWeight: '600' as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#E2E8F0',
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  inputError: {
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#FFF',
  },
  textArea: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#FFF',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  prefillHint: {
    fontSize: 12,
    color: '#93C5FD',
    marginTop: 4,
    fontWeight: '500' as const,
  },
  dateQuickPicks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  quickPickButton: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  quickPickText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  errorMessage: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
    fontWeight: '500' as const,
  },
  paymentInfo: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentLabel: {
    fontSize: 15,
    color: '#94A3B8',
  },
  paymentValue: {
    fontSize: 15,
    color: '#E2E8F0',
    fontWeight: '600' as const,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 17,
    color: '#FFF',
    fontWeight: '700' as const,
  },
  totalValue: {
    fontSize: 22,
    color: '#10B981',
    fontWeight: '700' as const,
  },
  addonsGrid: {
    gap: 12,
  },
  addonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 16,
  },
  addonCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  addonIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addonInfo: {
    flex: 1,
  },
  addonName: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  addonDescription: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  addonPrice: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '700' as const,
  },
  addonCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addonCheckActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  bookButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  bookButtonDisabled: {
    opacity: 0.8,
  },
  bookButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 17,
    color: '#FFF',
    fontWeight: '700' as const,
  },
  errorText: {
    color: '#FFF',
    fontSize: 16,
  },
});
