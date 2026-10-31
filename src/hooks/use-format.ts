import { useTranslation } from 'react-i18next';

import { usePreferences } from '@/hooks/use-preferences';
import { formatDate, formatNumber } from '@/lib/format';

/** Locale-aware formatting helpers: Bangla digits and Asia/Dhaka dates. */
export function useFormat() {
  const { t } = useTranslation();
  const { language } = usePreferences();

  return {
    number: (n: number) => formatNumber(n, language),
    date: (iso: string) => formatDate(iso, language),
    minutes: (n: number) => t('common.minutes', { n: formatNumber(n, language) }),
    distance: (m: number) =>
      m >= 1000
        ? t('common.kilometres', { n: formatNumber(Math.round(m / 100) / 10, language, 1) })
        : t('common.metres', { n: formatNumber(Math.round(m / 10) * 10, language) }),
  };
}
