import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@/providers/UserProvider';
import { authService } from '@/services/auth';
import { ROLE_OPTIONS } from '@/utils/budgetEngine';
import { UserRole } from '@/types';
import ScreenFrame from '@/components/ScreenFrame';
import GradientButton from '@/components/GradientButton';
import { theme } from '@/constants/theme';

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp } = useUser();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Enter email and password.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      Alert.alert('Required', 'Enter your full name.');
      return;
    }
    if (password.trim().length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      if (mode === 'signup') {
        await signUp(email.trim(), password.trim(), name.trim(), selectedRole);
      } else {
        await signIn(email.trim(), password.trim(), selectedRole);
      }
      router.replace('/home');
    } catch (error) {
      Alert.alert('Auth failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenFrame>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</Text>
          <Text style={styles.subtitle}>
            {authService.isSupabaseAuthEnabled()
              ? 'Supabase auth is active'
              : 'Running in local auth mode'}
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionLabel}>Select Role</Text>
          <View style={styles.rolesRow}>
            {ROLE_OPTIONS.map((role) => (
              <TouchableOpacity
                key={role.id}
                style={[
                  styles.roleChip,
                  selectedRole === role.id && styles.roleChipActive,
                ]}
                onPress={() => setSelectedRole(role.id)}
              >
                <Text style={[
                  styles.roleChipText,
                  selectedRole === role.id && styles.roleChipTextActive,
                ]}>
                  {role.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.roleDescription}>
            {ROLE_OPTIONS.find((role) => role.id === selectedRole)?.description}
          </Text>

          {mode === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#64748B"
              value={name}
              onChangeText={setName}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#64748B"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#64748B"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <GradientButton
            title={loading ? 'Please wait...' : mode === 'signup' ? 'Sign Up' : 'Sign In'}
            onPress={handleAuth}
            disabled={loading}
            style={styles.cta}
          />
        </View>

        <TouchableOpacity
          style={styles.adminPortal}
          onPress={() => router.push('/admin-login')}
        >
          <Text style={styles.adminPortalText}>Admin? Open secure admin portal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchMode}
          onPress={() => setMode(prev => (prev === 'login' ? 'signup' : 'login'))}
        >
          <Text style={styles.switchModeText}>
            {mode === 'login' ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  safeArea: { flex: 1, paddingHorizontal: 20, justifyContent: 'center' },
  header: { gap: 6, marginBottom: 24 },
  title: { fontSize: 30, color: theme.colors.text, fontFamily: theme.fonts.bold },
  subtitle: { fontSize: 14, color: theme.colors.textDim },
  form: { gap: 12 },
  sectionLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rolesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  roleChipActive: {
    borderColor: theme.colors.accent,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
  },
  roleChipText: {
    color: theme.colors.textDim,
    fontSize: 13,
    fontFamily: theme.fonts.medium,
  },
  roleChipTextActive: {
    color: theme.colors.accent,
  },
  roleDescription: {
    marginTop: -4,
    marginBottom: 4,
    color: theme.colors.textSubtle,
    fontSize: 12,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
    color: theme.colors.text,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  cta: {
    marginTop: 6,
  },
  adminPortal: { marginTop: 14, alignItems: 'center' },
  adminPortalText: { fontSize: 13, color: theme.colors.accent, fontFamily: theme.fonts.semibold },
  switchMode: { marginTop: 16, alignItems: 'center' },
  switchModeText: { color: theme.colors.accent, fontSize: 13, fontFamily: theme.fonts.semibold },
});
