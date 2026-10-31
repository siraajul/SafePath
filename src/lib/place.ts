import type { Language } from '@/i18n';
import type { Place } from '@/domain/types';

/** Dual-script label, e.g. "শাহবাগ (Shahbag)", with the user's language first. */
export function placeLabel(place: Place, language: Language): string {
  return language === 'bn' ? `${place.name.bn} (${place.name.en})` : `${place.name.en} (${place.name.bn})`;
}
