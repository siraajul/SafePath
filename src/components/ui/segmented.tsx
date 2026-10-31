import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  /** Wrap onto several lines instead of sharing one row. */
  wrap?: boolean;
};

/** A single-choice group; every option is at least 48 points tall. */
export function Segmented<T extends string>({ options, value, onChange, wrap = false }: Props<T>) {
  const theme = useTheme();

  return (
    <View accessibilityRole="radiogroup" style={[styles.row, wrap && styles.wrap]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              !wrap && styles.grow,
              {
                backgroundColor: selected ? theme.brand : theme.backgroundElement,
                borderColor: selected ? theme.brand : theme.backgroundSelected,
              },
            ]}>
            <ThemedText type="default" style={styles.text} themeColor={selected ? 'onBrand' : 'text'}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.two },
  wrap: { flexWrap: 'wrap' },
  grow: { flex: 1 },
  segment: {
    minHeight: 48,
    borderRadius: Spacing.three,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  text: { fontSize: 16, lineHeight: 26, textAlign: 'center' },
});
