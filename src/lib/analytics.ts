import { useQuery } from "@tanstack/react-query";

import type { AnalyticsSummary } from "@/lib/api";
import { analyticsApi } from "@/lib/api";

const USE_MOCK = true;

function mockSummary(days: number): AnalyticsSummary {
  const trend = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const wave = Math.sin(i / 3) * 0.3 + Math.sin(i / 7) * 0.2;
    const users = Math.round(40 + i * 0.6 + wave * 20);
    return {
      date: d.toISOString().slice(0, 10),
      users,
      page_views: Math.round(users * 2.4),
    };
  });
  const users = trend.reduce((s, p) => s + p.users, 0);
  const pageViews = trend.reduce((s, p) => s + p.page_views, 0);
  return {
    active_users_now: 7,
    totals: {
      users,
      sessions: Math.round(users * 1.35),
      page_views: pageViews,
      prev_users: Math.round(users * 0.88),
      prev_sessions: Math.round(users * 1.2),
      prev_page_views: Math.round(pageViews * 0.92),
    },
    trend,
    top_pages: [
      { path: "/", views: 1240, users: 860 },
      { path: "/medicines", views: 640, users: 480 },
      { path: "/articles", views: 520, users: 410 },
      { path: "/about", views: 380, users: 320 },
      { path: "/appointments", views: 290, users: 240 },
      { path: "/gallery", views: 180, users: 150 },
    ],
    traffic_sources: [
      { channel: "Organic Search", sessions: 980 },
      { channel: "Direct", sessions: 620 },
      { channel: "Social", sessions: 340 },
      { channel: "Referral", sessions: 180 },
      { channel: "Email", sessions: 90 },
    ],
    generated_at: new Date().toISOString(),
  };
}

export function useAnalytics(days: number) {
  return useQuery({
    queryKey: ["analytics", "summary", days],
    queryFn: () =>
      USE_MOCK
        ? new Promise<AnalyticsSummary>((resolve) =>
            setTimeout(() => resolve(mockSummary(days)), 600),
          )
        : analyticsApi.summary(days),
  });
}
