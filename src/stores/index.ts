import { createStore } from '@/lib/persisted-store';
import type { Journey, LngLat, Place, Report, TrustedContact } from '@/domain/types';

export const contactsStore = createStore<TrustedContact[]>([], 'safepath.contacts');
export const reportsStore = createStore<Report[]>([], 'safepath.reports');
export const journeyStore = createStore<Journey | null>(null, 'safepath.journey');

/** The trip being planned. In memory only: route searches are never kept as history. */
export type Plan = {
  origin: { kind: 'device' | 'place'; place?: Place } | null;
  destination: Place | null;
  /** Last device position this session, used when the origin is "my location". */
  device: { coordinate: LngLat; accuracy: number | null } | null;
};
export const planStore = createStore<Plan>({ origin: null, destination: null, device: null });

export const hydrateStores = () =>
  Promise.all([contactsStore.hydrate(), reportsStore.hydrate(), journeyStore.hydrate()]);

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** A journey past its expiry is no longer active, whatever was stored. */
export function effectiveJourney(journey: Journey | null, now = Date.now()): Journey | null {
  if (!journey) return null;
  if (journey.state === 'ACTIVE' && now >= journey.expiresAt) return { ...journey, state: 'EXPIRED' };
  return journey;
}

/** Removing a contact also takes it out of any live journey, and ends the journey if nobody is left. */
export function removeContact(id: string) {
  contactsStore.set((all) => all.filter((c) => c.id !== id));
  journeyStore.set((j) => {
    if (!j || j.state !== 'ACTIVE') return j;
    const recipientIds = j.recipientIds.filter((r) => r !== id);
    return recipientIds.length === 0 ? { ...j, recipientIds, state: 'REVOKED' } : { ...j, recipientIds };
  });
}

export function deleteAllData() {
  contactsStore.set([]);
  reportsStore.set([]);
  journeyStore.set(null);
}
