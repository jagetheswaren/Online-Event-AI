import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Bell,
  Brain,
  Calendar,
  Camera,
  ChevronLeft,
  LogOut,
  Mail,
  MapPin,
  Palette,
  Phone,
  Settings,
  Sparkles,
  User,
} from 'lucide-react-native';
import { useUser } from '@/providers/UserProvider';
import * as ImagePicker from 'expo-image-picker';
import TopMenuBar from '@/components/TopMenuBar';
import ScreenFrame from '@/components/ScreenFrame';
import { theme } from '@/constants/theme';
import { useEvents } from '@/providers/EventProvider';
import type { AiTone, BudgetTier, EventCategory, EventStyle, NotificationChannel } from '@/types';

const BUDGET_TIERS: { id: BudgetTier; label: string; tone: string }[] = [
  { id: 'budget', label: 'Budget', tone: '#22C55E' },
  { id: 'balanced', label: 'Balanced', tone: '#38BDF8' },
  { id: 'premium', label: 'Premium', tone: '#F59E0B' },
];

const AI_TONES: { id: AiTone; label: string; detail: string }[] = [
  { id: 'concise', label: 'Concise', detail: 'Short, direct answers' },
  { id: 'balanced', label: 'Balanced', detail: 'Guided + flexible' },
  { id: 'cinematic', label: 'Cinematic', detail: 'Creative, vivid ideas' },
];

const STYLE_TAGS: { id: EventStyle; label: string }[] = [
  { id: 'modern', label: 'Modern' },
  { id: 'traditional', label: 'Traditional' },
  { id: 'luxury', label: 'Luxury' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'boho', label: 'Boho' },
];

const CATEGORY_OPTIONS: { id: EventCategory; label: string }[] = [
  { id: 'birthday', label: 'Birthday' },
  { id: 'wedding', label: 'Wedding' },
  { id: 'reception', label: 'Reception' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'babyshower', label: 'Baby Shower' },
  { id: 'housewarming', label: 'Housewarming' },
  { id: 'graduation', label: 'Graduation' },
  { id: 'corporate', label: 'Corporate' },
  { id: 'cultural', label: 'Cultural' },
  { id: 'festival', label: 'Festival' },
];

const NOTIFICATION_CHANNELS: { id: NotificationChannel; label: string }[] = [
  { id: 'email', label: 'Email' },
  { id: 'sms', label: 'SMS' },
  { id: 'whatsapp', label: 'WhatsApp' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateUser, logout } = useUser();
  const { userEvents, events } = useEvents();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [city, setCity] = useState(user?.city || '');
  const [budgetTier, setBudgetTier] = useState<BudgetTier>(user?.budgetTier || 'balanced');
  const [aiTone, setAiTone] = useState<AiTone>(user?.aiTone || 'balanced');
  const [styleTags, setStyleTags] = useState<EventStyle[]>(user?.styleTags || []);
  const [favoriteCategories, setFavoriteCategories] = useState<EventCategory[]>(
    user?.favoriteCategories || []
  );
  const [notificationChannels, setNotificationChannels] = useState<NotificationChannel[]>(
    user?.notificationChannels?.length ? user.notificationChannels : ['email']
  );

  const eventInsights = useMemo(() => {
    const active = userEvents.filter(
      (event) => event.status === 'registered' || event.status === 'booked'
    ).length;
    const completed = userEvents.filter((event) => event.status === 'completed').length;
    const cancelled = userEvents.filter((event) => event.status === 'cancelled').length;
    const totalSpend = userEvents.reduce((sum, event) => {
      const totalAmount = event.bookingDetails?.totalAmount;
      return sum + (typeof totalAmount === 'number' ? totalAmount : event.event.price);
    }, 0);
    const categoryCounts = userEvents.reduce<Record<string, number>>((acc, event) => {
      acc[event.event.category] = (acc[event.event.category] || 0) + 1;
      return acc;
    }, {});
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    return {
      active,
      completed,
      cancelled,
      totalSpend,
      topCategory,
    };
  }, [userEvents]);

  const aiPicks = useMemo(() => {
    if (!events.length) return [];
    const targetMap: Record<BudgetTier, number> = {
      budget: 25000,
      balanced: 80000,
      premium: 180000,
    };
    const target = targetMap[budgetTier];
    const categorySet = new Set(favoriteCategories);

    return [...events]
      .map((event) => {
        const categoryBoost = categorySet.size && categorySet.has(event.category) ? 4 : 0;
        const priceDelta = Math.abs(event.price - target);
        const priceScore = Math.max(0, 1 - priceDelta / target) * 2;
        const score = event.rating + categoryBoost + priceScore;
        return { event, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.event);
  }, [events, favoriteCategories, budgetTier]);

  const toggleChip = <T,>(value: T, list: T[], setList: (next: T[]) => void) => {
    if (list.includes(value)) {
      setList(list.filter((item) => item !== value));
    } else {
      setList([...list, value]);
    }
  };

  const toggleNotification = (channel: NotificationChannel) => {
    setNotificationChannels((prev) => {
      if (prev.includes(channel)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== channel);
      }
      return [...prev, channel];
    });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['Images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name || !email || !phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    await updateUser({
      name,
      email,
      phone,
      nickname,
      avatar,
      city,
      budgetTier,
      aiTone,
      styleTags,
      favoriteCategories,
      notificationChannels,
    });
    Alert.alert('Success', 'Profile updated successfully');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => {
          logout();
          router.replace('/auth');
        }},
      ]
    );
  };

  return (
    <ScreenFrame>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <TopMenuBar />
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.backButton}>
            <Settings size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.completionCard}>
            <Text style={styles.completionTitle}>Profile Completion</Text>
            <View style={styles.completionTrack}>
              <View style={[styles.completionFill, { width: `${user?.profileCompletion || 0}%` }]} />
            </View>
            <Text style={styles.completionText}>{user?.profileCompletion || 0}% complete</Text>
          </View>

          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <View style={styles.insightBadge}>
                <Sparkles size={16} color="#38BDF8" />
                <Text style={styles.insightTitle}>Profile Intelligence</Text>
              </View>
              <Text style={styles.insightSubtitle}>Synced from your bookings</Text>
            </View>
            <View style={styles.insightGrid}>
              <View style={styles.insightItem}>
                <Text style={styles.insightValue}>{eventInsights.active}</Text>
                <Text style={styles.insightLabel}>Active</Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={styles.insightValue}>{eventInsights.completed}</Text>
                <Text style={styles.insightLabel}>Completed</Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={styles.insightValue}>{eventInsights.cancelled}</Text>
                <Text style={styles.insightLabel}>Cancelled</Text>
              </View>
            </View>
            <View style={styles.insightFooter}>
              <Text style={styles.insightFooterText}>
                Top category:{' '}
                {eventInsights.topCategory
                  ? CATEGORY_OPTIONS.find((option) => option.id === eventInsights.topCategory)?.label ||
                    eventInsights.topCategory
                  : 'No history yet'}
              </Text>
              <Text style={styles.insightFooterText}>
                Total spend: ₹{eventInsights.totalSpend.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
              {avatar ? (
                <Image 
                  source={{ uri: avatar }}
                  style={styles.avatar}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User size={48} color="#64748B" />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Camera size={18} color="#FFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarLabel}>Tap to change photo</Text>
          </View>

          <View style={styles.form}>
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
              <Text style={styles.label}>Email Address *</Text>
              <View style={styles.inputWrapper}>
                <Mail size={20} color="#64748B" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#64748B"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>AI Nickname (Optional)</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputEmoji}>✨</Text>
                <TextInput
                  style={styles.input}
                  placeholder="How should AI address you?"
                  placeholderTextColor="#64748B"
                  value={nickname}
                  onChangeText={setNickname}
                />
              </View>
              <Text style={styles.hint}>AI will use this name in conversations</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>City (Optional)</Text>
              <View style={styles.inputWrapper}>
                <MapPin size={20} color="#64748B" />
                <TextInput
                  style={styles.input}
                  placeholder="City for local vendor suggestions"
                  placeholderTextColor="#64748B"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
            </View>
          </View>

          <View style={styles.preferenceCard}>
            <View style={styles.preferenceHeader}>
              <View style={styles.preferenceBadge}>
                <Brain size={16} color="#A855F7" />
                <Text style={styles.preferenceTitle}>AI Persona</Text>
              </View>
              <Text style={styles.preferenceSubtitle}>Controls how AI plans your events</Text>
            </View>
            <View style={styles.choiceGrid}>
              {AI_TONES.map((tone) => (
                <TouchableOpacity
                  key={tone.id}
                  style={[styles.choiceChip, aiTone === tone.id && styles.choiceChipActive]}
                  onPress={() => setAiTone(tone.id)}
                >
                  <Text style={[styles.choiceChipText, aiTone === tone.id && styles.choiceChipTextActive]}>
                    {tone.label}
                  </Text>
                  <Text style={styles.choiceChipHint}>{tone.detail}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.picksCard}>
            <View style={styles.preferenceHeader}>
              <View style={styles.preferenceBadge}>
                <Sparkles size={16} color="#38BDF8" />
                <Text style={styles.preferenceTitle}>AI Picks</Text>
              </View>
              <Text style={styles.preferenceSubtitle}>
                Tailored for {budgetTier} budgets and your favorites
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.picksRow}
            >
              {aiPicks.length === 0 ? (
                <View style={styles.pickEmpty}>
                  <Text style={styles.pickEmptyText}>
                    Add favorite categories to unlock recommendations.
                  </Text>
                </View>
              ) : (
                aiPicks.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.pickCard}
                    onPress={() => router.push(`/event-detail?id=${event.id}`)}
                  >
                    <Image
                      source={{ uri: event.image }}
                      style={styles.pickImage}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={['rgba(15,23,42,0)', 'rgba(15,23,42,0.9)']}
                      style={styles.pickOverlay}
                    >
                      <Text style={styles.pickTitle} numberOfLines={1}>
                        {event.title}
                      </Text>
                      <Text style={styles.pickMeta}>
                        ₹{event.price.toLocaleString()} • {event.duration}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>

          <View style={styles.preferenceCard}>
            <View style={styles.preferenceHeader}>
              <View style={styles.preferenceBadge}>
                <Palette size={16} color="#38BDF8" />
                <Text style={styles.preferenceTitle}>Event DNA</Text>
              </View>
              <Text style={styles.preferenceSubtitle}>Personalize suggestions & vendors</Text>
            </View>

            <Text style={styles.sectionLabel}>Budget Tier</Text>
            <View style={styles.segmentRow}>
              {BUDGET_TIERS.map((tier) => (
                <TouchableOpacity
                  key={tier.id}
                  style={[
                    styles.segmentChip,
                    budgetTier === tier.id && styles.segmentChipActive,
                  ]}
                  onPress={() => setBudgetTier(tier.id)}
                >
                  <View style={[styles.segmentDot, { backgroundColor: tier.tone }]} />
                  <Text
                    style={[
                      styles.segmentText,
                      budgetTier === tier.id && styles.segmentTextActive,
                    ]}
                  >
                    {tier.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Signature Styles</Text>
            <View style={styles.chipRow}>
              {STYLE_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag.id}
                  style={[
                    styles.tagChip,
                    styleTags.includes(tag.id) && styles.tagChipActive,
                  ]}
                  onPress={() => toggleChip(tag.id, styleTags, setStyleTags)}
                >
                  <Text
                    style={[
                      styles.tagChipText,
                      styleTags.includes(tag.id) && styles.tagChipTextActive,
                    ]}
                  >
                    {tag.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Favorite Categories</Text>
            <View style={styles.chipRow}>
              {CATEGORY_OPTIONS.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.tagChip,
                    favoriteCategories.includes(category.id) && styles.tagChipActive,
                  ]}
                  onPress={() => toggleChip(category.id, favoriteCategories, setFavoriteCategories)}
                >
                  <Text
                    style={[
                      styles.tagChipText,
                      favoriteCategories.includes(category.id) && styles.tagChipTextActive,
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.preferenceCard}>
            <View style={styles.preferenceHeader}>
              <View style={styles.preferenceBadge}>
                <Bell size={16} color="#F59E0B" />
                <Text style={styles.preferenceTitle}>Notification Channels</Text>
              </View>
              <Text style={styles.preferenceSubtitle}>Keep at least one enabled</Text>
            </View>
            <View style={styles.chipRow}>
              {NOTIFICATION_CHANNELS.map((channel) => (
                <TouchableOpacity
                  key={channel.id}
                  style={[
                    styles.tagChip,
                    notificationChannels.includes(channel.id) && styles.tagChipActive,
                  ]}
                  onPress={() => toggleNotification(channel.id)}
                >
                  <Text
                    style={[
                      styles.tagChipText,
                      notificationChannels.includes(channel.id) && styles.tagChipTextActive,
                    ]}
                  >
                    {channel.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/my-events')}
          >
            <View style={styles.menuIcon}>
              <Calendar size={22} color="#3B82F6" />
            </View>
            <Text style={styles.menuText}>My Events</Text>
            <ChevronLeft size={20} color="#64748B" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
          >
            <LinearGradient
              colors={['#3B82F6', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveButtonGradient}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  completionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
    marginBottom: 20,
  },
  completionTitle: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '600' as const,
    marginBottom: 10,
  },
  completionTrack: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 999,
    overflow: 'hidden',
  },
  completionFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  completionText: {
    marginTop: 8,
    fontSize: 13,
    color: '#94A3B8',
  },
  insightCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.lineSoft,
    padding: 16,
    marginBottom: 24,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  insightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightTitle: {
    fontSize: 15,
    color: theme.colors.text,
    fontFamily: theme.fonts.semibold,
  },
  insightSubtitle: {
    fontSize: 12,
    color: theme.colors.textSubtle,
  },
  insightGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 14,
  },
  insightItem: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  insightValue: {
    fontSize: 18,
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
  },
  insightLabel: {
    marginTop: 4,
    fontSize: 11,
    color: theme.colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  insightFooter: {
    marginTop: 12,
    gap: 4,
  },
  insightFooterText: {
    fontSize: 12,
    color: theme.colors.textDim,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#0F172A',
  },
  avatarLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  form: {
    gap: 20,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    color: '#E2E8F0',
    fontWeight: '600' as const,
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
  inputEmoji: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#FFF',
  },
  hint: {
    fontSize: 13,
    color: '#64748B',
  },
  preferenceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.lineSoft,
    padding: 16,
    marginBottom: 20,
    gap: 14,
  },
  picksCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.lineSoft,
    padding: 16,
    marginBottom: 20,
    gap: 14,
  },
  preferenceHeader: {
    gap: 6,
  },
  preferenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  preferenceTitle: {
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.fonts.semibold,
  },
  preferenceSubtitle: {
    fontSize: 12,
    color: theme.colors.textSubtle,
  },
  sectionLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontFamily: theme.fonts.semibold,
  },
  choiceGrid: {
    gap: 10,
  },
  choiceChip: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  choiceChipActive: {
    borderColor: theme.colors.accent,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
  },
  choiceChipText: {
    fontSize: 14,
    color: theme.colors.text,
    fontFamily: theme.fonts.semibold,
  },
  choiceChipTextActive: {
    color: theme.colors.accent,
  },
  choiceChipHint: {
    marginTop: 4,
    fontSize: 12,
    color: theme.colors.textSubtle,
  },
  picksRow: {
    gap: 12,
  },
  pickCard: {
    width: 200,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: '#0F172A',
  },
  pickImage: {
    width: '100%',
    height: '100%',
  },
  pickOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    gap: 4,
  },
  pickTitle: {
    fontSize: 14,
    color: theme.colors.text,
    fontFamily: theme.fonts.semibold,
  },
  pickMeta: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  pickEmpty: {
    width: 240,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: '#0F172A',
    padding: 14,
  },
  pickEmptyText: {
    fontSize: 12,
    color: theme.colors.textSubtle,
    lineHeight: 18,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  segmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: '#0F172A',
  },
  segmentChipActive: {
    borderColor: theme.colors.accent,
    backgroundColor: 'rgba(45, 212, 191, 0.14)',
  },
  segmentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  segmentText: {
    fontSize: 13,
    color: theme.colors.textDim,
    fontFamily: theme.fonts.medium,
  },
  segmentTextActive: {
    color: theme.colors.text,
    fontFamily: theme.fonts.semibold,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: '#0F172A',
  },
  tagChipActive: {
    borderColor: theme.colors.accent,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
  },
  tagChipText: {
    fontSize: 12,
    color: theme.colors.textDim,
    fontFamily: theme.fonts.medium,
  },
  tagChipTextActive: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.semibold,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F620',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#E2E8F0',
    fontWeight: '600' as const,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 17,
    color: '#FFF',
    fontWeight: '700' as const,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#EF444420',
  },
  logoutText: {
    fontSize: 17,
    color: '#EF4444',
    fontWeight: '700' as const,
  },
});
