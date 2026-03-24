import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useRootNavigationState } from 'expo-router';
import { ArrowRight, Calculator, LockKeyhole, Sparkles, WandSparkles } from 'lucide-react-native';
import { useUser } from '@/providers/UserProvider';
import ScreenFrame from '@/components/ScreenFrame';
import GradientButton from '@/components/GradientButton';
import { theme } from '@/constants/theme';

export default function LandingScreen() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const { user, isLoading } = useUser();
  const { width } = useWindowDimensions();
  const isSmallScreen = width <= 360;
  const floating = useRef(new Animated.Value(0)).current;
  const drifting = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floating, {
          toValue: 1,
          duration: 2400,
        }),
        Animated.timing(floating, {
          toValue: 0,
          duration: 2400,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(drifting, {
          toValue: 1,
          duration: 4000,
        }),
        Animated.timing(drifting, {
          toValue: 0,
          duration: 4000,
        }),
      ])
    ).start();
  }, [drifting, floating]);

  useEffect(() => {
    if (!rootNavigationState?.key) return;
    if (isLoading || !user) return;
    if (!user.onboardingCompleted) {
      router.replace('/onboarding');
      return;
    }
    router.replace('/home');
  }, [isLoading, rootNavigationState?.key, router, user]);

  const cardTilt = floating.interpolate({
    inputRange: [0, 1],
    outputRange: ['-7deg', '7deg'],
  });
  const reverseTilt = floating.interpolate({
    inputRange: [0, 1],
    outputRange: ['7deg', '-7deg'],
  });

  const floatY = floating.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });

  const driftX = drifting.interpolate({
    inputRange: [0, 1],
    outputRange: [-14, 14],
  });

  return (
    <ScreenFrame variant="warm">
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.hero}>
            <View style={styles.logoPill}>
              <Sparkles size={14} color="#93C5FD" />
              <Text style={styles.logoText}>Online Event AI</Text>
            </View>

            <Text style={[styles.heroTitle, isSmallScreen && styles.heroTitleCompact]}>
              Plan events with AI speed and studio-level quality.
            </Text>
            <Text style={styles.heroSubtitle}>
              Smart budgeting, role-based collaboration, and one-click venue transformations.
            </Text>

            <View style={[styles.heroCanvas, isSmallScreen && styles.heroCanvasCompact]}>
              <Animated.View
                style={[
                  styles.glowOrb,
                  styles.glowOrbOne,
                  {
                    transform: [{ translateX: driftX }, { translateY: floatY }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.glowOrb,
                  styles.glowOrbTwo,
                  {
                    transform: [{ translateX: Animated.multiply(driftX, -1) }, { translateY: Animated.multiply(floatY, -0.6) }],
                  },
                ]}
              />

              <Animated.View
                style={[
                  styles.floatingCard,
                  { width: Math.min(width - 56, 360) },
                  styles.floatingCardPrimary,
                  {
                    transform: [
                      { perspective: 900 },
                      { translateY: floatY },
                      { rotateY: cardTilt },
                    ],
                  },
                ]}
              >
                <Calculator size={20} color="#86EFAC" />
                <Text style={styles.floatingCardTitle}>Budget Engine</Text>
                <Text style={styles.floatingCardText}>District pricing + category breakdown</Text>
              </Animated.View>

              <Animated.View
                style={[
                  styles.floatingCard,
                  { width: Math.min(width - 56, 360) },
                  styles.floatingCardSecondary,
                  {
                    transform: [
                      { perspective: 900 },
                      { translateY: Animated.multiply(floatY, -0.8) },
                      { rotateY: reverseTilt },
                    ],
                  },
                ]}
              >
                <WandSparkles size={20} color="#C4B5FD" />
                <Text style={styles.floatingCardTitle}>Room Transform</Text>
                <Text style={styles.floatingCardText}>AI decor previews + cost estimate</Text>
              </Animated.View>
            </View>

            <View style={[styles.ctaRow, isSmallScreen && styles.ctaRowCompact]}>
              <GradientButton
                title="Get Started"
                onPress={() => router.push('/auth')}
                icon={<ArrowRight size={18} color={theme.colors.ink} />}
                style={[styles.primaryCta, isSmallScreen && styles.ctaButtonCompact]}
              />
              <GradientButton
                title="Explore Events"
                variant="ghost"
                onPress={() => router.push('/events')}
                style={[styles.secondaryCta, isSmallScreen && styles.ctaButtonCompact]}
              />
            </View>
          </View>

          <View style={styles.features}>
            <FeatureCard
              icon={<LockKeyhole size={20} color="#60A5FA" />}
              title="Role-Based Authentication"
              text="Register as customer, planner, or vendor and unlock relevant workflows."
            />
            <FeatureCard
              icon={<Calculator size={20} color="#4ADE80" />}
              title="Smart Budget Engine"
              text="Dynamic estimates using district multipliers and category-level cost splits."
            />
            <FeatureCard
              icon={<WandSparkles size={20} color="#C084FC" />}
              title="AI Room Transform"
              text="Upload venue photos, pick decoration styles, and get live cost insights."
            />
          </View>

          <TouchableOpacity style={styles.signInLink} onPress={() => router.push('/auth')}>
            <Text style={styles.signInLinkText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ScreenFrame>
  );
}

function FeatureCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIcon}>{icon}</View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  hero: {
    marginTop: 12,
    marginBottom: 24,
  },
  logoPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: theme.colors.lineSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  logoText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: theme.fonts.semibold,
    letterSpacing: 0.5,
  },
  heroTitle: {
    marginTop: 18,
    color: theme.colors.text,
    fontSize: 34,
    lineHeight: 40,
    fontFamily: theme.fonts.bold,
    maxWidth: 560,
  },
  heroTitleCompact: {
    fontSize: 30,
    lineHeight: 36,
  },
  heroSubtitle: {
    marginTop: 12,
    color: theme.colors.textDim,
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 560,
  },
  heroCanvas: {
    marginTop: 24,
    minHeight: 270,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCanvasCompact: {
    minHeight: 230,
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.55,
  },
  glowOrbOne: {
    width: 170,
    height: 170,
    top: 18,
    left: 10,
    backgroundColor: theme.colors.glowBlue,
  },
  glowOrbTwo: {
    width: 145,
    height: 145,
    right: 20,
    bottom: 18,
    backgroundColor: theme.colors.glowEmber,
  },
  floatingCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  floatingCardPrimary: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderColor: 'rgba(45, 212, 191, 0.35)',
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  floatingCardSecondary: {
    backgroundColor: 'rgba(35, 24, 18, 0.9)',
    borderColor: 'rgba(249, 115, 22, 0.35)',
    alignSelf: 'flex-end',
  },
  floatingCardTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: theme.fonts.semibold,
  },
  floatingCardText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 26,
  },
  ctaRowCompact: {
    flexDirection: 'column',
  },
  ctaButtonCompact: {
    flex: 0,
    width: '100%',
  },
  primaryCta: {
    flex: 1,
    minHeight: 52,
  },
  secondaryCta: {
    flex: 1,
    minHeight: 52,
  },
  features: {
    gap: 12,
  },
  featureCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
    borderWidth: 1,
    borderColor: theme.colors.lineSoft,
    borderRadius: 16,
    padding: 16,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontFamily: theme.fonts.semibold,
  },
  featureText: {
    marginTop: 5,
    color: theme.colors.textDim,
    fontSize: 13,
    lineHeight: 20,
  },
  signInLink: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 10,
  },
  signInLinkText: {
    color: theme.colors.accent,
    fontSize: 13,
    fontFamily: theme.fonts.semibold,
  },
});
