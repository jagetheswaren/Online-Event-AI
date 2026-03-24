import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState, useRef } from 'react';
import { ChevronLeft, MessageCircle, Search, Sparkles, Star, Users } from 'lucide-react-native';
import { Vendor } from '@/types';
import TopMenuBar from '@/components/TopMenuBar';
import { useEvents } from '@/providers/EventProvider';
import { openVendorMessage } from '@/utils/vendorContact';
import ScreenFrame from '@/components/ScreenFrame';
import TiltCard from '@/components/TiltCard';
import { theme } from '@/constants/theme';
import {
  buildDreamTeamChatPrefill,
  getDreamTeamDiscountPercent,
  getVendorAiInsights,
  type VendorAiInsights,
} from '@/utils/vendorInsights';

export default function VendorsScreen() {
  const router = useRouter();
  const { vendors } = useEvents();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dreamTeamMode, setDreamTeamMode] = useState(false);
  const [dreamTeamVendorIds, setDreamTeamVendorIds] = useState<string[]>([]);
  const scrollY = useRef(new Animated.Value(0)).current;

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'caterer', name: 'Caterers' },
    { id: 'decorator', name: 'Decorators' },
    { id: 'photographer', name: 'Photographers' },
    { id: 'music', name: 'Music' },
  ];

  const filteredVendors = useMemo(
    () =>
      vendors.filter((vendor) => {
        if (selectedCategory !== 'all' && vendor.category !== selectedCategory) {
          return false;
        }
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          return (
            vendor.name.toLowerCase().includes(query) ||
            vendor.description.toLowerCase().includes(query)
          );
        }
        return true;
      }),
    [vendors, searchQuery, selectedCategory]
  );

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 140],
    outputRange: [0, -12],
    extrapolate: 'clamp',
  });

  const dreamTeamVendors = useMemo(
    () => vendors.filter((vendor) => dreamTeamVendorIds.includes(vendor.id)),
    [vendors, dreamTeamVendorIds]
  );

  const dreamTeamDiscount = getDreamTeamDiscountPercent(dreamTeamVendors.length);

  const aiInsightsMap = useMemo(() => {
    const map = new Map<string, VendorAiInsights>();
    filteredVendors.forEach((vendor) => {
      map.set(
        vendor.id,
        getVendorAiInsights(vendor, {
          selectedCategory,
        })
      );
    });
    return map;
  }, [filteredVendors, selectedCategory]);

  const toggleVendorInDreamTeam = (vendorId: string) => {
    setDreamTeamVendorIds((prev) =>
      prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]
    );
  };

  const openDreamTeamChatRoom = () => {
    if (dreamTeamVendors.length < 2) {
      Alert.alert('Dream Team', 'Select at least 2 vendors to start a collaboration room.');
      return;
    }

    const prefill = buildDreamTeamChatPrefill(dreamTeamVendors, dreamTeamDiscount);
    router.push(`/ai-chat?prefill=${encodeURIComponent(prefill)}`);
  };

  const openBundleBooking = () => {
    if (dreamTeamVendors.length < 2) {
      Alert.alert('Dream Team', 'Add at least 2 vendors to unlock bundle booking.');
      return;
    }

    const leadVendor = dreamTeamVendors[0];
    router.push({
      pathname: '/vendor-detail',
      params: {
        id: leadVendor.id,
        dreamTeam: dreamTeamVendors.map((vendor) => vendor.id).join(','),
        teamDiscount: String(dreamTeamDiscount),
      },
    });
  };

  return (
    <ScreenFrame>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <TopMenuBar />
        <Animated.View style={[styles.topGlass, { transform: [{ translateY: headerTranslate }] }]}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Vendor Marketplace</Text>
            <View style={styles.backButton} />
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <Search size={20} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search vendors..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category.id && styles.categoryChipTextActive
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            {}
          )}
        >
          <View style={styles.resultHeader}>
            <Text style={styles.resultCount}>
              {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''} found
            </Text>
            <TouchableOpacity
              style={[styles.dreamTeamToggle, dreamTeamMode && styles.dreamTeamToggleActive]}
              onPress={() => setDreamTeamMode((prev) => !prev)}
            >
              <Sparkles size={14} color={dreamTeamMode ? '#FFF' : '#A5B4FC'} />
              <Text
                style={[
                  styles.dreamTeamToggleText,
                  dreamTeamMode && styles.dreamTeamToggleTextActive,
                ]}
              >
                Dream Team Mode
              </Text>
            </TouchableOpacity>
          </View>
          
          {filteredVendors.map((vendor) => (
            <VendorCard 
              key={vendor.id} 
              vendor={vendor}
              insights={aiInsightsMap.get(vendor.id) || getVendorAiInsights(vendor)}
              dreamTeamMode={dreamTeamMode}
              inDreamTeam={dreamTeamVendorIds.includes(vendor.id)}
              onPress={() =>
                router.push({
                  pathname: '/vendor-detail',
                  params: {
                    id: vendor.id,
                    dreamTeam: dreamTeamVendorIds.join(','),
                    teamDiscount: String(dreamTeamDiscount),
                  },
                })
              }
              onMessage={() => {
                void openVendorMessage(vendor);
              }}
              onToggleDreamTeam={() => toggleVendorInDreamTeam(vendor.id)}
            />
          ))}

          <View style={{ height: dreamTeamMode && dreamTeamVendors.length > 0 ? 180 : 20 }} />
        </Animated.ScrollView>

        {dreamTeamMode && dreamTeamVendors.length > 0 && (
          <View style={styles.dreamTeamDock}>
            <LinearGradient
              colors={['#1E293B', '#0F172A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.dreamTeamDockGradient}
            >
              <View style={styles.dreamTeamDockHeader}>
                <Text style={styles.dreamTeamDockTitle}>
                  Dream Team: {dreamTeamVendors.length} vendor
                  {dreamTeamVendors.length !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.dreamTeamDiscountText}>
                  Bundle discount: {dreamTeamDiscount}%
                </Text>
              </View>
              <Text style={styles.dreamTeamNames} numberOfLines={2}>
                {dreamTeamVendors.map((vendor) => vendor.name).join(' • ')}
              </Text>
              <View style={styles.dreamTeamActions}>
                <TouchableOpacity style={styles.dreamTeamChatButton} onPress={openDreamTeamChatRoom}>
                  <MessageCircle size={16} color="#BFDBFE" />
                  <Text style={styles.dreamTeamChatButtonText}>Shared Planning Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dreamTeamBookButton} onPress={openBundleBooking}>
                  <Text style={styles.dreamTeamBookButtonText}>Bundle Booking</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        )}
      </SafeAreaView>
    </ScreenFrame>
  );
}

function VendorCard({
  vendor,
  insights,
  dreamTeamMode,
  inDreamTeam,
  onPress,
  onMessage,
  onToggleDreamTeam,
}: {
  vendor: Vendor;
  insights: VendorAiInsights;
  dreamTeamMode: boolean;
  inDreamTeam: boolean;
  onPress: () => void;
  onMessage: () => void;
  onToggleDreamTeam: () => void;
}) {
  return (
    <TiltCard style={styles.vendorCard} onPress={onPress} intensity={1.2}>
      <Image 
        source={{ uri: vendor.image }} 
        style={styles.vendorImage}
        contentFit="cover"
      />
      <View style={styles.vendorContent}>
        <View style={styles.vendorHeader}>
          <Text style={styles.vendorName} numberOfLines={1}>{vendor.name}</Text>
          <View style={styles.headerBadges}>
            {inDreamTeam && (
              <View style={styles.teamBadge}>
                <Text style={styles.teamBadgeText}>Dream Team</Text>
              </View>
            )}
            <View style={styles.ratingBadge}>
              <Star size={14} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>{vendor.rating}</Text>
            </View>
          </View>
        </View>

        <View style={styles.categoryPill}>
          <Text style={styles.categoryPillText}>{vendor.category}</Text>
        </View>
        
        <Text style={styles.vendorDescription} numberOfLines={2}>
          {vendor.description}
        </Text>

        <View style={styles.servicesRow}>
          {vendor.services.slice(0, 2).map((service, index) => (
            <View key={index} style={styles.serviceTag}>
              <Text style={styles.serviceTagText}>{service}</Text>
            </View>
          ))}
          {vendor.services.length > 2 && (
            <Text style={styles.moreServices}>+{vendor.services.length - 2} more</Text>
          )}
        </View>

        <View style={styles.vendorFooter}>
          <View style={styles.reviewCount}>
            <Users size={14} color="#94A3B8" />
            <Text style={styles.reviewCountText}>{vendor.reviewCount} reviews</Text>
          </View>
          <Text style={styles.priceRange}>{vendor.priceRange}</Text>
        </View>

        <View style={styles.aiMatchCard}>
          <View style={styles.aiMatchHeader}>
            <View style={styles.aiMatchBadge}>
              <Sparkles size={14} color="#FCD34D" />
              <Text style={styles.aiMatchBadgeText}>AI Match {insights.compatibilityScore}%</Text>
            </View>
            <Text style={styles.aiSuccessText}>
              Similar success {insights.similarEventSuccessRate}%
            </Text>
          </View>
          <Text style={styles.aiReasonText} numberOfLines={2}>
            {insights.matchReasons[0]}
          </Text>
          <View style={styles.analyticsQuickRow}>
            <Text style={styles.analyticsQuickMetric}>On-time {insights.onTimeRate}%</Text>
            <Text style={styles.analyticsQuickMetric}>
              Repeat bookings {insights.repeatBookingRate}%
            </Text>
          </View>
          <View style={styles.satisfactionGraph}>
            {insights.satisfactionTrend.map((point, index) => (
              <View
                key={`s-${index}`}
                style={[
                  styles.satisfactionBar,
                  {
                    height: 12 + Math.round(point * 0.26),
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {dreamTeamMode && (
          <TouchableOpacity
            style={[styles.teamSelectButton, inDreamTeam && styles.teamSelectButtonActive]}
            onPress={(event) => {
              event.stopPropagation();
              onToggleDreamTeam();
            }}
          >
            <Text style={[styles.teamSelectButtonText, inDreamTeam && styles.teamSelectButtonTextActive]}>
              {inDreamTeam ? 'In Dream Team' : 'Add to Dream Team'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.messageButton}
          onPress={(event) => {
            event.stopPropagation();
            onMessage();
          }}
        >
          <MessageCircle size={16} color="#10B981" />
          <Text style={styles.messageButtonText}>Message Vendor</Text>
        </TouchableOpacity>
      </View>
    </TiltCard>
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
  topGlass: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    paddingBottom: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: theme.colors.lineSoft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
  },
  categoriesScroll: {
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600' as const,
  },
  categoryChipTextActive: {
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  resultCount: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500' as const,
  },
  dreamTeamToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#4F46E5',
    backgroundColor: '#312E8120',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  dreamTeamToggleActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  dreamTeamToggleText: {
    fontSize: 12,
    color: '#A5B4FC',
    fontWeight: '700' as const,
  },
  dreamTeamToggleTextActive: {
    color: '#FFF',
  },
  vendorCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  vendorImage: {
    width: '100%',
    height: 180,
  },
  vendorContent: {
    padding: 16,
    gap: 12,
  },
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  vendorName: {
    flex: 1,
    fontSize: 18,
    color: theme.colors.text,
    fontFamily: theme.fonts.semibold,
  },
  headerBadges: {
    alignItems: 'flex-end',
    gap: 6,
  },
  teamBadge: {
    backgroundColor: 'rgba(45, 212, 191, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.35)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  teamBadgeText: {
    fontSize: 10,
    color: theme.colors.accent,
    fontFamily: theme.fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ratingText: {
    fontSize: 13,
    color: '#F59E0B',
    fontFamily: theme.fonts.bold,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryPillText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontFamily: theme.fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  vendorDescription: {
    fontSize: 14,
    color: theme.colors.textDim,
    lineHeight: 20,
  },
  servicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  serviceTag: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  serviceTagText: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '600' as const,
  },
  moreServices: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600' as const,
  },
  vendorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiMatchCard: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    backgroundColor: '#0F172A',
    padding: 10,
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
    gap: 5,
    backgroundColor: '#F59E0B20',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  aiMatchBadgeText: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  aiSuccessText: {
    fontSize: 12,
    color: '#A5B4FC',
    fontWeight: '600' as const,
  },
  aiReasonText: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 17,
  },
  analyticsQuickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  analyticsQuickMetric: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600' as const,
  },
  satisfactionGraph: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 44,
  },
  satisfactionBar: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: '#3B82F6',
    minHeight: 12,
  },
  teamSelectButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4338CA',
    backgroundColor: '#312E8122',
    paddingVertical: 9,
    alignItems: 'center',
  },
  teamSelectButtonActive: {
    borderColor: '#10B981',
    backgroundColor: '#064E3B',
  },
  teamSelectButtonText: {
    fontSize: 13,
    color: '#A5B4FC',
    fontWeight: '700' as const,
  },
  teamSelectButtonTextActive: {
    color: '#A7F3D0',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B98120',
    borderWidth: 1,
    borderColor: '#10B98155',
    borderRadius: 10,
    paddingVertical: 10,
  },
  messageButtonText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '700' as const,
  },
  reviewCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewCountText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  priceRange: {
    fontSize: 15,
    color: '#10B981',
    fontWeight: '700' as const,
  },
  dreamTeamDock: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  dreamTeamDockGradient: {
    padding: 14,
    gap: 10,
  },
  dreamTeamDockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  dreamTeamDockTitle: {
    fontSize: 14,
    color: '#E2E8F0',
    fontWeight: '700' as const,
  },
  dreamTeamDiscountText: {
    fontSize: 13,
    color: '#86EFAC',
    fontWeight: '700' as const,
  },
  dreamTeamNames: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 17,
  },
  dreamTeamActions: {
    flexDirection: 'row',
    gap: 8,
  },
  dreamTeamChatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3B82F699',
    backgroundColor: '#1E3A8A44',
    paddingVertical: 10,
  },
  dreamTeamChatButtonText: {
    fontSize: 12,
    color: '#BFDBFE',
    fontWeight: '700' as const,
  },
  dreamTeamBookButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  dreamTeamBookButtonText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '800' as const,
  },
});
