import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

import type { LngLat } from '@/domain/types';

export type PermissionState = 'undetermined' | 'granted' | 'denied' | 'blocked';
export type Position = { coordinate: LngLat; accuracy: number | null };

function toState(r: Location.LocationPermissionResponse): PermissionState {
  if (r.granted) return 'granted';
  if (r.status === Location.PermissionStatus.UNDETERMINED) return 'undetermined';
  return r.canAskAgain ? 'denied' : 'blocked';
}

/** Reads the current permission without asking. The system prompt only appears on `request`. */
export function useLocationPermission() {
  const [state, setState] = useState<PermissionState>('undetermined');

  const refresh = useCallback(async () => {
    try {
      setState(toState(await Location.getForegroundPermissionsAsync()));
    } catch {
      setState('denied');
    }
  }, []);

  useEffect(() => {
    let active = true;
    Location.getForegroundPermissionsAsync()
      .then((r) => active && setState(toState(r)))
      .catch(() => active && setState('denied'));
    return () => {
      active = false;
    };
  }, []);

  const request = useCallback(async () => {
    try {
      const next = toState(await Location.requestForegroundPermissionsAsync());
      setState(next);
      return next;
    } catch {
      setState('denied');
      return 'denied' as const;
    }
  }, []);

  return { state, refresh, request };
}

/** Asks for permission if needed, then reads one position. Call only from a user action. */
export async function requestPosition(): Promise<{ state: PermissionState; position: Position | null }> {
  try {
    let perm = await Location.getForegroundPermissionsAsync();
    if (!perm.granted && perm.canAskAgain) perm = await Location.requestForegroundPermissionsAsync();
    const state = toState(perm);
    if (state !== 'granted') return { state, position: null };
    const fix = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return {
      state,
      position: { coordinate: [fix.coords.longitude, fix.coords.latitude], accuracy: fix.coords.accuracy },
    };
  } catch {
    return { state: 'denied', position: null };
  }
}
