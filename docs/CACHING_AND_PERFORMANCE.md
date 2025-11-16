# Caching and Performance Monitoring

This document describes the caching layer and performance monitoring system implemented in the monitoring dashboard.

## Table of Contents

- [Caching Strategy](#caching-strategy)
- [Performance Monitoring](#performance-monitoring)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Caching Strategy

### Overview

The application uses a dual-mode caching system:

1. **Redis** (production): High-performance, distributed caching
2. **In-Memory** (fallback): Automatic fallback when Redis is unavailable

### Cache Service

**Location**: `lib/cache/cache-service.ts`

**Features**:

- Automatic TTL (Time To Live) management
- Tag-based invalidation for bulk operations
- Hit rate statistics and performance metrics
- Graceful degradation (Redis → in-memory)
- Thread-safe singleton pattern

### Usage Examples

#### Basic Operations

```typescript
import { CacheService, CacheKeys } from '@/lib/cache/cache-service';

// Get value from cache
const value = await CacheService.get<MyType>('my-key');

// Set value with TTL
await CacheService.set('my-key', myData, {
  ttl: 300, // 5 minutes
  tags: ['metrics', 'overview']
});

// Delete specific key
await CacheService.delete('my-key');

// Get or compute pattern
const data = await CacheService.getOrSet(
  'expensive-operation',
  async () => {
    // Expensive computation or API call
    return await fetchData();
  },
  { ttl: 600, tags: ['api-data'] }
);
```

#### Tag-Based Invalidation

```typescript
// Invalidate all metrics caches
await CacheService.invalidateByTag('metrics');

// Invalidate specific category
await CacheService.invalidateByTag('sentry');

// Clear all cache
await CacheService.clear();
```

#### Cache Statistics

```typescript
const stats = CacheService.getStats();
console.log(`Hit rate: ${stats.hitRate.toFixed(2)}%`);
console.log(`Total hits: ${stats.hits}`);
console.log(`Total misses: ${stats.misses}`);
```

### Predefined Cache Keys

**Location**: `lib/cache/cache-service.ts` (CacheKeys object)

```typescript
// Metrics cache keys
CacheKeys.metrics.overview()                 // 'metrics:overview'
CacheKeys.metrics.sentry('7d')              // 'metrics:sentry:7d'
CacheKeys.metrics.cicd('24h')               // 'metrics:cicd:24h'
CacheKeys.metrics.systemHealth()            // 'metrics:system-health'

// Reports cache keys
CacheKeys.reports.history(1, 'all')         // 'reports:history:1:all'
CacheKeys.reports.scheduled()               // 'reports:scheduled'
CacheKeys.reports.report('report-123')      // 'reports:report-123'

// User cache keys
CacheKeys.user.notifications('user-id')     // 'user:user-id:notifications'
CacheKeys.user.preferences('user-id')       // 'user:user-id:preferences'
```

### Cache TTL Guidelines

| Data Type | TTL | Reasoning |
|-----------|-----|-----------|
| Overview metrics | 2 minutes | Balance between freshness and API load |
| Sentry data | 3 minutes | External API rate limiting |
| CI/CD data | 2 minutes | Build status changes frequently |
| Report history | 5 minutes | Changes infrequently |
| User notifications | 30 seconds | High priority for real-time feel |
| System health | 1 minute | Important for monitoring |

### Configuration

#### Redis Configuration

```env
# .env
REDIS_URL=redis://localhost:6379
# or for Redis Cloud
REDIS_URL=rediss://username:password@host:port
```

#### In-Memory Fallback

When Redis is not configured or unavailable, the system automatically falls back to an in-memory cache with:

- Automatic cleanup every 5 minutes
- Same TTL support
- Limited to single server instance

## Performance Monitoring

### Overview

**Location**: `lib/monitoring/performance.ts`

The performance monitoring service tracks:

- API response times
- Database query performance
- External API call durations
- Success/failure rates

### Usage Examples

#### Automatic Timing

```typescript
import { PerformanceMonitor } from '@/lib/monitoring/performance';

export async function GET() {
  const endTiming = PerformanceMonitor.start('api:my-endpoint');

  try {
    const data = await fetchData();
    endTiming({ endpoint: 'my-endpoint' }, { success: true });
    return NextResponse.json(data);
  } catch (error) {
    endTiming({ endpoint: 'my-endpoint' }, { success: false, error: String(error) });
    throw error;
  }
}
```

#### Helper Functions

```typescript
import { measureAsync, measureSync } from '@/lib/monitoring/performance';

// Measure async operations
const result = await measureAsync(
  'database:query:users',
  async () => await prisma.user.findMany(),
  { operation: 'findMany' }
);

// Measure sync operations
const computed = measureSync(
  'compute:complex-calculation',
  () => performCalculation(),
  { input: 'large-dataset' }
);
```

### Performance Statistics

```typescript
// Get overall stats
const stats = PerformanceMonitor.getStats();

// Get stats for specific operation
const apiStats = PerformanceMonitor.getStats('api:metrics:overview');

console.log(`Total requests: ${stats.totalRequests}`);
console.log(`Average duration: ${stats.averageDuration.toFixed(2)}ms`);
console.log(`P95: ${stats.p95.toFixed(2)}ms`);
console.log(`P99: ${stats.p99.toFixed(2)}ms`);
```

### Slow Request Alerts

Requests taking longer than 2 seconds automatically log a warning:

```text
⚠️ Slow request detected: api:metrics:sentry took 2341.52ms
{
  tags: { endpoint: 'sentry' },
  metadata: { success: true }
}
```

## API Reference

### Cache Management API

#### Get Cache Statistics

```http
GET /api/cache
```

**Response**:

```json
{
  "stats": {
    "hits": 1250,
    "misses": 180,
    "sets": 95,
    "deletes": 12,
    "hitRate": 87.41
  },
  "uptime": 3600,
  "nodeVersion": "v20.10.0"
}
```

#### Invalidate Cache by Tag

```http
DELETE /api/cache?tag=metrics
```

**Response**:

```json
{
  "success": true,
  "message": "Cache invalidated for tag: metrics"
}
```

#### Clear All Cache

```http
DELETE /api/cache?all=true
```

**Response**:

```json
{
  "success": true,
  "message": "All cache cleared"
}
```

#### Reset Cache Statistics

```http
POST /api/cache/reset-stats
```

### Performance Monitoring API

#### Get Performance Statistics

```http
GET /api/monitoring/performance
GET /api/monitoring/performance?name=api:metrics:overview
```

**Response**:

```json
{
  "stats": {
    "totalRequests": 342,
    "averageDuration": 125.43,
    "p50": 98.21,
    "p95": 456.78,
    "p99": 892.34,
    "slowestRequests": [
      {
        "name": "api:metrics:sentry",
        "duration": 2341.52,
        "timestamp": "2025-01-16T12:34:56.789Z",
        "tags": { "endpoint": "sentry" },
        "metadata": { "success": true }
      }
    ]
  },
  "timestamp": "2025-01-16T12:45:00.000Z"
}
```

#### Clear Performance Metrics

```http
DELETE /api/monitoring/performance
```

## Best Practices

### Caching Best Practices

1. **Use appropriate TTLs**
   - Short TTL (30s-1m): High-priority, frequently changing data
   - Medium TTL (2-5m): Dashboard metrics, API aggregations
   - Long TTL (10-60m): Configuration, rarely changing data

2. **Always use tags**

   ```typescript
   await CacheService.set(key, data, {
     ttl: 300,
     tags: ['category', 'subcategory'] // Enables bulk invalidation
   });
   ```

3. **Use predefined cache keys**

   ```typescript
   // ✅ Good: Use CacheKeys helpers
   const key = CacheKeys.metrics.sentry('7d');

   // ❌ Bad: Manual key construction
   const key = 'metrics:sentry:7d';
   ```

4. **Handle cache misses gracefully**

   ```typescript
   const data = await CacheService.getOrSet(
     key,
     async () => {
       // Fallback computation
       return await fetchFromDatabase();
     },
     options
   );
   ```

5. **Invalidate on data changes**

   ```typescript
   // After updating data
   await updateDatabase();
   await CacheService.invalidateByTag('metrics');
   ```

### Performance Monitoring Best Practices

1. **Name operations consistently**

   ```typescript
   // Pattern: category:resource:action
   PerformanceMonitor.start('api:metrics:overview');
   PerformanceMonitor.start('database:user:create');
   PerformanceMonitor.start('external:sentry:fetch');
   ```

2. **Always include tags**

   ```typescript
   endTiming(
     { endpoint: 'overview', method: 'GET' },
     { success: true, cached: false }
   );
   ```

3. **Monitor critical paths**
   - API endpoints
   - Database queries
   - External API calls
   - Complex computations

4. **Set performance budgets**
   - API responses: < 200ms (P95)
   - Database queries: < 100ms (P95)
   - External APIs: < 1000ms (P95)

## Troubleshooting

### Cache Issues

#### Redis Connection Failures

**Symptom**: Warning in logs: "⚠️ Redis not available, using in-memory cache"

**Solution**:

1. Verify Redis is running: `redis-cli ping`
2. Check `REDIS_URL` in `.env`
3. Verify network connectivity
4. Check Redis logs for errors

**Temporary Workaround**: Application continues with in-memory cache

#### Low Hit Rate

**Symptom**: Cache hit rate < 50%

**Possible Causes**:

1. TTL too short for data access patterns
2. Frequent cache invalidations
3. High traffic with cold cache
4. Incorrect cache key generation

**Solutions**:

1. Analyze access patterns: `GET /api/cache`
2. Increase TTL for stable data
3. Pre-warm cache on deployment
4. Review invalidation strategy

#### Memory Issues (In-Memory Mode)

**Symptom**: High memory usage in development

**Solution**:

```typescript
// Manually trigger cleanup
CacheService.cleanup();

// Or adjust max entries in cache-service.ts
private cache: Map<string, { value: any; expires: number; tags: string[] }> = new Map();
```

### Performance Issues

#### Slow Requests Not Logged

**Symptom**: Slow requests not appearing in warnings

**Cause**: Threshold set to 2000ms

**Solution**: Adjust threshold in `lib/monitoring/performance.ts`:

```typescript
// Log slow requests (> 2 seconds)
if (metric.duration > 2000) {
```

#### Missing Metrics

**Symptom**: `GET /api/monitoring/performance` returns zero requests

**Cause**: Metrics not persisted across server restarts

**Solution**: Metrics are in-memory only. For persistent metrics, integrate with:

- Prometheus
- Datadog
- New Relic
- CloudWatch

#### High P99 Latency

**Investigation Steps**:

1. Check slowest requests: `GET /api/monitoring/performance`
2. Identify patterns in tags/metadata
3. Review external API performance
4. Check database query performance
5. Verify cache effectiveness

## Integration Examples

### Integrating Cache in New API Route

```typescript
import { NextResponse } from 'next/server';
import { CacheService, CacheKeys } from '@/lib/cache/cache-service';
import { PerformanceMonitor } from '@/lib/monitoring/performance';

export async function GET() {
  const endTiming = PerformanceMonitor.start('api:my-route');

  try {
    const data = await CacheService.getOrSet(
      'my-custom-key',
      async () => {
        // Expensive operation
        const result = await fetchExpensiveData();
        return result;
      },
      { ttl: 300, tags: ['my-category'] }
    );

    endTiming({ endpoint: 'my-route' }, { success: true });
    return NextResponse.json(data);
  } catch (error) {
    endTiming({ endpoint: 'my-route' }, { success: false });
    throw error;
  }
}
```

### Cache Warming Strategy

```typescript
// On application startup or deployment
async function warmCache() {
  console.log('Warming cache...');

  await Promise.all([
    // Pre-fetch commonly accessed data
    CacheService.getOrSet(
      CacheKeys.metrics.overview(),
      async () => await fetchOverviewMetrics(),
      { ttl: 120 }
    ),

    CacheService.getOrSet(
      CacheKeys.metrics.systemHealth(),
      async () => await fetchSystemHealth(),
      { ttl: 60 }
    ),
  ]);

  console.log('✅ Cache warmed');
}
```

### Scheduled Cache Invalidation

```typescript
// Invalidate cache on a schedule (e.g., every hour)
setInterval(async () => {
  console.log('Scheduled cache invalidation...');
  await CacheService.invalidateByTag('metrics');
}, 60 * 60 * 1000); // 1 hour
```

## Future Enhancements

### Planned Features

1. **Distributed Cache Invalidation**
   - Redis Pub/Sub for multi-instance cache invalidation
   - Webhook-based invalidation from external systems

2. **Advanced Performance Analytics**
   - Percentile histograms
   - Time-series performance data
   - Anomaly detection

3. **Cache Warming**
   - Automatic cache pre-loading on deployment
   - Predictive cache warming based on access patterns

4. **Performance Budgets**
   - Automated alerts when budgets exceeded
   - CI/CD integration for performance regression detection

5. **Observability Integration**
   - Prometheus metrics export
   - OpenTelemetry traces
   - Datadog/New Relic integration

---

**Last Updated**: 2025-01-16
**Version**: 1.0.0
