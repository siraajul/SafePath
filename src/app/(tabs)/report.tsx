import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { Spacing } from '@/constants/theme';
import { generalise } from '@/domain/geo';
import { PLACES } from '@/domain/synthetic';
import type { LngLat, ReportCategory } from '@/domain/types';
import { usePreferences } from '@/hooks/use-preferences';
import { requestPosition } from '@/hooks/use-location';
import { placeLabel } from '@/lib/place';
import { newId, reportsStore } from '@/stores';

const CATEGORIES: ReportCategory[] = ['STREETLIGHT', 'OBSTRUCTION', 'NO_WALKWAY', 'OTHER'];
const WHEN = { NOW: 0, TODAY: 3 * 3_600_000, YESTERDAY: 24 * 3_600_000 } as const;
const REPORT_PLACES = PLACES.filter((p) => p.scenario !== 'OUTSIDE_PILOT');

export default function ReportScreen() {
  const { t } = useTranslation();
  const { language } = usePreferences();
  // One id per form, so a retry after a poor connection can never create a second report.
  const formId = useRef(newId());
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [area, setArea] = useState<LngLat | null>(null);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [when, setWhen] = useState<keyof typeof WHEN>('NOW');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [locating, setLocating] = useState(false);

  async function useMyArea() {
    setLocating(true);
    const { position } = await requestPosition();
    setLocating(false);
    if (position) {
      setArea(generalise(position.coordinate));
      setPlaceId(null);
    }
  }

  async function pickPhoto() {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, exif: false });
    if (picked.canceled) return;
    const asset = picked.assets[0];
    // Re-encoding the image drops its embedded metadata, including any GPS position.
    const context = ImageManipulator.ImageManipulator.manipulate(asset.uri);
    if (asset.width > 1280) context.resize({ width: 1280 });
    const rendered = await context.renderAsync();
    const clean = await rendered.saveAsync({ format: ImageManipulator.SaveFormat.JPEG, compress: 0.7 });
    setPhoto(clean.uri);
  }

  function submit() {
    if (!category) return setError(t('report.needCategory'));
    if (!area && !placeId) return setError(t('report.needWhere'));
    setError(null);
    reportsStore.set((all) =>
      all.some((r) => r.id === formId.current)
        ? all
        : [
            {
              id: formId.current,
              category,
              area,
              placeId,
              occurredAt: Date.now() - WHEN[when],
              note: note.trim(),
              photoUri: photo,
              state: 'SUBMITTED',
              createdAt: Date.now(),
            },
            ...all,
          ],
    );
    setSaved(true);
  }

  function reset() {
    formId.current = newId();
    setCategory(null);
    setArea(null);
    setPlaceId(null);
    setWhen('NOW');
    setNote('');
    setPhoto(null);
    setSaved(false);
  }

  if (saved) {
    return (
      <Screen tab>
        <Card>
          <ThemedText type="heading" accessibilityRole="header">
            {t('report.saved')}
          </ThemedText>
          <ThemedText type="default">{t('report.savedBody')}</ThemedText>
        </Card>
        <Button label={t('report.myReports')} onPress={() => router.push('/reports')} />
        <Button variant="secondary" label={t('report.another')} onPress={reset} />
      </Screen>
    );
  }

  return (
    <Screen tab>
      <ThemedText type="subtitle" accessibilityRole="header" style={styles.title}>
        {t('report.title')}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {t('report.intro')}
      </ThemedText>

      <ThemedText type="heading" accessibilityRole="header">
        {t('report.category')}
      </ThemedText>
      <Segmented wrap value={category} onChange={setCategory} options={CATEGORIES.map((c) => ({ value: c, label: t(`report.categories.${c}`) }))} />

      <ThemedText type="heading" accessibilityRole="header">
        {t('report.where')}
      </ThemedText>
      <Button variant="secondary" loading={locating} icon={{ ios: 'location', android: 'my_location', web: 'my_location' }} label={area ? t('report.areaSet') : t('report.useMyArea')} onPress={useMyArea} />
      <ThemedText type="small" themeColor="textSecondary">
        {t('report.orPlace')}
      </ThemedText>
      <Segmented
        wrap
        value={placeId}
        onChange={(id) => {
          setPlaceId(id);
          setArea(null);
        }}
        options={REPORT_PLACES.map((p) => ({ value: p.id, label: placeLabel(p, language) }))}
      />

      <ThemedText type="heading" accessibilityRole="header">
        {t('report.when')}
      </ThemedText>
      <Segmented wrap value={when} onChange={setWhen} options={(Object.keys(WHEN) as (keyof typeof WHEN)[]).map((k) => ({ value: k, label: t(`report.whenOptions.${k}`) }))} />

      <Field label={t('report.note')} value={note} onChangeText={setNote} placeholder={t('report.noteHint')} multiline maxLength={280} style={styles.note} />

      <View style={styles.photo}>
        <Notice kind="warning" text={t('report.photoNote')} />
        {photo ? (
          <>
            <Image source={{ uri: photo }} style={styles.preview} contentFit="cover" accessibilityLabel={t('report.photo')} />
            <Button variant="secondary" label={t('report.removePhoto')} onPress={() => setPhoto(null)} />
          </>
        ) : (
          <Button variant="secondary" icon={{ ios: 'photo', android: 'image', web: 'image' }} label={t('report.photo')} onPress={pickPhoto} />
        )}
      </View>

      {error && (
        <ThemedText type="smallBold" accessibilityLiveRegion="assertive">
          {error}
        </ThemedText>
      )}
      <Button label={t('report.submit')} onPress={submit} />
      <Button variant="ghost" label={t('report.myReports')} onPress={() => router.push('/reports')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, lineHeight: 44, marginTop: Spacing.two },
  note: { minHeight: 96, textAlignVertical: 'top', paddingTop: Spacing.two },
  photo: { gap: Spacing.two },
  preview: { width: '100%', height: 180, borderRadius: Spacing.three },
});
