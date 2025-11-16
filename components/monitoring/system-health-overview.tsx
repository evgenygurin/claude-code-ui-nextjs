'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Activity, Server, Database, Zap, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface SystemHealthOverviewProps {
  isLoading: boolean;
  lastUpdate: Date;
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  responseTime: number;
  errorRate: number;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

interface HealthData {
  overallHealth: number;
  services: ServiceHealth[];
  metrics: SystemMetrics;
  alerts: Array<{
    id: string;
    severity: 'warning' | 'error' | 'critical';
    message: string;
    timestamp: string;
  }>;
  trends: {
    health: 'improving' | 'stable' | 'degrading';
    errorRate: 'up' | 'down' | 'stable';
    performance: 'up' | 'down' | 'stable';
  };
}

export function SystemHealthOverview({ isLoading, lastUpdate }: SystemHealthOverviewProps) {
  const [data, setData] = useState<HealthData>({
    overallHealth: 100,
    services: [],
    metrics: {
      cpu: 0,
      memory: 0,
      disk: 0,
      network: 0
    },
    alerts: [],
    trends: {
      health: 'stable',
      errorRate: 'stable',
      performance: 'stable'
    }
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/metrics/system-health');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch system health:', error);
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

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-green-600';
    if (health >= 70) return 'text-yellow-600';
    if (health >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (health: number) => {
    if (health >= 90) return 'bg-green-500';
    if (health >= 70) return 'bg-yellow-500';
    if (health >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'down':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up' || trend === 'improving') {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    }
    if (trend === 'down' || trend === 'degrading') {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  return (
    <div className="space-y-4">
      {/* Overall Health Score */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Overall System Health</h3>
            <p className="text-sm text-muted-foreground">Real-time health monitoring</p>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon(data.trends.health)}
            <span className="text-sm text-muted-foreground capitalize">{data.trends.health}</span>
          </div>
        </div>

        <div className="flex items-center justify-center mb-6">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                strokeWidth="8"
                strokeDasharray={`${data.overallHealth * 2.51} 251`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                className={`${getHealthBgColor(data.overallHealth)} transition-all duration-500`}
                stroke="currentColor"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className={`text-5xl font-bold ${getHealthColor(data.overallHealth)}`}>
                  {data.overallHealth}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">Health Score</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <p className="text-xs text-muted-foreground">Error Rate</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              {getTrendIcon(data.trends.errorRate)}
              <p className="text-sm font-medium">
                {data.trends.errorRate === 'stable' ? 'Stable' : data.trends.errorRate === 'up' ? 'Rising' : 'Falling'}
              </p>
            </div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <p className="text-xs text-muted-foreground">Performance</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              {getTrendIcon(data.trends.performance)}
              <p className="text-sm font-medium">
                {data.trends.performance === 'stable' ? 'Stable' : data.trends.performance === 'up' ? 'Improving' : 'Degrading'}
              </p>
            </div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <p className="text-xs text-muted-foreground">Services</p>
            <p className="text-sm font-medium mt-1">
              {data.services.filter(s => s.status === 'healthy').length}/{data.services.length} Healthy
            </p>
          </div>
        </div>
      </Card>

      {/* System Metrics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">System Metrics</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">CPU Usage</span>
              </div>
              <span className="text-sm font-bold">{data.metrics.cpu}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  data.metrics.cpu > 80 ? 'bg-red-500' : data.metrics.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${data.metrics.cpu}%` }}
              />
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Memory</span>
              </div>
              <span className="text-sm font-bold">{data.metrics.memory}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  data.metrics.memory > 80 ? 'bg-red-500' : data.metrics.memory > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${data.metrics.memory}%` }}
              />
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Disk</span>
              </div>
              <span className="text-sm font-bold">{data.metrics.disk}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  data.metrics.disk > 80 ? 'bg-red-500' : data.metrics.disk > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${data.metrics.disk}%` }}
              />
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Network</span>
              </div>
              <span className="text-sm font-bold">{data.metrics.network}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  data.metrics.network > 80 ? 'bg-red-500' : data.metrics.network > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${data.metrics.network}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Services Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Services Status</h3>
        <div className="space-y-3">
          {data.services.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No services monitored
            </p>
          ) : (
            data.services.map((service, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${getServiceStatusColor(service.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-sm">{service.name}</h4>
                      <span className="px-2 py-0.5 text-xs font-medium capitalize rounded bg-white/50">
                        {service.status}
                      </span>
                    </div>
                    <div className="flex gap-6 text-xs">
                      <div>
                        <span className="text-muted-foreground">Uptime:</span>{' '}
                        <span className="font-medium">{service.uptime}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Response:</span>{' '}
                        <span className="font-medium">{service.responseTime}ms</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Errors:</span>{' '}
                        <span className="font-medium">{service.errorRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Active Alerts */}
      {data.alerts.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-semibold">Active Alerts</h3>
          </div>
          <div className="space-y-2">
            {data.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 border-l-4 rounded ${
                  alert.severity === 'critical'
                    ? 'bg-red-50 border-red-500'
                    : alert.severity === 'error'
                    ? 'bg-orange-50 border-orange-500'
                    : 'bg-yellow-50 border-yellow-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className={`text-xs font-medium uppercase ${
                        alert.severity === 'critical'
                          ? 'text-red-700'
                          : alert.severity === 'error'
                          ? 'text-orange-700'
                          : 'text-yellow-700'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <p className="text-sm font-medium mt-1">{alert.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
