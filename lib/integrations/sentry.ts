/**
 * Sentry Integration for CodeGen
 *
 * Capabilities according to CodeGen docs:
 * - Automated root cause analysis of error patterns and stack traces
 * - Deep error investigation with context and user impact
 * - Error prioritization
 * - Performance monitoring
 * - Release tracking
 * - Team coordination for issue resolution
 *
 * Permissions Required:
 * - Read organization information
 * - Read/Write project and team details
 * - Read/Write event information
 *
 * Note: Currently in beta, requires feature flag access and team administrator enablement
 */

interface SentryIntegrationConfig {
  authToken: string;
  organization: string;
  project?: string;
  region?: 'us' | 'eu';
}

interface SentryIssue {
  id: string;
  shortId: string;
  title: string;
  culprit: string;
  permalink: string;
  level: 'error' | 'warning' | 'info' | 'debug' | 'fatal';
  status: 'unresolved' | 'resolved' | 'ignored';
  statusDetails: Record<string, any>;
  type: string;
  metadata: Record<string, any>;
  numComments: number;
  userCount: number;
  count: string;
  userReportCount: number;
  firstSeen: string;
  lastSeen: string;
  stats: {
    '24h': Array<[number, number]>;
  };
  project: {
    id: string;
    name: string;
    slug: string;
  };
}

interface SentryEvent {
  id: string;
  eventID: string;
  projectID: string;
  groupID: string;
  title: string;
  message: string;
  culprit: string;
  level: string;
  platform: string;
  datetime: string;
  tags: Array<{
    key: string;
    value: string;
  }>;
  user?: {
    id?: string;
    email?: string;
    username?: string;
    ip_address?: string;
  };
  context: Record<string, any>;
  fingerprint: string[];
  size: number;
}

interface SentryRelease {
  version: string;
  shortVersion: string;
  ref?: string;
  url?: string;
  dateReleased?: string;
  dateCreated: string;
  data: Record<string, any>;
  newGroups: number;
  commitCount: number;
  deployCount: number;
  authors: Array<{
    name: string;
    email: string;
  }>;
  projects: Array<{
    name: string;
    slug: string;
  }>;
}

interface SentryProject {
  id: string;
  slug: string;
  name: string;
  platform?: string;
  dateCreated: string;
  isBookmarked: boolean;
  isMember: boolean;
  features: string[];
  firstEvent?: string;
  hasAccess: boolean;
  status: 'active' | 'disabled' | 'pending_deletion' | 'deletion_in_progress';
}

interface ErrorAnalysis {
  issue: SentryIssue;
  rootCause?: string;
  frequency: number;
  userImpact: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  relatedIssues: string[];
}

export class SentryIntegration {
  private authToken: string;
  private organization: string;
  private defaultProject?: string;
  private baseUrl: string;

  constructor(config: SentryIntegrationConfig) {
    this.authToken = config.authToken;
    this.organization = config.organization;
    this.defaultProject = config.project;

    // Set base URL based on region
    this.baseUrl = config.region === 'eu'
      ? 'https://eu.sentry.io/api/0'
      : 'https://us.sentry.io/api/0';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
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
      const errorText = await response.text();
      throw new Error(
        `Sentry API error (${response.status}): ${errorText}`
      );
    }

    return response.json();
  }

  // Organization and Project Management
  async getOrganization(): Promise<any> {
    try {
      return await this.request(`/organizations/${this.organization}/`);
    } catch (error) {
      throw new Error(`Failed to get organization: ${error}`);
    }
  }

  async listProjects(): Promise<SentryProject[]> {
    try {
      return await this.request<SentryProject[]>(
        `/organizations/${this.organization}/projects/`
      );
    } catch (error) {
      throw new Error(`Failed to list projects: ${error}`);
    }
  }

  async getProject(projectSlug?: string): Promise<SentryProject> {
    const project = projectSlug || this.defaultProject;
    if (!project) {
      throw new Error('Project slug must be provided');
    }

    try {
      return await this.request<SentryProject>(
        `/projects/${this.organization}/${project}/`
      );
    } catch (error) {
      throw new Error(`Failed to get project: ${error}`);
    }
  }

  // Issues Management
  async listIssues(
    projectSlug?: string,
    query?: string,
    sort?: 'date' | 'new' | 'priority' | 'freq' | 'user',
    statsPeriod?: string
  ): Promise<SentryIssue[]> {
    const project = projectSlug || this.defaultProject;
    if (!project) {
      throw new Error('Project slug must be provided');
    }

    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (sort) params.append('sort', sort);
      if (statsPeriod) params.append('statsPeriod', statsPeriod);

      const queryString = params.toString();
      const endpoint = `/projects/${this.organization}/${project}/issues/${
        queryString ? `?${queryString}` : ''
      }`;

      return await this.request<SentryIssue[]>(endpoint);
    } catch (error) {
      throw new Error(`Failed to list issues: ${error}`);
    }
  }

  async getIssue(
    issueId: string,
    projectSlug?: string
  ): Promise<SentryIssue> {
    const project = projectSlug || this.defaultProject;
    if (!project) {
      throw new Error('Project slug must be provided');
    }

    try {
      return await this.request<SentryIssue>(
        `/issues/${issueId}/`
      );
    } catch (error) {
      throw new Error(`Failed to get issue: ${error}`);
    }
  }

  async updateIssue(
    issueId: string,
    updates: {
      status?: 'resolved' | 'unresolved' | 'ignored' | 'resolvedInNextRelease';
      assignedTo?: string;
      isBookmarked?: boolean;
      isSubscribed?: boolean;
      isPublic?: boolean;
    }
  ): Promise<SentryIssue> {
    try {
      return await this.request<SentryIssue>(
        `/issues/${issueId}/`,
        {
          method: 'PUT',
          body: JSON.stringify(updates),
        }
      );
    } catch (error) {
      throw new Error(`Failed to update issue: ${error}`);
    }
  }

  async deleteIssue(issueId: string): Promise<void> {
    try {
      await this.request(
        `/issues/${issueId}/`,
        { method: 'DELETE' }
      );
    } catch (error) {
      throw new Error(`Failed to delete issue: ${error}`);
    }
  }

  // Events Management
  async listEvents(
    issueId: string,
    full?: boolean
  ): Promise<SentryEvent[]> {
    try {
      const params = new URLSearchParams();
      if (full) params.append('full', 'true');

      const queryString = params.toString();
      const endpoint = `/issues/${issueId}/events/${
        queryString ? `?${queryString}` : ''
      }`;

      return await this.request<SentryEvent[]>(endpoint);
    } catch (error) {
      throw new Error(`Failed to list events: ${error}`);
    }
  }

  async getEvent(
    projectSlug: string,
    eventId: string
  ): Promise<SentryEvent> {
    const project = projectSlug || this.defaultProject;
    if (!project) {
      throw new Error('Project slug must be provided');
    }

    try {
      return await this.request<SentryEvent>(
        `/projects/${this.organization}/${project}/events/${eventId}/`
      );
    } catch (error) {
      throw new Error(`Failed to get event: ${error}`);
    }
  }

  // Release Management
  async listReleases(projectSlug?: string): Promise<SentryRelease[]> {
    const project = projectSlug || this.defaultProject;
    if (!project) {
      throw new Error('Project slug must be provided');
    }

    try {
      return await this.request<SentryRelease[]>(
        `/projects/${this.organization}/${project}/releases/`
      );
    } catch (error) {
      throw new Error(`Failed to list releases: ${error}`);
    }
  }

  async createRelease(
    version: string,
    projectSlug?: string,
    options?: {
      ref?: string;
      url?: string;
      dateReleased?: string;
      commits?: Array<{
        id: string;
        repository?: string;
        author_name?: string;
        author_email?: string;
        message?: string;
        timestamp?: string;
      }>;
    }
  ): Promise<SentryRelease> {
    const project = projectSlug || this.defaultProject;
    if (!project) {
      throw new Error('Project slug must be provided');
    }

    try {
      const releaseData = {
        version,
        projects: [project],
        ...options,
      };

      return await this.request<SentryRelease>(
        `/organizations/${this.organization}/releases/`,
        {
          method: 'POST',
          body: JSON.stringify(releaseData),
        }
      );
    } catch (error) {
      throw new Error(`Failed to create release: ${error}`);
    }
  }

  async deployRelease(
    version: string,
    environment: string,
    projectSlug?: string
  ): Promise<any> {
    const project = projectSlug || this.defaultProject;
    if (!project) {
      throw new Error('Project slug must be provided');
    }

    try {
      return await this.request(
        `/organizations/${this.organization}/releases/${version}/deploys/`,
        {
          method: 'POST',
          body: JSON.stringify({
            environment,
            projects: [project],
          }),
        }
      );
    } catch (error) {
      throw new Error(`Failed to deploy release: ${error}`);
    }
  }

  // Stats and Analytics
  async getProjectStats(
    projectSlug?: string,
    stat?: string,
    since?: number,
    until?: number,
    resolution?: string
  ): Promise<any> {
    const project = projectSlug || this.defaultProject;
    if (!project) {
      throw new Error('Project slug must be provided');
    }

    try {
      const params = new URLSearchParams();
      if (stat) params.append('stat', stat);
      if (since) params.append('since', since.toString());
      if (until) params.append('until', until.toString());
      if (resolution) params.append('resolution', resolution);

      const queryString = params.toString();
      const endpoint = `/projects/${this.organization}/${project}/stats/${
        queryString ? `?${queryString}` : ''
      }`;

      return await this.request(endpoint);
    } catch (error) {
      throw new Error(`Failed to get project stats: ${error}`);
    }
  }

  // Advanced Error Analysis (CodeGen specific features)
  async analyzeError(issueId: string): Promise<ErrorAnalysis> {
    try {
      // Get the issue details
      const issue = await this.getIssue(issueId);

      // Get recent events for analysis
      const events = await this.listEvents(issueId, true);

      // Calculate frequency and user impact
      const frequency = parseInt(issue.count);
      const userImpact = issue.userCount;

      // Determine priority based on frequency and user impact
      let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (userImpact > 1000 || frequency > 10000) {
        priority = 'critical';
      } else if (userImpact > 100 || frequency > 1000) {
        priority = 'high';
      } else if (userImpact > 10 || frequency > 100) {
        priority = 'medium';
      }

      // Generate recommendations based on error patterns
      const recommendations: string[] = [];

      // Analyze error type and metadata
      if (issue.type === 'error') {
        recommendations.push('Implement proper error handling and validation');

        if (issue.metadata.type === 'TypeError') {
          recommendations.push('Add type checking and null/undefined guards');
        }

        if (issue.metadata.type === 'ReferenceError') {
          recommendations.push('Verify variable declarations and scope');
        }

        if (issue.culprit.includes('network') || issue.culprit.includes('fetch')) {
          recommendations.push('Implement retry logic and better network error handling');
        }
      }

      // Check for performance issues
      if (issue.level === 'warning' && frequency > 1000) {
        recommendations.push('Consider performance optimization for high-frequency warnings');
      }

      // Analyze stack trace patterns from events
      const stackTracePatterns = events
        .map(event => event.culprit)
        .filter((culprit, index, arr) => arr.indexOf(culprit) === index);

      if (stackTracePatterns.length > 1) {
        recommendations.push('Multiple error patterns detected - consider common root cause');
      }

      // Find related issues (simplified - would use ML in production)
      const relatedIssues: string[] = [];
      // This would typically involve semantic analysis of error messages and stack traces

      return {
        issue,
        rootCause: this.identifyRootCause(issue, events),
        frequency,
        userImpact,
        priority,
        recommendations,
        relatedIssues,
      };
    } catch (error) {
      throw new Error(`Failed to analyze error: ${error}`);
    }
  }

  private identifyRootCause(issue: SentryIssue, events: SentryEvent[]): string {
    // Simplified root cause analysis
    // In production, this would use advanced pattern recognition and ML

    if (issue.metadata.type === 'TypeError' && issue.metadata.value?.includes('null')) {
      return 'Null pointer dereference - missing null checks before object access';
    }

    if (issue.metadata.type === 'ReferenceError') {
      return 'Variable not defined - check variable scope and declarations';
    }

    if (issue.culprit.includes('async') || issue.culprit.includes('Promise')) {
      return 'Asynchronous operation error - check promise handling and async/await usage';
    }

    if (events.some(e => e.tags.some(tag => tag.key === 'environment' && tag.value === 'production'))) {
      return 'Production-specific error - check environment configuration and deployment';
    }

    return 'Generic error - requires manual investigation of stack trace and context';
  }

  // Team Coordination
  async assignIssue(issueId: string, userId: string): Promise<SentryIssue> {
    try {
      return await this.updateIssue(issueId, { assignedTo: userId });
    } catch (error) {
      throw new Error(`Failed to assign issue: ${error}`);
    }
  }

  async addIssueComment(issueId: string, text: string): Promise<any> {
    try {
      return await this.request(
        `/issues/${issueId}/notes/`,
        {
          method: 'POST',
          body: JSON.stringify({ text }),
        }
      );
    } catch (error) {
      throw new Error(`Failed to add comment: ${error}`);
    }
  }

  async getTeamMembers(): Promise<any[]> {
    try {
      return await this.request(
        `/organizations/${this.organization}/members/`
      );
    } catch (error) {
      throw new Error(`Failed to get team members: ${error}`);
    }
  }
}

// Factory function to create Sentry integration instance
export function createSentryIntegration(
  authToken?: string,
  organization?: string,
  project?: string,
  region?: 'us' | 'eu'
): SentryIntegration {
  const sentryAuthToken = authToken || process.env.SENTRY_AUTH_TOKEN;
  const sentryOrg = organization || process.env.SENTRY_ORG;

  if (!sentryAuthToken) {
    throw new Error('Sentry auth token is required. Set SENTRY_AUTH_TOKEN environment variable or pass authToken parameter.');
  }

  if (!sentryOrg) {
    throw new Error('Sentry organization is required. Set SENTRY_ORG environment variable or pass organization parameter.');
  }

  return new SentryIntegration({
    authToken: sentryAuthToken,
    organization: sentryOrg,
    project: project || process.env.SENTRY_PROJECT,
    region: region || 'us',
  });
}

export default SentryIntegration;