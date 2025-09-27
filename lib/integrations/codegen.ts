/**
 * CodeGen API Integration - Advanced Agent Management System
 *
 * Ultra-sophisticated implementation following CodeGen API documentation
 * with enterprise-level patterns for agent orchestration, multi-agent
 * coordination, and event-driven automation.
 *
 * @see https://docs.codegen.com/api-reference/overview
 */

// Core Types and Interfaces
interface CodeGenConfig {
  apiKey: string;
  organizationId: string;
  baseUrl?: string;
  rateLimitStrategy?: RateLimitStrategy;
}

interface AgentRunRequest {
  prompt: string;
  repoId: number;
  files?: string[];
  context?: AgentContext;
  priority?: AgentPriority;
  parentAgentId?: string;
  tags?: string[];
  webhookUrl?: string;
}

interface AgentContext {
  issueId?: string;
  pullRequestId?: number;
  errorId?: string;
  designId?: string;
  buildId?: string;
  integrationData?: Record<string, any>;
}

interface AgentRun {
  id: string;
  status: AgentStatus;
  prompt: string;
  repoId: number;
  createdAt: string;
  updatedAt: string;
  priority?: AgentPriority;
  result?: AgentResult;
  trace?: AgentTrace[];
  cost?: number;
  duration?: number;
  parentAgentId?: string;
  childAgentIds?: string[];
}

interface AgentResult {
  success: boolean;
  filesChanged: string[];
  pullRequestUrl?: string;
  summary: string;
  metrics: {
    linesAdded: number;
    linesRemoved: number;
    filesModified: number;
    testsCovered: number;
  };
  recommendations?: string[];
}

interface AgentTrace {
  timestamp: string;
  action: string;
  details: any;
  cost: number;
}

type AgentStatus = 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
type AgentPriority = 'low' | 'normal' | 'high' | 'critical';
type RateLimitStrategy = 'aggressive' | 'balanced' | 'conservative';

// Advanced Agent Management Classes
export class CodeGenClient {
  private config: CodeGenConfig;
  private rateLimiter: RateLimiter;
  private agentQueue: AgentQueue;
  private eventEmitter: EventEmitter;

  constructor(config: CodeGenConfig) {
    this.config = {
      baseUrl: 'https://api.codegen.com/v1',
      rateLimitStrategy: 'balanced',
      ...config
    };

    this.rateLimiter = new RateLimiter(config.rateLimitStrategy || 'balanced');
    this.agentQueue = new AgentQueue();
    this.eventEmitter = new EventEmitter();
  }

  // Core Agent Operations
  async createAgent(request: AgentRunRequest): Promise<AgentRun> {
    await this.rateLimiter.waitForSlot('agent_creation');

    try {
      const response = await this.makeRequest('POST', `/organizations/${this.config.organizationId}/agent/run`, {
        ...request,
        metadata: {
          source: 'claude-code-ui',
          timestamp: new Date().toISOString(),
          ...request.context
        }
      });

      const agentRun = response.data as AgentRun;
      this.agentQueue.add(agentRun);
      this.eventEmitter.emit('agent:created', agentRun);

      return agentRun;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.eventEmitter.emit('agent:error', { request, error: errorMessage });
      throw error;
    }
  }

  async getAgentRun(agentId: string): Promise<AgentRun> {
    await this.rateLimiter.waitForSlot('standard');

    const response = await this.makeRequest('GET', `/organizations/${this.config.organizationId}/agent/run/${agentId}`);
    const agentRun = response.data as AgentRun;

    this.eventEmitter.emit('agent:status_checked', agentRun);
    return agentRun;
  }

  async listAgentRuns(filters?: {
    status?: AgentStatus;
    repoId?: number;
    parentAgentId?: string;
    tags?: string[];
    limit?: number;
  }): Promise<AgentRun[]> {
    await this.rateLimiter.waitForSlot('standard');

    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, Array.isArray(value) ? value.join(',') : String(value));
        }
      });
    }

    const response = await this.makeRequest('GET', `/organizations/${this.config.organizationId}/agent/runs?${queryParams}`);
    return response.data.agents as AgentRun[];
  }

  async pauseAgent(agentId: string): Promise<void> {
    await this.rateLimiter.waitForSlot('standard');
    await this.makeRequest('POST', `/organizations/${this.config.organizationId}/agent/run/${agentId}/pause`);
    this.eventEmitter.emit('agent:paused', { agentId });
  }

  async resumeAgent(agentId: string): Promise<void> {
    await this.rateLimiter.waitForSlot('standard');
    await this.makeRequest('POST', `/organizations/${this.config.organizationId}/agent/run/${agentId}/resume`);
    this.eventEmitter.emit('agent:resumed', { agentId });
  }

  async cancelAgent(agentId: string): Promise<void> {
    await this.rateLimiter.waitForSlot('standard');
    await this.makeRequest('DELETE', `/organizations/${this.config.organizationId}/agent/run/${agentId}`);
    this.agentQueue.remove(agentId);
    this.eventEmitter.emit('agent:cancelled', { agentId });
  }

  // Advanced Multi-Agent Operations
  async createMultiAgentWorkflow(workflow: MultiAgentWorkflow): Promise<WorkflowExecution> {
    const execution: WorkflowExecution = {
      id: `workflow_${Date.now()}`,
      status: 'initializing',
      agents: [],
      startedAt: new Date().toISOString(),
      workflow
    };

    try {
      // Create parent agent if specified
      if (workflow.parentAgent) {
        const parentAgent = await this.createAgent({
          ...workflow.parentAgent,
          tags: [...(workflow.parentAgent.tags || []), 'parent-agent', execution.id]
        });
        execution.agents.push(parentAgent);
      }

      // Create parallel agents
      const parallelAgents = await Promise.all(
        workflow.parallelAgents.map(agentSpec =>
          this.createAgent({
            ...agentSpec,
            parentAgentId: execution.agents[0]?.id,
            tags: [...(agentSpec.tags || []), 'parallel-agent', execution.id]
          })
        )
      );
      execution.agents.push(...parallelAgents);

      execution.status = 'running';
      this.eventEmitter.emit('workflow:started', execution);

      return execution;
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);
      this.eventEmitter.emit('workflow:failed', execution);
      throw error;
    }
  }

  // Context-Aware Agent Creation
  async createContextualAgent(trigger: AgentTrigger): Promise<AgentRun> {
    const context = await this.buildAgentContext(trigger);
    const prompt = await this.generateContextualPrompt(trigger, context);

    return this.createAgent({
      prompt,
      repoId: trigger.repoId,
      context: context.integrationData,
      priority: this.calculatePriority(trigger),
      tags: this.generateTags(trigger)
    });
  }

  // Repository Operations
  async getRepositories(): Promise<Repository[]> {
    await this.rateLimiter.waitForSlot('standard');
    const response = await this.makeRequest('GET', `/organizations/${this.config.organizationId}/repositories`);
    return response.data.repositories;
  }

  async getRepository(repoId: number): Promise<Repository> {
    await this.rateLimiter.waitForSlot('standard');
    const response = await this.makeRequest('GET', `/organizations/${this.config.organizationId}/repositories/${repoId}`);
    return response.data;
  }

  // Analytics and Monitoring
  async getAgentAnalytics(timeRange: { start: string; end: string }): Promise<AgentAnalytics> {
    await this.rateLimiter.waitForSlot('standard');
    const response = await this.makeRequest('GET', `/organizations/${this.config.organizationId}/analytics/agents`, {
      params: timeRange
    });
    return response.data;
  }

  async getOrganizationUsage(): Promise<OrganizationUsage> {
    await this.rateLimiter.waitForSlot('standard');
    const response = await this.makeRequest('GET', `/organizations/${this.config.organizationId}/usage`);
    return response.data;
  }

  // Event Handling
  onAgentEvent(event: string, handler: (data: any) => void): void {
    this.eventEmitter.on(event, handler);
  }

  offAgentEvent(event: string, handler: (data: any) => void): void {
    this.eventEmitter.off(event, handler);
  }

  // Private Helper Methods
  private async makeRequest(method: string, path: string, data?: any): Promise<any> {
    const url = `${this.config.baseUrl}${path}`;
    const headers = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'claude-code-ui/1.0'
    };

    const config = {
      method,
      headers,
      ...(data && { body: JSON.stringify(data) })
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`CodeGen API Error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  private async buildAgentContext(trigger: AgentTrigger): Promise<AgentContext> {
    const context: AgentContext = {
      integrationData: {}
    };

    // Ensure integrationData is initialized
    if (!context.integrationData) {
      context.integrationData = {};
    }

    // Add specific context based on trigger type
    switch (trigger.type) {
      case 'sentry_error':
        context.errorId = trigger.errorId;
        context.integrationData.sentry = trigger.sentryData;
        break;
      case 'circleci_failure':
        context.buildId = trigger.buildId;
        context.integrationData.circleci = trigger.buildData;
        break;
      case 'linear_issue':
        context.issueId = trigger.issueId;
        context.integrationData.linear = trigger.issueData;
        break;
      case 'github_pr':
        context.pullRequestId = trigger.prNumber;
        context.integrationData.github = trigger.prData;
        break;
      case 'figma_design':
        context.designId = trigger.designId;
        context.integrationData.figma = trigger.designData;
        break;
    }

    return context;
  }

  private async generateContextualPrompt(trigger: AgentTrigger, context: AgentContext): Promise<string> {
    const integrationData = context.integrationData || {};

    const templates = {
      sentry_error: `Analyze and fix the production error with ID ${context.errorId}.
        Error details: ${JSON.stringify(integrationData.sentry || {})}.
        Provide a comprehensive fix with proper error handling and tests.`,

      circleci_failure: `Investigate and fix the CI/CD build failure for build ${context.buildId}.
        Build logs: ${JSON.stringify(integrationData.circleci || {})}.
        Ensure the fix maintains build stability and includes proper testing.`,

      linear_issue: `Implement the feature or fix described in Linear issue ${context.issueId}.
        Requirements: ${JSON.stringify(integrationData.linear || {})}.
        Follow the existing code patterns and include comprehensive tests.`,

      github_pr: `Review and improve the pull request #${context.pullRequestId}.
        PR details: ${JSON.stringify(integrationData.github || {})}.
        Provide code quality improvements and ensure adherence to best practices.`,

      figma_design: `Implement the UI component from Figma design ${context.designId}.
        Design specs: ${JSON.stringify(integrationData.figma || {})}.
        Create a responsive, accessible component with proper TypeScript types.`
    };

    return templates[trigger.type] || `Handle the ${trigger.type} event with appropriate code changes.`;
  }

  private calculatePriority(trigger: AgentTrigger): AgentPriority {
    const priorityMap = {
      sentry_error: 'high',
      circleci_failure: 'high',
      linear_issue: 'normal',
      github_pr: 'normal',
      figma_design: 'low'
    } as const;

    return priorityMap[trigger.type] || 'normal';
  }

  private generateTags(trigger: AgentTrigger): string[] {
    return [
      trigger.type,
      `repo:${trigger.repoId}`,
      `source:claude-code-ui`,
      `timestamp:${Date.now()}`
    ];
  }
}

// Advanced Supporting Classes
class RateLimiter {
  private buckets: Map<string, TokenBucket>;

  constructor(strategy: RateLimitStrategy) {
    this.buckets = new Map();

    // Initialize rate limit buckets based on CodeGen API limits
    // Strategy could be used to adjust bucket sizes in the future
    const multiplier = strategy === 'aggressive' ? 1.5 : strategy === 'conservative' ? 0.5 : 1;

    this.buckets.set('standard', new TokenBucket(Math.floor(60 * multiplier), 30000)); // 60 requests per 30 seconds
    this.buckets.set('agent_creation', new TokenBucket(Math.floor(10 * multiplier), 60000)); // 10 requests per minute
    this.buckets.set('setup_commands', new TokenBucket(Math.floor(5 * multiplier), 60000)); // 5 requests per minute
    this.buckets.set('log_analysis', new TokenBucket(Math.floor(5 * multiplier), 60000)); // 5 requests per minute
  }

  async waitForSlot(bucketType: string): Promise<void> {
    const bucket = this.buckets.get(bucketType);
    if (!bucket) throw new Error(`Unknown rate limit bucket: ${bucketType}`);

    await bucket.consume();
  }
}

class TokenBucket {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number;
  private lastRefill: number;

  constructor(maxTokens: number, refillIntervalMs: number) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRate = maxTokens / refillIntervalMs;
    this.lastRefill = Date.now();
  }

  async consume(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens--;
      return;
    }

    // Wait for token to become available
    const waitTime = (1 - this.tokens) / this.refillRate;
    await new Promise(resolve => setTimeout(resolve, waitTime));
    await this.consume();
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

class AgentQueue {
  private agents: Map<string, AgentRun>;
  private priorityQueue: PriorityQueue<AgentRun>;

  constructor() {
    this.agents = new Map();
    this.priorityQueue = new PriorityQueue((a, b) => {
      const priorityValues = { critical: 4, high: 3, normal: 2, low: 1 };
      return priorityValues[b.priority || 'normal'] - priorityValues[a.priority || 'normal'];
    });
  }

  add(agent: AgentRun): void {
    this.agents.set(agent.id, agent);
    this.priorityQueue.enqueue(agent);
  }

  remove(agentId: string): void {
    this.agents.delete(agentId);
    // Note: PriorityQueue removal would require rebuilding, which is expensive
    // In practice, we'd mark as cancelled and filter during dequeue
  }

  getNext(): AgentRun | null {
    return this.priorityQueue.dequeue() || null;
  }

  get size(): number {
    return this.agents.size;
  }
}

class EventEmitter {
  private events: Map<string, Function[]>;

  constructor() {
    this.events = new Map();
  }

  on(event: string, handler: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(handler);
  }

  off(event: string, handler: Function): void {
    const handlers = this.events.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event: string, data: any): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
}

class PriorityQueue<T> {
  private items: T[];
  private compare: (a: T, b: T) => number;

  constructor(compareFunction: (a: T, b: T) => number) {
    this.items = [];
    this.compare = compareFunction;
  }

  enqueue(item: T): void {
    this.items.push(item);
    this.items.sort(this.compare);
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  get size(): number {
    return this.items.length;
  }
}

// Supporting Types
interface MultiAgentWorkflow {
  id: string;
  name: string;
  parentAgent?: AgentRunRequest;
  parallelAgents: AgentRunRequest[];
  sequentialAgents?: AgentRunRequest[];
  onComplete?: (results: AgentRun[]) => void;
  onError?: (error: Error) => void;
}

interface WorkflowExecution {
  id: string;
  status: 'initializing' | 'running' | 'completed' | 'failed' | 'cancelled';
  agents: AgentRun[];
  startedAt: string;
  completedAt?: string;
  workflow: MultiAgentWorkflow;
  error?: string;
}

interface AgentTrigger {
  type: 'sentry_error' | 'circleci_failure' | 'linear_issue' | 'github_pr' | 'figma_design';
  repoId: number;
  context?: AgentContext;
  errorId?: string;
  buildId?: string;
  issueId?: string;
  prNumber?: number;
  designId?: string;
  sentryData?: any;
  buildData?: any;
  issueData?: any;
  prData?: any;
  designData?: any;
}

interface Repository {
  id: number;
  name: string;
  fullName: string;
  url: string;
  defaultBranch: string;
  language: string;
  stars: number;
  isPrivate: boolean;
}

interface AgentAnalytics {
  totalRuns: number;
  successRate: number;
  averageDuration: number;
  costSummary: {
    total: number;
    byStatus: Record<AgentStatus, number>;
    byRepository: Record<string, number>;
  };
  trends: {
    runsPerDay: Array<{ date: string; count: number }>;
    successRatePerDay: Array<{ date: string; rate: number }>;
  };
}

interface OrganizationUsage {
  currentPeriod: {
    agentRuns: number;
    totalCost: number;
    planLimit: number;
  };
  quotaRemaining: {
    agentRuns: number;
    cost: number;
  };
  billing: {
    nextBillingDate: string;
    currentPlan: string;
  };
}

// Factory Function
export function createCodeGenClient(config?: Partial<CodeGenConfig>): CodeGenClient {
  const apiKey = config?.apiKey || process.env.CODEGEN_API_KEY;
  const organizationId = config?.organizationId || process.env.CODEGEN_ORG_ID;

  if (!apiKey) {
    throw new Error('CodeGen API key is required. Set CODEGEN_API_KEY environment variable or pass apiKey in config.');
  }

  if (!organizationId) {
    throw new Error('CodeGen organization ID is required. Set CODEGEN_ORG_ID environment variable or pass organizationId in config.');
  }

  return new CodeGenClient({
    apiKey,
    organizationId,
    ...config
  });
}

export type {
  CodeGenConfig,
  AgentRunRequest,
  AgentRun,
  AgentResult,
  AgentTrace,
  AgentStatus,
  AgentPriority,
  AgentContext,
  AgentTrigger,
  MultiAgentWorkflow,
  WorkflowExecution,
  Repository,
  AgentAnalytics,
  OrganizationUsage
};