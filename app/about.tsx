import { View, Text, StyleSheet, ScrollView } from 'react-native';
import ScreenFrame from '@/components/ScreenFrame';
import { theme } from '@/constants/theme';

export default function AboutScreen() {
  return (
    <ScreenFrame variant="cool">
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>About</Text>

        <Text style={styles.sectionTitle}>Releases</Text>
        <Text style={styles.sectionText}>Track changes and new features across app versions.</Text>

        <Text style={styles.sectionTitle}>Packages</Text>
        <Text style={styles.sectionText}>No packages published</Text>
        <Text style={styles.mutedText}>Publish your first package to share reusable modules and UI components.</Text>
      </ScrollView>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 30,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.semibold,
    color: theme.colors.text,
    marginTop: 12,
  },
  sectionText: {
    fontSize: 16,
    color: theme.colors.textDim,
    marginTop: 4,
    lineHeight: 22,
  },
  mutedText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 2,
    lineHeight: 20,
  },
});
