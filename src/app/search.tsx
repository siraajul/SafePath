import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { searchPlaces } from '@/api';
import { ThemedText } from '@/components/themed-text';
import { Field } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { RowButton } from '@/components/ui/row-button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import type { Place } from '@/domain/types';
import { usePreferences } from '@/hooks/use-preferences';
import { placeLabel } from '@/lib/place';
import { planStore } from '@/stores';

export default function SearchScreen() {
  const { t } = useTranslation();
  const { language } = usePreferences();
  const { field } = useLocalSearchParams<{ field?: 'origin' | 'destination' }>();
  const [q, setQ] = useState('');
  const { data, isFetching } = useQuery({ queryKey: ['places', q], queryFn: () => searchPlaces(q) });

  function choose(place: Place) {
    planStore.set((p) =>
      field === 'origin' ? { ...p, origin: { kind: 'place', place } } : { ...p, destination: place },
    );
    router.back();
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: field === 'origin' ? t('search.startTitle') : t('search.title') }} />
      <Field label={t('search.placeholder')} value={q} onChangeText={setQ} autoFocus returnKeyType="search" autoCorrect={false} />
      <Notice kind="synthetic" text={t('search.note')} />

      {!q.trim() && (
        <ThemedText type="smallBold" themeColor="textSecondary">
          {t('search.samples')}
        </ThemedText>
      )}
      {isFetching && !data ? <ActivityIndicator /> : null}

      <View style={styles.list}>
        {data?.map((place) => (
          <RowButton
            key={place.id}
            icon={{ ios: 'mappin', android: 'location_on', web: 'location_on' }}
            title={placeLabel(place, language)}
            onPress={() => choose(place)}
            chevron={false}
          />
        ))}
      </View>

      {data && data.length === 0 && (
        <View style={styles.empty}>
          <ThemedText type="default" accessibilityRole="header">
            {t('search.noResults')}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t('search.noResultsHint')}
          </ThemedText>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  empty: { gap: Spacing.one, paddingTop: Spacing.three },
});
