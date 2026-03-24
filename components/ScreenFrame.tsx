import { ReactNode, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';

type ScreenFrameProps = {
  children: ReactNode;
  variant?: 'cool' | 'warm';
};

export default function ScreenFrame({ children, variant = 'cool' }: ScreenFrameProps) {
  const float = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 5200 }),
        Animated.timing(float, { toValue: 0, duration: 5200 }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 7600 }),
        Animated.timing(drift, { toValue: 0, duration: 7600 }),
      ])
    ).start();
  }, [float, drift]);

  const floatY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });
  const floatX = drift.interpolate({ inputRange: [0, 1], outputRange: [-12, 12] });
  const tilt = float.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '2deg'] });
  const reverseTilt = drift.interpolate({ inputRange: [0, 1], outputRange: ['2deg', '-2deg'] });

  const gradientColors = variant === 'warm' ? theme.gradients.screenWarm : theme.gradients.screen;

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0.06)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.grain, { pointerEvents: 'none' }]}
      />

      <Animated.View
        style={[
          styles.mesh,
          {
            transform: [
              { perspective: 900 },
              { rotateX: tilt },
              { rotateY: reverseTilt },
            ],
            pointerEvents: 'none',
          },
        ]}
      />

      <Animated.View
        style={[
          styles.orb,
          styles.orbOne,
          {
            transform: [{ translateX: floatX }, { translateY: floatY }],
            pointerEvents: 'none',
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          styles.orbTwo,
          {
            transform: [{ translateX: Animated.multiply(floatX, -1) }, { translateY: Animated.multiply(floatY, -0.6) }],
            pointerEvents: 'none',
          },
        ]}
      />

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.ink,
  },
  content: {
    flex: 1,
  },
  mesh: {
    position: 'absolute',
    top: -120,
    left: -60,
    right: -60,
    height: 360,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.16)',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    opacity: 0.5,
  },
  grain: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
    transform: [{ rotate: '6deg' }, { scale: 1.4 }],
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.5,
  },
  orbOne: {
    width: 220,
    height: 220,
    top: -40,
    left: -60,
    backgroundColor: theme.colors.glowBlue,
  },
  orbTwo: {
    width: 180,
    height: 180,
    bottom: 40,
    right: -40,
    backgroundColor: theme.colors.glowEmber,
  },
});
