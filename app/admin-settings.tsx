import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, RefreshCw, Server, CreditCard, MessageSquare, Shield } from 'lucide-react-native';
import { useAdmin } from '@/providers/AdminProvider';
import config from '@/config';
import ScreenFrame from '@/components/ScreenFrame';
import { theme } from '@/constants/theme';

export default function AdminSettingsScreen() {
  const router = useRouter();
  const { admin, getStats, refreshPaymentWebhookStatuses } = useAdmin();
  const stats = getStats();

  const handleRefreshWebhooks = async () => {
    await refreshPaymentWebhookStatuses();
    Alert.alert('Sync complete', 'Payment webhook statuses were refreshed.');
  };

  return (
    <ScreenFrame>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Settings</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Shield size={18} color="#3B82F6" />
              <Text style={styles.cardTitle}>Account</Text>
            </View>
            <Text style={styles.itemText}>Name: {admin?.name || 'Admin'}</Text>
            <Text style={styles.itemText}>Role: {admin?.role?.replace('_', ' ') || 'N/A'}</Text>
            <Text style={styles.itemText}>Email: {admin?.email || 'N/A'}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Server size={18} color="#10B981" />
              <Text style={styles.cardTitle}>System</Text>
            </View>
            <Text style={styles.itemText}>Backend Provider: {config.backendProvider}</Text>
            <Text style={styles.itemText}>API Base URL: {config.apiBaseUrl}</Text>
            <Text style={styles.itemText}>Environment: {config.environment}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <CreditCard size={18} color="#F59E0B" />
              <Text style={styles.cardTitle}>Payments</Text>
            </View>
            <Text style={styles.itemText}>Gateway: {config.paymentProvider}</Text>
            <Text style={styles.itemText}>Pending Booking Approvals: {stats.pendingBookings}</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={handleRefreshWebhooks}>
              <RefreshCw size={16} color="#FFF" />
              <Text style={styles.primaryButtonText}>Refresh Webhook Status</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <MessageSquare size={18} color="#8B5CF6" />
              <Text style={styles.cardTitle}>Logs & Monitoring</Text>
            </View>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/ai-chat')}>
              <Text style={styles.secondaryButtonText}>Open Chat Logs</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/admin-dashboard')}>
              <Text style={styles.secondaryButtonText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
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
    gap: 14,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    gap: 10,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '700' as const,
  },
  itemText: {
    fontSize: 14,
    color: '#CBD5E1',
  },
  primaryButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  secondaryButton: {
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
