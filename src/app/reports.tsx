import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { placeById } from '@/domain/synthetic';
import { useFormat } from '@/hooks/use-format';
import { usePreferences } from '@/hooks/use-preferences';
import { confirm } from '@/lib/confirm';
import { placeLabel } from '@/lib/place';
import { reportsStore } from '@/stores';

export default function ReportsScreen() {
  const { t } = useTranslation();
  const f = useFormat();
  const { language } = usePreferences();
  const reports = reportsStore.useValue();

  async function remove(id: string) {
    if (await confirm(t('reports.deleteTitle'), t('reports.deleteBody'), t('common.delete'), t('common.cancel'))) {
      reportsStore.set((all) => all.filter((r) => r.id !== id));
    }
  }

  return (
    <Screen>
      {reports.length === 0 && <ThemedText type="default">{t('reports.empty')}</ThemedText>}
      {reports.map((r) => {
        const place = r.placeId ? placeById(r.placeId) : null;
        return (
          <Card key={r.id}>
            <ThemedText type="default">{t(`report.categories.${r.category}`)}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {place ? placeLabel(place, language) : t('report.areaSet')} · {f.date(new Date(r.occurredAt).toISOString())}
            </ThemedText>
            {r.note ? <ThemedText type="small">{r.note}</ThemedText> : null}
            {r.photoUri ? <Image source={{ uri: r.photoUri }} style={styles.photo} contentFit="cover" /> : null}
            <ThemedText type="smallBold">{t(`reports.state.${r.state}`)}</ThemedText>
            <Button variant="secondary" label={t('reports.delete')} onPress={() => remove(r.id)} />
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', height: 140, borderRadius: Spacing.two },
});
