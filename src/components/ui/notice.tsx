import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = { kind: 'synthetic' | 'preview' | 'info' | 'warning'; text?: string };

/** A bordered note with an icon, so the meaning never relies on colour alone. */
export function Notice({ kind, text }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const message = text ?? (kind === 'synthetic' ? t('common.synthetic') : kind === 'preview' ? t('common.preview') : '');
  const tint = kind === 'warning' ? theme.caution : theme.textSecondary;

  return (
    <View
      accessibilityRole="text"
      style={[styles.box, { borderColor: tint, backgroundColor: theme.backgroundElement }]}>
      <SymbolView
        name={{ ios: kind === 'warning' ? 'exclamationmark.triangle' : 'info.circle', android: kind === 'warning' ? 'warning' : 'info', web: kind === 'warning' ? 'warning' : 'info' }}
        size={18}
        tintColor={tint}
      />
      <ThemedText type="small" style={styles.text}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  text: { flex: 1, lineHeight: 22 },
});
