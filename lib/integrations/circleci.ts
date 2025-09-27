/**
 * CircleCI Integration for CodeGen
 *
 * Capabilities according to CodeGen docs:
 * - Monitor and automatically fix failing CI checks
 * - View broken checks and failures
 * - Analyze build logs and error messages
 * - Automatically fix failing PRs when checks fail
 *
 * Permissions Required:
 * - Read project information and settings
 * - View build history and logs
 * - Read test results and artifacts
 * - Access check status and details
 *
 * Key Behaviors:
 * - Operates in read-only mode for CircleCI
 * - Automatically wakes up when Codegen-created PRs have check failures
 * - Investigates logs, identifies issues, and generates fixes
 * - Pushes updates to the same PR branch
 *
 * Note: Currently available for enterprise customers at codegen.com/billing
 */

interface CircleCIIntegrationConfig {
  token: string;
  vcsType?: 'github' | 'bitbucket';
  organization?: string;
}

interface CircleCIProject {
  slug: string;
  name: string;
  organization_name: string;
  organization_slug: string;
  vcs_info: {
    vcs_url: string;
    provider: string;
    default_branch: string;
  };
}

interface CircleCIPipeline {
  id: string;
  number: number;
  project_slug: string;
  created_at: string;
  updated_at: string;
  state: 'created' | 'errored' | 'setup-pending' | 'setup' | 'pending';
  vcs: {
    origin_repository_url: string;
    target_repository_url: string;
    revision: string;
    provider_name: string;
    branch?: string;
    tag?: string;
    commit: {
      subject: string;
      body: string;
    };
  };
  trigger: {
    type: 'webhook' | 'api' | 'schedule';
    received_at: string;
    actor: {
      login: string;
      avatar_url: string;
    };
  };
}

interface CircleCIWorkflow {
  id: string;
  name: string;
  project_slug: string;
  pipeline_id: string;
  pipeline_number: number;
  status: 'success' | 'running' | 'not_run' | 'failed' | 'error' | 'failing' | 'on_hold' | 'canceled' | 'unauthorized';
  started_by: string;
  created_at: string;
  stopped_at?: string;
  tag?: string;
}

interface CircleCIJob {
  id: string;
  name: string;
  project_slug: string;
  pipeline_id: string;
  pipeline_number: number;
  workflow_id: string;
  status: 'success' | 'running' | 'not_run' | 'failed' | 'retried' | 'queued' | 'not_running' | 'infrastructure_fail' | 'timedout' | 'on_hold' | 'terminated-unknown' | 'blocked' | 'canceled' | 'unauthorized';
  started_at?: string;
  stopped_at?: string;
  job_number: number;
  type: 'build' | 'approval';
  web_url: string;
}

interface CircleCITestResults {
  items: Array<{
    classname: string;
    name: string;
    result: 'success' | 'failure' | 'skipped' | 'error';
    message?: string;
    file?: string;
    source?: string;
    run_time: number;
  }>;
  next_page_token?: string;
}

interface CircleCIArtifact {
  path: string;
  node_index: number;
  url: string;
  pretty_path: string;
}

interface BuildFailureAnalysis {
  job: CircleCIJob;
  failureType: 'test_failure' | 'build_error' | 'timeout' | 'infrastructure_failure' | 'unknown';
  errorMessages: string[];
  logSnippets: string[];
  suggestedFixes: string[];
  affectedFiles: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class CircleCIIntegration {
  private token: string;
  private vcsType: string;
  private organization?: string;
  private baseUrl = 'https://circleci.com/api/v2';

  constructor(config: CircleCIIntegrationConfig) {
    this.token = config.token;
    this.vcsType = config.vcsType || 'github';
    this.organization = config.organization;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Circle-Token': this.token,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `CircleCI API error (${response.status}): ${errorText}`
      );
    }

    return response.json();
  }

  // Project Management
  async listProjects(): Promise<CircleCIProject[]> {
    try {
      const data = await this.request<{ items: CircleCIProject[] }>('/projects');
      return data.items;
    } catch (error) {
      throw new Error(`Failed to list projects: ${error}`);
    }
  }

  async getProject(projectSlug: string): Promise<CircleCIProject> {
    try {
      return await this.request<CircleCIProject>(`/project/${projectSlug}`);
    } catch (error) {
      throw new Error(`Failed to get project: ${error}`);
    }
  }

  // Pipeline Management
  async listPipelines(
    projectSlug: string,
    branch?: string,
    pageToken?: string
  ): Promise<{ items: CircleCIPipeline[]; next_page_token?: string }> {
    try {
      const params = new URLSearchParams();
      if (branch) params.append('branch', branch);
      if (pageToken) params.append('page-token', pageToken);

      const queryString = params.toString();
      const endpoint = `/project/${projectSlug}/pipeline${
        queryString ? `?${queryString}` : ''
      }`;

      return await this.request<{ items: CircleCIPipeline[]; next_page_token?: string }>(
        endpoint
      );
    } catch (error) {
      throw new Error(`Failed to list pipelines: ${error}`);
    }
  }

  async getPipeline(pipelineId: string): Promise<CircleCIPipeline> {
    try {
      return await this.request<CircleCIPipeline>(`/pipeline/${pipelineId}`);
    } catch (error) {
      throw new Error(`Failed to get pipeline: ${error}`);
    }
  }

  async triggerPipeline(
    projectSlug: string,
    options?: {
      branch?: string;
      tag?: string;
      parameters?: Record<string, any>;
    }
  ): Promise<CircleCIPipeline> {
    try {
      const body: Record<string, any> = {};

      if (options?.branch) body.branch = options.branch;
      if (options?.tag) body.tag = options.tag;
      if (options?.parameters) body.parameters = options.parameters;

      return await this.request<CircleCIPipeline>(
        `/project/${projectSlug}/pipeline`,
        {
          method: 'POST',
          body: JSON.stringify(body),
        }
      );
    } catch (error) {
      throw new Error(`Failed to trigger pipeline: ${error}`);
    }
  }

  // Workflow Management
  async listWorkflows(
    pipelineId: string,
    pageToken?: string
  ): Promise<{ items: CircleCIWorkflow[]; next_page_token?: string }> {
    try {
      const params = new URLSearchParams();
      if (pageToken) params.append('page-token', pageToken);

      const queryString = params.toString();
      const endpoint = `/pipeline/${pipelineId}/workflow${
        queryString ? `?${queryString}` : ''
      }`;

      return await this.request<{ items: CircleCIWorkflow[]; next_page_token?: string }>(
        endpoint
      );
    } catch (error) {
      throw new Error(`Failed to list workflows: ${error}`);
    }
  }

  async getWorkflow(workflowId: string): Promise<CircleCIWorkflow> {
    try {
      return await this.request<CircleCIWorkflow>(`/workflow/${workflowId}`);
    } catch (error) {
      throw new Error(`Failed to get workflow: ${error}`);
    }
  }

  async approveJob(workflowId: string, approvalRequestId: string): Promise<any> {
    try {
      return await this.request(
        `/workflow/${workflowId}/approve/${approvalRequestId}`,
        { method: 'POST' }
      );
    } catch (error) {
      throw new Error(`Failed to approve job: ${error}`);
    }
  }

  async cancelWorkflow(workflowId: string): Promise<any> {
    try {
      return await this.request(`/workflow/${workflowId}/cancel`, {
        method: 'POST',
      });
    } catch (error) {
      throw new Error(`Failed to cancel workflow: ${error}`);
    }
  }

  async rerunWorkflow(
    workflowId: string,
    options?: {
      fromFailed?: boolean;
      jobs?: string[];
    }
  ): Promise<any> {
    try {
      const body: Record<string, any> = {};

      if (options?.fromFailed !== undefined) {
        body.from_failed = options.fromFailed;
      }

      if (options?.jobs) {
        body.jobs = options.jobs;
      }

      return await this.request(`/workflow/${workflowId}/rerun`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new Error(`Failed to rerun workflow: ${error}`);
    }
  }

  // Job Management
  async listJobs(
    workflowId: string,
    pageToken?: string
  ): Promise<{ items: CircleCIJob[]; next_page_token?: string }> {
    try {
      const params = new URLSearchParams();
      if (pageToken) params.append('page-token', pageToken);

      const queryString = params.toString();
      const endpoint = `/workflow/${workflowId}/job${
        queryString ? `?${queryString}` : ''
      }`;

      return await this.request<{ items: CircleCIJob[]; next_page_token?: string }>(
        endpoint
      );
    } catch (error) {
      throw new Error(`Failed to list jobs: ${error}`);
    }
  }

  async getJob(jobNumber: number, projectSlug: string): Promise<CircleCIJob> {
    try {
      return await this.request<CircleCIJob>(
        `/project/${projectSlug}/job/${jobNumber}`
      );
    } catch (error) {
      throw new Error(`Failed to get job: ${error}`);
    }
  }

  async cancelJob(jobNumber: number, projectSlug: string): Promise<any> {
    try {
      return await this.request(
        `/project/${projectSlug}/job/${jobNumber}/cancel`,
        { method: 'POST' }
      );
    } catch (error) {
      throw new Error(`Failed to cancel job: ${error}`);
    }
  }

  // Test Results and Artifacts
  async getTestResults(
    jobNumber: number,
    projectSlug: string
  ): Promise<CircleCITestResults> {
    try {
      return await this.request<CircleCITestResults>(
        `/project/${projectSlug}/${jobNumber}/tests`
      );
    } catch (error) {
      throw new Error(`Failed to get test results: ${error}`);
    }
  }

  async getArtifacts(
    jobNumber: number,
    projectSlug: string
  ): Promise<CircleCIArtifact[]> {
    try {
      const data = await this.request<{ items: CircleCIArtifact[] }>(
        `/project/${projectSlug}/${jobNumber}/artifacts`
      );
      return data.items;
    } catch (error) {
      throw new Error(`Failed to get artifacts: ${error}`);
    }
  }

  // Advanced Failure Analysis (CodeGen specific features)
  async analyzeFailure(
    jobNumber: number,
    projectSlug: string
  ): Promise<BuildFailureAnalysis> {
    try {
      // Get job details
      const job = await this.getJob(jobNumber, projectSlug);

      // If job didn't fail, return early
      if (job.status === 'success' || job.status === 'running') {
        throw new Error('Job has not failed - cannot analyze failure');
      }

      // Get test results if available
      let testResults: CircleCITestResults | null = null;
      try {
        testResults = await this.getTestResults(jobNumber, projectSlug);
      } catch {
        // Test results might not be available for all job types
      }

      // Analyze failure type
      let failureType: BuildFailureAnalysis['failureType'] = 'unknown';
      const errorMessages: string[] = [];
      const affectedFiles: string[] = [];
      const suggestedFixes: string[] = [];

      // Analyze job status
      switch (job.status) {
        case 'failed':
          if (testResults?.items.some(test => test.result === 'failure')) {
            failureType = 'test_failure';
            const failedTests = testResults.items.filter(test => test.result === 'failure');
            errorMessages.push(...failedTests.map(test =>
              `${test.classname}.${test.name}: ${test.message || 'Test failed'}`
            ));
            affectedFiles.push(...failedTests.map(test => test.file).filter(Boolean) as string[]);
            suggestedFixes.push('Fix failing tests', 'Review test assertions and data setup');
          } else {
            failureType = 'build_error';
            suggestedFixes.push('Check build configuration', 'Review dependency installation');
          }
          break;
        case 'timedout':
          failureType = 'timeout';
          errorMessages.push('Job execution timed out');
          suggestedFixes.push('Optimize build performance', 'Increase timeout limits', 'Parallelize slow operations');
          break;
        case 'infrastructure_fail':
          failureType = 'infrastructure_failure';
          errorMessages.push('Infrastructure failure detected');
          suggestedFixes.push('Retry the job', 'Check CircleCI status page', 'Contact support if issue persists');
          break;
      }

      // Determine priority based on failure type and affected area
      let priority: BuildFailureAnalysis['priority'] = 'medium';

      if (failureType === 'infrastructure_failure') {
        priority = 'low'; // Usually transient
      } else if (failureType === 'test_failure') {
        const failedTestCount = testResults?.items.filter(test => test.result === 'failure').length || 0;
        if (failedTestCount > 10) {
          priority = 'high';
        } else if (failedTestCount > 5) {
          priority = 'medium';
        } else {
          priority = 'low';
        }
      } else if (failureType === 'build_error') {
        priority = 'high'; // Build errors prevent deployment
      } else if (failureType === 'timeout') {
        priority = 'medium';
      }

      // Generate additional suggestions based on common patterns
      if (job.name.includes('test')) {
        suggestedFixes.push('Run tests locally to reproduce issue');
      }

      if (job.name.includes('deploy') || job.name.includes('build')) {
        suggestedFixes.push('Check environment configuration', 'Verify deployment scripts');
      }

      return {
        job,
        failureType,
        errorMessages: [...new Set(errorMessages)], // Remove duplicates
        logSnippets: [], // Would need access to job logs for this
        suggestedFixes: [...new Set(suggestedFixes)], // Remove duplicates
        affectedFiles: [...new Set(affectedFiles)], // Remove duplicates
        priority,
      };
    } catch (error) {
      throw new Error(`Failed to analyze failure: ${error}`);
    }
  }

  // Check Monitoring
  async getFailingChecks(
    projectSlug: string,
    branch?: string,
    limit: number = 10
  ): Promise<CircleCIJob[]> {
    try {
      // Get recent pipelines
      const pipelines = await this.listPipelines(projectSlug, branch);
      const failingJobs: CircleCIJob[] = [];

      // Check each pipeline for failing jobs
      for (const pipeline of pipelines.items.slice(0, limit)) {
        const workflows = await this.listWorkflows(pipeline.id);

        for (const workflow of workflows.items) {
          if (workflow.status === 'failed' || workflow.status === 'failing') {
            const jobs = await this.listJobs(workflow.id);
            const failed = jobs.items.filter(job =>
              job.status === 'failed' || job.status === 'timedout' || job.status === 'infrastructure_fail'
            );
            failingJobs.push(...failed);
          }
        }
      }

      return failingJobs;
    } catch (error) {
      throw new Error(`Failed to get failing checks: ${error}`);
    }
  }

  // Auto-fix Integration (for CodeGen)
  async generateFix(analysis: BuildFailureAnalysis): Promise<{
    fixDescription: string;
    codeChanges: Array<{
      file: string;
      changes: string;
      reason: string;
    }>;
    configChanges: Array<{
      file: string;
      changes: string;
      reason: string;
    }>;
  }> {
    const fixes = {
      fixDescription: '',
      codeChanges: [] as Array<{ file: string; changes: string; reason: string }>,
      configChanges: [] as Array<{ file: string; changes: string; reason: string }>,
    };

    switch (analysis.failureType) {
      case 'test_failure':
        fixes.fixDescription = 'Fix failing tests based on error analysis';

        // Generate test fixes based on error messages
        analysis.errorMessages.forEach(error => {
          if (error.includes('AssertionError') || error.includes('expected')) {
            analysis.affectedFiles.forEach(file => {
              if (file) {
                fixes.codeChanges.push({
                  file,
                  changes: 'Review test assertions and expected values',
                  reason: 'Test assertion mismatch detected',
                });
              }
            });
          }
        });
        break;

      case 'build_error':
        fixes.fixDescription = 'Fix build configuration and dependency issues';

        fixes.configChanges.push({
          file: '.circleci/config.yml',
          changes: 'Review CircleCI configuration for syntax errors and resource allocation',
          reason: 'Build failure indicates potential configuration issues',
        });

        fixes.configChanges.push({
          file: 'package.json',
          changes: 'Verify dependency versions and compatibility',
          reason: 'Build errors often stem from dependency conflicts',
        });
        break;

      case 'timeout':
        fixes.fixDescription = 'Optimize build performance and increase timeout limits';

        fixes.configChanges.push({
          file: '.circleci/config.yml',
          changes: 'Increase job timeout and optimize parallelization',
          reason: 'Job timed out - need performance optimization',
        });
        break;

      case 'infrastructure_failure':
        fixes.fixDescription = 'Infrastructure failure - retry or escalate';
        // No code changes needed for infrastructure failures
        break;

      default:
        fixes.fixDescription = 'Generic failure analysis - requires manual investigation';
    }

    return fixes;
  }

  // Integration with GitHub/Git workflows
  async monitorPRChecks(
    projectSlug: string,
    prBranch: string,
    callback: (failingJobs: CircleCIJob[]) => Promise<void>
  ): Promise<void> {
    try {
      const failingJobs = await this.getFailingChecks(projectSlug, prBranch, 5);

      if (failingJobs.length > 0) {
        await callback(failingJobs);
      }
    } catch (error) {
      throw new Error(`Failed to monitor PR checks: ${error}`);
    }
  }
}

// Factory function to create CircleCI integration instance
export function createCircleCIIntegration(
  token?: string,
  vcsType?: 'github' | 'bitbucket',
  organization?: string
): CircleCIIntegration {
  const circleCIToken = token || process.env.CIRCLECI_TOKEN;

  if (!circleCIToken) {
    throw new Error('CircleCI token is required. Set CIRCLECI_TOKEN environment variable or pass token parameter.');
  }

  return new CircleCIIntegration({
    token: circleCIToken,
    vcsType: vcsType || 'github',
    organization,
  });
}

export default CircleCIIntegration;