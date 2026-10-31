import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { EMERGENCY_NUMBERS } from '@/constants/emergency';
import { Spacing } from '@/constants/theme';
import { requestPosition } from '@/hooks/use-location';
import { contactsStore } from '@/stores';

/**
 * Works with no account, no network and no backend: the numbers are compiled in and calls go
 * straight to the phone dialer.
 */
export default function HelpScreen() {
  const { t } = useTranslation();
  const contacts = contactsStore.useValue().filter((c) => c.state === 'ACCEPTED' || c.state === 'INVITED');
  const [failedNumber, setFailedNumber] = useState<string | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  async function dial(number: string) {
    setFailedNumber(null);
    try {
      await Linking.openURL(`tel:${number}`);
    } catch {
      setFailedNumber(number);
    }
  }

  async function copyLocation() {
    setLocationMessage(null);
    const { position } = await requestPosition();
    if (!position) {
      setLocationMessage(t('help.locationFailed'));
      return;
    }
    const text = `${position.coordinate[1].toFixed(5)}, ${position.coordinate[0].toFixed(5)}`;
    await Clipboard.setStringAsync(text);
    setLocationMessage(t('help.locationCopied', { text }));
  }

  return (
    <Screen tab>
      <ThemedText type="subtitle" accessibilityRole="header" style={styles.title}>
        {t('help.title')}
      </ThemedText>
      <ThemedText type="default">{t('help.intro')}</ThemedText>

      <View style={styles.group}>
        {EMERGENCY_NUMBERS.map(({ number, key }) => (
          <View key={number} style={styles.group}>
            <ThemedText type="small" themeColor="textSecondary">
              {t(`help.numbers.${key}`)}
            </ThemedText>
            <Button variant="danger" icon={{ ios: 'phone.fill', android: 'call', web: 'call' }} label={t('help.call', { number })} onPress={() => dial(number)} />
          </View>
        ))}
        <ThemedText type="caption" themeColor="textSecondary">
          {t('help.callNote')}
        </ThemedText>
        {failedNumber && <Notice kind="warning" text={t('help.unavailable', { number: failedNumber })} />}
      </View>

      <Card>
        <Button variant="secondary" icon={{ ios: 'location', android: 'my_location', web: 'my_location' }} label={t('help.location')} onPress={copyLocation} />
        {locationMessage && (
          <ThemedText type="small" accessibilityLiveRegion="polite">
            {locationMessage}
          </ThemedText>
        )}
        <ThemedText type="caption" themeColor="textSecondary">
          {t('help.locationNote')}
        </ThemedText>
      </Card>

      {contacts.length > 0 && (
        <View style={styles.group}>
          <ThemedText type="heading" accessibilityRole="header">
            {t('help.contacts')}
          </ThemedText>
          {contacts.map((c) => (
            <Card key={c.id}>
              <ThemedText type="default">{c.name}</ThemedText>
              <View style={styles.row}>
                <Button style={styles.grow} variant="secondary" label={t('help.callContact')} onPress={() => Linking.openURL(`tel:${c.phone}`).catch(() => setFailedNumber(c.phone))} />
                <Button style={styles.grow} variant="secondary" label={t('help.messageContact')} onPress={() => Linking.openURL(`sms:${c.phone}`).catch(() => setFailedNumber(c.phone))} />
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, lineHeight: 44, marginTop: Spacing.two },
  group: { gap: Spacing.two },
  row: { flexDirection: 'row', gap: Spacing.two },
  grow: { flex: 1 },
});
