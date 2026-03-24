import { ReactNode, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '@/constants/theme';

type TiltCardProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  ambient?: boolean;
};

export default function TiltCard({
  children,
  onPress,
  style,
  intensity = 1.2,
  ambient = true,
}: TiltCardProps) {
  const pressAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const hoverAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!ambient) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 5000,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 5000,
        }),
      ])
    );
    loop.start();
    return () => {
      floatAnim.stopAnimation();
    };
  }, [ambient, floatAnim]);

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 0,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  const handleHoverIn = () => {
    Animated.timing(hoverAnim, {
      toValue: 1,
      duration: 180,
    }).start();
  };

  const handleHoverOut = () => {
    Animated.timing(hoverAnim, {
      toValue: 0,
      duration: 180,
    }).start();
  };

  const rotateX = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${3.6 * intensity}deg`],
  });
  const rotateY = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${-4.2 * intensity}deg`],
  });
  const pressScale = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.975],
  });
  const hoverScale = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.025],
  });
  const scale = Animated.multiply(pressScale, hoverScale);
  const pressTranslateY = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3],
  });
  const floatTranslateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-2, 2],
  });
  const hoverTranslateY = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });
  const translateY = Animated.add(Animated.add(pressTranslateY, floatTranslateY), hoverTranslateY);
  const rotateZ = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-1.2deg', '1.2deg'],
  });
  const pressGlow = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.08, 0.28],
  });
  const hoverGlow = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.05, 0.18],
  });
  const glowOpacity = Animated.add(pressGlow, hoverGlow);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
    >
      <Animated.View
        style={[
          styles.card,
          style,
          {
            transform: [
              { perspective: 900 },
              { rotateX },
              { rotateY },
              { rotateZ },
              { translateY },
              { scale },
            ],
          },
        ]}
      >
        <Animated.View style={[styles.glow, { opacity: glowOpacity, pointerEvents: 'none' }]} />
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.lineSoft,
    overflow: 'hidden',
    ...theme.shadow,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45, 212, 191, 0.14)',
  },
});
