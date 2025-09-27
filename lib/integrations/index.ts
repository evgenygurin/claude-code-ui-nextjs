/**
 * CodeGen Integrations Hub with AI Orchestration
 *
 * This module provides unified access to all CodeGen integrations as specified
 * in the official CodeGen documentation at https://docs.codegen.com/integrations/integrations
 * with advanced AI-powered orchestration for automated development workflows.
 *
 * All integrations are implemented exactly according to the CodeGen specifications
 * with proper authentication, permissions, and capabilities, enhanced with
 * intelligent agent coordination and event-driven automation.
 */

// Import all integration classes
import { GitHubIntegration, createGitHubIntegration } from './github';
import { SentryIntegration, createSentryIntegration } from './sentry';
import { LinearIntegration, createLinearIntegration } from './linear';
import { CircleCIIntegration, createCircleCIIntegration } from './circleci';
import { FigmaIntegration, createFigmaIntegration } from './figma';
import { CodeGenClient, createCodeGenClient } from './codegen';
import { CodeGenOrchestrator, createCodeGenOrchestrator, type OrchestratorConfig, type OrchestratorEvent } from './orchestrator';

// Re-export all integrations
export {
  GitHubIntegration,
  createGitHubIntegration,
  SentryIntegration,
  createSentryIntegration,
  LinearIntegration,
  createLinearIntegration,
  CircleCIIntegration,
  createCircleCIIntegration,
  FigmaIntegration,
  createFigmaIntegration,
  CodeGenClient,
  createCodeGenClient,
  CodeGenOrchestrator,
  createCodeGenOrchestrator,
  type OrchestratorConfig,
  type OrchestratorEvent,
};

// Integration status based on CodeGen documentation
export interface IntegrationStatus {
  name: string;
  category: string;
  status: 'available' | 'beta' | 'enterprise';
  description: string;
  permissions: string[];
  capabilities: string[];
  requiresFeatureFlag?: boolean;
  requiresAdmin?: boolean;
}

export const INTEGRATION_CATALOG: Record<string, IntegrationStatus> = {
  github: {
    name: 'GitHub',
    category: 'Core Development',
    status: 'available',
    description: 'Access repositories, create PRs, conduct code reviews, and manage the full development workflow',
    permissions: [
      'Read/write repository contents',
      'Create and manage pull requests',
      'Write status checks',
      'Read/write issues and comments',
      'Manage GitHub Actions workflows',
      'Access organization projects and members',
    ],
    capabilities: [
      'Create and manage pull requests',
      'Conduct automated code reviews',
      'Run checks and CI/CD workflows',
      'Synchronize repository changes',
    ],
  },
  sentry: {
    name: 'Sentry',
    category: 'DevOps & Monitoring',
    status: 'beta',
    description: 'Analyze errors with automated root cause analysis and intelligent insights',
    permissions: [
      'Read organization information',
      'Read/Write project and team details',
      'Read/Write event information',
    ],
    capabilities: [
      'Automated root cause analysis of error patterns and stack traces',
      'Deep error investigation with context and user impact',
      'Error prioritization',
      'Performance monitoring',
      'Release tracking',
      'Team coordination for issue resolution',
    ],
    requiresFeatureFlag: true,
    requiresAdmin: true,
  },
  linear: {
    name: 'Linear',
    category: 'Project Management',
    status: 'available',
    description: 'Track progress, create issues, and orchestrate teams of humans and agents',
    permissions: [
      'Create issues',
      'Create comments',
      'Read workspace data',
      'Update issues and projects',
      'Assign issues to teams',
    ],
    capabilities: [
      'Automatically create and update issues',
      'Track development progress',
      'Link code changes to tickets',
      'Sync status updates',
      'Support for multi-agent systems',
      'Agents can create sub-issues',
      'Child agents can be spawned for complex tasks',
    ],
  },
  circleci: {
    name: 'CircleCI',
    category: 'DevOps & Monitoring',
    status: 'enterprise',
    description: 'Monitor CI checks, analyze build logs, and automatically fix failing tests and builds',
    permissions: [
      'Read project information and settings',
      'View build history and logs',
      'Read test results and artifacts',
      'Access check status and details',
    ],
    capabilities: [
      'Monitor and automatically fix failing CI checks',
      'View broken checks and failures',
      'Analyze build logs and error messages',
      'Automatically fix failing PRs when checks fail',
      'Operates in read-only mode for CircleCI',
      'Automatically wakes up when Codegen-created PRs have check failures',
      'Investigates logs, identifies issues, and generates fixes',
      'Pushes updates to the same PR branch',
    ],
  },
  figma: {
    name: 'Figma',
    category: 'Design & Documentation',
    status: 'available',
    description: 'Convert designs to code, extract assets, and maintain design systems',
    permissions: [
      'Read user profile information',
      'Access file contents and nodes',
      'Read file metadata and version history',
      'View file comments',
      'Access design variables and tokens',
      'Read published components and styles',
      'Access team library content',
    ],
    capabilities: [
      'Access design specifications',
      'Extract design assets',
      'Convert designs to code',
      'Sync design changes',
      'Analyze design files',
      'Generate frontend code',
      'Pull icons and images',
      'Maintain design system consistency',
    ],
    requiresFeatureFlag: true,
    requiresAdmin: true,
  },
  codegen: {
    name: 'CodeGen',
    category: 'AI Orchestration',
    status: 'enterprise',
    description: 'AI-powered agent orchestration system for automated development workflows',
    permissions: [
      'Create and manage AI agents',
      'Execute automated code generation',
      'Coordinate multi-agent workflows',
      'Access organization repositories',
      'Integrate with all other services',
    ],
    capabilities: [
      'Intelligent agent creation and management',
      'Event-driven workflow orchestration',
      'Multi-agent coordination patterns',
      'Context-aware code generation',
      'Cross-integration automation',
      'Real-time progress monitoring',
      'Cost optimization and analytics',
    ],
    requiresFeatureFlag: false,
    requiresAdmin: true,
  },
};

// Integration configuration interface
export interface IntegrationConfig {
  github?: {
    token?: string;
    owner?: string;
    repo?: string;
  };
  sentry?: {
    authToken?: string;
    organization?: string;
    project?: string;
    region?: 'us' | 'eu';
  };
  linear?: {
    apiKey?: string;
    teamId?: string;
    workspaceId?: string;
  };
  circleci?: {
    token?: string;
    vcsType?: 'github' | 'bitbucket';
    organization?: string;
  };
  figma?: {
    accessToken?: string;
    teamId?: string;
  };
  codegen?: {
    apiKey?: string;
    organizationId?: string;
  };
}

// Unified integration manager with AI orchestration
export class CodeGenIntegrations {
  private github?: GitHubIntegration;
  private sentry?: SentryIntegration;
  private linear?: LinearIntegration;
  private circleci?: CircleCIIntegration;
  private figma?: FigmaIntegration;
  private codegen?: CodeGenClient;
  private orchestrator?: CodeGenOrchestrator;

  constructor(config: IntegrationConfig = {}) {
    this.initializeIntegrations(config);
  }

  private initializeIntegrations(config: IntegrationConfig) {
    // Initialize GitHub integration
    try {
      this.github = createGitHubIntegration(
        config.github?.token,
        config.github?.owner,
        config.github?.repo
      );
    } catch (error) {
      console.warn('GitHub integration not available:', error);
    }

    // Initialize Sentry integration
    try {
      this.sentry = createSentryIntegration(
        config.sentry?.authToken,
        config.sentry?.organization,
        config.sentry?.project,
        config.sentry?.region
      );
    } catch (error) {
      console.warn('Sentry integration not available:', error);
    }

    // Initialize Linear integration
    try {
      this.linear = createLinearIntegration(
        config.linear?.apiKey,
        config.linear?.teamId,
        config.linear?.workspaceId
      );
    } catch (error) {
      console.warn('Linear integration not available:', error);
    }

    // Initialize CircleCI integration
    try {
      this.circleci = createCircleCIIntegration(
        config.circleci?.token,
        config.circleci?.vcsType,
        config.circleci?.organization
      );
    } catch (error) {
      console.warn('CircleCI integration not available:', error);
    }

    // Initialize Figma integration
    try {
      this.figma = createFigmaIntegration(
        config.figma?.accessToken,
        config.figma?.teamId
      );
    } catch (error) {
      console.warn('Figma integration not available:', error);
    }

    // Initialize CodeGen integration
    try {
      this.codegen = createCodeGenClient({
        apiKey: config.codegen?.apiKey,
        organizationId: config.codegen?.organizationId,
      });

      // Initialize orchestrator if CodeGen is available
      if (this.codegen) {
        const orchestratorConfig: OrchestratorConfig = {
          codegen: {
            apiKey: config.codegen?.apiKey || '',
            organizationId: config.codegen?.organizationId || '',
          },
          integrations: {
            github: config.github && config.github.token && config.github.owner && config.github.repo ? config.github : undefined,
            sentry: config.sentry && config.sentry.authToken && config.sentry.organization && config.sentry.project ? config.sentry : undefined,
            linear: config.linear && config.linear.apiKey && config.linear.teamId ? config.linear : undefined,
            circleci: config.circleci && config.circleci.token && config.circleci.vcsType && config.circleci.organization ? config.circleci : undefined,
            figma: config.figma && config.figma.accessToken ? config.figma : undefined,
          },
          ai: {
            enabled: true,
            modelPreferences: {
              codeGeneration: 'gpt-4',
              codeReview: 'gpt-4',
              debugging: 'gpt-4',
              designToCode: 'gpt-4',
            },
          },
        };

        this.orchestrator = createCodeGenOrchestrator(orchestratorConfig);
      }
    } catch (error) {
      console.warn('CodeGen integration not available:', error);
    }
  }

  // Getters for individual integrations
  getGitHub(): GitHubIntegration | undefined {
    return this.github;
  }

  getSentry(): SentryIntegration | undefined {
    return this.sentry;
  }

  getLinear(): LinearIntegration | undefined {
    return this.linear;
  }

  getCircleCI(): CircleCIIntegration | undefined {
    return this.circleci;
  }

  getFigma(): FigmaIntegration | undefined {
    return this.figma;
  }

  getCodeGen(): CodeGenClient | undefined {
    return this.codegen;
  }

  getOrchestrator(): CodeGenOrchestrator | undefined {
    return this.orchestrator;
  }

  // Check which integrations are available
  getAvailableIntegrations(): string[] {
    const available: string[] = [];
    if (this.github) available.push('github');
    if (this.sentry) available.push('sentry');
    if (this.linear) available.push('linear');
    if (this.circleci) available.push('circleci');
    if (this.figma) available.push('figma');
    if (this.codegen) available.push('codegen');
    return available;
  }

  // Get integration status
  getIntegrationStatus(): Record<string, { available: boolean; status: IntegrationStatus }> {
    return {
      github: {
        available: !!this.github,
        status: INTEGRATION_CATALOG.github,
      },
      sentry: {
        available: !!this.sentry,
        status: INTEGRATION_CATALOG.sentry,
      },
      linear: {
        available: !!this.linear,
        status: INTEGRATION_CATALOG.linear,
      },
      circleci: {
        available: !!this.circleci,
        status: INTEGRATION_CATALOG.circleci,
      },
      figma: {
        available: !!this.figma,
        status: INTEGRATION_CATALOG.figma,
      },
      codegen: {
        available: !!this.codegen,
        status: INTEGRATION_CATALOG.codegen,
      },
    };
  }

  // Cross-integration workflows
  async createIssueFromError(sentryIssueId: string): Promise<void> {
    if (!this.sentry || !this.linear) {
      throw new Error('Both Sentry and Linear integrations are required');
    }

    try {
      // Analyze the Sentry error
      const errorAnalysis = await this.sentry.analyzeError(sentryIssueId);

      // Create a Linear issue
      const linearIssue = await this.linear.createIssue(
        `🚨 Production Error: ${errorAnalysis.issue.title}`,
        `**Error Analysis from Sentry**\n\n` +
        `**Priority**: ${errorAnalysis.priority.toUpperCase()}\n` +
        `**Frequency**: ${errorAnalysis.frequency} occurrences\n` +
        `**User Impact**: ${errorAnalysis.userImpact} users affected\n\n` +
        `**Root Cause**: ${errorAnalysis.rootCause}\n\n` +
        `**Recommendations**:\n${errorAnalysis.recommendations.map(rec => `- ${rec}`).join('\n')}\n\n` +
        `**Sentry Issue**: ${errorAnalysis.issue.permalink}`,
        undefined,
        {
          priority: errorAnalysis.priority === 'critical' ? 1 : errorAnalysis.priority === 'high' ? 2 : 3,
        }
      );

      console.log(`Created Linear issue ${linearIssue.identifier} for Sentry error ${sentryIssueId}`);
    } catch (error) {
      throw new Error(`Failed to create issue from error: ${error}`);
    }
  }

  async linkPRToIssue(prNumber: number, issueId: string, repoOwner?: string, repoName?: string): Promise<void> {
    if (!this.github || !this.linear) {
      throw new Error('Both GitHub and Linear integrations are required');
    }

    try {
      // Get PR details
      const pr = await this.github.getPullRequest(prNumber, repoOwner, repoName);

      // Link the code changes to the Linear issue
      await this.linear.linkCodeChanges(issueId, [{
        type: 'pr',
        url: pr.url,
        description: pr.title,
      }]);

      // Add comment to PR linking to Linear issue
      const linearIssue = await this.linear.getIssue(issueId);
      await this.github.addComment(
        prNumber,
        `🔗 **Linked to Linear Issue**: [${linearIssue.identifier}](${linearIssue.url})\n\n${linearIssue.title}`,
        repoOwner,
        repoName
      );

      console.log(`Linked PR #${prNumber} to Linear issue ${linearIssue.identifier}`);
    } catch (error) {
      throw new Error(`Failed to link PR to issue: ${error}`);
    }
  }

  async monitorCIAndCreateIssues(projectSlug: string, branch?: string): Promise<void> {
    if (!this.circleci || !this.linear) {
      throw new Error('Both CircleCI and Linear integrations are required');
    }

    try {
      // Get failing checks
      const failingJobs = await this.circleci.getFailingChecks(projectSlug, branch);

      for (const job of failingJobs) {
        // Analyze the failure
        const analysis = await this.circleci.analyzeFailure(job.job_number, projectSlug);

        // Create Linear issue for the failure
        const issue = await this.linear.createIssue(
          `🔧 CI Failure: ${job.name}`,
          `**Build Failure Analysis**\n\n` +
          `**Job**: ${job.name}\n` +
          `**Status**: ${job.status}\n` +
          `**Priority**: ${analysis.priority.toUpperCase()}\n` +
          `**Failure Type**: ${analysis.failureType}\n\n` +
          `**Error Messages**:\n${analysis.errorMessages.map(msg => `- ${msg}`).join('\n')}\n\n` +
          `**Suggested Fixes**:\n${analysis.suggestedFixes.map(fix => `- ${fix}`).join('\n')}\n\n` +
          `**Affected Files**:\n${analysis.affectedFiles.map(file => `- ${file}`).join('\n')}\n\n` +
          `**Job URL**: ${job.web_url}`,
          undefined,
          {
            priority: analysis.priority === 'critical' ? 1 : analysis.priority === 'high' ? 2 : 3,
          }
        );

        console.log(`Created Linear issue ${issue.identifier} for CI failure in job ${job.name}`);
      }
    } catch (error) {
      throw new Error(`Failed to monitor CI and create issues: ${error}`);
    }
  }

  async generateCodeFromDesign(figmaFileKey: string, nodeId: string, framework: 'react' | 'vue' | 'angular' | 'svelte' | 'html' = 'react'): Promise<void> {
    if (!this.figma || !this.github) {
      throw new Error('Both Figma and GitHub integrations are required');
    }

    try {
      // Convert Figma design to code
      const conversion = await this.figma.convertToCode(figmaFileKey, nodeId, framework);

      // Create a new branch for the generated code
      const branchName = `feature/figma-${conversion.componentName.toLowerCase()}-${Date.now()}`;

      // Create PR with the generated code (this would require actual file creation)
      console.log(`Generated ${framework} code for ${conversion.componentName} on branch ${branchName}:`);
      console.log(conversion.code);
      console.log('\nStyles:');
      console.log(conversion.styles);
      console.log('\nAssets:', conversion.assets);
      console.log('\nDesign Tokens:', conversion.designTokens);

      // Note: In a real implementation, you would:
      // 1. Create the new branch (branchName)
      // 2. Commit the generated files
      // 3. Create a PR
      // 4. Link to the Figma design in the PR description
    } catch (error) {
      throw new Error(`Failed to generate code from design: ${error}`);
    }
  }
}

// Factory function to create CodeGen integrations manager
export function createCodeGenIntegrations(config?: IntegrationConfig): CodeGenIntegrations {
  return new CodeGenIntegrations(config);
}

// Default export
export default CodeGenIntegrations;