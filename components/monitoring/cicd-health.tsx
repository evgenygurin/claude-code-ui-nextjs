'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, Zap, Shield, Package } from 'lucide-react';

interface CICDHealthProps {
  isLoading: boolean;
  lastUpdate: Date;
}

interface PipelineRun {
  id: string;
  branch: string;
  status: 'success' | 'failed' | 'running';
  duration: number;
  timestamp: string;
  jobs: Array<{
    name: string;
    status: 'success' | 'failed' | 'running';
    duration: number;
  }>;
}

interface CICDData {
  pipelineStatus: 'passing' | 'failing' | 'pending';
  successRate: number;
  averageDuration: number; // minutes
  totalRuns24h: number;
  failedRuns24h: number;
  cacheHitRate: number;
  securityScans: {
    vulnerabilities: number;
    secrets: number;
    sast: number;
  };
  recentRuns: PipelineRun[];
  jobPerformance: Array<{
    name: string;
    avgDuration: number;
    successRate: number;
  }>;
}

export function CICDHealth({ isLoading, lastUpdate }: CICDHealthProps) {
  const [data, setData] = useState<CICDData>({
    pipelineStatus: 'passing',
    successRate: 100,
    averageDuration: 0,
    totalRuns24h: 0,
    failedRuns24h: 0,
    cacheHitRate: 0,
    securityScans: {
      vulnerabilities: 0,
      secrets: 0,
      sast: 0
    },
    recentRuns: [],
    jobPerformance: []
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/metrics/cicd');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch CI/CD health:', error);
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

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pipeline Status</p>
              <p className="text-2xl font-bold mt-2 capitalize">{data.pipelineStatus}</p>
            </div>
            {data.pipelineStatus === 'passing' ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : data.pipelineStatus === 'failing' ? (
              <XCircle className="h-6 w-6 text-red-500" />
            ) : (
              <Clock className="h-6 w-6 text-yellow-500" />
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Success Rate (24h)</p>
              <p className="text-2xl font-bold mt-2">{data.successRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {data.totalRuns24h} runs, {data.failedRuns24h} failed
              </p>
            </div>
            <Zap className="h-6 w-6 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
              <p className="text-2xl font-bold mt-2">{data.averageDuration} min</p>
            </div>
            <Clock className="h-6 w-6 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cache Hit Rate</p>
              <p className="text-2xl font-bold mt-2">{data.cacheHitRate}%</p>
            </div>
            <Package className="h-6 w-6 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Security Scans */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Security Scans (24h)</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 border rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">Vulnerabilities</p>
            <p className="text-3xl font-bold mt-2">{data.securityScans.vulnerabilities}</p>
            <p className="text-xs text-muted-foreground mt-1">Critical/High issues</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">Secret Leaks</p>
            <p className="text-3xl font-bold mt-2">{data.securityScans.secrets}</p>
            <p className="text-xs text-muted-foreground mt-1">Detected secrets</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">SAST Findings</p>
            <p className="text-3xl font-bold mt-2">{data.securityScans.sast}</p>
            <p className="text-xs text-muted-foreground mt-1">Code analysis issues</p>
          </div>
        </div>
      </Card>

      {/* Job Performance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Job Performance</h3>
        <div className="space-y-4">
          {data.jobPerformance.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No job performance data available
            </p>
          ) : (
            data.jobPerformance.map((job, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{job.name}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {job.avgDuration.toFixed(1)} min avg
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-muted-foreground">
                        {job.successRate}% success
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-32">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${job.successRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Recent Pipeline Runs */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Pipeline Runs</h3>
        <div className="space-y-3">
          {data.recentRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recent pipeline runs
            </p>
          ) : (
            data.recentRuns.map((run) => (
              <div
                key={run.id}
                className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {run.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : run.status === 'failed' ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-500 animate-spin" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{run.branch}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(run.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{run.duration} min</p>
                    <p className="text-xs text-muted-foreground">Duration</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {run.jobs.map((job, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-1 text-xs rounded ${
                        job.status === 'success'
                          ? 'bg-green-100 text-green-700'
                          : job.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {job.name} ({job.duration}min)
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
