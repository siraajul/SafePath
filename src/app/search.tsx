import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { popularPlaces, searchesAsYouType, searchPlaces } from '@/api';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
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
  const [typed, setTyped] = useState('');
  const [submitted, setSubmitted] = useState('');

  // The public geocoder forbids search-as-you-type, so real search runs only on submit.
  const query = searchesAsYouType ? typed : submitted;
  const searching = query.trim().length >= 2 || (searchesAsYouType && query.trim().length > 0);
  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ['places', query.trim().toLowerCase()],
    queryFn: () => searchPlaces(query),
    enabled: searching,
    retry: false,
    staleTime: 10 * 60_000,
  });

  const results = searching ? data : popularPlaces();

  function choose(place: Place) {
    planStore.set((p) =>
      field === 'origin' ? { ...p, origin: { kind: 'place', place } } : { ...p, destination: place },
    );
    router.back();
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: field === 'origin' ? t('search.startTitle') : t('search.title') }} />
      <Field
        label={t('search.placeholder')}
        value={typed}
        onChangeText={setTyped}
        onSubmitEditing={() => setSubmitted(typed)}
        autoFocus
        returnKeyType="search"
        autoCorrect={false}
      />
      {!searchesAsYouType && (
        <Button variant="secondary" label={t('search.button')} disabled={typed.trim().length < 2} onPress={() => setSubmitted(typed)} />
      )}
      <Notice kind={searchesAsYouType ? 'synthetic' : 'info'} text={searchesAsYouType ? t('search.note') : t('search.noteOsm')} />

      {!searching && (
        <ThemedText type="smallBold" themeColor="textSecondary">
          {searchesAsYouType ? t('search.samples') : t('search.popular')}
        </ThemedText>
      )}
      {isFetching ? <ActivityIndicator /> : null}

      {isError ? (
        <View style={styles.empty}>
          <ThemedText type="default">{t('search.failed')}</ThemedText>
          <Button variant="secondary" label={t('common.retry')} onPress={() => refetch()} />
        </View>
      ) : (
        <View style={styles.list}>
          {results?.map((place) => (
            <RowButton
              key={place.id}
              icon={{ ios: 'mappin', android: 'location_on', web: 'location_on' }}
              title={placeLabel(place, language)}
              onPress={() => choose(place)}
              chevron={false}
            />
          ))}
        </View>
      )}

      {searching && !isFetching && !isError && data && data.length === 0 && (
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
