/**
 * GitHub Integration for CodeGen
 *
 * Capabilities according to CodeGen docs:
 * - Access repositories, create PRs, conduct code reviews, and manage the full development workflow
 * - Create and manage pull requests
 * - Conduct automated code reviews
 * - Run checks and CI/CD workflows
 * - Synchronize repository changes
 *
 * Permissions Required:
 * - Read/write repository contents
 * - Create and manage pull requests
 * - Write status checks
 * - Read/write issues and comments
 * - Manage GitHub Actions workflows
 * - Access organization projects and members
 */

import { Octokit } from '@octokit/rest';

interface GitHubIntegrationConfig {
  token: string;
  owner?: string;
  repo?: string;
}

interface PullRequest {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed' | 'merged';
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  url: string;
  created_at: string;
  updated_at: string;
}

interface CodeReview {
  id: number;
  body: string;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED';
  submitted_at: string;
  user: {
    login: string;
  };
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  labels: Array<{
    name: string;
    color: string;
  }>;
  assignees: Array<{
    login: string;
  }>;
  created_at: string;
  updated_at: string;
}

interface GitHubCheck {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required';
  started_at?: string;
  completed_at?: string;
  output: {
    title?: string;
    summary?: string;
  };
}

export class GitHubIntegration {
  private octokit: Octokit;
  private defaultOwner?: string;
  private defaultRepo?: string;

  constructor(config: GitHubIntegrationConfig) {
    this.octokit = new Octokit({
      auth: config.token,
    });
    this.defaultOwner = config.owner;
    this.defaultRepo = config.repo;
  }

  // Repository Management
  async getRepository(owner?: string, repo?: string) {
    const ownerName = owner || this.defaultOwner;
    const repoName = repo || this.defaultRepo;

    if (!ownerName || !repoName) {
      throw new Error('Repository owner and name must be provided');
    }

    try {
      const { data } = await this.octokit.rest.repos.get({
        owner: ownerName,
        repo: repoName,
      });
      return data;
    } catch (error) {
      throw new Error(`Failed to get repository: ${error}`);
    }
  }

  async listRepositories(org?: string): Promise<any[]> {
    try {
      if (org) {
        const { data } = await this.octokit.rest.repos.listForOrg({
          org,
          type: 'all',
        });
        return data;
      } else {
        const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
          type: 'all',
        });
        return data;
      }
    } catch (error) {
      throw new Error(`Failed to list repositories: ${error}`);
    }
  }

  // Pull Request Management
  async createPullRequest(
    title: string,
    head: string,
    base: string,
    body?: string,
    owner?: string,
    repo?: string
  ): Promise<PullRequest> {
    const ownerName = owner || this.defaultOwner;
    const repoName = repo || this.defaultRepo;

    if (!ownerName || !repoName) {
      throw new Error('Repository owner and name must be provided');
    }

    try {
      const { data } = await this.octokit.rest.pulls.create({
        owner: ownerName,
        repo: repoName,
        title,
        head,
        base,
        body,
      });

      return {
        id: data.id,
        number: data.number,
        title: data.title,
        body: data.body || undefined,
        state: data.state as 'open' | 'closed',
        head: {
          ref: data.head.ref,
          sha: data.head.sha,
        },
        base: {
          ref: data.base.ref,
          sha: data.base.sha,
        },
        url: data.html_url,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error) {
      throw new Error(`Failed to create pull request: ${error}`);
    }
  }

  async getPullRequest(
    pullNumber: number,
    owner?: string,
    repo?: string
  ): Promise<PullRequest> {
    const ownerName = owner || this.defaultOwner;
    const repoName = repo || this.defaultRepo;

    if (!ownerName || !repoName) {
      throw new Error('Repository owner and name must be provided');
    }

    try {
      const { data } = await this.octokit.rest.pulls.get({
        owner: ownerName,
        repo: repoName,
        pull_number: pullNumber,
      });

      return {
        id: data.id,
        number: data.number,
        title: data.title,
        body: data.body || undefined,
        state: data.state as 'open' | 'closed',
        head: {
          ref: data.head.ref,
          sha: data.head.sha,
        },
        base: {
          ref: data.base.ref,
          sha: data.base.sha,
        },
        url: data.html_url,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error) {
      throw new Error(`Failed to get pull request: ${error}`);
    }
  }

  async listPullRequests(
    state: 'open' | 'closed' | 'all' = 'open',
    owner?: string,
    repo?: string
  ): Promise<PullRequest[]> {
    const ownerName = owner || this.defaultOwner;
    const repoName = repo || this.defaultRepo;

    if (!ownerName || !repoName) {
      throw new Error('Repository owner and name must be provided');
    }

    try {
      const { data } = await this.octokit.rest.pulls.list({
        owner: ownerName,
        repo: repoName,
        state,
      });

      return data.map((pr: any) => ({
        id: pr.id,
        number: pr.number,
        title: pr.title,
        body: pr.body || undefined,
        state: pr.state as 'open' | 'closed',
        head: {
          ref: pr.head.ref,
          sha: pr.head.sha,
        },
        base: {
          ref: pr.base.ref,
          sha: pr.base.sha,
        },
        url: pr.html_url,
        created_at: pr.created_at,
        updated_at: pr.updated_at,
      }));
    } catch (error) {
      throw new Error(`Failed to list pull requests: ${error}`);
    }
  }

  async updatePullRequest(
    pullNumber: number,
    updates: {
      title?: string;
      body?: string;
      state?: 'open' | 'closed';
      base?: string;
    },
    owner?: string,
    repo?: string
  ): Promise<PullRequest> {
    const ownerName = owner || this.defaultOwner;
    const repoName = repo || this.defaultRepo;

    if (!ownerName || !repoName) {
      throw new Error('Repository owner and name must be provided');
    }

    try {
      const { data } = await this.octokit.rest.pulls.update({
        owner: ownerName,
        repo: repoName,
        pull_number: pullNumber,
        ...updates,
      });

      return {
        id: data.id,
        number: data.number,
        title: data.title,
        body: data.body || undefined,
        state: data.state as 'open' | 'closed',
        head: {
          ref: data.head.ref,
          sha: data.head.sha,
        },
        base: {
          ref: data.base.ref,
          sha: data.base.sha,
        },
        url: data.html_url,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error) {
      throw new Error(`Failed to update pull request: ${error}`);
    }
  }

  // Code Review Management
  async createReview(
    pullNumber: number,
    body: string,
    event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT',
    comments?: Array<{
      path: string;
      position?: number;
      line?: number;
      body: string;
    }>,
    owner?: string,
    repo?: string
  ): Promise<CodeReview> {
    const ownerName = owner || this.defaultOwner;
    const repoName = repo || this.defaultRepo;

    if (!ownerName || !repoName) {
      throw new Error('Repository owner and name must be provided');
    }

    try {
      const { data } = await this.octokit.rest.pulls.createReview({
        owner: ownerName,
        repo: repoName,
        pull_number: pullNumber,
        body,
        event,
        comments,
      });

      return {
        id: data.id,
        body: data.body,
        state: data.state as 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED',
        submitted_at: data.submitted_at || new Date().toISOString(),
        user: {
          login: data.user?.login || 'unknown',
        },
      };
    } catch (error) {
      throw new Error(`Failed to create review: ${error}`);
    }
  }

  async listReviews(
    pullNumber: number,
    owner?: string,
    repo?: string
  ): Promise<CodeReview[]> {
    const ownerName = owner || this.defaultOwner;
    const repoName = repo || this.defaultRepo;

    if (!ownerName || !repoName) {
      throw new Error('Repository owner and name must be provided');
    }

    try {
      const { data } = await this.octokit.rest.pulls.listReviews({
        owner: ownerName,
        repo: repoName,
        pull_number: pullNumber,
      });

      return data.map((review: any) => ({
        id: review.id,
        body: review.body,
        state: review.state as 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED',
        submitted_at: review.submitted_at || new Date().toISOString(),
        user: {
          login: review.user?.login || 'unknown',
        },
      }));
    } catch (error) {
      throw new Error(`Failed to list reviews: ${error}`);
    }
  }

  // Issues Management
  async createIssue(
    title: string,
    body?: string,
    labels?: string[],
    assignees?: string[],
    owner?: string,
    repo?: string
  ): Promise<GitHubIssue> {
    const ownerName = owner || this.defaultOwner;
    const repoName = repo || this.defaultRepo;

    if (!ownerName || !repoName) {
      throw new Error('Repository owner and name must be provided');
    }

    try {
      const { data } = await this.octokit.rest.issues.create({
        owner: ownerName,
        repo: repoName,
        title,
        body,
        labels,
        assignees,
      });

      return {
        id: data.id,
        number: data.number,
        title: data.title,
        body: data.body || undefined,
        state: data.state as 'open' | 'closed',
        labels: data.labels.map((label: any) => ({
          name: typeof label === 'string' ? label : label.name || '',
          color: typeof label === 'string' ? '' : label.color || '',
        })),
        assignees: data.assignees?.map((assignee: any) => ({
          login: assignee?.login || '',
        })) || [],
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error) {
      throw new Error(`Failed to create issue: ${error}`);
    }
  }

  async listIssues(
    state: 'open' | 'closed' | 'all' = 'open',
    owner?: string,
    repo?: string
  ): Promise<GitHubIssue[]> {
    const ownerName = owner || this.defaultOwner;
    const repoName = repo || this.defaultRepo;

    if (!ownerName || !repoName) {
      throw new Error('Repository owner and name must be provided');
    }

    try {
      const { data } = await this.octokit.rest.issues.listForRepo({
        owner: ownerName,
        repo: repoName,
        state,
      });

      return data.map((issue: any) => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        body: issue.body || undefined,
        state: issue.state as 'open' | 'closed',
        labels: issue.labels.map((label: any) => ({
          name: typeof label === 'string' ? label : label.name || '',
          color: typeof label === 'string' ? '' : label.color || '',
        })),
        assignees: issue.assignees?.map((assignee: any) => ({
          login: assignee?.login || '',
        })) || [],
        created_at: issue.created_at,
        updated_at: issue.updated_at,
      }));
    } catch (error) {
      throw new Error(`Failed to list issues: ${error}`);
    }
  }

  // Status Checks and CI/CD
  async listChecks(
    ref: string,
    owner?: string,
    repo?: string
  ): Promise<GitHubCheck[]> {
    const ownerName = owner || this.defaultOwner;
    const repoName = repo || this.defaultRepo;

    if (!ownerName || !repoName) {
      throw new Error('Repository owner and name must be provided');
    }

    try {
      const { data } = await this.octokit.rest.checks.listForRef({
        owner: ownerName,
        repo: repoName,
        ref,
      });

      return data.check_runs.map((check: any) => ({
        id: check.id,
        name: check.name,
        status: check.status as 'queued' | 'in_progress' | 'completed',
        conclusion: check.conclusion as 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | undefined,
        started_at: check.started_at || undefined,
        completed_at: check.completed_at || undefined,
        output: {
          title: check.output?.title || undefined,
          summary: check.output?.summary || undefined,
        },
      }));
    } catch (error) {
      throw new Error(`Failed to list checks: ${error}`);
    }
  }

  async createStatus(
    sha: string,
    state: 'error' | 'failure' | 'pending' | 'success',
    context: string,
    description?: string,
    targetUrl?: string,
    owner?: string,
    repo?: string
  ): Promise<void> {
    const ownerName = owner || this.defaultOwner;
    const repoName = repo || this.defaultRepo;

    if (!ownerName || !repoName) {
      throw new Error('Repository owner and name must be provided');
    }

    try {
      await this.octokit.rest.repos.createCommitStatus({
        owner: ownerName,
        repo: repoName,
        sha,
        state,
        context,
        description,
        target_url: targetUrl,
      });
    } catch (error) {
      throw new Error(`Failed to create status: ${error}`);
    }
  }

  // Workflow Management
  async triggerWorkflow(
    workflowId: string | number,
    ref: string,
    inputs?: Record<string, any>,
    owner?: string,
    repo?: string
  ): Promise<void> {
    const ownerName = owner || this.defaultOwner;
    const repoName = repo || this.defaultRepo;

    if (!ownerName || !repoName) {
      throw new Error('Repository owner and name must be provided');
    }

    try {
      await this.octokit.rest.actions.createWorkflowDispatch({
        owner: ownerName,
        repo: repoName,
        workflow_id: workflowId,
        ref,
        inputs,
      });
    } catch (error) {
      throw new Error(`Failed to trigger workflow: ${error}`);
    }
  }

  async listWorkflowRuns(
    workflowId?: string | number,
    owner?: string,
    repo?: string
  ): Promise<any[]> {
    const ownerName = owner || this.defaultOwner;
    const repoName = repo || this.defaultRepo;

    if (!ownerName || !repoName) {
      throw new Error('Repository owner and name must be provided');
    }

    try {
      if (workflowId) {
        const { data } = await this.octokit.rest.actions.listWorkflowRuns({
          owner: ownerName,
          repo: repoName,
          workflow_id: workflowId,
        });
        return data.workflow_runs;
      } else {
        const { data } = await this.octokit.rest.actions.listWorkflowRunsForRepo({
          owner: ownerName,
          repo: repoName,
        });
        return data.workflow_runs;
      }
    } catch (error) {
      throw new Error(`Failed to list workflow runs: ${error}`);
    }
  }

  // Comments Management
  async addComment(
    issueNumber: number,
    body: string,
    owner?: string,
    repo?: string
  ): Promise<void> {
    const ownerName = owner || this.defaultOwner;
    const repoName = repo || this.defaultRepo;

    if (!ownerName || !repoName) {
      throw new Error('Repository owner and name must be provided');
    }

    try {
      await this.octokit.rest.issues.createComment({
        owner: ownerName,
        repo: repoName,
        issue_number: issueNumber,
        body,
      });
    } catch (error) {
      throw new Error(`Failed to add comment: ${error}`);
    }
  }

  // Organization and Team Management
  async listOrgMembers(org: string): Promise<any[]> {
    try {
      const { data } = await this.octokit.rest.orgs.listMembers({
        org,
      });
      return data;
    } catch (error) {
      throw new Error(`Failed to list organization members: ${error}`);
    }
  }

  async listTeams(org: string): Promise<any[]> {
    try {
      const { data } = await this.octokit.rest.teams.list({
        org,
      });
      return data;
    } catch (error) {
      throw new Error(`Failed to list teams: ${error}`);
    }
  }
}

// Factory function to create GitHub integration instance
export function createGitHubIntegration(token?: string, owner?: string, repo?: string): GitHubIntegration {
  const githubToken = token || process.env.GITHUB_TOKEN;

  if (!githubToken) {
    throw new Error('GitHub token is required. Set GITHUB_TOKEN environment variable or pass token parameter.');
  }

  return new GitHubIntegration({
    token: githubToken,
    owner,
    repo,
  });
}

export default GitHubIntegration;