/**
 * Compiled into the app on purpose: the emergency dialer must never depend on the backend,
 * a login or the network (spec D-011). Numbers are from the Bangladesh Police helpline page.
 */
export const EMERGENCY_NUMBERS = [
  { number: '999', key: 'national' },
  { number: '109', key: 'violence' },
  { number: '1098', key: 'child' },
] as const;

export type EmergencyKey = (typeof EMERGENCY_NUMBERS)[number]['key'];
