import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield } from 'lucide-react-native';
import { useAdmin } from '@/providers/AdminProvider';
import { theme } from '@/constants/theme';

interface TopMenuBarProps {
  transparent?: boolean;
  showMenu?: boolean;
}

export default function TopMenuBar({ transparent = false, showMenu = true }: TopMenuBarProps) {
  const router = useRouter();
  const { admin } = useAdmin();

  return (
    <View style={[styles.container, transparent && styles.transparent]}>
      <View style={styles.leftSection}>
        {showMenu && (
          <TouchableOpacity 
            style={styles.adminButton}
            onPress={() => {
              if (admin) {
                router.push('/admin-dashboard');
              } else {
                router.push('/admin-login');
              }
            }}
          >
            <Shield size={20} color="#3B82F6" />
            <Text style={styles.adminText}>Admin</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.centerSection}>
        <Text style={styles.logo}>EventAI</Text>
      </View>
      
      <View style={styles.rightSection} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(10, 14, 26, 0.92)',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lineSoft,
  },
  transparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
  },
  adminText: {
    fontSize: 14,
    color: theme.colors.accent,
    fontFamily: theme.fonts.semibold,
  },
  logo: {
    fontSize: 18,
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
  },
});
