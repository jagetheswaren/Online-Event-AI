import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ChevronLeft, Star, Phone, Mail, MessageCircle, CheckCircle2, Sparkles } from 'lucide-react-native';
import { useUser } from '@/providers/UserProvider';
import { useEvents } from '@/providers/EventProvider';
import { useAdmin } from '@/providers/AdminProvider';
import { openVendorEmail, openVendorMessage, openVendorPhone } from '@/utils/vendorContact';
import {
  buildDreamTeamChatPrefill,
  getDreamTeamDiscountPercent,
  getVendorAiInsights,
} from '@/utils/vendorInsights';
import ScreenFrame from '@/components/ScreenFrame';

const getSingleParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function VendorDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const isSmallScreen = width <= 360;
  const { user } = useUser();
  const { addVendorBooking, getVendorById, vendors } = useEvents();
  const { createVendorBooking } = useAdmin();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');

  const vendorIdParam = getSingleParam(params.id as string | string[] | undefined) || '';
  const dreamTeamRaw = getSingleParam(params.dreamTeam as string | string[] | undefined) || '';
  const teamDiscountParam = Number(getSingleParam(params.teamDiscount as string | string[] | undefined) || '0');
  const dreamTeamIds = dreamTeamRaw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  const vendor = getVendorById(vendorIdParam);

  if (!vendor) {
    return (
      <ScreenFrame>
        <View style={styles.container}>
          <Text style={styles.errorText}>Vendor not found</Text>
        </View>
      </ScreenFrame>
    );
  }

  const aiInsights = getVendorAiInsights(vendor);
  const dreamTeamVendors = vendors.filter((candidate) => dreamTeamIds.includes(candidate.id));
  const hasDreamTeam = dreamTeamVendors.length >= 2;
  const effectiveDreamTeamDiscount =
    teamDiscountParam > 0 ? teamDiscountParam : getDreamTeamDiscountPercent(dreamTeamVendors.length);
  const dreamTeamNames = dreamTeamVendors.map((teamVendor) => teamVendor.name);

  const openSharedPlanningChat = () => {
    if (!hasDreamTeam) return;
    const prefill = buildDreamTeamChatPrefill(dreamTeamVendors, effectiveDreamTeamDiscount);
    router.push(`/ai-chat?prefill=${encodeURIComponent(prefill)}`);
  };

  const openBookingModal = () => {
    if (hasDreamTeam) {
      setNotes(
        `Dream Team bundle (${dreamTeamNames.join(', ')}) - apply ${effectiveDreamTeamDiscount}% bundle discount.`
      );
    } else {
      setNotes('');
    }
    setShowBookingModal(true);
  };

  const handleContact = async (type: 'phone' | 'email' | 'message') => {
    switch (type) {
      case 'phone':
        await openVendorPhone(vendor);
        break;
      case 'email':
        await openVendorEmail(vendor);
        break;
      case 'message':
        await openVendorMessage(vendor);
        break;
    }
  };

  const handleBookVendor = async () => {
    if (!eventDate || !guestCount) {
      Alert.alert('Required', 'Please enter event date and guest count.');
      return;
    }
    const parsedGuests = parseInt(guestCount);
    if (Number.isNaN(parsedGuests) || parsedGuests <= 0) {
      Alert.alert('Invalid guests', 'Enter a valid guest count.');
      return;
    }

    const booking = {
      id: `vendor_booking_${Date.now()}`,
      vendorId: vendor.id,
      vendor,
      userId: user?.id || 'guest_vendor_user',
      user: {
        id: user?.id || 'guest_vendor_user',
        name: user?.name || 'Guest User',
        email: user?.email || 'guest@eventai.com',
        phone: user?.phone || '0000000000',
        avatar: user?.avatar,
        nickname: user?.nickname,
        role: user?.role || 'customer',
      },
      eventDate,
      guestCount: parsedGuests,
      budget: budget ? parseInt(budget) : undefined,
      notes: notes.trim() || undefined,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    addVendorBooking(booking);
    createVendorBooking(booking);
    setShowBookingModal(false);
    setEventDate('');
    setGuestCount('');
    setBudget('');
    setNotes('');
    Alert.alert(
      'Request Sent',
      hasDreamTeam
        ? `Vendor booking request submitted with Dream Team bundle context (${effectiveDreamTeamDiscount}% discount target).`
        : 'Vendor booking request submitted for admin approval.'
    );
  };

  return (
    <ScreenFrame>
      <View style={styles.container}>
        <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: vendor.image }} 
            style={styles.headerImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent']}
            style={styles.headerGradient}
          />
          <SafeAreaView style={styles.headerOverlay} edges={['top']}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <View style={styles.backButtonInner}>
                <ChevronLeft size={24} color="#FFF" />
              </View>
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, isSmallScreen && styles.titleCompact]}>{vendor.name}</Text>
              <View style={styles.ratingBadge}>
                <Star size={16} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>{vendor.rating}</Text>
              </View>
            </View>
            <Text style={styles.reviewCount}>{vendor.reviewCount} reviews</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{vendor.category}</Text>
            </View>
          </View>

          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Price Range</Text>
            <Text style={styles.priceValue}>{vendor.priceRange}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vendor AI Match Score</Text>
            <View style={styles.aiMatchCard}>
              <View style={styles.aiMatchHeader}>
                <View style={styles.aiMatchBadge}>
                  <Sparkles size={16} color="#FCD34D" />
                  <Text style={styles.aiMatchBadgeText}>Compatibility {aiInsights.compatibilityScore}%</Text>
                </View>
                <Text style={styles.aiMatchSuccessText}>
                  Similar event success {aiInsights.similarEventSuccessRate}%
                </Text>
              </View>
              <Text style={styles.aiMatchReasonTitle}>Why this vendor matches your event:</Text>
              {aiInsights.matchReasons.map((reason, index) => (
                <Text key={index} style={styles.aiMatchReasonText}>
                  • {reason}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vendor Performance Analytics</Text>
            <View style={styles.analyticsCard}>
              <View style={styles.analyticsRow}>
                <Text style={styles.analyticsLabel}>On-time delivery</Text>
                <Text style={styles.analyticsValue}>{aiInsights.onTimeRate}%</Text>
              </View>
              <View style={styles.analyticsRow}>
                <Text style={styles.analyticsLabel}>Repeat booking rate</Text>
                <Text style={styles.analyticsValue}>{aiInsights.repeatBookingRate}%</Text>
              </View>
              <Text style={styles.analyticsGraphTitle}>Client satisfaction trend</Text>
              <View style={styles.analyticsGraph}>
                {aiInsights.satisfactionTrend.map((point, index) => (
                  <View key={index} style={styles.analyticsBarWrap}>
                    <View
                      style={[
                        styles.analyticsBar,
                        {
                          height: 14 + Math.round(point * 0.36),
                        },
                      ]}
                    />
                    <Text style={styles.analyticsBarLabel}>{point}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instant Collaboration Mode</Text>
            <View style={styles.collaborationCard}>
              {hasDreamTeam ? (
                <>
                  <Text style={styles.collaborationTitle}>Dream Team Active</Text>
                  <Text style={styles.collaborationSummary}>
                    {dreamTeamNames.join(' • ')}
                  </Text>
                  <Text style={styles.collaborationDiscount}>
                    {effectiveDreamTeamDiscount}% bundle discount if booked together
                  </Text>
                  <TouchableOpacity
                    style={styles.collaborationChatButton}
                    onPress={openSharedPlanningChat}
                  >
                    <MessageCircle size={16} color="#BFDBFE" />
                    <Text style={styles.collaborationChatButtonText}>Open Shared Planning Chat Room</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.collaborationTitle}>Build Your Dream Team</Text>
                  <Text style={styles.collaborationSummary}>
                    Bundle 2+ vendors to unlock a shared planning chat room and automatic package discounts.
                  </Text>
                  <TouchableOpacity
                    style={styles.collaborationBuildButton}
                    onPress={() => router.push('/vendors')}
                  >
                    <Text style={styles.collaborationBuildButtonText}>Go to Vendor Marketplace</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{vendor.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services</Text>
            <View style={styles.servicesGrid}>
              {vendor.services.map((service, index) => (
                <View key={index} style={styles.serviceItem}>
                  <CheckCircle2 size={20} color="#10B981" />
                  <Text style={styles.serviceText}>{service}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portfolio</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.portfolioScroll}
            >
              {vendor.portfolio.map((image, index) => (
                <Image 
                  key={index}
                  source={{ uri: image }}
                  style={[styles.portfolioImage, { width: Math.min(width * 0.72, 280) }]}
                  contentFit="cover"
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.contactSection}>
            <Text style={styles.sectionTitle}>Get in Touch</Text>
            <View style={[styles.contactButtons, isSmallScreen && styles.contactButtonsCompact]}>
              <TouchableOpacity 
                style={[styles.contactButton, isSmallScreen && styles.contactButtonCompact]}
                onPress={() => {
                  void handleContact('phone');
                }}
              >
                <Phone size={20} color="#3B82F6" />
                <Text style={styles.contactButtonText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.contactButton, isSmallScreen && styles.contactButtonCompact]}
                onPress={() => {
                  void handleContact('email');
                }}
              >
                <Mail size={20} color="#8B5CF6" />
                <Text style={styles.contactButtonText}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.contactButton, isSmallScreen && styles.contactButtonCompact]}
                onPress={() => {
                  void handleContact('message');
                }}
              >
                <MessageCircle size={20} color="#10B981" />
                <Text style={styles.contactButtonText}>Message</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <LinearGradient
          colors={['transparent', '#0F172A']}
          style={styles.footerGradient}
        />
        <SafeAreaView style={styles.footerContent} edges={['bottom']}>
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={openBookingModal}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bookButtonGradient}
            >
              <Text style={styles.bookButtonText}>Book This Vendor</Text>
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      <Modal
        visible={showBookingModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBookingModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Book {vendor.name}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Event date (YYYY-MM-DD)"
              placeholderTextColor="#64748B"
              value={eventDate}
              onChangeText={setEventDate}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Guest count"
              placeholderTextColor="#64748B"
              value={guestCount}
              onChangeText={setGuestCount}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Budget (optional)"
              placeholderTextColor="#64748B"
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Notes (optional)"
              placeholderTextColor="#64748B"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowBookingModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleBookVendor}>
                <Text style={styles.modalConfirmText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imageContainer: {
    height: 320,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  backButton: {
    margin: 20,
  },
  backButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
  },
  titleSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 28,
    color: '#FFF',
    fontWeight: '700' as const,
  },
  titleCompact: {
    fontSize: 24,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 16,
    color: '#F59E0B',
    fontWeight: '700' as const,
  },
  reviewCount: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 12,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#3B82F620',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '700' as const,
    textTransform: 'capitalize',
  },
  priceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 6,
  },
  priceValue: {
    fontSize: 24,
    color: '#10B981',
    fontWeight: '700' as const,
  },
  aiMatchCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0F172A',
    padding: 14,
    gap: 8,
  },
  aiMatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  aiMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F59E0B20',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  aiMatchBadgeText: {
    fontSize: 13,
    color: '#FCD34D',
    fontWeight: '700' as const,
  },
  aiMatchSuccessText: {
    fontSize: 12,
    color: '#A5B4FC',
    fontWeight: '600' as const,
  },
  aiMatchReasonTitle: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '700' as const,
    marginTop: 2,
  },
  aiMatchReasonText: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 19,
  },
  analyticsCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    padding: 14,
    gap: 10,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  analyticsLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600' as const,
  },
  analyticsValue: {
    fontSize: 14,
    color: '#E2E8F0',
    fontWeight: '700' as const,
  },
  analyticsGraphTitle: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '700' as const,
    marginTop: 2,
  },
  analyticsGraph: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
    minHeight: 90,
    paddingTop: 6,
  },
  analyticsBarWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  analyticsBar: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: '#3B82F6',
    minHeight: 14,
  },
  analyticsBarLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600' as const,
  },
  collaborationCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    padding: 14,
    gap: 9,
  },
  collaborationTitle: {
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '700' as const,
  },
  collaborationSummary: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 19,
  },
  collaborationDiscount: {
    fontSize: 13,
    color: '#86EFAC',
    fontWeight: '700' as const,
  },
  collaborationChatButton: {
    marginTop: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3B82F699',
    backgroundColor: '#1E3A8A44',
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  collaborationChatButtonText: {
    fontSize: 12,
    color: '#BFDBFE',
    fontWeight: '700' as const,
  },
  collaborationBuildButton: {
    marginTop: 2,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collaborationBuildButtonText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '700' as const,
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
  description: {
    fontSize: 15,
    color: '#CBD5E1',
    lineHeight: 24,
  },
  servicesGrid: {
    gap: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceText: {
    fontSize: 15,
    color: '#E2E8F0',
    fontWeight: '500' as const,
  },
  portfolioScroll: {
    gap: 12,
  },
  portfolioImage: {
    height: 200,
    borderRadius: 16,
  },
  contactSection: {
    marginBottom: 24,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButtonsCompact: {
    flexWrap: 'wrap',
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    borderRadius: 12,
  },
  contactButtonCompact: {
    flex: 0,
    width: '48%',
    minWidth: 128,
    flexDirection: 'column',
    gap: 6,
    paddingVertical: 12,
  },
  contactButtonText: {
    fontSize: 14,
    color: '#E2E8F0',
    fontWeight: '600' as const,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerGradient: {
    height: 100,
  },
  footerContent: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  bookButton: {
    borderRadius: 16,
    overflow: 'hidden',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    color: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalTextArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  modalCancel: {
    backgroundColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalCancelText: {
    color: '#E2E8F0',
    fontWeight: '600' as const,
  },
  modalConfirm: {
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalConfirmText: {
    color: '#FFF',
    fontWeight: '700' as const,
  },
});
