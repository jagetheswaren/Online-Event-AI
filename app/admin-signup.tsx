import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Shield, User, Mail, Lock, ArrowLeft, UserCog } from 'lucide-react-native';
import { useAdmin } from '@/providers/AdminProvider';
import { Admin } from '@/types';
import ScreenFrame from '@/components/ScreenFrame';
import GradientButton from '@/components/GradientButton';
import { theme } from '@/constants/theme';

export default function AdminSignupScreen() {
  const router = useRouter();
  const { signupAdmin } = useAdmin();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Admin['role']>('event_admin');
  const [loading, setLoading] = useState(false);

  const roles: { value: Admin['role']; label: string }[] = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'event_admin', label: 'Event Admin' },
    { value: 'ai_manager', label: 'AI Manager' },
  ];

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const result = await signupAdmin(name, email, password, role);
    setLoading(false);

    if (result.success) {
      router.replace('/admin-dashboard');
    } else {
      Alert.alert('Signup Failed', result.error || 'Could not create account');
    }
  };

  return (
    <ScreenFrame>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <View style={styles.iconWrapper}>
              <Shield size={48} color="#3B82F6" />
            </View>
            <Text style={styles.title}>Create Admin Account</Text>
            <Text style={styles.subtitle}>
              Setup your admin credentials
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <User size={20} color="#94A3B8" />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#64748B"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Mail size={20} color="#94A3B8" />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#64748B"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.roleContainer}>
              <View style={styles.roleHeader}>
                <UserCog size={20} color="#94A3B8" />
                <Text style={styles.roleLabel}>Select Role</Text>
              </View>
              <View style={styles.roleButtons}>
                {roles.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    style={[
                      styles.roleButton,
                      role === r.value && styles.roleButtonActive
                    ]}
                    onPress={() => setRole(r.value)}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      role === r.value && styles.roleButtonTextActive
                    ]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#94A3B8" />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#64748B"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#94A3B8" />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#64748B"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <GradientButton
              title={loading ? 'Creating Account...' : 'Create Account'}
              onPress={handleSignup}
              disabled={loading}
              style={styles.signupButton}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
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
  backButton: {
    width: 44,
    height: 44,
    marginLeft: 16,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
  roleContainer: {
    gap: 12,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleLabel: {
    fontSize: 14,
    color: theme.colors.textDim,
    fontFamily: theme.fonts.semibold,
  },
  roleButtons: {
    gap: 8,
  },
  roleButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  roleButtonActive: {
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    borderColor: theme.colors.accent,
  },
  roleButtonText: {
    fontSize: 14,
    color: theme.colors.textDim,
    fontFamily: theme.fonts.medium,
  },
  roleButtonTextActive: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.semibold,
  },
  signupButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.textDim,
  },
  loginLink: {
    fontSize: 14,
    color: theme.colors.accent,
    fontFamily: theme.fonts.semibold,
  },
});
