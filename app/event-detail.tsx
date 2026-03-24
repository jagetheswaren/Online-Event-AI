import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, useWindowDimensions, PanResponder, type PanResponderInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Star, Clock, Users, CheckCircle2, Sparkles, MessageSquare, Calculator, ArrowRight } from 'lucide-react-native';
import { useEvents } from '@/providers/EventProvider';
import { useUser } from '@/providers/UserProvider';
import { Review } from '@/types';
import ScreenFrame from '@/components/ScreenFrame';

type LightingMode = 'day' | 'night';
type VenueTheme = 'classic' | 'garden' | 'modern';
type TableLayout = 'round' | 'banquet' | 'uShape';
type DecorItemId = 'mainStage' | 'photoPoint' | 'dessertStation';

type DecorPosition = { x: number; y: number };

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const roundToStep = (value: number, step: number) =>
  Math.round(value / step) * step;

const THEME_OPTIONS: { id: VenueTheme; label: string }[] = [
  { id: 'classic', label: 'Classic Gold' },
  { id: 'garden', label: 'Garden Fresh' },
  { id: 'modern', label: 'Modern Luxe' },
];

const TABLE_LAYOUT_OPTIONS: { id: TableLayout; label: string }[] = [
  { id: 'round', label: 'Round Tables' },
  { id: 'banquet', label: 'Banquet Rows' },
  { id: 'uShape', label: 'U-Shape Setup' },
];

const DECOR_ITEMS: { id: DecorItemId; label: string; color: string }[] = [
  { id: 'mainStage', label: 'Main Stage', color: '#F59E0B' },
  { id: 'photoPoint', label: 'Photo Spot', color: '#3B82F6' },
  { id: 'dessertStation', label: 'Dessert Bar', color: '#10B981' },
];

const INITIAL_DECOR_POSITIONS: Record<DecorItemId, DecorPosition> = {
  mainStage: { x: 0.5, y: 0.2 },
  photoPoint: { x: 0.22, y: 0.66 },
  dessertStation: { x: 0.78, y: 0.62 },
};

export default function EventDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const isSmallScreen = width <= 360;
  const { getEventById, getReviewsByEvent, addReview } = useEvents();
  const { user } = useUser();
  const tabParam = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const openReviewParam = Array.isArray(params.openReview) ? params.openReview[0] : params.openReview;

  const event = getEventById(params.id as string);
  const reviews = event ? getReviewsByEvent(event.id) : [];
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>(
    tabParam === 'reviews' ? 'reviews' : 'overview'
  );
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [lightingMode, setLightingMode] = useState<LightingMode>('day');
  const [venueTheme, setVenueTheme] = useState<VenueTheme>('classic');
  const [tableLayout, setTableLayout] = useState<TableLayout>('round');
  const [decorPositions, setDecorPositions] = useState<Record<DecorItemId, DecorPosition>>(INITIAL_DECOR_POSITIONS);
  const [draggingDecorId, setDraggingDecorId] = useState<DecorItemId | null>(null);
  const [previewBounds, setPreviewBounds] = useState({ width: 1, height: 1 });
  const [guestCountSlider, setGuestCountSlider] = useState(120);
  const [decorLevelSlider, setDecorLevelSlider] = useState(5);
  const [entertainmentLevelSlider, setEntertainmentLevelSlider] = useState(5);
  const [compareModeEnabled, setCompareModeEnabled] = useState(false);

  useEffect(() => {
    if (tabParam === 'reviews') {
      setActiveTab('reviews');
    }
  }, [tabParam]);

  useEffect(() => {
    if (openReviewParam === '1' || openReviewParam === 'true') {
      setActiveTab('reviews');
      setShowReviewModal(true);
    }
  }, [openReviewParam]);

  if (!event) {
    return (
      <ScreenFrame>
        <View style={styles.container}>
          <Text style={styles.errorText}>Event not found</Text>
        </View>
      </ScreenFrame>
    );
  }

  const fallbackReviews: Review[] = [
    {
      id: '1',
      eventId: event.id,
      userId: '1',
      userName: 'Priya Sharma',
      userAvatar: 'https://i.pravatar.cc/150?img=1',
      rating: 5,
      comment: 'Amazing service! The AI room transformation feature helped us visualize everything perfectly. Highly recommend!',
      date: '2024-01-15',
    },
    {
      id: '2',
      eventId: event.id,
      userId: '2',
      userName: 'Raj Kumar',
      userAvatar: 'https://i.pravatar.cc/150?img=2',
      rating: 4,
      comment: 'Great experience overall. The planning was smooth and the team was very professional.',
      date: '2024-01-10',
    },
  ];

  const visibleReviews = reviews.length > 0 ? reviews : fallbackReviews;
  const displayedRating = reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : event.rating.toFixed(1);
  const displayedReviewCount = reviews.length > 0 ? reviews.length : event.reviewCount;

  const themePreset = (() => {
    if (venueTheme === 'garden') {
      return lightingMode === 'night'
        ? {
            previewGradient: ['#0B1A14', '#102A1F'],
            floorColor: '#1B4332',
            gridColor: 'rgba(134, 239, 172, 0.25)',
            tableColor: '#86EFAC',
            accentText: 'Moonlit garden setup',
          }
        : {
            previewGradient: ['#D9F99D', '#86EFAC'],
            floorColor: '#EAF6D2',
            gridColor: 'rgba(15, 118, 110, 0.25)',
            tableColor: '#0F766E',
            accentText: 'Fresh daytime garden setup',
          };
    }

    if (venueTheme === 'modern') {
      return lightingMode === 'night'
        ? {
            previewGradient: ['#111827', '#1F2937'],
            floorColor: '#1E293B',
            gridColor: 'rgba(148, 163, 184, 0.3)',
            tableColor: '#E2E8F0',
            accentText: 'Night lounge lighting',
          }
        : {
            previewGradient: ['#DBEAFE', '#BFDBFE'],
            floorColor: '#E5E7EB',
            gridColor: 'rgba(71, 85, 105, 0.25)',
            tableColor: '#334155',
            accentText: 'Minimalist daylight theme',
          };
    }

    return lightingMode === 'night'
      ? {
          previewGradient: ['#2B1A05', '#3D2808'],
          floorColor: '#4A3310',
          gridColor: 'rgba(251, 191, 36, 0.25)',
          tableColor: '#FBBF24',
          accentText: 'Golden evening ambience',
        }
      : {
          previewGradient: ['#FDE68A', '#FECACA'],
          floorColor: '#FEF3C7',
          gridColor: 'rgba(202, 138, 4, 0.2)',
          tableColor: '#B45309',
          accentText: 'Warm classic daytime setup',
        };
  })();

  const tablePreviewPoints = (() => {
    if (tableLayout === 'banquet') {
      return [
        { x: 0.18, y: 0.28 },
        { x: 0.18, y: 0.5 },
        { x: 0.18, y: 0.72 },
        { x: 0.82, y: 0.28 },
        { x: 0.82, y: 0.5 },
        { x: 0.82, y: 0.72 },
      ];
    }

    if (tableLayout === 'uShape') {
      return [
        { x: 0.2, y: 0.22 },
        { x: 0.2, y: 0.45 },
        { x: 0.2, y: 0.68 },
        { x: 0.5, y: 0.68 },
        { x: 0.8, y: 0.22 },
        { x: 0.8, y: 0.45 },
        { x: 0.8, y: 0.68 },
      ];
    }

    return [
      { x: 0.25, y: 0.3 },
      { x: 0.5, y: 0.3 },
      { x: 0.75, y: 0.3 },
      { x: 0.25, y: 0.6 },
      { x: 0.5, y: 0.6 },
      { x: 0.75, y: 0.6 },
    ];
  })();

  const guestAdjustment = (guestCountSlider - 120) * Math.max(100, Math.round(event.price * 0.006));
  const decorAdjustment = Math.round((decorLevelSlider - 5) * event.price * 0.055);
  const entertainmentAdjustment = Math.round((entertainmentLevelSlider - 5) * event.price * 0.045);
  const liveEstimate = roundToStep(
    Math.max(Math.round(event.price * 0.65), event.price + guestAdjustment + decorAdjustment + entertainmentAdjustment),
    100
  );
  const hasCustomizationChanges =
    guestCountSlider !== 120 || decorLevelSlider !== 5 || entertainmentLevelSlider !== 5;

  const tiers = [
    {
      id: 'basic',
      name: 'Birthday Basic',
      multiplier: 0.84,
      accent: '#38BDF8',
      guestScale: 0.85,
      decorDelta: -2,
      entertainmentDelta: -2,
      support: 'Phone + email support',
      deliverable: '2 layout concepts',
    },
    {
      id: 'premium',
      name: 'Premium',
      multiplier: 1,
      accent: '#F59E0B',
      guestScale: 1,
      decorDelta: 0,
      entertainmentDelta: 0,
      support: 'Dedicated event planner',
      deliverable: '5 concepts + AI previews',
    },
    {
      id: 'luxury',
      name: 'Luxury',
      multiplier: 1.32,
      accent: '#A78BFA',
      guestScale: 1.2,
      decorDelta: 2,
      entertainmentDelta: 3,
      support: 'On-site premium team',
      deliverable: 'Unlimited revisions + 3D storyboard',
    },
  ] as const;

  const packageComparisons = tiers.map((tier) => ({
    ...tier,
    estimate: roundToStep(Math.max(5000, liveEstimate * tier.multiplier), 100),
    guestCapacity: Math.max(30, Math.round(guestCountSlider * tier.guestScale)),
    decorScore: clamp(decorLevelSlider + tier.decorDelta, 1, 10),
    entertainmentScore: clamp(entertainmentLevelSlider + tier.entertainmentDelta, 1, 10),
  }));

  const intensity = decorLevelSlider + entertainmentLevelSlider + (guestCountSlider >= 180 ? 2 : 0);
  const recommendedTierId = intensity >= 17 ? 'luxury' : intensity >= 12 ? 'premium' : 'basic';

  const recommendedPackage =
    packageComparisons.find((item) => item.id === recommendedTierId) || packageComparisons[1];

  const updateDecorPosition = (id: DecorItemId, nextPosition: DecorPosition) => {
    setDecorPositions((prev) => ({
      ...prev,
      [id]: nextPosition,
    }));
  };

  const submitReview = () => {
    if (newReviewText.trim().length < 10) {
      Alert.alert('Review too short', 'Please add at least 10 characters.');
      return;
    }

    addReview({
      id: `review_${Date.now()}`,
      eventId: event.id,
      userId: user?.id || 'guest_user',
      userName: user?.name || 'Guest User',
      userAvatar: user?.avatar || 'https://i.pravatar.cc/150?img=5',
      rating: newReviewRating,
      comment: newReviewText.trim(),
      date: new Date().toISOString(),
    });

    setShowReviewModal(false);
    setNewReviewText('');
    setNewReviewRating(5);
    Alert.alert('Thanks!', 'Your review has been added.');
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
            source={{ uri: event.image }}
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
              <Text style={[styles.title, isSmallScreen && styles.titleCompact]}>{event.title}</Text>
              <View style={styles.ratingBadge}>
                <Star size={16} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>{displayedRating}</Text>
              </View>
            </View>
            <Text style={styles.reviewCount}>{displayedReviewCount} reviews</Text>
          </View>

          <View style={[styles.metaRow, isSmallScreen && styles.metaRowCompact]}>
            <View style={[styles.metaItem, isSmallScreen && styles.metaItemCompact]}>
              <Clock size={18} color="#3B82F6" />
              <Text style={styles.metaText}>{event.duration}</Text>
            </View>
            <View style={[styles.metaItem, isSmallScreen && styles.metaItemCompact]}>
              <Users size={18} color="#8B5CF6" />
              <Text style={styles.metaText}>Professional Team</Text>
            </View>
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
              onPress={() => setActiveTab('overview')}
            >
              <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
                Overview
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
              onPress={() => setActiveTab('reviews')}
            >
              <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
                Reviews
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'overview' ? (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About This Event</Text>
                <Text style={styles.description}>{event.description}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>What is Included</Text>
                <View style={styles.featuresList}>
                  {event.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <CheckCircle2 size={20} color="#10B981" />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <View style={[styles.sectionHeaderRow, isSmallScreen && styles.sectionHeaderRowCompact]}>
                  <Text style={styles.sectionTitle}>3D Venue Preview</Text>
                  <Text style={styles.sectionSubtle}>Drag decor blocks and preview instantly</Text>
                </View>

                <View style={styles.controlGroup}>
                  <Text style={styles.controlLabel}>Lighting</Text>
                  <View style={styles.optionRow}>
                    {(['day', 'night'] as const).map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.optionChip,
                          lightingMode === option && styles.optionChipActive,
                        ]}
                        onPress={() => setLightingMode(option)}
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            lightingMode === option && styles.optionChipTextActive,
                          ]}
                        >
                          {option === 'day' ? 'Day' : 'Night'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.controlGroup}>
                  <Text style={styles.controlLabel}>Theme</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.optionScrollRow}
                  >
                    {THEME_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.optionChip,
                          venueTheme === option.id && styles.optionChipActive,
                        ]}
                        onPress={() => setVenueTheme(option.id)}
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            venueTheme === option.id && styles.optionChipTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.controlGroup}>
                  <Text style={styles.controlLabel}>Table Layout</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.optionScrollRow}
                  >
                    {TABLE_LAYOUT_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.optionChip,
                          tableLayout === option.id && styles.optionChipActive,
                        ]}
                        onPress={() => setTableLayout(option.id)}
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            tableLayout === option.id && styles.optionChipTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.venuePreviewCard}>
                  <LinearGradient colors={themePreset.previewGradient} style={styles.venuePreviewGradient}>
                    <View
                      style={styles.venueStage}
                      onLayout={(layoutEvent) => {
                        const { width: stageWidth, height: stageHeight } = layoutEvent.nativeEvent.layout;
                        setPreviewBounds({
                          width: Math.max(stageWidth, 1),
                          height: Math.max(stageHeight, 1),
                        });
                      }}
                    >
                      <View style={[styles.venueFloor, { backgroundColor: themePreset.floorColor }]}>
                        <View style={[styles.venueGridLayer, { borderColor: themePreset.gridColor }]} />
                      </View>

                      {tablePreviewPoints.map((point, index) => (
                        <View
                          key={`table-${index}`}
                          style={[
                            styles.tableNode,
                            {
                              left: `${point.x * 100}%`,
                              top: `${point.y * 100}%`,
                              backgroundColor: themePreset.tableColor,
                            },
                          ]}
                        />
                      ))}

                      {DECOR_ITEMS.map((decorItem) => (
                        <DraggableDecorMarker
                          key={decorItem.id}
                          id={decorItem.id}
                          label={decorItem.label}
                          color={decorItem.color}
                          position={decorPositions[decorItem.id]}
                          previewWidth={previewBounds.width}
                          previewHeight={previewBounds.height}
                          isDragging={draggingDecorId === decorItem.id}
                          onDragStateChange={(active) => {
                            setDraggingDecorId(active ? decorItem.id : null);
                          }}
                          onMove={updateDecorPosition}
                        />
                      ))}
                    </View>

                    <View style={styles.venuePreviewFooter}>
                      <Text style={styles.venuePreviewHint}>
                        {draggingDecorId ? 'Release to drop decor' : 'Press and drag to reposition decor'}
                      </Text>
                      <Text style={styles.venuePreviewAccent}>{themePreset.accentText}</Text>
                    </View>
                  </LinearGradient>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Event Customization Slider</Text>
                <Text style={styles.sectionSubtle}>
                  Adjust guest count, decor intensity, and entertainment to tune your package live.
                </Text>

                <View style={styles.customizationCard}>
                  <EventCustomizationSlider
                    label="Guest Count"
                    value={guestCountSlider}
                    min={40}
                    max={500}
                    step={10}
                    accentColor="#3B82F6"
                    suffix=" guests"
                    onChange={setGuestCountSlider}
                  />
                  <EventCustomizationSlider
                    label="Decor Level"
                    value={decorLevelSlider}
                    min={1}
                    max={10}
                    step={1}
                    accentColor="#F59E0B"
                    suffix="/10"
                    onChange={setDecorLevelSlider}
                  />
                  <EventCustomizationSlider
                    label="Entertainment Level"
                    value={entertainmentLevelSlider}
                    min={1}
                    max={10}
                    step={1}
                    accentColor="#8B5CF6"
                    suffix="/10"
                    onChange={setEntertainmentLevelSlider}
                  />

                  <View style={styles.priceBreakdownCard}>
                    <View style={styles.priceBreakdownRow}>
                      <Text style={styles.priceBreakdownLabel}>Base Package</Text>
                      <Text style={styles.priceBreakdownValue}>₹{event.price.toLocaleString()}</Text>
                    </View>
                    <View style={styles.priceBreakdownRow}>
                      <Text style={styles.priceBreakdownLabel}>Guest Adjustment</Text>
                      <Text style={styles.priceBreakdownValue}>
                        {guestAdjustment >= 0 ? '+' : '-'}₹{Math.abs(guestAdjustment).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.priceBreakdownRow}>
                      <Text style={styles.priceBreakdownLabel}>Decor + Entertainment</Text>
                      <Text style={styles.priceBreakdownValue}>
                        {decorAdjustment + entertainmentAdjustment >= 0 ? '+' : '-'}₹
                        {Math.abs(decorAdjustment + entertainmentAdjustment).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.priceBreakdownDivider} />
                    <View style={styles.priceBreakdownRow}>
                      <Text style={styles.liveEstimateLabel}>Live Estimate</Text>
                      <Text style={styles.liveEstimateValue}>₹{liveEstimate.toLocaleString()}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <View style={[styles.sectionHeaderRow, isSmallScreen && styles.sectionHeaderRowCompact]}>
                  <Text style={styles.sectionTitle}>Compare Packages</Text>
                  <TouchableOpacity
                    style={[
                      styles.compareToggleButton,
                      compareModeEnabled && styles.compareToggleButtonActive,
                    ]}
                    onPress={() => setCompareModeEnabled((prev) => !prev)}
                  >
                    <Text
                      style={[
                        styles.compareToggleButtonText,
                        compareModeEnabled && styles.compareToggleButtonTextActive,
                      ]}
                    >
                      {compareModeEnabled ? 'Hide' : 'Open Mode'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {compareModeEnabled ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.packageCompareRow}
                  >
                    {packageComparisons.map((pkg) => (
                      <View
                        key={pkg.id}
                        style={[
                          styles.packageCompareCard,
                          {
                            borderColor: pkg.accent,
                            width: isSmallScreen ? 260 : 280,
                          },
                        ]}
                      >
                        <Text style={styles.packageName}>{pkg.name}</Text>
                        <Text style={[styles.packageEstimate, { color: pkg.accent }]}>
                          ₹{pkg.estimate.toLocaleString()}
                        </Text>

                        <View style={styles.packageLineItem}>
                          <Text style={styles.packageLineLabel}>Guest Capacity</Text>
                          <Text style={styles.packageLineValue}>{pkg.guestCapacity} guests</Text>
                        </View>

                        <View style={styles.packageMetricBlock}>
                          <View style={styles.packageLineItem}>
                            <Text style={styles.packageLineLabel}>Decor</Text>
                            <Text style={styles.packageLineValue}>{pkg.decorScore}/10</Text>
                          </View>
                          <View style={styles.packageMetricTrack}>
                            <View
                              style={[
                                styles.packageMetricFill,
                                { width: `${pkg.decorScore * 10}%`, backgroundColor: pkg.accent },
                              ]}
                            />
                          </View>
                        </View>

                        <View style={styles.packageMetricBlock}>
                          <View style={styles.packageLineItem}>
                            <Text style={styles.packageLineLabel}>Entertainment</Text>
                            <Text style={styles.packageLineValue}>{pkg.entertainmentScore}/10</Text>
                          </View>
                          <View style={styles.packageMetricTrack}>
                            <View
                              style={[
                                styles.packageMetricFill,
                                { width: `${pkg.entertainmentScore * 10}%`, backgroundColor: pkg.accent },
                              ]}
                            />
                          </View>
                        </View>

                        <Text style={styles.packageMetaText}>{pkg.support}</Text>
                        <Text style={styles.packageMetaText}>{pkg.deliverable}</Text>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.recommendedCard}>
                    <Text style={styles.recommendedLabel}>Recommended right now</Text>
                    <Text style={styles.recommendedName}>{recommendedPackage.name}</Text>
                    <Text style={styles.recommendedPrice}>
                      ₹{recommendedPackage.estimate.toLocaleString()}
                    </Text>
                    <Text style={styles.recommendedHint}>
                      Enable compare mode for side-by-side differences with Basic and Luxury.
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.aiFeatureCard}
                onPress={() => router.push(`/ai-transform?eventId=${event.id}`)}
              >
                <LinearGradient
                  colors={['#3B82F6', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.aiFeatureGradient}
                >
                  <View style={[styles.aiFeatureContent, isSmallScreen && styles.aiFeatureContentCompact]}>
                    <View style={styles.aiIconWrapper}>
                      <Sparkles size={28} color="#FFF" />
                    </View>
                    <View style={styles.aiFeatureText}>
                      <Text style={styles.aiFeatureTitle}>AI Room Transformation</Text>
                      <Text style={styles.aiFeatureSubtitle}>
                        Upload your venue photo and see it transformed with event decorations
                      </Text>
                    </View>
                    <View style={[styles.aiFeatureCta, isSmallScreen && styles.aiFeatureCtaCompact]}>
                      <Text style={styles.aiFeatureCtaText}>Open</Text>
                      <ArrowRight size={16} color="#DBEAFE" />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.budgetCard}
                onPress={() => router.push('/budget-engine' as any)}
              >
                <View style={styles.budgetIcon}>
                  <Calculator size={20} color="#10B981" />
                </View>
                <View style={styles.budgetText}>
                  <Text style={styles.budgetTitle}>Budget Engine</Text>
                  <Text style={styles.budgetSubtitle}>
                    Calculate district pricing and category breakdown for this event
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.section}>
              <View style={[styles.reviewsHeader, isSmallScreen && styles.reviewsHeaderCompact]}>
                <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleCompact]}>
                  Customer Reviews
                </Text>
                <TouchableOpacity
                  style={styles.writeReviewButton}
                  onPress={() => setShowReviewModal(true)}
                >
                  <MessageSquare size={18} color="#3B82F6" />
                  <Text style={styles.writeReviewText}>Write Review</Text>
                </TouchableOpacity>
              </View>

              {visibleReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <LinearGradient
          colors={['transparent', '#0F172A']}
          style={styles.footerGradient}
        />
        <SafeAreaView
          style={[styles.footerContent, isSmallScreen && styles.footerContentCompact]}
          edges={['bottom']}
        >
          <View style={[styles.priceSection, isSmallScreen && styles.priceSectionCompact]}>
            <Text style={styles.priceLabel}>{hasCustomizationChanges ? 'Live estimate' : 'Starting from'}</Text>
            <Text style={styles.price}>
              ₹{(hasCustomizationChanges ? liveEstimate : event.price).toLocaleString()}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.bookButton, isSmallScreen && styles.bookButtonCompact]}
            onPress={() =>
              router.push({
                pathname: '/booking',
                params: {
                  eventId: event.id,
                  prefGuestCount: String(guestCountSlider),
                  decorLevel: String(decorLevelSlider),
                  entertainmentLevel: String(entertainmentLevelSlider),
                  estimateAmount: String(liveEstimate),
                  packageTier: recommendedTierId,
                  hasCustomization: hasCustomizationChanges ? '1' : '0',
                  venueTheme,
                  lightingMode,
                  tableLayout,
                },
              })
            }
          >
            <LinearGradient
              colors={['#F59E0B', '#EF4444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bookButtonGradient}
            >
              <Text style={styles.bookButtonText}>Book Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      <Modal
        visible={showReviewModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Write a Review</Text>
            <Text style={styles.modalLabel}>Your Rating</Text>
            <View style={styles.ratingPicker}>
              {[1, 2, 3, 4, 5].map((value) => (
                <TouchableOpacity key={value} onPress={() => setNewReviewRating(value)}>
                  <Star
                    size={28}
                    color="#F59E0B"
                    fill={value <= newReviewRating ? '#F59E0B' : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Comment</Text>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience..."
              placeholderTextColor="#64748B"
              value={newReviewText}
              onChangeText={setNewReviewText}
              multiline
              numberOfLines={4}
              maxLength={500}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowReviewModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonPrimary} onPress={submitReview}>
                <Text style={styles.modalButtonPrimaryText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </ScreenFrame>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image
          source={{ uri: review.userAvatar }}
          style={styles.reviewAvatar}
          contentFit="cover"
        />
        <View style={styles.reviewHeaderText}>
          <Text style={styles.reviewUserName}>{review.userName}</Text>
          <View style={styles.reviewRating}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                color="#F59E0B"
                fill={i < review.rating ? '#F59E0B' : 'transparent'}
              />
            ))}
          </View>
        </View>
        <Text style={styles.reviewDate}>{new Date(review.date).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.reviewComment}>{review.comment}</Text>
    </View>
  );
}

interface EventCustomizationSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  accentColor: string;
  onChange: (value: number) => void;
}

function EventCustomizationSlider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  accentColor,
  onChange,
}: EventCustomizationSliderProps) {
  const [trackWidth, setTrackWidth] = useState(1);

  const percentage = ((value - min) / (max - min)) * 100;

  const updateFromTouchX = (touchX: number) => {
    const normalized = clamp(touchX / Math.max(trackWidth, 1), 0, 1);
    const rawValue = min + normalized * (max - min);
    const nextValue = clamp(roundToStep(rawValue, step), min, max);
    if (nextValue !== value) onChange(nextValue);
  };

  return (
    <View style={styles.customSliderWrapper}>
      <View style={styles.customSliderHeader}>
        <Text style={styles.customSliderLabel}>{label}</Text>
        <Text style={[styles.customSliderValue, { color: accentColor }]}>
          {value}
          {suffix || ''}
        </Text>
      </View>

      <View
        style={styles.customSliderTrackTouch}
        onLayout={(event) => setTrackWidth(Math.max(event.nativeEvent.layout.width, 1))}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => updateFromTouchX(event.nativeEvent.locationX)}
        onResponderMove={(event) => updateFromTouchX(event.nativeEvent.locationX)}
      >
        <View style={styles.customSliderTrack}>
          <View
            style={[
              styles.customSliderFill,
              {
                width: `${percentage}%`,
                backgroundColor: accentColor,
              },
            ]}
          />
          <View
            style={[
              styles.customSliderThumb,
              {
                left: `${percentage}%`,
                borderColor: accentColor,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

interface DraggableDecorMarkerProps {
  id: DecorItemId;
  label: string;
  color: string;
  position: DecorPosition;
  previewWidth: number;
  previewHeight: number;
  isDragging: boolean;
  onDragStateChange: (active: boolean) => void;
  onMove: (id: DecorItemId, nextPosition: DecorPosition) => void;
}

function DraggableDecorMarker({
  id,
  label,
  color,
  position,
  previewWidth,
  previewHeight,
  isDragging,
  onDragStateChange,
  onMove,
}: DraggableDecorMarkerProps) {
  const markerWidth = 98;
  const markerHeight = 34;
  const startPositionRef = useRef(position);

  useEffect(() => {
    startPositionRef.current = position;
  }, [position]);

  const panResponder = useRef<PanResponderInstance>(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startPositionRef.current = position;
        onDragStateChange(true);
      },
      onPanResponderMove: (_event, gestureState) => {
        const safeWidth = Math.max(previewWidth, 1);
        const safeHeight = Math.max(previewHeight, 1);
        const nextX = clamp(startPositionRef.current.x + gestureState.dx / safeWidth, 0.08, 0.92);
        const nextY = clamp(startPositionRef.current.y + gestureState.dy / safeHeight, 0.1, 0.9);
        onMove(id, { x: nextX, y: nextY });
      },
      onPanResponderRelease: () => onDragStateChange(false),
      onPanResponderTerminate: () => onDragStateChange(false),
    })
  ).current;

  return (
    <View
      style={[
        styles.decorMarker,
        {
          left: position.x * previewWidth - markerWidth / 2,
          top: position.y * previewHeight - markerHeight / 2,
          width: markerWidth,
          height: markerHeight,
          backgroundColor: color,
          transform: [{ scale: isDragging ? 1.06 : 1 }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <Text style={styles.decorMarkerText} numberOfLines={1}>
        {label}
      </Text>
    </View>
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
    height: 360,
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
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  metaRowCompact: {
    flexWrap: 'wrap',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  metaItemCompact: {
    flex: 1,
    minWidth: 130,
  },
  metaText: {
    fontSize: 14,
    color: '#E2E8F0',
    fontWeight: '600' as const,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '600' as const,
  },
  tabTextActive: {
    color: '#FFF',
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
  sectionTitleCompact: {
    fontSize: 18,
  },
  description: {
    fontSize: 15,
    color: '#CBD5E1',
    lineHeight: 24,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#E2E8F0',
    fontWeight: '500' as const,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  sectionHeaderRowCompact: {
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  sectionSubtle: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 12,
    flex: 1,
  },
  controlGroup: {
    marginBottom: 12,
  },
  controlLabel: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionScrollRow: {
    gap: 8,
    paddingRight: 12,
  },
  optionChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionChipActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#1D4ED8',
  },
  optionChipText: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '600' as const,
  },
  optionChipTextActive: {
    color: '#EFF6FF',
  },
  venuePreviewCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 4,
  },
  venuePreviewGradient: {
    padding: 14,
    gap: 12,
  },
  venueStage: {
    height: 230,
    borderRadius: 14,
    backgroundColor: '#0F172AAA',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#475569',
    position: 'relative',
  },
  venueFloor: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ perspective: 900 }, { rotateX: '56deg' }, { scaleY: 1.32 }],
    borderRadius: 14,
    opacity: 0.95,
  },
  venueGridLayer: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
    borderRadius: 14,
    borderStyle: 'dashed',
    opacity: 0.8,
  },
  tableNode: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -9,
    marginTop: -9,
    borderWidth: 2,
    borderColor: '#FFFFFFAA',
  },
  venuePreviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  venuePreviewHint: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '500' as const,
  },
  venuePreviewAccent: {
    fontSize: 12,
    color: '#BFDBFE',
    fontWeight: '600' as const,
  },
  decorMarker: {
    position: 'absolute',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF55',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  decorMarkerText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '700' as const,
  },
  customizationCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    padding: 14,
    gap: 14,
  },
  customSliderWrapper: {
    gap: 8,
  },
  customSliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  customSliderLabel: {
    fontSize: 14,
    color: '#E2E8F0',
    fontWeight: '600' as const,
  },
  customSliderValue: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  customSliderTrackTouch: {
    paddingVertical: 10,
    marginTop: -2,
    marginBottom: -4,
  },
  customSliderTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#334155',
    overflow: 'visible',
    position: 'relative',
  },
  customSliderFill: {
    height: '100%',
    borderRadius: 999,
  },
  customSliderThumb: {
    position: 'absolute',
    top: '50%',
    marginTop: -9,
    marginLeft: -9,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0F172A',
    borderWidth: 2,
  },
  priceBreakdownCard: {
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    gap: 7,
  },
  priceBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  priceBreakdownLabel: {
    fontSize: 13,
    color: '#94A3B8',
  },
  priceBreakdownValue: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '600' as const,
  },
  priceBreakdownDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 2,
  },
  liveEstimateLabel: {
    fontSize: 15,
    color: '#F8FAFC',
    fontWeight: '700' as const,
  },
  liveEstimateValue: {
    fontSize: 17,
    color: '#10B981',
    fontWeight: '800' as const,
  },
  compareToggleButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  compareToggleButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  compareToggleButtonText: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '700' as const,
  },
  compareToggleButtonTextActive: {
    color: '#FFF',
  },
  packageCompareRow: {
    gap: 10,
    paddingRight: 20,
  },
  packageCompareCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    gap: 9,
  },
  packageName: {
    fontSize: 15,
    color: '#E2E8F0',
    fontWeight: '700' as const,
  },
  packageEstimate: {
    fontSize: 22,
    fontWeight: '800' as const,
  },
  packageLineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  packageLineLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  packageLineValue: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '700' as const,
  },
  packageMetricBlock: {
    gap: 5,
  },
  packageMetricTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: '#334155',
    overflow: 'hidden',
  },
  packageMetricFill: {
    height: '100%',
    borderRadius: 999,
  },
  packageMetaText: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 17,
  },
  recommendedCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    padding: 14,
    gap: 4,
  },
  recommendedLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600' as const,
  },
  recommendedName: {
    fontSize: 17,
    color: '#FFF',
    fontWeight: '700' as const,
  },
  recommendedPrice: {
    fontSize: 22,
    color: '#10B981',
    fontWeight: '800' as const,
  },
  recommendedHint: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: '#94A3B8',
  },
  aiFeatureCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  aiFeatureGradient: {
    padding: 20,
  },
  aiFeatureContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  aiFeatureContentCompact: {
    flexWrap: 'wrap',
    gap: 12,
  },
  aiIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiFeatureText: {
    flex: 1,
  },
  aiFeatureTitle: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '700' as const,
  },
  aiFeatureSubtitle: {
    fontSize: 14,
    color: '#E0E7FF',
    marginTop: 4,
    lineHeight: 20,
  },
  aiFeatureCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  aiFeatureCtaCompact: {
    alignSelf: 'flex-start',
  },
  aiFeatureCtaText: {
    fontSize: 12,
    color: '#DBEAFE',
    fontWeight: '700' as const,
  },
  budgetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    padding: 14,
    marginBottom: 24,
  },
  budgetIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#10B98120',
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetText: {
    flex: 1,
  },
  budgetTitle: {
    fontSize: 15,
    color: '#E2E8F0',
    fontWeight: '700' as const,
  },
  budgetSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 19,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewsHeaderCompact: {
    flexWrap: 'wrap',
    gap: 10,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  writeReviewText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600' as const,
  },
  reviewCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  reviewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  reviewHeaderText: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#64748B',
  },
  reviewComment: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
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
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  footerContentCompact: {
    gap: 10,
  },
  priceSection: {
    flex: 1,
    minWidth: 120,
  },
  priceSectionCompact: {
    width: '100%',
    minWidth: 0,
  },
  priceLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 2,
  },
  price: {
    fontSize: 22,
    color: '#F59E0B',
    fontWeight: '700' as const,
  },
  bookButton: {
    minWidth: 148,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bookButtonCompact: {
    width: '100%',
    minWidth: 0,
  },
  bookButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  bookButtonText: {
    fontSize: 17,
    color: '#FFF',
    fontWeight: '700' as const,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  modalLabel: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '600' as const,
  },
  ratingPicker: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  reviewInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#E2E8F0',
    fontSize: 14,
    padding: 12,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  modalButtonSecondary: {
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalButtonSecondaryText: {
    color: '#E2E8F0',
    fontWeight: '600' as const,
  },
  modalButtonPrimary: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalButtonPrimaryText: {
    color: '#FFF',
    fontWeight: '700' as const,
  },
  errorText: {
    color: '#FFF',
    fontSize: 16,
  },
});
