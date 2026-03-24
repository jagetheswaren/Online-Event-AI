import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, IndianRupee, Percent, Sparkles } from 'lucide-react-native';
import { EventCategory } from '@/types';
import ScreenFrame from '@/components/ScreenFrame';
import { theme } from '@/constants/theme';
import {
  BudgetTier,
  DISTRICT_PRICING,
  EVENT_CATEGORY_LABELS,
  calculateBudgetEstimate,
} from '@/utils/budgetEngine';

const EVENT_CATEGORY_ORDER: EventCategory[] = [
  'wedding',
  'birthday',
  'reception',
  'engagement',
  'corporate',
  'festival',
  'babyshower',
  'graduation',
  'housewarming',
  'cultural',
];

export default function BudgetEngineScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('wedding');
  const [selectedDistrict, setSelectedDistrict] = useState(DISTRICT_PRICING[0].id);
  const [selectedTier, setSelectedTier] = useState<BudgetTier>('signature');
  const [guestInput, setGuestInput] = useState('180');

  const parsedGuests = Number.parseInt(guestInput, 10);
  const guestCount = Number.isFinite(parsedGuests) ? parsedGuests : 180;

  const estimate = useMemo(
    () =>
      calculateBudgetEstimate({
        eventCategory: selectedCategory,
        districtId: selectedDistrict,
        guestCount,
        tier: selectedTier,
      }),
    [guestCount, selectedCategory, selectedDistrict, selectedTier]
  );

  return (
    <ScreenFrame>
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Budget Engine</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Event Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {EVENT_CATEGORY_ORDER.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.chip,
                    selectedCategory === category && styles.chipActive,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedCategory === category && styles.chipTextActive,
                    ]}
                  >
                    {EVENT_CATEGORY_LABELS[category]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>District Pricing</Text>
            <View style={styles.grid}>
              {DISTRICT_PRICING.map((district) => (
                <TouchableOpacity
                  key={district.id}
                  style={[
                    styles.gridItem,
                    selectedDistrict === district.id && styles.gridItemActive,
                  ]}
                  onPress={() => setSelectedDistrict(district.id)}
                >
                  <Text style={styles.gridTitle}>{district.name}</Text>
                  <Text style={styles.gridValue}>{district.multiplier.toFixed(2)}x</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guest Count</Text>
            <View style={styles.inputCard}>
              <TextInput
                value={guestInput}
                onChangeText={setGuestInput}
                style={styles.input}
                keyboardType="number-pad"
                placeholder="Enter guest count"
                placeholderTextColor="#64748B"
              />
              <Text style={styles.inputHint}>Allowed range: 20 to 5000 guests</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget Tier</Text>
            <View style={styles.tierRow}>
              <TierButton
                active={selectedTier === 'essential'}
                title="Essential"
                subtitle="Cost conscious"
                onPress={() => setSelectedTier('essential')}
              />
              <TierButton
                active={selectedTier === 'signature'}
                title="Signature"
                subtitle="Balanced premium"
                onPress={() => setSelectedTier('signature')}
              />
              <TierButton
                active={selectedTier === 'luxury'}
                title="Luxury"
                subtitle="High-end setup"
                onPress={() => setSelectedTier('luxury')}
              />
            </View>
          </View>

          <View style={styles.summaryCard}>
            <LinearGradient colors={['#2563EB', '#1D4ED8']} style={StyleSheet.absoluteFill} />
            <Text style={styles.summaryLabel}>Estimated Total Budget</Text>
            <Text style={styles.summaryValue}>₹{estimate.total.toLocaleString()}</Text>
            <View style={styles.summaryMetrics}>
              <View style={styles.metric}>
                <IndianRupee size={14} color="#BFDBFE" />
                <Text style={styles.metricText}>₹{estimate.perGuest.toLocaleString()} / guest</Text>
              </View>
              <View style={styles.metric}>
                <Percent size={14} color="#BFDBFE" />
                <Text style={styles.metricText}>{estimate.district.multiplier.toFixed(2)}x district</Text>
              </View>
            </View>
            <Text style={styles.summarySubtext}>
              Subtotal ₹{estimate.subtotal.toLocaleString()} + contingency ₹{estimate.contingency.toLocaleString()}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category Breakdown</Text>
            <View style={styles.breakdownCard}>
              {estimate.breakdown.map((item) => (
                <View key={item.id} style={styles.breakdownRow}>
                  <View style={styles.breakdownTop}>
                    <Text style={styles.breakdownLabel}>{item.label}</Text>
                    <Text style={styles.breakdownAmount}>₹{item.amount.toLocaleString()}</Text>
                  </View>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${item.percent}%` }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Smart Optimization Tips</Text>
            <View style={styles.tipsCard}>
              {estimate.tips.map((tip, index) => (
                <View key={`${tip}_${index}`} style={styles.tipRow}>
                  <Sparkles size={14} color="#60A5FA" />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.cta} onPress={() => router.push('/events')}>
            <Text style={styles.ctaText}>Explore Plans Using This Budget</Text>
          </TouchableOpacity>
        </ScrollView>
        </SafeAreaView>
      </View>
    </ScreenFrame>
  );
}

function TierButton({
  active,
  title,
  subtitle,
  onPress,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.tierCard, active && styles.tierCardActive]} onPress={onPress}>
      <Text style={[styles.tierTitle, active && styles.tierTitleActive]}>{title}</Text>
      <Text style={styles.tierSubtitle}>{subtitle}</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  backButton: {
    width: 36,
    height: 36,
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
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#E2E8F0',
    fontWeight: '700' as const,
  },
  chipRow: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#1E293B',
  },
  chipActive: {
    borderColor: '#60A5FA',
    backgroundColor: '#1D4ED820',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  chipTextActive: {
    color: '#BFDBFE',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    padding: 12,
  },
  gridItemActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#172554',
  },
  gridTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  gridValue: {
    marginTop: 5,
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  inputCard: {
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  input: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700' as const,
  },
  inputHint: {
    color: '#64748B',
    fontSize: 12,
  },
  tierRow: {
    gap: 10,
  },
  tierCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    padding: 12,
  },
  tierCardActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#172554',
  },
  tierTitle: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  tierTitleActive: {
    color: '#DBEAFE',
  },
  tierSubtitle: {
    marginTop: 4,
    color: '#94A3B8',
    fontSize: 12,
  },
  summaryCard: {
    borderRadius: 18,
    overflow: 'hidden',
    padding: 18,
    gap: 8,
  },
  summaryLabel: {
    color: '#BFDBFE',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700' as const,
  },
  summaryValue: {
    color: '#FFF',
    fontSize: 34,
    fontWeight: '800' as const,
  },
  summaryMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metricText: {
    color: '#DBEAFE',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  summarySubtext: {
    color: '#DBEAFE',
    fontSize: 12,
  },
  breakdownCard: {
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 12,
    gap: 14,
  },
  breakdownRow: {
    gap: 8,
  },
  breakdownTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  breakdownLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600' as const,
    flex: 1,
  },
  breakdownAmount: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700' as const,
  },
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#3B82F6',
  },
  tipsCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    padding: 12,
    gap: 10,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 20,
  },
  cta: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginTop: 4,
  },
  ctaText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700' as const,
  },
});
