import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@/providers/UserProvider';
import ScreenFrame from '@/components/ScreenFrame';
import GradientButton from '@/components/GradientButton';
import { theme } from '@/constants/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useUser();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const next = () => {
    if (step === 1 && !name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    if (step === 2 && !email.trim()) {
      Alert.alert('Required', 'Please enter your email.');
      return;
    }
    if (step < 3) setStep(prev => prev + 1);
  };

  const finish = async () => {
    if (!phone.trim()) {
      Alert.alert('Required', 'Please enter your phone.');
      return;
    }
    await completeOnboarding({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });
    router.replace('/home');
  };

  return (
    <ScreenFrame>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to EventAI</Text>
          <Text style={styles.subtitle}>Step {step} of 3</Text>
        </View>

        <View style={styles.body}>
          {step === 1 && (
            <>
              <Text style={styles.label}>What should we call you?</Text>
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor="#64748B"
                value={name}
                onChangeText={setName}
              />
            </>
          )}
          {step === 2 && (
            <>
              <Text style={styles.label}>Where should we send updates?</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#64748B"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </>
          )}
          {step === 3 && (
            <>
              <Text style={styles.label}>Contact number for bookings</Text>
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                placeholderTextColor="#64748B"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </>
          )}
        </View>

        <View style={styles.footer}>
          {step < 3 ? (
            <GradientButton title="Continue" onPress={next} style={styles.cta} />
          ) : (
            <GradientButton title="Finish Setup" onPress={finish} style={styles.cta} />
          )}
        </View>
      </SafeAreaView>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  safeArea: { flex: 1, paddingHorizontal: 20 },
  header: { paddingTop: 20, gap: 6 },
  title: { fontSize: 30, color: theme.colors.text, fontFamily: theme.fonts.bold },
  subtitle: { fontSize: 14, color: theme.colors.textDim },
  body: { flex: 1, justifyContent: 'center', gap: 12 },
  label: { fontSize: 16, color: theme.colors.textMuted, fontFamily: theme.fonts.semibold },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
    color: theme.colors.text,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
  },
  footer: { paddingBottom: 20 },
  cta: {
    paddingVertical: 2,
  },
});
