import { useQuery } from "@tanstack/react-query";

import { analyticsApi } from "@/lib/api";

export function useAnalytics(days: number) {
  return useQuery({
    queryKey: ["analytics", "summary", days],
    queryFn: () => analyticsApi.summary(days),
    // The backend caches the historical reports for 5 minutes; only the
    // "active users now" tile is live, so refetch on a slow beat.
    staleTime: 60_000,
    refetchInterval: 120_000,
    refetchOnWindowFocus: true,
  });
}
