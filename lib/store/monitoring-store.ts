import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * Monitoring Dashboard State Store
 *
 * Centralized state management for the monitoring dashboard using Zustand.
 * Features:
 * - Auto-refresh control
 * - Last update timestamp tracking
 * - Active tab management
 * - Metrics caching with TTL
 * - Loading states
 */

interface MetricsCache {
  data: any;
  timestamp: number;
  ttl: number; // Time-to-live in milliseconds
}

interface MonitoringState {
  // Auto-refresh settings
  autoRefresh: boolean;
  refreshInterval: number; // milliseconds
  lastUpdate: Date;

  // Active tab
  activeTab: string;

  // Loading states
  isLoading: boolean;

  // Metrics cache
  metricsCache: {
    overview?: MetricsCache;
    sentry?: MetricsCache;
    conflicts?: MetricsCache;
    cicd?: MetricsCache;
    timeline?: MetricsCache;
    systemHealth?: MetricsCache;
  };

  // Actions
  setAutoRefresh: (value: boolean) => void;
  setRefreshInterval: (interval: number) => void;
  triggerRefresh: () => void;
  setActiveTab: (tab: string) => void;
  setIsLoading: (loading: boolean) => void;

  // Cache management
  setMetricsCache: (key: string, data: any, ttl?: number) => void;
  getMetricsCache: (key: string) => any | null;
  clearMetricsCache: (key?: string) => void;
  isMetricsCacheValid: (key: string) => boolean;
}

const DEFAULT_TTL = 30000; // 30 seconds
const DEFAULT_REFRESH_INTERVAL = 30000; // 30 seconds

export const useMonitoringStore = create<MonitoringState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        autoRefresh: true,
        refreshInterval: DEFAULT_REFRESH_INTERVAL,
        lastUpdate: new Date(),
        activeTab: 'overview',
        isLoading: false,
        metricsCache: {},

        // Actions
        setAutoRefresh: (value: boolean) =>
          set({ autoRefresh: value }, false, 'setAutoRefresh'),

        setRefreshInterval: (interval: number) =>
          set({ refreshInterval: interval }, false, 'setRefreshInterval'),

        triggerRefresh: () =>
          set({ lastUpdate: new Date() }, false, 'triggerRefresh'),

        setActiveTab: (tab: string) =>
          set({ activeTab: tab }, false, 'setActiveTab'),

        setIsLoading: (loading: boolean) =>
          set({ isLoading: loading }, false, 'setIsLoading'),

        // Cache management
        setMetricsCache: (key: string, data: any, ttl = DEFAULT_TTL) =>
          set(
            (state) => ({
              metricsCache: {
                ...state.metricsCache,
                [key]: {
                  data,
                  timestamp: Date.now(),
                  ttl,
                },
              },
            }),
            false,
            'setMetricsCache'
          ),

        getMetricsCache: (key: string) => {
          const state = get();
          const cache = state.metricsCache[key as keyof typeof state.metricsCache];
          if (!cache) return null;

          const isValid = Date.now() - cache.timestamp < cache.ttl;
          return isValid ? cache.data : null;
        },

        clearMetricsCache: (key?: string) =>
          set(
            (state) => {
              if (key) {
                const newCache = { ...state.metricsCache };
                delete newCache[key as keyof typeof newCache];
                return { metricsCache: newCache };
              }
              return { metricsCache: {} };
            },
            false,
            'clearMetricsCache'
          ),

        isMetricsCacheValid: (key: string) => {
          const state = get();
          const cache = state.metricsCache[key as keyof typeof state.metricsCache];
          if (!cache) return false;
          return Date.now() - cache.timestamp < cache.ttl;
        },
      }),
      {
        name: 'monitoring-storage',
        partialize: (state) => ({
          autoRefresh: state.autoRefresh,
          refreshInterval: state.refreshInterval,
          activeTab: state.activeTab,
        }),
      }
    ),
    { name: 'MonitoringStore' }
  )
);

/**
 * Hook to fetch metrics with caching
 *
 * @param endpoint - API endpoint to fetch from (e.g., 'overview', 'sentry')
 * @param cacheKey - Key for storing in cache
 * @returns Cached data or null if not available/expired
 */
export function useCachedMetrics(endpoint: string, cacheKey: string) {
  const store = useMonitoringStore();

  const fetchMetrics = async () => {
    // Check cache first
    const cached = store.getMetricsCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API
    try {
      const response = await fetch(`/api/metrics/${endpoint}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint} metrics`);
      }

      const data = await response.json();

      // Store in cache
      store.setMetricsCache(cacheKey, data);

      return data;
    } catch (error) {
      console.error(`Error fetching ${endpoint} metrics:`, error);
      return null;
    }
  };

  return { fetchMetrics };
}

/**
 * Hook to automatically refresh metrics
 *
 * Usage in components:
 * ```tsx
 * const { autoRefresh, refreshInterval } = useMonitoringStore();
 * useAutoRefresh(autoRefresh, refreshInterval, () => {
 *   // Refresh logic here
 * });
 * ```
 */
export function useAutoRefresh(
  enabled: boolean,
  interval: number,
  callback: () => void
) {
  const triggerRefresh = useMonitoringStore((state) => state.triggerRefresh);

  if (typeof window !== 'undefined') {
    // Client-side only
    const { useEffect } = require('react');

    useEffect(() => {
      if (!enabled) return;

      const intervalId = setInterval(() => {
        triggerRefresh();
        callback();
      }, interval);

      return () => clearInterval(intervalId);
    }, [enabled, interval, callback, triggerRefresh]);
  }
}
