import {
  Activity,
  Eye,
  GalleryHorizontalEnd,
  Image,
  MousePointerClick,
  Newspaper,
  Pill,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAnalytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const RANGE_OPTIONS = [
  { days: 7, label: "7 days" },
  { days: 28, label: "28 days" },
  { days: 90, label: "90 days" },
];

const sections = [
  {
    to: "/medicines",
    title: "Medicines",
    description: "Manage the medicine catalog",
    icon: Pill,
  },
  {
    to: "/articles",
    title: "Articles",
    description: "Write and publish articles",
    icon: Newspaper,
  },
  {
    to: "/gallery",
    title: "Gallery",
    description: "Manage gallery images",
    icon: Image,
  },
  {
    to: "/hero-slides",
    title: "Hero slider",
    description: "Manage the homepage sliding images",
    icon: GalleryHorizontalEnd,
  },
];

function formatNumber(n: number) {
  return n.toLocaleString("en-US");
}

function Delta({ current, previous }: { current: number; previous: number }) {
  if (!previous) return null;
  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        up ? "text-emerald-600" : "text-red-600",
      )}
    >
      {up ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {up ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

export function DashboardPage() {
  const [days, setDays] = useState(28);
  const { data, isLoading, isError, error, refetch, isFetching, dataUpdatedAt } =
    useAnalytics(days);

  const statCards = data
    ? [
        {
          title: "Active users now",
          value: formatNumber(data.active_users_now),
          icon: Activity,
          live: true,
        },
        {
          title: "Users",
          value: formatNumber(data.totals.users),
          icon: Users,
          delta: { current: data.totals.users, previous: data.totals.prev_users },
        },
        {
          title: "Sessions",
          value: formatNumber(data.totals.sessions),
          icon: MousePointerClick,
          delta: {
            current: data.totals.sessions,
            previous: data.totals.prev_sessions,
          },
        },
        {
          title: "Page views",
          value: formatNumber(data.totals.page_views),
          icon: Eye,
          delta: {
            current: data.totals.page_views,
            previous: data.totals.prev_page_views,
          },
        },
      ]
    : [];

  const maxChannelSessions = data
    ? Math.max(...data.traffic_sources.map((s) => s.sessions), 1)
    : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Website analytics from Google Analytics.
            {dataUpdatedAt > 0 && (
              <>
                {" "}
                Last updated{" "}
                {new Date(dataUpdatedAt).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border">
            {RANGE_OPTIONS.map(({ days: d, label }) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors first:rounded-l-md last:rounded-r-md",
                  days === d
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh"
          >
            <RefreshCw
              className={cn("h-4 w-4", isFetching && "animate-spin")}
            />
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
          <Skeleton className="h-72 w-full" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      )}

      {isError && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          Failed to load analytics:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map(({ title, value, icon: Icon, delta, live }) => (
              <Card key={title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{value}</span>
                    {live && (
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      </span>
                    )}
                    {delta && (
                      <Delta current={delta.current} previous={delta.previous} />
                    )}
                  </div>
                  {!live && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      vs previous {days} days
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Traffic overview</CardTitle>
              <CardDescription>
                Daily users and page views, last {days} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d: string) => d.slice(5)}
                      tickLine={false}
                      fontSize={12}
                      className="text-muted-foreground"
                    />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip
                      formatter={(value, name) => [
                        formatNumber(Number(value ?? 0)),
                        name === "users" ? "Users" : "Page views",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="page_views"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.08}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="hsl(var(--primary) / 0.5)"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top pages</CardTitle>
                <CardDescription>
                  Most viewed pages, last {days} days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.top_pages.map((page) => (
                      <TableRow key={page.path}>
                        <TableCell className="max-w-xs truncate font-medium">
                          {page.path}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(page.views)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(page.users)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Traffic sources</CardTitle>
                <CardDescription>
                  Sessions by channel group, last {days} days
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.traffic_sources.map((source) => (
                  <div key={source.channel} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{source.channel}</span>
                      <span className="text-muted-foreground">
                        {formatNumber(source.sessions)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{
                          width: `${(source.sessions / maxChannelSessions) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Manage content</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map(({ to, title, description, icon: Icon }) => (
            <Link key={to} to={to}>
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardHeader>
                  <Icon className="mb-2 h-8 w-8 text-primary" />
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
