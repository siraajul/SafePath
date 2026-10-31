import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

type Store<T> = {
  get: () => T;
  set: (next: T | ((current: T) => T)) => void;
  useValue: () => T;
  hydrate: () => Promise<void>;
};

/** A tiny external store; pass a key to persist it in AsyncStorage. */
export function createStore<T>(initial: T, key?: string): Store<T> {
  let value = initial;
  const listeners = new Set<() => void>();
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return {
    get: () => value,
    set(next) {
      value = typeof next === 'function' ? (next as (current: T) => T)(value) : next;
      listeners.forEach((l) => l());
      if (key) AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
    },
    useValue: () => useSyncExternalStore(subscribe, () => value, () => value),
    async hydrate() {
      if (!key) return;
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          value = JSON.parse(raw) as T;
          listeners.forEach((l) => l());
        }
      } catch {
        // Unreadable storage behaves like a first launch.
      }
    },
  };
}
