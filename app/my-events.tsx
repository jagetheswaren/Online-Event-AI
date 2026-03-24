import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ChevronLeft, Calendar, Users, Edit, MessageSquare, RotateCcw, Trash2 } from 'lucide-react-native';
import { useEvents } from '@/providers/EventProvider';
import TopMenuBar from '@/components/TopMenuBar';
import { UserEvent } from '@/types';
import ScreenFrame from '@/components/ScreenFrame';
import { theme } from '@/constants/theme';

function isPastEventDate(dateString: string): boolean {
  const eventDate = new Date(dateString);
  if (Number.isNaN(eventDate.getTime())) return false;
  eventDate.setHours(23, 59, 59, 999);
  return eventDate.getTime() < Date.now();
}

function getDisplayStatus(userEvent: UserEvent): UserEvent['status'] {
  if (
    (userEvent.status === 'registered' || userEvent.status === 'booked') &&
    isPastEventDate(userEvent.date)
  ) {
    return 'completed';
  }
  return userEvent.status;
}

export default function MyEventsScreen() {
  const router = useRouter();
  const { userEvents, cancelUserEvent } = useEvents();
  const { width } = useWindowDimensions();
  const isSmallScreen = width <= 360;

  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');

  const upcomingEvents = userEvents.filter(e => {
    const status = getDisplayStatus(e);
    return status === 'registered' || status === 'booked';
  });
  const completedEvents = userEvents.filter(e => {
    const status = getDisplayStatus(e);
    return status === 'completed' || status === 'cancelled';
  });
  const completedCount = completedEvents.filter(e => getDisplayStatus(e) === 'completed').length;
  const cancelledCount = completedEvents.filter(e => getDisplayStatus(e) === 'cancelled').length;

  const displayEvents = activeTab === 'upcoming' ? upcomingEvents : completedEvents;

  const handleCancelEvent = (userEvent: UserEvent) => {
    Alert.alert(
      'Cancel Booking',
      `Cancel "${userEvent.event.title}"?`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: () => {
            cancelUserEvent(userEvent.id);
            Alert.alert('Booking Updated', 'This event is now marked as cancelled.');
          },
        },
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
          <Text style={styles.headerTitle}>My Events</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
              Upcoming
            </Text>
            {upcomingEvents.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{upcomingEvents.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
              Completed
            </Text>
            {completedEvents.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{completedEvents.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {activeTab === 'completed' && displayEvents.length > 0 && (
            <View style={styles.completedSummary}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{completedCount}</Text>
                <Text style={styles.summaryLabel}>Completed</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{cancelledCount}</Text>
                <Text style={styles.summaryLabel}>Cancelled</Text>
              </View>
            </View>
          )}

          {displayEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={64} color="#475569" />
              <Text style={styles.emptyTitle}>No events yet</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'upcoming' 
                  ? 'Book your first event to get started'
                  : 'Past and cancelled events will show here with review and rebook actions'}
              </Text>
              {activeTab === 'upcoming' && (
                <TouchableOpacity 
                  style={styles.browseButton}
                  onPress={() => router.push('/events')}
                >
                  <LinearGradient
                    colors={['#3B82F6', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.browseButtonGradient}
                  >
                    <Text style={styles.browseButtonText}>Browse Events</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            displayEvents.map((userEvent) => (
              <EventCard 
                key={userEvent.id}
                userEvent={userEvent}
                displayStatus={getDisplayStatus(userEvent)}
                isSmallScreen={isSmallScreen}
                onPress={() => router.push(`/event-detail?id=${userEvent.eventId}`)}
                onCancel={() => handleCancelEvent(userEvent)}
                onRebook={() => router.push(`/booking?eventId=${userEvent.eventId}`)}
                onWriteReview={() =>
                  router.push(`/event-detail?id=${userEvent.eventId}&tab=reviews&openReview=1`)
                }
              />
            ))
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </ScreenFrame>
  );
}

function EventCard({
  userEvent,
  displayStatus,
  isSmallScreen,
  onPress,
  onCancel,
  onRebook,
  onWriteReview,
}: {
  userEvent: UserEvent;
  displayStatus: UserEvent['status'];
  isSmallScreen: boolean;
  onPress: () => void;
  onCancel: () => void;
  onRebook: () => void;
  onWriteReview: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.eventCard, isSmallScreen && styles.eventCardCompact]} onPress={onPress}>
      <Image 
        source={{ uri: userEvent.event.image }}
        style={[styles.eventImage, isSmallScreen && styles.eventImageCompact]}
        contentFit="cover"
      />
      
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {userEvent.event.title}
          </Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(displayStatus) + '20' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: getStatusColor(displayStatus) }
            ]}>
              {displayStatus}
            </Text>
          </View>
        </View>

        <View style={styles.eventDetails}>
          <View style={styles.detailRow}>
            <Calendar size={16} color="#94A3B8" />
            <Text style={styles.detailText}>
              {new Date(userEvent.date).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Users size={16} color="#94A3B8" />
            <Text style={styles.detailText}>
              {userEvent.guestCount} guests
            </Text>
          </View>
        </View>

        {userEvent.bookingDetails && (
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentText}>
              Paid: ₹{userEvent.bookingDetails.amountPaid.toLocaleString()} / 
              ₹{userEvent.bookingDetails.totalAmount.toLocaleString()}
            </Text>
            <View style={styles.paymentBar}>
              <View 
                style={[
                  styles.paymentProgress,
                  { 
                    width: `${(userEvent.bookingDetails.amountPaid / userEvent.bookingDetails.totalAmount) * 100}%` 
                  }
                ]}
              />
            </View>
          </View>
        )}

        <View style={[styles.eventActions, isSmallScreen && styles.eventActionsCompact]}>
          {displayStatus === 'completed' ? (
            <>
              <TouchableOpacity style={[styles.actionButton, isSmallScreen && styles.actionButtonCompact]} onPress={onWriteReview}>
                <MessageSquare size={18} color="#3B82F6" />
                <Text style={styles.actionButtonText}>Review</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, isSmallScreen && styles.actionButtonCompact]} onPress={onRebook}>
                <RotateCcw size={18} color="#10B981" />
                <Text style={[styles.actionButtonText, { color: '#10B981' }]}>
                  Book Again
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={[styles.actionButton, isSmallScreen && styles.actionButtonCompact]} onPress={onPress}>
                <Edit size={18} color="#3B82F6" />
                <Text style={styles.actionButtonText}>Details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, isSmallScreen && styles.actionButtonCompact]}
                onPress={displayStatus === 'cancelled' ? onRebook : onCancel}
              >
                {displayStatus === 'cancelled' ? (
                  <RotateCcw size={18} color="#10B981" />
                ) : (
                  <Trash2 size={18} color="#EF4444" />
                )}
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: displayStatus === 'cancelled' ? '#10B981' : '#EF4444' },
                  ]}
                >
                  {displayStatus === 'cancelled' ? 'Rebook' : 'Cancel'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function getStatusColor(status: UserEvent['status']): string {
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
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
  badge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '700' as const,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  completedSummary: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  summaryValue: {
    fontSize: 22,
    color: '#FFF',
    fontWeight: '700' as const,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 22,
    color: '#FFF',
    fontWeight: '700' as const,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  browseButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 24,
  },
  browseButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  browseButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '700' as const,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  eventCardCompact: {
    flexDirection: 'column',
  },
  eventImage: {
    width: 120,
    height: 132,
  },
  eventImageCompact: {
    width: '100%',
    height: 160,
  },
  eventContent: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  eventTitle: {
    flex: 1,
    fontSize: 17,
    color: '#FFF',
    fontWeight: '700' as const,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase',
  },
  eventDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  paymentInfo: {
    gap: 6,
  },
  paymentText: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '600' as const,
  },
  paymentBar: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    overflow: 'hidden',
  },
  paymentProgress: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  eventActions: {
    flexDirection: 'row',
    gap: 8,
  },
  eventActionsCompact: {
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionButtonCompact: {
    minWidth: 120,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600' as const,
  },
});
