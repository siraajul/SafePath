import { formatNumber, normalisePhone, toBanglaDigits } from './format';

describe('normalisePhone', () => {
  it('accepts local, international and Bangla-digit numbers', () => {
    expect(normalisePhone('01712 345678')).toBe('01712345678');
    expect(normalisePhone('+8801712345678')).toBe('01712345678');
    expect(normalisePhone('০১৭১২৩৪৫৬৭৮')).toBe('01712345678');
  });

  it('rejects numbers that are not Bangladeshi mobiles', () => {
    expect(normalisePhone('12345')).toBeNull();
    expect(normalisePhone('01012345678')).toBeNull();
    expect(normalisePhone('')).toBeNull();
  });
});

describe('digits', () => {
  it('uses Bangla digits only for Bangla', () => {
    expect(toBanglaDigits('790 m, 80%')).toBe('৭৯০ m, ৮০%');
    expect(formatNumber(1234, 'bn')).toBe('১,২৩৪');
    expect(formatNumber(1234, 'en')).toBe('1,234');
    expect(formatNumber(1.4, 'bn', 1)).toBe('১.৪');
  });
});
