import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { usePreferences } from '@/hooks/use-preferences';
import { useTheme } from '@/hooks/use-theme';
import type { Language } from '@/i18n';

const LANGUAGES: Language[] = ['bn', 'en'];

const POINTS = [
  { key: 'observed', symbol: { ios: 'map', android: 'map', web: 'map' } },
  { key: 'share', symbol: { ios: 'person.2', android: 'group', web: 'group' } },
  { key: 'help', symbol: { ios: 'phone', android: 'call', web: 'call' } },
] as const;

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { language, setLanguage, completeOnboarding } = usePreferences();

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <BrandMark />
            <ThemedText type="subtitle" style={styles.appName} accessibilityRole="header">
              {t('appName')}
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Language / ভাষা
            </ThemedText>
            <View accessibilityRole="radiogroup" style={styles.segmented}>
              {LANGUAGES.map((code) => {
                const selected = code === language;
                return (
                  <Pressable
                    key={code}
                    accessibilityRole="radio"
                    accessibilityState={{ selected, checked: selected }}
                    onPress={() => setLanguage(code)}
                    style={[
                      styles.segment,
                      { backgroundColor: selected ? theme.brand : theme.backgroundElement },
                      { borderColor: selected ? theme.brand : theme.backgroundSelected },
                    ]}>
                    <ThemedText
                      type="default"
                      style={styles.segmentText}
                      themeColor={selected ? 'onBrand' : 'text'}>
                      {t(`language.${code}`)}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <ThemedText type="subtitle" style={styles.title} accessibilityRole="header">
            {t('onboarding.title')}
          </ThemedText>

          <View style={styles.points}>
            {POINTS.map(({ key, symbol }) => (
              <View key={key} style={styles.point}>
                <ThemedView type="backgroundSelected" style={styles.pointIcon}>
                  <SymbolView name={symbol} size={20} tintColor={theme.brand} />
                </ThemedView>
                <ThemedText style={styles.pointText}>{t(`onboarding.points.${key}`)}</ThemedText>
              </View>
            ))}
          </View>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">{t('onboarding.privacyTitle')}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.cardText}>
              {t('onboarding.privacy')}
            </ThemedText>
          </ThemedView>

          <ThemedText type="small" themeColor="textSecondary">
            {t('onboarding.disclaimer')}
          </ThemedText>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={completeOnboarding}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.brand },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="default" themeColor="onBrand" style={styles.buttonText}>
              {t('onboarding.continue')}
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  safeArea: { flex: 1, width: '100%', maxWidth: MaxContentWidth },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.four,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  appName: { fontSize: 24, lineHeight: 36 },
  section: { gap: Spacing.two },
  segmented: { flexDirection: 'row', gap: Spacing.two },
  segment: {
    flex: 1,
    minHeight: 48,
    borderRadius: Spacing.three,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  segmentText: { fontSize: 17, lineHeight: 28 },
  // Bangla needs generous line height so conjuncts are not clipped.
  title: { fontSize: 28, lineHeight: 42 },
  points: { gap: Spacing.three },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  pointIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointText: { flex: 1, lineHeight: 26, paddingTop: Spacing.half },
  card: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.one },
  cardText: { lineHeight: 22 },
  footer: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  button: {
    minHeight: 52,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  buttonText: { fontSize: 17, lineHeight: 28, fontWeight: 600 },
  pressed: { opacity: 0.85 },
});
