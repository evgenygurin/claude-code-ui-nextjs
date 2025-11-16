/**
 * Performance Monitoring Service
 *
 * Tracks API response times, database queries, and external API calls
 * Provides metrics for identifying bottlenecks and optimization opportunities
 */

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface PerformanceStats {
  totalRequests: number;
  averageDuration: number;
  p50: number;
  p95: number;
  p99: number;
  slowestRequests: PerformanceMetric[];
}

class PerformanceMonitorClass {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics in memory

  /**
   * Start a performance timer
   */
  start(name: string): (tags?: Record<string, string>, metadata?: Record<string, any>) => void {
    const startTime = performance.now();

    // Return function to end timing
    return (tags?: Record<string, string>, metadata?: Record<string, any>) => {
      const duration = performance.now() - startTime;
      this.record({
        name,
        duration,
        timestamp: new Date(),
        tags,
        metadata,
      });
    };
  }

  /**
   * Record a performance metric
   */
  record(metric: PerformanceMetric): void {
    this.metrics.unshift(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(0, this.maxMetrics);
    }

    // Log slow requests (> 2 seconds)
    if (metric.duration > 2000) {
      console.warn(`Slow request detected: ${metric.name} took ${metric.duration.toFixed(2)}ms`, {
        tags: metric.tags,
        metadata: metric.metadata,
      });
    }
  }

  /**
   * Get performance statistics
   */
  getStats(name?: string): PerformanceStats {
    let filteredMetrics = this.metrics;

    if (name) {
      filteredMetrics = this.metrics.filter((m) => m.name === name);
    }

    if (filteredMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageDuration: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        slowestRequests: [],
      };
    }

    const durations = filteredMetrics.map((m) => m.duration).sort((a, b) => a - b);
    const sum = durations.reduce((acc, d) => acc + d, 0);

    return {
      totalRequests: filteredMetrics.length,
      averageDuration: sum / filteredMetrics.length,
      p50: this.percentile(durations, 50),
      p95: this.percentile(durations, 95),
      p99: this.percentile(durations, 99),
      slowestRequests: [...filteredMetrics]
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10),
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Get metrics by tag
   */
  getMetricsByTag(key: string, value: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.tags?.[key] === value);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] ?? 0;
  }
}

// Singleton instance
export const PerformanceMonitor = new PerformanceMonitorClass();

/**
 * Helper function to measure async operations
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  const end = PerformanceMonitor.start(name);

  try {
    const result = await fn();
    end(tags, { success: true });
    return result;
  } catch (error) {
    end(tags, { success: false, error: String(error) });
    throw error;
  }
}

/**
 * Helper function to measure sync operations
 */
export function measureSync<T>(
  name: string,
  fn: () => T,
  tags?: Record<string, string>
): T {
  const end = PerformanceMonitor.start(name);

  try {
    const result = fn();
    end(tags, { success: true });
    return result;
  } catch (error) {
    end(tags, { success: false, error: String(error) });
    throw error;
  }
}

/**
 * Middleware helper for Next.js API routes
 */
export function withPerformanceMonitoring(
  handler: (req: any, res: any) => Promise<any>,
  routeName: string
) {
  return async (req: any, res: any) => {
    const end = PerformanceMonitor.start(`api:${routeName}`);

    try {
      const result = await handler(req, res);
      end(
        { method: req.method, route: routeName },
        { status: res.statusCode || 200 }
      );
      return result;
    } catch (error) {
      end(
        { method: req.method, route: routeName },
        { status: 500, error: String(error) }
      );
      throw error;
    }
  };
}
