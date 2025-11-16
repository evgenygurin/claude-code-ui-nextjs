/**
 * Sentry API Client
 *
 * Integrates with Sentry API to fetch real error tracking data
 * Documentation: https://docs.sentry.io/api/
 */

export interface SentryConfig {
  authToken: string;
  organizationSlug: string;
  projectSlug?: string;
}

export interface SentryIssue {
  id: string;
  title: string;
  culprit: string;
  level: string;
  count: number;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  status: string;
  metadata: {
    type?: string;
    value?: string;
  };
}

export interface SentryStats {
  totalEvents: number;
  affectedUsers: number;
  resolvedIssues: number;
  unresolvedIssues: number;
}

export class SentryClient {
  private authToken: string;
  private organizationSlug: string;
  private projectSlug?: string;
  private baseUrl = 'https://sentry.io/api/0';

  constructor(config: SentryConfig) {
    this.authToken = config.authToken;
    this.organizationSlug = config.organizationSlug;
    this.projectSlug = config.projectSlug;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Sentry API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get issues for a project
   */
  async getIssues(params: {
    statsPeriod?: string; // e.g., '24h', '7d', '30d'
    query?: string;
    limit?: number;
  } = {}): Promise<SentryIssue[]> {
    if (!this.projectSlug) {
      throw new Error('Project slug is required');
    }

    const searchParams = new URLSearchParams({
      statsPeriod: params.statsPeriod || '24h',
      limit: String(params.limit || 25),
    });

    if (params.query) {
      searchParams.append('query', params.query);
    }

    const endpoint = `/organizations/${this.organizationSlug}/issues/?${searchParams}`;
    return this.request<SentryIssue[]>(endpoint);
  }

  /**
   * Get project statistics
   */
  async getProjectStats(statsPeriod: string = '24h'): Promise<SentryStats> {
    if (!this.projectSlug) {
      throw new Error('Project slug is required');
    }

    const endpoint = `/projects/${this.organizationSlug}/${this.projectSlug}/stats/?stat=received&stat=rejected&resolution=1h&statsPeriod=${statsPeriod}`;
    const data = await this.request<any>(endpoint);

    // Transform Sentry stats to our format
    return {
      totalEvents: data.received?.reduce((sum: number, point: [number, number]) => sum + point[1], 0) || 0,
      affectedUsers: 0, // Need separate endpoint
      resolvedIssues: 0,
      unresolvedIssues: 0,
    };
  }

  /**
   * Get issue details
   */
  async getIssueDetails(issueId: string): Promise<SentryIssue> {
    const endpoint = `/issues/${issueId}/`;
    return this.request<SentryIssue>(endpoint);
  }

  /**
   * Get events for an issue
   */
  async getIssueEvents(issueId: string, limit: number = 10): Promise<any[]> {
    const endpoint = `/issues/${issueId}/events/?limit=${limit}`;
    return this.request<any[]>(endpoint);
  }

  /**
   * Calculate priority distribution from issues
   */
  calculatePriorityDistribution(issues: SentryIssue[]): {
    critical: number;
    high: number;
    medium: number;
    low: number;
  } {
    const distribution = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    issues.forEach((issue) => {
      // Determine priority based on level and count
      if (issue.level === 'fatal' || issue.level === 'error' && issue.count > 100) {
        distribution.critical++;
      } else if (issue.level === 'error' || issue.level === 'warning' && issue.count > 50) {
        distribution.high++;
      } else if (issue.level === 'warning') {
        distribution.medium++;
      } else {
        distribution.low++;
      }
    });

    return distribution;
  }

  /**
   * Get error trends over time
   */
  async getErrorTrends(days: number = 7): Promise<Array<{ date: string; count: number }>> {
    if (!this.projectSlug) {
      throw new Error('Project slug is required');
    }

    const endpoint = `/projects/${this.organizationSlug}/${this.projectSlug}/stats/?stat=received&resolution=1d&statsPeriod=${days}d`;
    const data = await this.request<any>(endpoint);

    // Transform to trend format
    if (!data.received) {
      return [];
    }

    return data.received.map(([timestamp, count]: [number, number]) => ({
      date: new Date(timestamp * 1000).toISOString(),
      count,
    }));
  }

  /**
   * Get top errors for dashboard
   */
  async getTopErrors(limit: number = 10): Promise<Array<{
    id: string;
    title: string;
    count: number;
    users: number;
    lastSeen: string;
  }>> {
    const issues = await this.getIssues({ limit });

    return issues.map((issue) => ({
      id: issue.id,
      title: issue.title || issue.culprit || 'Unknown Error',
      count: issue.count,
      users: issue.userCount,
      lastSeen: issue.lastSeen,
    }));
  }
}

/**
 * Create a Sentry client from environment variables
 */
export function createSentryClient(): SentryClient | null {
  const authToken = process.env.SENTRY_AUTH_TOKEN;
  const organizationSlug = process.env.SENTRY_ORG_SLUG;
  const projectSlug = process.env.SENTRY_PROJECT_SLUG;

  if (!authToken || !organizationSlug) {
    console.warn('Sentry credentials not configured');
    return null;
  }

  return new SentryClient({
    authToken,
    organizationSlug,
    projectSlug,
  });
}
