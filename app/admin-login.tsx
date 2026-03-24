import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Shield, Mail, Lock, ArrowLeft } from 'lucide-react-native';
import { useAdmin } from '@/providers/AdminProvider';
import ScreenFrame from '@/components/ScreenFrame';
import GradientButton from '@/components/GradientButton';
import { theme } from '@/constants/theme';

export default function AdminLoginScreen() {
  const router = useRouter();
  const { loginAdmin } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const result = await loginAdmin(email, password);
    setLoading(false);

    if (result.success) {
      router.replace('/admin-dashboard');
    } else {
      Alert.alert('Login Failed', result.error || 'Invalid credentials');
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

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconWrapper}>
              <Shield size={48} color="#3B82F6" />
            </View>
            <Text style={styles.title}>Admin Portal</Text>
            <Text style={styles.subtitle}>
              Secure access to admin dashboard
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Mail size={20} color="#94A3B8" />
              <TextInput
                style={styles.input}
                placeholder="Admin Email"
                placeholderTextColor="#64748B"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
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

            <GradientButton
              title={loading ? 'Logging in...' : 'Login'}
              onPress={handleLogin}
              disabled={loading}
              style={styles.loginButton}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Do not have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/admin-signup')}>
                <Text style={styles.signupLink}>Create Admin Account</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.demoCredentials}>
              <Text style={styles.demoTitle}>Demo Credentials:</Text>
              <Text style={styles.demoText}>Email: admin@eventai.com</Text>
              <Text style={styles.demoText}>Password: admin123</Text>
            </View>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
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
    fontSize: 32,
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
  loginButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  loginGradient: {
    paddingVertical: 16,
    alignItems: 'center',
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
  signupLink: {
    fontSize: 14,
    color: theme.colors.accent,
    fontFamily: theme.fonts.semibold,
  },
  demoCredentials: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.25)',
  },
  demoTitle: {
    fontSize: 14,
    color: theme.colors.accent,
    fontFamily: theme.fonts.semibold,
    marginBottom: 8,
  },
  demoText: {
    fontSize: 13,
    color: theme.colors.textDim,
    marginBottom: 4,
  },
});
