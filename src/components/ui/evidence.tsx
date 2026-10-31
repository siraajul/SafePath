import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { EvidenceState, SegmentCondition } from '@/domain/types';

export type EvidenceKind = 'GOOD' | 'CAUTION' | EvidenceState;

/** Pattern and icon per kind, so state is never shown by colour alone. */
export const EVIDENCE_STYLE: Record<
  EvidenceKind,
  { color: 'verified' | 'caution' | 'unknown'; ios: string; md: string }
> = {
  GOOD: { color: 'verified', ios: 'checkmark.circle', md: 'check_circle' },
  CAUTION: { color: 'caution', ios: 'exclamationmark.triangle', md: 'warning' },
  REPORTED: { color: 'caution', ios: 'text.bubble', md: 'feedback' },
  OLD: { color: 'unknown', ios: 'clock.arrow.circlepath', md: 'history' },
  UNKNOWN: { color: 'unknown', ios: 'questionmark.circle', md: 'help' },
  VERIFIED: { color: 'verified', ios: 'checkmark.seal', md: 'verified' },
};

export const kindOf = (evidence: EvidenceState, condition: SegmentCondition | null): EvidenceKind =>
  evidence === 'VERIFIED' && condition ? condition : evidence;

/** Dash length, gap and thickness per kind, mirroring the map's line styles. */
const SAMPLE: Record<EvidenceKind, { dash: number; gap: number; thick: number; round?: boolean }> = {
  GOOD: { dash: 40, gap: 0, thick: 5 },
  CAUTION: { dash: 12, gap: 4, thick: 5 },
  REPORTED: { dash: 4, gap: 5, thick: 4, round: true },
  OLD: { dash: 6, gap: 5, thick: 5 },
  UNKNOWN: { dash: 40, gap: 0, thick: 2 },
  VERIFIED: { dash: 40, gap: 0, thick: 5 },
};

/**
 * A short sample of the line style used on the map. Built from small blocks, because iOS cannot
 * draw dashed borders when only one side is set.
 */
export function LineSample({ kind }: { kind: EvidenceKind }) {
  const theme = useTheme();
  const { dash, gap, thick, round } = SAMPLE[kind];
  const count = gap === 0 ? 1 : Math.floor((40 + gap) / (dash + gap));

  return (
    <View accessible={false} style={styles.sample}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            width: dash,
            height: thick,
            borderRadius: round ? thick / 2 : 1,
            backgroundColor: theme[EVIDENCE_STYLE[kind].color],
            marginRight: i < count - 1 ? gap : 0,
          }}
        />
      ))}
    </View>
  );
}

export function EvidenceLabel({ kind, text }: { kind: EvidenceKind; text: string }) {
  const theme = useTheme();
  const s = EVIDENCE_STYLE[kind];
  return (
    <View style={styles.label}>
      <SymbolView name={{ ios: s.ios as never, android: s.md as never, web: s.md as never }} size={18} tintColor={theme[s.color]} />
      <ThemedText type="small">{text}</ThemedText>
    </View>
  );
}

const KINDS: EvidenceKind[] = ['GOOD', 'CAUTION', 'REPORTED', 'OLD', 'UNKNOWN'];

export function Legend() {
  const { t } = useTranslation();
  return (
    <View accessibilityRole="list" style={styles.legend}>
      <ThemedText type="smallBold">{t('evidence.legend')}</ThemedText>
      {KINDS.map((kind) => (
        <View key={kind} accessibilityRole="text" style={styles.legendRow}>
          <LineSample kind={kind} />
          <ThemedText type="small" style={styles.legendText}>
            {kind === 'GOOD' ? `${t('evidence.VERIFIED')}: ${t('evidence.GOOD')}` : kind === 'CAUTION' ? `${t('evidence.VERIFIED')}: ${t('evidence.CAUTION')}` : t(`evidence.${kind}`)}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sample: { width: 40, flexDirection: 'row', alignItems: 'center' },
  label: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  legend: { gap: Spacing.two },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  legendText: { flex: 1 },
});
