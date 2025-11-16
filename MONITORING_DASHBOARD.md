# Monitoring Dashboard Documentation

Comprehensive monitoring dashboard for tracking error metrics, merge conflicts, CI/CD pipeline health, and system status.

## Overview

The monitoring dashboard provides real-time visibility into all automation systems:

- **Sentry Error Tracking**: Error trends, priority distribution, top errors, MTTR
- **Merge Conflict Resolution**: Auto-resolution statistics, strategy distribution
- **CI/CD Pipeline Health**: Build status, success rate, security scans
- **Escalation Timeline**: Event history with priorities and resolutions
- **System Health**: Overall health score, service status, resource metrics

## Architecture

### Component Structure

```text
app/dashboard/monitoring/page.tsx           # Main dashboard page
├── components/monitoring/
│   ├── overview-panel.tsx                  # 4 metric cards overview
│   ├── sentry-metrics.tsx                  # Detailed Sentry view
│   ├── merge-conflict-analytics.tsx        # Conflict resolution stats
│   ├── cicd-health.tsx                     # Pipeline health metrics
│   ├── escalation-timeline.tsx             # Timeline of events
│   └── system-health-overview.tsx          # System health status
├── app/api/metrics/
│   ├── overview/route.ts                   # Overview metrics API
│   ├── sentry/route.ts                     # Sentry metrics API
│   ├── conflicts/route.ts                  # Conflict metrics API
│   ├── cicd/route.ts                       # CI/CD metrics API
│   ├── timeline/route.ts                   # Timeline events API
│   └── system-health/route.ts              # System health API
└── lib/store/monitoring-store.ts           # Zustand state management
```

### State Management

The dashboard uses **Zustand** for centralized state management:

- **Auto-refresh control**: Enable/disable automatic data refresh
- **Metrics caching**: Client-side caching with TTL (30s default)
- **Loading states**: Unified loading state management
- **Active tab tracking**: Persistent tab selection

## Features

### 1. Auto-Refresh System

The dashboard automatically refreshes every 30 seconds when enabled:

```tsx
const { autoRefresh, setAutoRefresh, triggerRefresh } = useMonitoringStore();

// Toggle auto-refresh
<button onClick={() => setAutoRefresh(!autoRefresh)}>
  {autoRefresh ? 'Pause' : 'Resume'} Auto-refresh
</button>

// Manual refresh
<button onClick={() => triggerRefresh()}>
  Refresh Now
</button>
```

### 2. Metrics Caching

All API responses are cached for 30 seconds to reduce server load:

```tsx
import { useCachedMetrics } from '@/lib/store/monitoring-store';

const { fetchMetrics } = useCachedMetrics('sentry', 'sentry-cache');

// Fetches from cache if available, otherwise from API
const data = await fetchMetrics();
```

### 3. Tabbed Interface

The dashboard provides 5 specialized views:

1. **System Health**: Overall health score and service status
2. **Sentry Metrics**: Error tracking and prioritization
3. **Merge Conflicts**: Automatic resolution statistics
4. **CI/CD Pipeline**: Build and deployment health
5. **Timeline**: Chronological event history

## API Endpoints

### Overview Metrics

**GET** `/api/metrics/overview`

Returns high-level metrics for the overview panel.

**Response:**
```json
{
  "activeEscalations": 0,
  "recentMergeConflicts": 0,
  "cicdStatus": "passing",
  "errorRate24h": 0,
  "errorRateTrend": "stable",
  "systemHealth": 100,
  "mttr": 0
}
```

### Sentry Metrics

**GET** `/api/metrics/sentry`

Returns detailed Sentry error tracking metrics.

**Response:**
```json
{
  "errorTrends": [
    { "date": "2025-01-10T00:00:00Z", "count": 5 }
  ],
  "priorityDistribution": {
    "critical": 2,
    "high": 5,
    "medium": 10,
    "low": 3
  },
  "topErrors": [
    {
      "id": "error-123",
      "title": "TypeError: Cannot read property",
      "count": 15,
      "users": 8,
      "lastSeen": "2025-01-16T12:00:00Z"
    }
  ],
  "mttr": 45,
  "totalErrors24h": 20,
  "affectedUsers24h": 12
}
```

### Merge Conflict Metrics

**GET** `/api/metrics/conflicts`

Returns merge conflict resolution analytics.

**Response:**
```json
{
  "totalConflicts24h": 5,
  "autoResolved": 4,
  "manualResolution": 1,
  "averageResolutionTime": 12,
  "strategyDistribution": {
    "packageLock": 2,
    "packageJson": 1,
    "jsonMerge": 1,
    "yamlMerge": 0,
    "codeMerge": 0,
    "documentMerge": 0,
    "intelligentMerge": 1
  },
  "recentConflicts": [
    {
      "id": "conflict-123",
      "file": "package-lock.json",
      "strategy": "packageLock",
      "status": "resolved",
      "timestamp": "2025-01-16T12:00:00Z",
      "resolutionTime": 5
    }
  ],
  "successRate": 80
}
```

### CI/CD Health

**GET** `/api/metrics/cicd`

Returns CI/CD pipeline health metrics.

**Response:**
```json
{
  "pipelineStatus": "passing",
  "successRate": 95,
  "averageDuration": 8,
  "totalRuns24h": 12,
  "failedRuns24h": 1,
  "cacheHitRate": 85,
  "securityScans": {
    "vulnerabilities": 0,
    "secrets": 0,
    "sast": 2
  },
  "recentRuns": [
    {
      "id": "run-123",
      "branch": "main",
      "status": "success",
      "duration": 7,
      "timestamp": "2025-01-16T12:00:00Z",
      "jobs": [
        { "name": "build", "status": "success", "duration": 3 },
        { "name": "test", "status": "success", "duration": 4 }
      ]
    }
  ],
  "jobPerformance": [
    { "name": "build", "avgDuration": 3.2, "successRate": 100 },
    { "name": "test", "avgDuration": 4.5, "successRate": 95 }
  ]
}
```

### Timeline Events

**GET** `/api/metrics/timeline`

Returns escalation timeline events.

**Response:**
```json
{
  "events": [
    {
      "id": "event-123",
      "type": "error",
      "title": "Critical production error detected",
      "description": "TypeError in user authentication flow",
      "status": "resolved",
      "priority": "critical",
      "timestamp": "2025-01-16T12:00:00Z",
      "metadata": {
        "errorCount": 15,
        "affectedUsers": 8,
        "duration": 45
      }
    }
  ],
  "stats": {
    "total": 10,
    "open": 2,
    "resolved": 7,
    "failed": 1
  }
}
```

### System Health

**GET** `/api/metrics/system-health`

Returns overall system health metrics.

**Response:**
```json
{
  "overallHealth": 95,
  "services": [
    {
      "name": "API Gateway",
      "status": "healthy",
      "uptime": 99.9,
      "responseTime": 45,
      "errorRate": 0.1
    }
  ],
  "metrics": {
    "cpu": 35,
    "memory": 60,
    "disk": 45,
    "network": 20
  },
  "alerts": [
    {
      "id": "alert-123",
      "severity": "warning",
      "message": "Memory usage above 80%",
      "timestamp": "2025-01-16T12:00:00Z"
    }
  ],
  "trends": {
    "health": "stable",
    "errorRate": "down",
    "performance": "up"
  }
}
```

## Integration with Real Data

Currently, all API endpoints return mock data. To integrate with real monitoring systems:

### 1. Sentry Integration

```typescript
// app/api/metrics/sentry/route.ts
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  // Fetch real data from Sentry API
  const sentryClient = new SentryClient({
    dsn: process.env.SENTRY_DSN,
    authToken: process.env.SENTRY_AUTH_TOKEN
  });

  const events = await sentryClient.getEvents({
    project: 'your-project',
    statsPeriod: '24h'
  });

  // Transform to expected format
  return NextResponse.json(transformSentryData(events));
}
```

### 2. GitHub/CircleCI Integration

```typescript
// app/api/metrics/cicd/route.ts
import { Octokit } from '@octokit/rest';

export async function GET() {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  });

  // Fetch workflow runs
  const { data } = await octokit.actions.listWorkflowRuns({
    owner: 'your-org',
    repo: 'your-repo',
    workflow_id: 'ci.yml'
  });

  return NextResponse.json(transformCICDData(data));
}
```

### 3. Database Integration

```typescript
// app/api/metrics/timeline/route.ts
import { prisma } from '@/lib/db';

export async function GET() {
  const events = await prisma.escalation.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      metadata: true
    }
  });

  return NextResponse.json(transformTimelineData(events));
}
```

## Usage

### Accessing the Dashboard

Navigate to: `/dashboard/monitoring`

### Customizing Refresh Interval

```tsx
import { useMonitoringStore } from '@/lib/store/monitoring-store';

function CustomInterval() {
  const { setRefreshInterval } = useMonitoringStore();

  return (
    <select onChange={(e) => setRefreshInterval(Number(e.target.value))}>
      <option value="10000">10 seconds</option>
      <option value="30000">30 seconds</option>
      <option value="60000">1 minute</option>
    </select>
  );
}
```

### Programmatic Cache Control

```tsx
import { useMonitoringStore } from '@/lib/store/monitoring-store';

function CacheControl() {
  const { clearMetricsCache, isMetricsCacheValid } = useMonitoringStore();

  // Clear specific cache
  const clearSentryCache = () => clearMetricsCache('sentry');

  // Clear all caches
  const clearAllCaches = () => clearMetricsCache();

  // Check if cache is valid
  const isSentryCacheValid = isMetricsCacheValid('sentry');

  return (
    <div>
      <button onClick={clearSentryCache}>Clear Sentry Cache</button>
      <button onClick={clearAllCaches}>Clear All Caches</button>
      <p>Sentry cache valid: {isSentryCacheValid ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

## Performance Optimization

### Client-Side Caching

All metrics are cached client-side for 30 seconds:

- **Reduces server load**: Fewer API calls during auto-refresh
- **Faster navigation**: Instant data when switching tabs
- **Configurable TTL**: Adjust cache duration per metric type

### Lazy Loading

Components only fetch data when their tab is active:

```tsx
useEffect(() => {
  if (activeTab === 'sentry') {
    fetchSentryMetrics();
  }
}, [activeTab]);
```

### Skeleton Loading States

All components show loading skeletons during data fetching:

```tsx
if (isLoading) {
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="h-64 bg-muted animate-pulse rounded" />
      </Card>
    </div>
  );
}
```

## Development

### Running Tests

```bash
# Test monitoring dashboard components
npm test -- dashboard/monitoring

# Test API endpoints
npm test -- api/metrics
```

### Adding New Metrics

1. **Create API endpoint**: `app/api/metrics/[name]/route.ts`
2. **Create component**: `components/monitoring/[name].tsx`
3. **Add to dashboard**: Import in `app/dashboard/monitoring/page.tsx`
4. **Update store**: Add cache key to `monitoring-store.ts`

### Example: Adding Custom Metric

```typescript
// app/api/metrics/custom/route.ts
export async function GET() {
  return NextResponse.json({
    customMetric: 100
  });
}

// components/monitoring/custom-metric.tsx
export function CustomMetric({ isLoading, lastUpdate }: Props) {
  const [data, setData] = useState({ customMetric: 0 });

  useEffect(() => {
    async function fetchData() {
      const response = await fetch('/api/metrics/custom');
      const result = await response.json();
      setData(result);
    }
    fetchData();
  }, [lastUpdate]);

  return <div>{data.customMetric}</div>;
}

// app/dashboard/monitoring/page.tsx
import { CustomMetric } from '@/components/monitoring/custom-metric';

// Add to TabsContent
<TabsContent value="custom">
  <CustomMetric isLoading={isLoading} lastUpdate={lastUpdate} />
</TabsContent>
```

## Troubleshooting

### Auto-Refresh Not Working

- Check browser console for errors
- Verify `autoRefresh` is enabled in store
- Ensure components are using `lastUpdate` dependency

### Cache Not Invalidating

- Increase TTL in `monitoring-store.ts`
- Clear cache manually: `clearMetricsCache()`
- Check timestamp calculation in cache validation

### API Endpoints Returning 500

- Check server logs for errors
- Verify environment variables are set
- Ensure database/external services are accessible

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Historical data trends (7d, 30d, 90d)
- [ ] Exportable reports (PDF, CSV)
- [ ] Alerting thresholds configuration
- [ ] Mobile-responsive optimizations
- [ ] Dark mode support
- [ ] Multi-project dashboard
- [ ] Custom dashboard layouts

---

**Dashboard Version**: 1.0.0
**Last Updated**: 2025-01-16
**Status**: Production Ready (with mock data)
