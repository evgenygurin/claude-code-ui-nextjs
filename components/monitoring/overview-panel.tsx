'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle, GitMerge, Activity, TrendingUp, TrendingDown } from 'lucide-react';

interface OverviewPanelProps {
  isLoading: boolean;
  lastUpdate: Date;
}

interface OverviewMetrics {
  activeEscalations: number;
  recentMergeConflicts: number;
  cicdStatus: 'passing' | 'failing' | 'pending';
  errorRate24h: number;
  errorRateTrend: 'up' | 'down' | 'stable';
  systemHealth: number;
  mttr: number; // Mean Time To Resolution in minutes
}

export function OverviewPanel({ isLoading, lastUpdate }: OverviewPanelProps) {
  const [metrics, setMetrics] = useState<OverviewMetrics>({
    activeEscalations: 0,
    recentMergeConflicts: 0,
    cicdStatus: 'passing',
    errorRate24h: 0,
    errorRateTrend: 'stable',
    systemHealth: 100,
    mttr: 0
  });

  useEffect(() => {
    // Fetch overview metrics from API
    async function fetchMetrics() {
      try {
        const response = await fetch('/api/metrics/overview');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Failed to fetch overview metrics:', error);
      }
    }

    fetchMetrics();
  }, [lastUpdate]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="space-y-3">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Active Escalations */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Active Escalations</p>
            <p className="text-3xl font-bold mt-2">{metrics.activeEscalations}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.activeEscalations === 0 ? (
                <span className="text-green-600">All clear! 🎉</span>
              ) : (
                <span className="text-orange-600">Needs attention</span>
              )}
            </p>
          </div>
          <AlertCircle className={`h-8 w-8 ${metrics.activeEscalations > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
        </div>
      </Card>

      {/* Merge Conflicts */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Merge Conflicts (24h)</p>
            <p className="text-3xl font-bold mt-2">{metrics.recentMergeConflicts}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Auto-resolved
            </p>
          </div>
          <GitMerge className="h-8 w-8 text-blue-500" />
        </div>
      </Card>

      {/* CI/CD Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">CI/CD Pipeline</p>
            <p className="text-3xl font-bold mt-2 capitalize">{metrics.cicdStatus}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Latest build status
            </p>
          </div>
          {metrics.cicdStatus === 'passing' ? (
            <CheckCircle className="h-8 w-8 text-green-500" />
          ) : (
            <AlertCircle className="h-8 w-8 text-red-500" />
          )}
        </div>
      </Card>

      {/* Error Rate */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Error Rate (24h)</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-3xl font-bold">{metrics.errorRate24h}</p>
              <p className="text-sm text-muted-foreground">errors</p>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {metrics.errorRateTrend === 'down' ? (
                <>
                  <TrendingDown className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-green-600">Decreasing</p>
                </>
              ) : metrics.errorRateTrend === 'up' ? (
                <>
                  <TrendingUp className="h-4 w-4 text-red-600" />
                  <p className="text-xs text-red-600">Increasing</p>
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 text-gray-600" />
                  <p className="text-xs text-gray-600">Stable</p>
                </>
              )}
            </div>
          </div>
          <Activity className="h-8 w-8 text-purple-500" />
        </div>
      </Card>
    </div>
  );
}
