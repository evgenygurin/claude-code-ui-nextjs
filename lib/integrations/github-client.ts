/**
 * GitHub API Client
 *
 * Integrates with GitHub API to fetch CI/CD workflow data
 * Documentation: https://docs.github.com/en/rest
 */

import { Octokit } from '@octokit/rest';

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

export interface WorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  run_started_at: string;
  jobs_url: string;
}

export interface WorkflowJob {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  started_at: string;
  completed_at: string;
  steps: Array<{
    name: string;
    status: string;
    conclusion: string | null;
    number: number;
  }>;
}

export class GitHubClient {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(config: GitHubConfig) {
    this.octokit = new Octokit({ auth: config.token });
    this.owner = config.owner;
    this.repo = config.repo;
  }

  /**
   * Get recent workflow runs
   */
  async getWorkflowRuns(params: {
    workflow_id?: string;
    branch?: string;
    event?: string;
    status?: 'completed' | 'queued' | 'in_progress';
    per_page?: number;
  } = {}): Promise<WorkflowRun[]> {
    const response = await this.octokit.actions.listWorkflowRunsForRepo({
      owner: this.owner,
      repo: this.repo,
      per_page: params.per_page || 30,
      ...params,
    });

    return response.data.workflow_runs as WorkflowRun[];
  }

  /**
   * Get jobs for a workflow run
   */
  async getWorkflowRunJobs(runId: number): Promise<WorkflowJob[]> {
    const response = await this.octokit.actions.listJobsForWorkflowRun({
      owner: this.owner,
      repo: this.repo,
      run_id: runId,
    });

    return response.data.jobs as WorkflowJob[];
  }

  /**
   * Calculate CI/CD health metrics
   */
  async getCICDHealth(hours: number = 24): Promise<{
    pipelineStatus: 'passing' | 'failing' | 'pending';
    successRate: number;
    averageDuration: number;
    totalRuns: number;
    failedRuns: number;
    recentRuns: Array<{
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
    }>;
  }> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const runs = await this.getWorkflowRuns({ per_page: 50 });

    // Filter runs within time window
    const recentRuns = runs.filter((run) => {
      const runDate = new Date(run.created_at);
      return runDate >= since;
    });

    const completedRuns = recentRuns.filter((run) => run.status === 'completed');
    const failedRuns = completedRuns.filter((run) => run.conclusion === 'failure');
    const successRate = completedRuns.length > 0
      ? ((completedRuns.length - failedRuns.length) / completedRuns.length) * 100
      : 100;

    // Calculate average duration
    const durations = completedRuns.map((run) => {
      const start = new Date(run.run_started_at || run.created_at);
      const end = new Date(run.updated_at);
      return (end.getTime() - start.getTime()) / 1000 / 60; // minutes
    });

    const averageDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

    // Get detailed info for recent runs (limit to 10)
    const detailedRuns = await Promise.all(
      recentRuns.slice(0, 10).map(async (run) => {
        const jobs = await this.getWorkflowRunJobs(run.id);

        const start = new Date(run.run_started_at || run.created_at);
        const end = new Date(run.updated_at);
        const duration = (end.getTime() - start.getTime()) / 1000 / 60;

        return {
          id: String(run.id),
          branch: run.head_branch,
          status: this.mapStatus(run.conclusion),
          duration: Math.round(duration),
          timestamp: run.created_at,
          jobs: jobs.map((job) => {
            const jobStart = new Date(job.started_at);
            const jobEnd = new Date(job.completed_at || Date.now());
            const jobDuration = (jobEnd.getTime() - jobStart.getTime()) / 1000 / 60;

            return {
              name: job.name,
              status: this.mapStatus(job.conclusion),
              duration: Math.round(jobDuration),
            };
          }),
        };
      })
    );

    // Determine overall pipeline status
    const latestRun = runs[0];
    let pipelineStatus: 'passing' | 'failing' | 'pending' = 'passing';
    if (latestRun) {
      if (latestRun.status !== 'completed') {
        pipelineStatus = 'pending';
      } else if (latestRun.conclusion === 'failure') {
        pipelineStatus = 'failing';
      }
    }

    return {
      pipelineStatus,
      successRate: Math.round(successRate),
      averageDuration: Math.round(averageDuration),
      totalRuns: recentRuns.length,
      failedRuns: failedRuns.length,
      recentRuns: detailedRuns,
    };
  }

  /**
   * Get job performance statistics
   */
  async getJobPerformance(runs: number = 50): Promise<Array<{
    name: string;
    avgDuration: number;
    successRate: number;
  }>> {
    const workflowRuns = await this.getWorkflowRuns({ per_page: runs, status: 'completed' });

    const jobStats = new Map<string, { durations: number[]; successes: number; total: number }>();

    for (const run of workflowRuns) {
      const jobs = await this.getWorkflowRunJobs(run.id);

      for (const job of jobs) {
        if (!jobStats.has(job.name)) {
          jobStats.set(job.name, { durations: [], successes: 0, total: 0 });
        }

        const stats = jobStats.get(job.name)!;
        stats.total++;

        if (job.conclusion === 'success') {
          stats.successes++;
        }

        if (job.started_at && job.completed_at) {
          const start = new Date(job.started_at);
          const end = new Date(job.completed_at);
          const duration = (end.getTime() - start.getTime()) / 1000 / 60;
          stats.durations.push(duration);
        }
      }
    }

    return Array.from(jobStats.entries()).map(([name, stats]) => ({
      name,
      avgDuration: stats.durations.length > 0
        ? stats.durations.reduce((sum, d) => sum + d, 0) / stats.durations.length
        : 0,
      successRate: (stats.successes / stats.total) * 100,
    }));
  }

  /**
   * Get merge conflict statistics
   */
  async getMergeConflicts(days: number = 7): Promise<{
    totalConflicts: number;
    resolvedConflicts: number;
    averageResolutionTime: number;
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const pulls = await this.octokit.pulls.list({
      owner: this.owner,
      repo: this.repo,
      state: 'all',
      per_page: 100,
    });

    // Filter PRs with merge conflicts
    const conflictedPRs = pulls.data.filter((pr) => {
      const prDate = new Date(pr.created_at);
      return prDate >= since && (pr as any).mergeable === false;
    });

    const resolvedConflicts = conflictedPRs.filter((pr) => pr.state === 'closed' && pr.merged_at);

    // Calculate average resolution time
    const resolutionTimes = resolvedConflicts
      .filter((pr) => pr.merged_at)
      .map((pr) => {
        const created = new Date(pr.created_at);
        const merged = new Date(pr.merged_at!);
        return (merged.getTime() - created.getTime()) / 1000 / 60; // minutes
      });

    const averageResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((sum, t) => sum + t, 0) / resolutionTimes.length
      : 0;

    return {
      totalConflicts: conflictedPRs.length,
      resolvedConflicts: resolvedConflicts.length,
      averageResolutionTime: Math.round(averageResolutionTime),
    };
  }

  private mapStatus(conclusion: string | null): 'success' | 'failed' | 'running' {
    if (!conclusion) return 'running';
    if (conclusion === 'success') return 'success';
    return 'failed';
  }
}

/**
 * Create a GitHub client from environment variables
 */
export function createGitHubClient(): GitHubClient | null {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    console.warn('GitHub credentials not configured');
    return null;
  }

  return new GitHubClient({ token, owner, repo });
}
