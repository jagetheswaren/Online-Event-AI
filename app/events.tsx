import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useMemo, useRef } from 'react';
import { ChevronLeft, Search, Star } from 'lucide-react-native';
import { useEvents } from '@/providers/EventProvider';
import { Event } from '@/types';
import TopMenuBar from '@/components/TopMenuBar';
import ScreenFrame from '@/components/ScreenFrame';
import TiltCard from '@/components/TiltCard';
import { theme } from '@/constants/theme';

export default function EventsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { events } = useEvents();
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    (params.category as string) || 'all'
  );

  const categories = [
    { id: 'all', name: 'All Events' },
    { id: 'birthday', name: 'Birthday' },
    { id: 'wedding', name: 'Wedding' },
    { id: 'corporate', name: 'Corporate' },
    { id: 'festival', name: 'Festival' },
    { id: 'graduation', name: 'Graduation' },
  ];

  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(e => e.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [events, selectedCategory, searchQuery]);

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 140],
    outputRange: [0, -12],
    extrapolate: 'clamp',
  });

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
            <Text style={styles.headerTitle}>Events</Text>
            <View style={styles.backButton} />
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <Search size={20} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search events..."
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
          <Text style={styles.resultCount}>
            {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
          </Text>
          
          {filteredEvents.map((event) => (
            <EventCard 
              key={event.id} 
              event={event}
              onPress={() => router.push(`/event-detail?id=${event.id}`)}
            />
          ))}

          <View style={{ height: 20 }} />
        </Animated.ScrollView>
      </SafeAreaView>
    </ScreenFrame>
  );
}

function EventCard({ event, onPress }: { event: Event; onPress: () => void }) {
  return (
    <TiltCard style={styles.eventCard} onPress={onPress} intensity={1.2}>
      <Image 
        source={{ uri: event.image }} 
        style={styles.eventImage}
        contentFit="cover"
      />
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
          <View style={styles.ratingBadge}>
            <Star size={14} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingText}>{event.rating}</Text>
          </View>
        </View>

        <View style={styles.categoryPill}>
          <Text style={styles.categoryPillText}>{event.category}</Text>
        </View>
        
        <Text style={styles.eventDescription} numberOfLines={2}>
          {event.description}
        </Text>

        <View style={styles.eventFooter}>
          <View style={styles.eventMeta}>
            <Text style={styles.duration}>{event.duration}</Text>
            <Text style={styles.reviews}>• {event.reviewCount} reviews</Text>
          </View>
          <Text style={styles.eventPrice}>₹{event.price.toLocaleString()}</Text>
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
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
  resultCount: {
    fontSize: 14,
    color: theme.colors.textDim,
    marginBottom: 16,
    fontFamily: theme.fonts.medium,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.lineSoft,
  },
  eventImage: {
    width: 140,
    height: 160,
  },
  eventContent: {
    flex: 1,
    padding: 16,
    gap: 8,
    justifyContent: 'space-between',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  eventTitle: {
    flex: 1,
    fontSize: 18,
    color: theme.colors.text,
    fontFamily: theme.fonts.semibold,
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
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
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
  ratingText: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '700' as const,
  },
  eventDescription: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginTop: 8,
  },
  eventFooter: {
    marginTop: 12,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  duration: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500' as const,
  },
  reviews: {
    fontSize: 13,
    color: theme.colors.textSubtle,
    marginLeft: 4,
  },
  eventPrice: {
    fontSize: 18,
    color: theme.colors.gold,
    fontFamily: theme.fonts.bold,
  },
});
