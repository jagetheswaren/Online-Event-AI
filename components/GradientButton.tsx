import { ReactNode, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';

type GradientButtonProps = {
  title: string;
  onPress: () => void;
  icon?: ReactNode;
  variant?: 'primary' | 'ember' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export default function GradientButton({
  title,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
}: GradientButtonProps) {
  const pressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      speed: 24,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 0,
      speed: 24,
      bounciness: 6,
    }).start();
  };

  const translateY = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 2] });
  const scale = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] });

  const gradientColors =
    variant === 'ember' ? theme.gradients.ember : theme.gradients.accent;

  const isGhost = variant === 'ghost';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        isGhost && styles.ghost,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.inner,
          {
            transform: [
              { perspective: 800 },
              { translateY },
              { scale },
            ],
          },
        ]}
      >
        {isGhost ? (
          <Text style={[styles.text, styles.ghostText, textStyle]}>{title}</Text>
        ) : (
          <LinearGradient colors={gradientColors} style={styles.gradient}>
            <Text style={[styles.text, textStyle]}>{title}</Text>
            {icon ? <>{icon}</> : null}
          </LinearGradient>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
  },
  inner: {
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    color: theme.colors.ink,
    fontSize: 15,
    fontFamily: theme.fonts.bold,
    letterSpacing: 0.3,
  },
  ghost: {
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: 'rgba(20, 26, 42, 0.6)',
  },
  ghostText: {
    color: theme.colors.text,
    paddingVertical: 14,
    paddingHorizontal: 18,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.5,
  },
});
