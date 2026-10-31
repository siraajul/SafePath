import { resolveLanguage } from '@/i18n';

describe('resolveLanguage', () => {
  it('defaults to Bangla on a Bangla device and English otherwise', () => {
    expect(resolveLanguage(null, 'bn')).toBe('bn');
    expect(resolveLanguage(null, 'en')).toBe('en');
    expect(resolveLanguage(null, 'fr')).toBe('en');
    expect(resolveLanguage(null, null)).toBe('en');
  });

  it('lets a saved choice override the device language', () => {
    expect(resolveLanguage('en', 'bn')).toBe('en');
    expect(resolveLanguage('bn', 'en')).toBe('bn');
  });

  it('ignores an unrecognised saved value', () => {
    expect(resolveLanguage('xx', 'bn')).toBe('bn');
  });
});
