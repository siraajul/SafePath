import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { confirm } from '@/lib/confirm';
import { normalisePhone } from '@/lib/format';
import { contactsStore, newId, removeContact } from '@/stores';

export default function ContactsScreen() {
  const { t } = useTranslation();
  const contacts = contactsStore.useValue().filter((c) => c.state !== 'REVOKED');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  function add() {
    const normalised = normalisePhone(phone);
    const next: typeof errors = {};
    if (!name.trim()) next.name = t('contacts.invalidName');
    if (!normalised) next.phone = t('contacts.invalidPhone');
    else if (contacts.some((c) => c.phone === normalised)) next.phone = t('contacts.duplicate');
    setErrors(next);
    if (next.name || next.phone || !normalised) return;
    contactsStore.set((all) => [...all, { id: newId(), name: name.trim(), phone: normalised, state: 'INVITED' }]);
    setName('');
    setPhone('');
  }

  async function remove(id: string) {
    if (await confirm(t('contacts.removeTitle'), t('contacts.removeBody'), t('contacts.remove'), t('common.cancel'))) {
      removeContact(id);
    }
  }

  return (
    <Screen>
      <ThemedText type="small" themeColor="textSecondary">
        {t('contacts.intro')}
      </ThemedText>
      <Notice kind="preview" text={t('contacts.inviteNote')} />

      <View style={styles.list}>
        {contacts.length === 0 && <ThemedText type="default">{t('contacts.empty')}</ThemedText>}
        {contacts.map((c) => (
          <Card key={c.id}>
            <ThemedText type="default">{c.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {c.phone}
            </ThemedText>
            <ThemedText type="smallBold">{t(`contacts.state.${c.state}`)}</ThemedText>
            {__DEV__ && c.state === 'INVITED' && (
              <Button
                variant="ghost"
                label={t('contacts.simulateAccept')}
                onPress={() => contactsStore.set((all) => all.map((x) => (x.id === c.id ? { ...x, state: 'ACCEPTED' } : x)))}
              />
            )}
            <Button variant="secondary" label={t('contacts.remove')} onPress={() => remove(c.id)} />
          </Card>
        ))}
      </View>

      <Card>
        <Field label={t('contacts.name')} value={name} onChangeText={setName} error={errors.name} autoComplete="name" />
        <Field
          label={t('contacts.phone')}
          value={phone}
          onChangeText={setPhone}
          error={errors.phone}
          placeholder={t('contacts.phoneHint')}
          keyboardType="phone-pad"
          autoComplete="tel"
        />
        <Button label={t('contacts.add')} onPress={add} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
});
