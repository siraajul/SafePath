import type { Language } from '@/i18n';

const locale = (lang: Language) => (lang === 'bn' ? 'bn-BD' : 'en-GB');

/** Hermes formats bn-BD with Latin digits, so convert explicitly. */
export const toBanglaDigits = (s: string) => s.replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
const localiseDigits = (s: string, lang: Language) => (lang === 'bn' ? toBanglaDigits(s) : s);

export function formatNumber(n: number, lang: Language, decimals = 0): string {
  try {
    return localiseDigits(
      new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(n),
      lang,
    );
  } catch {
    return localiseDigits(n.toFixed(decimals), lang);
  }
}

/** Dates are shown in Bangladesh time, whatever the device zone is. */
export function formatDate(iso: string, lang: Language): string {
  try {
    return localiseDigits(
      new Intl.DateTimeFormat(locale(lang), {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Dhaka',
      }).format(new Date(iso)),
      lang,
    );
  } catch {
    return iso;
  }
}

/** Phone numbers: Bangladesh mobile, with or without +88. Returns the 11-digit form or null. */
export function normalisePhone(input: string): string | null {
  const digits = input
    .replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)))
    .replace(/[\s-]/g, '');
  const local = digits.replace(/^\+?88/, '');
  return /^01[3-9]\d{8}$/.test(local) ? local : null;
}
