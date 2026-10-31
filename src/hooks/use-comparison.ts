import { useQuery } from '@tanstack/react-query';

import { compareRoutes } from '@/api';
import type { LngLat } from '@/domain/types';
import { planStore } from '@/stores';

/** Runs the route comparison for the trip in the plan store. Shared by the route screens. */
export function useComparison() {
  const plan = planStore.useValue();
  const origin: LngLat | null =
    plan.origin?.kind === 'device' ? (plan.device?.coordinate ?? null) : (plan.origin?.place?.coordinate ?? null);
  const destination = plan.destination;

  const query = useQuery({
    queryKey: ['compare', origin, destination?.id],
    queryFn: () => compareRoutes({ origin: origin!, destination: destination!.coordinate, destinationId: destination!.id }),
    enabled: !!origin && !!destination,
    retry: false,
    staleTime: 5 * 60_000,
  });

  return { query, plan, origin, destination };
}
