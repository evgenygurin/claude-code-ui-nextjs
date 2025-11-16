'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Clock, Users, TrendingUp } from 'lucide-react';

interface SentryMetricsProps {
  isLoading: boolean;
  lastUpdate: Date;
}

interface SentryData {
  errorTrends: Array<{ date: string; count: number }>;
  priorityDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  topErrors: Array<{
    id: string;
    title: string;
    count: number;
    users: number;
    lastSeen: string;
  }>;
  mttr: number; // Mean Time To Resolution in minutes
  totalErrors24h: number;
  affectedUsers24h: number;
}

export function SentryMetrics({ isLoading, lastUpdate }: SentryMetricsProps) {
  const [data, setData] = useState<SentryData>({
    errorTrends: [],
    priorityDistribution: { critical: 0, high: 0, medium: 0, low: 0 },
    topErrors: [],
    mttr: 0,
    totalErrors24h: 0,
    affectedUsers24h: 0
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/metrics/sentry');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch Sentry metrics:', error);
      }
    }

    fetchData();
  }, [lastUpdate]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <div className="h-64 bg-muted animate-pulse rounded" />
        </Card>
      </div>
    );
  }

  const totalPriority =
    data.priorityDistribution.critical +
    data.priorityDistribution.high +
    data.priorityDistribution.medium +
    data.priorityDistribution.low;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Errors (24h)</p>
              <p className="text-2xl font-bold mt-2">{data.totalErrors24h}</p>
            </div>
            <AlertTriangle className="h-6 w-6 text-orange-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Affected Users (24h)</p>
              <p className="text-2xl font-bold mt-2">{data.affectedUsers24h}</p>
            </div>
            <Users className="h-6 w-6 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">MTTR</p>
              <p className="text-2xl font-bold mt-2">{data.mttr} min</p>
            </div>
            <Clock className="h-6 w-6 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Priority Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Priority Distribution</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Critical</span>
              <span className="text-sm text-muted-foreground">
                {data.priorityDistribution.critical} errors
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all"
                style={{
                  width: totalPriority > 0 ? `${(data.priorityDistribution.critical / totalPriority) * 100}%` : '0%'
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">High</span>
              <span className="text-sm text-muted-foreground">
                {data.priorityDistribution.high} errors
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{
                  width: totalPriority > 0 ? `${(data.priorityDistribution.high / totalPriority) * 100}%` : '0%'
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Medium</span>
              <span className="text-sm text-muted-foreground">
                {data.priorityDistribution.medium} errors
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all"
                style={{
                  width: totalPriority > 0 ? `${(data.priorityDistribution.medium / totalPriority) * 100}%` : '0%'
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Low</span>
              <span className="text-sm text-muted-foreground">
                {data.priorityDistribution.low} errors
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{
                  width: totalPriority > 0 ? `${(data.priorityDistribution.low / totalPriority) * 100}%` : '0%'
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Top Errors Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Errors</h3>
        <div className="space-y-3">
          {data.topErrors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No errors in the last 24 hours 🎉
            </p>
          ) : (
            data.topErrors.map((error) => (
              <div
                key={error.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{error.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last seen: {new Date(error.lastSeen).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <p className="font-medium">{error.count}</p>
                    <p className="text-xs text-muted-foreground">occurrences</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{error.users}</p>
                    <p className="text-xs text-muted-foreground">users</p>
                  </div>
                  <button className="px-3 py-1 text-xs border rounded hover:bg-accent">
                    View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Error Trends Chart (simplified) */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Error Trends (Last 7 Days)</h3>
        <div className="h-48 flex items-end justify-between gap-2">
          {data.errorTrends.length === 0 ? (
            <p className="text-sm text-muted-foreground w-full text-center">
              No trend data available
            </p>
          ) : (
            data.errorTrends.map((trend, index) => {
              const maxCount = Math.max(...data.errorTrends.map((t) => t.count));
              const height = maxCount > 0 ? (trend.count / maxCount) * 100 : 0;

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-primary/20 rounded-t flex items-end justify-center relative group">
                    <div
                      className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                      style={{ height: `${height}px`, minHeight: trend.count > 0 ? '4px' : '0px' }}
                    >
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-popover px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {trend.count} errors
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(trend.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
