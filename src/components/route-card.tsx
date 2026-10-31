import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import type { RouteOption } from '@/domain/types';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';

type Props = { route: RouteOption; selected: boolean; onSelect: () => void; onDetails: () => void };

export function RouteCard({ route, selected, onSelect, onDetails }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const f = useFormat();
  const assessed = route.conditionLabel !== 'NOT_ASSESSED';
  const percent = Math.round(route.observedLengthFraction * 100);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: selected ? theme.brand : theme.backgroundSelected,
          borderWidth: selected ? 2 : 1,
        },
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={`${f.minutes(route.etaMinutes)}, ${f.distance(route.distanceM)}, ${t(`routes.label.${route.conditionLabel}`)}`}
        onPress={onSelect}
        style={styles.body}>
        <View style={styles.tags}>
          {route.tags.map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="smallBold">{t(`routes.tag.${tag}`)}</ThemedText>
            </View>
          ))}
          {selected && (
            <View style={styles.tags}>
              <SymbolView name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }} size={18} tintColor={theme.brand} />
              <ThemedText type="smallBold" style={{ color: theme.brand }}>
                {t('routes.selected')}
              </ThemedText>
            </View>
          )}
        </View>

        <ThemedText type="heading">
          {f.minutes(route.etaMinutes)} · {f.distance(route.distanceM)}
        </ThemedText>
        <ThemedText type="default">{t(`routes.label.${route.conditionLabel}`)}</ThemedText>

        {assessed && (
          <View style={styles.coverage}>
            <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
              <View style={[styles.fill, { width: `${percent}%`, backgroundColor: theme.verified }]} />
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {t('routes.observed', { percent: f.number(percent) })} · {t(`routes.confidence.${route.confidenceLabel}`)}
            </ThemedText>
          </View>
        )}

        {route.notices.map((n) => (
          <ThemedText key={n.key} type="small" themeColor="textSecondary">
            {t(`routes.notice.${n.key}`, { percent: f.number(n.percent ?? 0) })}
          </ThemedText>
        ))}
      </Pressable>
      <Button variant="secondary" label={t('routes.viewDetails')} onPress={onDetails} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.three },
  body: { gap: Spacing.two },
  tags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two },
  tag: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: Spacing.two },
  coverage: { gap: Spacing.one },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8 },
});
