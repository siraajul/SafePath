import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { Spacing } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { contactsStore, effectiveJourney, journeyStore, newId } from '@/stores';

const DURATIONS = ['30', '60', '120'] as const;

export default function ShareScreen() {
  const { t } = useTranslation();
  const f = useFormat();
  const theme = useTheme();
  const contacts = contactsStore.useValue();
  const stored = journeyStore.useValue();
  const [now, setNow] = useState(() => Date.now());
  const [chosen, setChosen] = useState<string[]>([]);
  const [minutes, setMinutes] = useState<(typeof DURATIONS)[number]>('60');

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const journey = effectiveJourney(stored, now);
  const accepted = contacts.filter((c) => c.state === 'ACCEPTED');
  const active = journey?.state === 'ACTIVE' ? journey : null;
  const names = active ? contacts.filter((c) => active.recipientIds.includes(c.id)).map((c) => c.name).join(', ') : '';

  function start() {
    const startedAt = Date.now();
    journeyStore.set({ id: newId(), startedAt, expiresAt: startedAt + Number(minutes) * 60_000, recipientIds: chosen, state: 'ACTIVE' });
  }

  function stop() {
    journeyStore.set((j) => (j ? { ...j, state: 'ENDED' } : j));
  }

  if (active) {
    const left = Math.max(1, Math.ceil((active.expiresAt - now) / 60_000));
    return (
      <Screen>
        <Card>
          <View style={styles.status}>
            <SymbolView name={{ ios: 'dot.radiowaves.left.and.right', android: 'sensors', web: 'sensors' }} size={22} tintColor={theme.brand} />
            <ThemedText type="heading">{t('share.active')}</ThemedText>
          </View>
          <ThemedText type="default">{t('share.sharedWith', { names })}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t('share.expiresIn', { time: f.minutes(left) })}
          </ThemedText>
        </Card>
        <Notice kind="preview" text={t('share.stateNote')} />
        <Button variant="danger" label={t('share.stop')} onPress={stop} />
        <Button variant="secondary" label={t('common.close')} onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      {journey && (
        <ThemedText type="small" themeColor="textSecondary">
          {t('share.ended')}
        </ThemedText>
      )}
      <Card>
        <ThemedText type="smallBold">{t('share.explainTitle')}</ThemedText>
        <ThemedText type="small">{t('share.explain')}</ThemedText>
      </Card>

      <ThemedText type="heading" accessibilityRole="header">
        {t('share.who')}
      </ThemedText>
      {accepted.length === 0 ? (
        <View style={styles.group}>
          <ThemedText type="default">{contacts.length === 0 ? t('share.noContacts') : t('share.waitingContacts')}</ThemedText>
          <Button variant="secondary" label={contacts.length === 0 ? t('share.addContact') : t('share.manage')} onPress={() => router.push('/contacts')} />
        </View>
      ) : (
        <View style={styles.group}>
          {accepted.map((c) => {
            const on = chosen.includes(c.id);
            return (
              <Pressable
                key={c.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                onPress={() => setChosen((all) => (on ? all.filter((x) => x !== c.id) : [...all, c.id]))}
                style={[styles.contact, { backgroundColor: theme.backgroundElement, borderColor: on ? theme.brand : theme.backgroundSelected }]}>
                <SymbolView
                  name={on ? { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' } : { ios: 'circle', android: 'radio_button_unchecked', web: 'radio_button_unchecked' }}
                  size={24}
                  tintColor={on ? theme.brand : theme.textSecondary}
                />
                <ThemedText type="default">{c.name}</ThemedText>
              </Pressable>
            );
          })}
          <Button variant="ghost" label={t('share.manage')} onPress={() => router.push('/contacts')} />
        </View>
      )}

      <ThemedText type="heading" accessibilityRole="header">
        {t('share.duration')}
      </ThemedText>
      <Segmented
        value={minutes}
        onChange={setMinutes}
        options={DURATIONS.map((m) => ({ value: m, label: Number(m) < 60 ? f.minutes(Number(m)) : t('share.hours', { n: f.number(Number(m) / 60) }) }))}
      />

      <Notice kind="preview" text={t('share.stateNote')} />
      <Button label={t('share.start')} disabled={chosen.length === 0} onPress={start} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  group: { gap: Spacing.two },
  contact: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 2,
  },
});
