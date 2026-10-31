import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RowButton } from '@/components/ui/row-button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { usePreferences } from '@/hooks/use-preferences';
import { requestPosition } from '@/hooks/use-location';
import { placeLabel } from '@/lib/place';
import { planStore } from '@/stores';

type LocationNote = 'locationOff' | 'locationBlocked' | 'locationFailed' | null;

export default function HomeScreen() {
  const { t } = useTranslation();
  const { language } = usePreferences();
  const plan = planStore.useValue();
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState<LocationNote>(null);

  const originText =
    plan.origin?.kind === 'device'
      ? t('home.myLocation')
      : plan.origin?.place
        ? placeLabel(plan.origin.place, language)
        : t('home.chooseStart');
  const destinationText = plan.destination ? placeLabel(plan.destination, language) : t('home.chooseDestination');

  const sameSpot = !!plan.destination && plan.origin?.kind === 'place' && plan.origin.place?.id === plan.destination.id;
  const ready = !!plan.origin && !!plan.destination && !sameSpot && (plan.origin.kind === 'place' || !!plan.device);
  const problem = !plan.origin || !plan.destination ? 'pickBoth' : sameSpot ? 'sameSpot' : null;

  async function useMyLocation() {
    setLocating(true);
    setNote(null);
    const { state, position } = await requestPosition();
    setLocating(false);
    if (position) {
      planStore.set((p) => ({ ...p, origin: { kind: 'device' }, device: position }));
    } else {
      setNote(state === 'blocked' ? 'locationBlocked' : state === 'denied' ? 'locationOff' : 'locationFailed');
    }
  }

  return (
    <Screen tab>
      <ThemedText type="subtitle" accessibilityRole="header" style={styles.title}>
        {t('home.title')}
      </ThemedText>

      <View style={styles.group}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          {t('home.from')}
        </ThemedText>
        <RowButton
          icon={{ ios: 'circle', android: 'radio_button_unchecked', web: 'radio_button_unchecked' }}
          title={originText}
          onPress={() => router.push({ pathname: '/search', params: { field: 'origin' } })}
        />
        <Button
          variant="secondary"
          icon={{ ios: 'location', android: 'my_location', web: 'my_location' }}
          label={locating ? t('home.locating') : t('home.useMyLocation')}
          loading={locating}
          onPress={useMyLocation}
        />
        {note && (
          <Card>
            <ThemedText type="small">{t(`home.${note}`)}</ThemedText>
          </Card>
        )}
      </View>

      <View style={styles.group}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          {t('home.to')}
        </ThemedText>
        <RowButton
          icon={{ ios: 'mappin.circle.fill', android: 'location_on', web: 'location_on' }}
          title={destinationText}
          onPress={() => router.push({ pathname: '/search', params: { field: 'destination' } })}
        />
      </View>

      <Button label={t('home.findRoute')} disabled={!ready} onPress={() => router.push('/routes')} />
      {problem && !ready && (
        <ThemedText type="small" themeColor="textSecondary">
          {t(`home.${problem}`)}
        </ThemedText>
      )}

      <RowButton
        icon={{ ios: 'phone.fill', android: 'call', web: 'call' }}
        title={t('home.helpCard')}
        onPress={() => router.navigate('/help')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, lineHeight: 44, marginTop: Spacing.two },
  group: { gap: Spacing.two },
});
