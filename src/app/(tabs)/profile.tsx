import { useFocusEffect, router } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { RowButton } from '@/components/ui/row-button';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { Spacing } from '@/constants/theme';
import { useLocationPermission } from '@/hooks/use-location';
import { useFormat } from '@/hooks/use-format';
import { usePreferences } from '@/hooks/use-preferences';
import type { Language } from '@/i18n';
import { confirm } from '@/lib/confirm';
import { contactsStore, deleteAllData, effectiveJourney, journeyStore, reportsStore } from '@/stores';

const LANGUAGES: Language[] = ['bn', 'en'];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const f = useFormat();
  const { language, setLanguage } = usePreferences();
  const location = useLocationPermission();
  const contacts = contactsStore.useValue().filter((c) => c.state !== 'REVOKED');
  const reports = reportsStore.useValue();
  const journey = effectiveJourney(journeyStore.useValue());

  const { refresh } = location;
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  async function deleteData() {
    if (await confirm(t('profile.deleteTitle'), t('profile.deleteBody'), t('common.delete'), t('common.cancel'))) {
      deleteAllData();
    }
  }

  return (
    <Screen tab>
      <ThemedText type="subtitle" accessibilityRole="header" style={styles.title}>
        {t('profile.title')}
      </ThemedText>

      <Card>
        <ThemedText type="smallBold">{t('profile.anonymous')}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('profile.anonymousBody')}
        </ThemedText>
      </Card>

      <View style={styles.group}>
        <ThemedText type="heading" accessibilityRole="header">
          {t('profile.language')}
        </ThemedText>
        <Segmented value={language} onChange={setLanguage} options={LANGUAGES.map((l) => ({ value: l, label: t(`language.${l}`) }))} />
      </View>

      <Card>
        <ThemedText type="smallBold">{t('profile.location')}</ThemedText>
        <ThemedText type="small">{t(`profile.locationState.${location.state}`)}</ThemedText>
        {location.state === 'blocked' ? (
          <Button variant="secondary" label={t('common.openSettings')} onPress={() => Linking.openSettings()} />
        ) : location.state !== 'granted' ? (
          <Button variant="secondary" label={t('profile.allow')} onPress={() => location.request()} />
        ) : null}
      </Card>

      <View style={styles.group}>
        <RowButton icon={{ ios: 'person.2', android: 'group', web: 'group' }} title={t('profile.trusted')} subtitle={f.number(contacts.length)} onPress={() => router.push('/contacts')} />
        <RowButton
          icon={{ ios: 'dot.radiowaves.left.and.right', android: 'sensors', web: 'sensors' }}
          title={t('profile.sharing')}
          subtitle={journey?.state === 'ACTIVE' ? t('profile.sharingOn') : t('profile.sharingOff')}
          onPress={() => router.push('/share')}
        />
        <RowButton icon={{ ios: 'doc.text', android: 'description', web: 'description' }} title={t('profile.reports')} subtitle={f.number(reports.length)} onPress={() => router.push('/reports')} />
      </View>

      <View style={styles.group}>
        <ThemedText type="heading" accessibilityRole="header">
          {t('profile.data')}
        </ThemedText>
        <Button variant="danger" label={t('profile.deleteData')} onPress={deleteData} />
      </View>

      <Notice kind="synthetic" text={`${t('profile.about')}: ${t('profile.aboutBody')}`} />
      <ThemedText type="small" themeColor="textSecondary">
        {t('common.disclaimer')}
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, lineHeight: 44, marginTop: Spacing.two },
  group: { gap: Spacing.two },
});
