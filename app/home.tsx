import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useRouter, useRootNavigationState } from 'expo-router';
import { Sparkles, Calendar, Users, Bot, Star } from 'lucide-react-native';
import { useEvents } from '@/providers/EventProvider';
import { useUser } from '@/providers/UserProvider';
import { Event } from '@/types';
import TopMenuBar from '@/components/TopMenuBar';
import ScreenFrame from '@/components/ScreenFrame';
import { theme } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const { events } = useEvents();
  const { user, isLoading } = useUser();
  const { width } = useWindowDimensions();
  const isSmallScreen = width <= 360;
  const scrollY = useRef(new Animated.Value(0)).current;
  const aiGradientShift = useRef(new Animated.Value(0)).current;
  const aiOrbFloat = useRef(new Animated.Value(0)).current;
  const livePulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!rootNavigationState?.key) return;
    if (isLoading) return;
    if (!user) {
      router.replace('/auth');
      return;
    }
    if (!user.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [isLoading, rootNavigationState?.key, user, router]);

  useEffect(() => {
    const gradientLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(aiGradientShift, {
          toValue: 1,
          duration: 6200,
        }),
        Animated.timing(aiGradientShift, {
          toValue: 0,
          duration: 6200,
        }),
      ])
    );
    gradientLoop.start();

    const orbLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(aiOrbFloat, {
          toValue: 1,
          duration: 3000,
        }),
        Animated.timing(aiOrbFloat, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    orbLoop.start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(livePulse, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      gradientLoop.stop();
      orbLoop.stop();
      pulseLoop.stop();
    };
  }, [aiGradientShift, aiOrbFloat, livePulse]);

  const categories = [
    { id: 'birthday', name: 'Birthday', icon: '🎂', color: '#FF6B9D' },
    { id: 'wedding', name: 'Wedding', icon: '💍', color: '#FFD93D' },
    { id: 'corporate', name: 'Corporate', icon: '💼', color: '#6BCB77' },
    { id: 'festival', name: 'Festival', icon: '🎉', color: '#FF8FB1' },
  ];

  const quickActions = [
    {
      id: 'ideas',
      title: 'AI Ideas',
      icon: Sparkles,
      color: '#38BDF8',
      onPress: () =>
        router.push(
          `/ai-chat?prefill=${encodeURIComponent(
            'Give me 7 unique event ideas for this month with theme, mood board colors, and budget level.'
          )}`
        ),
      roles: ['customer', 'planner', 'vendor'],
    },
    {
      id: 'vendors',
      title: 'Find Vendors',
      icon: Users,
      color: '#F59E0B',
      onPress: () => router.push('/vendors'),
      roles: ['customer', 'planner', 'vendor'],
    },
    {
      id: 'my-events',
      title: user?.role === 'vendor' ? 'Leads' : 'My Events',
      icon: Calendar,
      color: '#3B82F6',
      onPress: () => router.push('/my-events'),
      roles: ['customer', 'planner', 'vendor'],
    },
    {
      id: 'about',
      title: 'About App',
      icon: Star,
      color: '#A855F7',
      onPress: () => router.push('/about'),
      roles: ['customer', 'planner', 'vendor'],
    },
  ].filter((action) => action.roles.includes(user?.role || 'customer'));

  return (
    <ScreenFrame>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <TopMenuBar />
        <Animated.ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
        >
          <View style={styles.heroSection}>
            <View style={styles.heroContent}>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={[styles.userName, isSmallScreen && styles.userNameCompact]}>
                {user?.name || 'Guest'}
              </Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {(user?.role || 'customer').toUpperCase()}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.profileButton, isSmallScreen && styles.profileButtonCompact]}
              onPress={() => router.push('/profile')}
            >
              <LinearGradient
                colors={theme.gradients.accent as any}
                style={styles.profileGradient}
              >
                <Text style={styles.profileInitial}>
                  {user?.name?.[0] || 'G'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.aiPrompt}>
            <LinearGradient
              colors={theme.gradients.neon as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aiPromptCard}
            >
              <BlurView intensity={20} tint="dark" style={styles.aiBlur} />
              <View style={styles.aiPromptContent}>
                <View style={styles.aiIconWrapper}>
                  <Sparkles size={22} color="#FFF" />
                </View>
                <View style={styles.aiPromptText}>
                  <Text style={styles.aiTitle}>AI Event Planner</Text>
                  <Text style={styles.aiSubtitle}>
                    Create magical experiences with AI
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.aiButton}
                  onPress={() => router.push('/ai-chat')}
                >
                  <LinearGradient
                    colors={['#FFFFFF', '#F3F4F6'] as any}
                    style={styles.aiButtonGradient}
                  >
                    <Bot size={18} color="#7C3AED" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleCompact]}>Explore</Text>
              <TouchableOpacity onPress={() => router.push('/events')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.categoriesGrid}>
              {categories.map((category) => (
                <ModernCategoryCard
                  key={category.id}
                  category={category}
                  onPress={() => router.push(`/events?category=${category.id}`)}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleCompact]}>
                Trending Events
              </Text>
              <TouchableOpacity onPress={() => router.push('/events')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.eventsContainer}
            >
              {events.slice(0, 5).map((event) => (
                <ModernEventCard
                  key={event.id}
                  event={event}
                  cardWidth={Math.min(width * 0.75, 360)}
                  onPress={() => router.push(`/event-detail?id=${event.id}`)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleCompact]}>
                Quick Actions
              </Text>
            </View>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action) => (
                <ModernActionCard
                  key={action.id}
                  action={action}
                  onPress={action.onPress}
                />
              ))}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </Animated.ScrollView>
        <TouchableOpacity 
          style={styles.floatingAIButton}
          onPress={() => router.push('/ai-chat')}
        >
          <LinearGradient
          colors={theme.gradients.neon as any}
          style={styles.floatingAIGradient}
        >
            <Bot size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </ScreenFrame>
  );
}


function ModernCategoryCard({
  category,
  onPress,
}: {
  category: { id: string; name: string; icon: string; color: string };
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.modernCategoryCard}
    >
      <LinearGradient
        colors={[category.color + '40', category.color + '20'] as any}
        style={styles.modernCategoryGradient}
      >
        <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
        <Text style={styles.modernCategoryIcon}>{category.icon}</Text>
        <Text style={styles.modernCategoryName}>{category.name}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function ModernEventCard({ event, cardWidth, onPress }: { event: Event; cardWidth: number; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.modernEventCard, { width: cardWidth }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: event.image }} 
        style={styles.modernEventImage}
        contentFit="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.modernEventOverlay}
      >
        <View style={styles.modernEventBadge}>
          <Star size={12} color="#FCD34D" fill="#FCD34D" />
          <Text style={styles.modernEventRating}>{event.rating}</Text>
        </View>
        <Text style={styles.modernEventTitle} numberOfLines={1}>{event.title}</Text>
        <Text style={styles.modernEventPrice}>₹{event.price.toLocaleString()}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function ModernActionCard({ action, onPress }: { action: any; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.modernActionCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={theme.gradients.card as any}
        style={styles.modernActionGradient}
      >
        <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[styles.modernActionIcon, { backgroundColor: action.color + '20' }]}>
          <action.icon size={20} color={action.color} />
        </View>
        <Text style={styles.modernActionText}>{action.title}</Text>
      </LinearGradient>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  heroContent: {
    flex: 1,
  },
  profileGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 14,
    color: theme.colors.textDim,
    fontFamily: theme.fonts.medium,
    letterSpacing: 0.2,
  },
  userName: {
    fontSize: 26,
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
    marginTop: 2,
    letterSpacing: -0.5,
  },
  userNameCompact: {
    fontSize: 24,
  },
  roleBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    color: theme.colors.accent,
    fontFamily: theme.fonts.semibold,
    letterSpacing: 0.5,
  },
  profileButton: {
    width: 48,
    height: 48,
  },
  profileButtonCompact: {
    width: 42,
    height: 42,
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: '700' as const,
  },
  aiPrompt: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  aiPromptCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginBottom: 24,
  },
  aiBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  aiPromptContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiPromptText: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.fonts.semibold,
    letterSpacing: -0.2,
  },
  aiSubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  aiButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  aiButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
    letterSpacing: -0.3,
  },
  sectionTitleCompact: {
    fontSize: 20,
  },
  seeAll: {
    fontSize: 15,
    color: theme.colors.accent,
    fontFamily: theme.fonts.semibold,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  modernCategoryCard: {
    width: '48%',
    height: 100,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 4,
  },
  modernCategoryGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modernCategoryIcon: {
    fontSize: 28,
  },
  modernCategoryName: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  categoryCard: {
    width: 100,
    height: 100,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  categoryCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  categoryIcon: {
    fontSize: 32,
  },
  categoryName: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
  eventsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  modernEventCard: {
    height: 280,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 16,
  },
  modernEventImage: {
    width: '100%',
    height: '100%',
  },
  modernEventOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    gap: 8,
  },
  modernEventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  modernEventRating: {
    fontSize: 13,
    color: '#FCD34D',
    fontWeight: '700' as const,
  },
  modernEventTitle: {
    fontSize: 18,
    color: theme.colors.text,
    fontFamily: theme.fonts.semibold,
    letterSpacing: -0.2,
  },
  modernEventPrice: {
    fontSize: 16,
    color: theme.colors.gold,
    fontFamily: theme.fonts.bold,
    letterSpacing: -0.1,
  },
  eventCard: {
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  eventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  eventRating: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '600' as const,
  },
  eventTitle: {
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.fonts.semibold,
    letterSpacing: -0.2,
  },
  eventPrice: {
    fontSize: 15,
    color: theme.colors.gold,
    fontFamily: theme.fonts.bold,
    letterSpacing: -0.1,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  modernActionCard: {
    width: '48%',
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 4,
  },
  modernActionGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  modernActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernActionText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    fontFamily: theme.fonts.semibold,
    letterSpacing: -0.1,
  },
  floatingAIButton: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  floatingAIGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
