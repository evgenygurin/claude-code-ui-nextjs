'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OverviewPanel } from '@/components/monitoring/overview-panel';
import { SentryMetrics } from '@/components/monitoring/sentry-metrics';
import { MergeConflictAnalytics } from '@/components/monitoring/merge-conflict-analytics';
import { CICDHealth } from '@/components/monitoring/cicd-health';
import { EscalationTimeline } from '@/components/monitoring/escalation-timeline';
import { SystemHealthOverview } from '@/components/monitoring/system-health-overview';

/**
 * Monitoring Dashboard Page
 *
 * Comprehensive monitoring dashboard for all automation systems:
 * - Sentry error tracking and escalations
 * - Merge conflict resolution statistics
 * - CI/CD pipeline health
 * - System health overview
 *
 * Real-time updates via polling (can be upgraded to WebSocket)
 */
export default function MonitoringDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Refresh data every 30 seconds when autoRefresh is enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitoring Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of error tracking, CI/CD, and automation systems
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm text-muted-foreground">
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
          >
            {autoRefresh ? 'Pause' : 'Resume'} Auto-refresh
          </button>

          <button
            onClick={() => setLastUpdate(new Date())}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Overview Panel - Always visible */}
      <OverviewPanel isLoading={isLoading} lastUpdate={lastUpdate} />

      {/* Tabbed Interface for Detailed Views */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">System Health</TabsTrigger>
          <TabsTrigger value="sentry">Sentry Metrics</TabsTrigger>
          <TabsTrigger value="conflicts">Merge Conflicts</TabsTrigger>
          <TabsTrigger value="cicd">CI/CD Pipeline</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* System Health Tab */}
        <TabsContent value="overview" className="space-y-4">
          <SystemHealthOverview isLoading={isLoading} lastUpdate={lastUpdate} />
        </TabsContent>

        {/* Sentry Metrics Tab */}
        <TabsContent value="sentry" className="space-y-4">
          <SentryMetrics isLoading={isLoading} lastUpdate={lastUpdate} />
        </TabsContent>

        {/* Merge Conflicts Tab */}
        <TabsContent value="conflicts" className="space-y-4">
          <MergeConflictAnalytics isLoading={isLoading} lastUpdate={lastUpdate} />
        </TabsContent>

        {/* CI/CD Health Tab */}
        <TabsContent value="cicd" className="space-y-4">
          <CICDHealth isLoading={isLoading} lastUpdate={lastUpdate} />
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <EscalationTimeline isLoading={isLoading} lastUpdate={lastUpdate} />
        </TabsContent>
      </Tabs>

      {/* Footer with metrics summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>Dashboard v1.0.0</div>
          <div className="flex gap-6">
            <span>Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}</span>
            <span>Refresh interval: 30s</span>
            <span>Data retention: 30 days</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
