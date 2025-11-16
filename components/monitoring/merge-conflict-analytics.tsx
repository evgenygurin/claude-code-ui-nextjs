'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { GitMerge, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface MergeConflictAnalyticsProps {
  isLoading: boolean;
  lastUpdate: Date;
}

interface ConflictData {
  totalConflicts24h: number;
  autoResolved: number;
  manualResolution: number;
  averageResolutionTime: number; // minutes
  strategyDistribution: {
    packageLock: number;
    packageJson: number;
    jsonMerge: number;
    yamlMerge: number;
    codeMerge: number;
    documentMerge: number;
    intelligentMerge: number;
  };
  recentConflicts: Array<{
    id: string;
    file: string;
    strategy: string;
    status: 'resolved' | 'pending' | 'failed';
    timestamp: string;
    resolutionTime: number;
  }>;
  successRate: number;
}

export function MergeConflictAnalytics({ isLoading, lastUpdate }: MergeConflictAnalyticsProps) {
  const [data, setData] = useState<ConflictData>({
    totalConflicts24h: 0,
    autoResolved: 0,
    manualResolution: 0,
    averageResolutionTime: 0,
    strategyDistribution: {
      packageLock: 0,
      packageJson: 0,
      jsonMrge: 0,
      yamlMerge: 0,
      codeMerge: 0,
      documentMerge: 0,
      intelligentMerge: 0
    },
    recentConflicts: [],
    successRate: 100
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/metrics/conflicts');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch merge conflict analytics:', error);
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

  const strategies = [
    { name: 'Package Lock', key: 'packageLock', color: 'bg-blue-500' },
    { name: 'Package JSON', key: 'packageJson', color: 'bg-green-500' },
    { name: 'JSON Merge', key: 'jsonMerge', color: 'bg-yellow-500' },
    { name: 'YAML Merge', key: 'yamlMerge', color: 'bg-purple-500' },
    { name: 'Code Merge', key: 'codeMerge', color: 'bg-orange-500' },
    { name: 'Document Merge', key: 'documentMerge', color: 'bg-pink-500' },
    { name: 'Intelligent Merge', key: 'intelligentMerge', color: 'bg-indigo-500' }
  ];

  const totalStrategyUses = Object.values(data.strategyDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Conflicts (24h)</p>
              <p className="text-2xl font-bold mt-2">{data.totalConflicts24h}</p>
            </div>
            <GitMerge className="h-6 w-6 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Auto-Resolved</p>
              <p className="text-2xl font-bold mt-2">{data.autoResolved}</p>
              <p className="text-xs text-green-600 mt-1">
                {data.totalConflicts24h > 0
                  ? `${Math.round((data.autoResolved / data.totalConflicts24h) * 100)}%`
                  : '0%'}
              </p>
            </div>
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Manual Resolution</p>
              <p className="text-2xl font-bold mt-2">{data.manualResolution}</p>
            </div>
            <AlertTriangle className="h-6 w-6 text-orange-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Resolution Time</p>
              <p className="text-2xl font-bold mt-2">{data.averageResolutionTime} min</p>
            </div>
            <Clock className="h-6 w-6 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Strategy Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Resolution Strategy Distribution</h3>
        <div className="space-y-4">
          {strategies.map((strategy) => {
            const count = data.strategyDistribution[strategy.key as keyof typeof data.strategyDistribution];
            const percentage = totalStrategyUses > 0 ? (count / totalStrategyUses) * 100 : 0;

            return (
              <div key={strategy.key}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{strategy.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {count} uses ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`${strategy.color} h-2 rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent Conflicts */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Conflicts</h3>
        <div className="space-y-3">
          {data.recentConflicts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No conflicts in the last 24 hours
            </p>
          ) : (
            data.recentConflicts.map((conflict) => (
              <div
                key={conflict.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{conflict.file}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(conflict.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <p className="font-medium">{conflict.strategy}</p>
                    <p className="text-xs text-muted-foreground">strategy</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{conflict.resolutionTime}min</p>
                    <p className="text-xs text-muted-foreground">resolution</p>
                  </div>
                  <div>
                    {conflict.status === 'resolved' ? (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                        Resolved
                      </span>
                    ) : conflict.status === 'pending' ? (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
                        Pending
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                        Failed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Success Rate */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Success Rate</h3>
        <div className="flex items-center justify-center">
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
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${data.successRate * 2.51} 251`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                className="text-green-500 transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl font-bold">{data.successRate}%</p>
                <p className="text-sm text-muted-foreground">Success</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
