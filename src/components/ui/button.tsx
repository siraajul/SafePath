import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: SymbolViewProps['name'];
  disabled?: boolean;
  loading?: boolean;
  hint?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', icon, disabled, loading, hint, style }: Props) {
  const theme = useTheme();
  const palette = {
    primary: { bg: theme.brand, fg: theme.onBrand, border: theme.brand },
    secondary: { bg: theme.backgroundElement, fg: theme.text, border: theme.backgroundSelected },
    danger: { bg: theme.emergency, fg: theme.onEmergency, border: theme.emergency },
    ghost: { bg: 'transparent', fg: theme.brand, border: 'transparent' },
  }[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: palette.bg, borderColor: palette.border },
        inactive && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon && <SymbolView name={icon} size={20} tintColor={palette.fg} />}
          <ThemedText type="default" style={[styles.label, { color: palette.fg }]}>
            {label}
          </ThemedText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: Spacing.three,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  label: { fontSize: 17, lineHeight: 28, fontWeight: 600, flexShrink: 1, textAlign: 'center' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
