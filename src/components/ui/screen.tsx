import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

type Props = PropsWithChildren<{
  /** Tab screens have no native header, so they pad for the status bar and the tab bar. */
  tab?: boolean;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
}>;

export function Screen({ children, tab = false, scroll = true, edges, contentStyle }: Props) {
  const content = [
    styles.content,
    tab && { paddingBottom: BottomTabInset + Spacing.four },
    contentStyle,
  ];

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={edges ?? (tab ? ['top'] : ['bottom'])}>
        {scroll ? (
          <ScrollView contentContainerStyle={content} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <ThemedView style={[styles.fill, ...content]}>{children}</ThemedView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  safeArea: { flex: 1, width: '100%', maxWidth: MaxContentWidth },
  fill: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.three },
});
