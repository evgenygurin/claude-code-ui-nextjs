/**
 * Linear Integration for CodeGen
 *
 * Capabilities according to CodeGen docs:
 * - Automatically create and update issues
 * - Track development progress
 * - Link code changes to tickets
 * - Sync status updates
 * - Support for multi-agent systems
 * - Orchestrate teams of humans and agents working together
 *
 * Permissions Needed:
 * - Create issues
 * - Create comments
 * - Read workspace data
 * - Update issues and projects
 * - Assign issues to teams
 *
 * Multi-Agent System Highlights:
 * - Agents can create sub-issues
 * - Child agents can be spawned for complex tasks
 * - Requires Team Plan
 * - Parent agent provides scaffolding and context for child agents
 */

interface LinearIntegrationConfig {
  apiKey: string;
  teamId?: string;
  workspaceId?: string;
}

interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  priority: number;
  estimate?: number;
  state: {
    id: string;
    name: string;
    type: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  creator: {
    id: string;
    name: string;
    email: string;
  };
  team: {
    id: string;
    name: string;
    key: string;
  };
  project?: {
    id: string;
    name: string;
  };
  cycle?: {
    id: string;
    name: string;
    number: number;
  };
  labels: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  url: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  dueDate?: string;
  subIssues: string[];
  parent?: {
    id: string;
    identifier: string;
    title: string;
  };
}

interface LinearProject {
  id: string;
  name: string;
  description?: string;
  state: 'backlog' | 'started' | 'paused' | 'completed' | 'cancelled';
  progress: number;
  startDate?: string;
  targetDate?: string;
  lead?: {
    id: string;
    name: string;
    email: string;
  };
  teams: Array<{
    id: string;
    name: string;
    key: string;
  }>;
  url: string;
  createdAt: string;
  updatedAt: string;
}

interface LinearTeam {
  id: string;
  name: string;
  key: string;
  description?: string;
  timezone: string;
  issueEstimationType: 'notUsed' | 'exponential' | 'fibonacci' | 'linear' | 'tShirt';
  defaultIssueEstimate?: number;
  cyclesEnabled: boolean;
  cyclesDuration: number;
  cycleDuration: number;
  cycleEnabledStartWeek: number;
  members: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  states: Array<{
    id: string;
    name: string;
    color: string;
    type: 'backlog' | 'unstarted' | 'started' | 'completed' | 'cancelled';
  }>;
  labels: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

interface LinearCycle {
  id: string;
  number: number;
  name: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  completedAt?: string;
  progress: number;
  team: {
    id: string;
    name: string;
    key: string;
  };
  issues: string[];
}

interface LinearComment {
  id: string;
  body: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  issue: {
    id: string;
    identifier: string;
    title: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface MultiAgentTask {
  parentIssueId: string;
  taskDescription: string;
  context: Record<string, any>;
  childAgents: Array<{
    id: string;
    role: string;
    assignedSubtask: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
  }>;
}

export class LinearIntegration {
  private apiKey: string;
  private defaultTeamId?: string;
  private workspaceId?: string;
  private baseUrl = 'https://api.linear.app/graphql';

  constructor(config: LinearIntegrationConfig) {
    this.apiKey = config.apiKey;
    this.defaultTeamId = config.teamId;
    this.workspaceId = config.workspaceId;
  }

  private async request<T>(query: string, variables?: Record<string, any>): Promise<T> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Linear API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`Linear GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
  }

  // Team Management
  async getTeam(teamId?: string): Promise<LinearTeam> {
    const id = teamId || this.defaultTeamId;
    if (!id) {
      throw new Error('Team ID must be provided');
    }

    const query = `
      query GetTeam($id: String!) {
        team(id: $id) {
          id
          name
          key
          description
          timezone
          issueEstimationType
          defaultIssueEstimate
          cyclesEnabled
          cyclesDuration
          cycleDuration
          cycleEnabledStartWeek
          members {
            nodes {
              id
              name
              email
              role
            }
          }
          states {
            nodes {
              id
              name
              color
              type
            }
          }
          labels {
            nodes {
              id
              name
              color
            }
          }
        }
      }
    `;

    try {
      const data = await this.request<{ team: any }>(query, { id });
      return {
        ...data.team,
        members: data.team.members.nodes,
        states: data.team.states.nodes,
        labels: data.team.labels.nodes,
      };
    } catch (error) {
      throw new Error(`Failed to get team: ${error}`);
    }
  }

  async listTeams(): Promise<LinearTeam[]> {
    const query = `
      query ListTeams {
        teams {
          nodes {
            id
            name
            key
            description
            timezone
            issueEstimationType
            defaultIssueEstimate
            cyclesEnabled
            cyclesDuration
            cycleDuration
            cycleEnabledStartWeek
            members {
              nodes {
                id
                name
                email
                role
              }
            }
            states {
              nodes {
                id
                name
                color
                type
              }
            }
            labels {
              nodes {
                id
                name
                color
              }
            }
          }
        }
      }
    `;

    try {
      const data = await this.request<{ teams: { nodes: any[] } }>(query);
      return data.teams.nodes.map(team => ({
        ...team,
        members: team.members.nodes,
        states: team.states.nodes,
        labels: team.labels.nodes,
      }));
    } catch (error) {
      throw new Error(`Failed to list teams: ${error}`);
    }
  }

  // Issue Management
  async createIssue(
    title: string,
    description?: string,
    teamId?: string,
    options?: {
      priority?: number;
      estimate?: number;
      assigneeId?: string;
      stateId?: string;
      projectId?: string;
      cycleId?: string;
      labelIds?: string[];
      dueDate?: string;
      parentId?: string;
    }
  ): Promise<LinearIssue> {
    const team = teamId || this.defaultTeamId;
    if (!team) {
      throw new Error('Team ID must be provided');
    }

    const mutation = `
      mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            identifier
            title
            description
            priority
            estimate
            state {
              id
              name
              type
            }
            assignee {
              id
              name
              email
            }
            creator {
              id
              name
              email
            }
            team {
              id
              name
              key
            }
            project {
              id
              name
            }
            cycle {
              id
              name
              number
            }
            labels {
              nodes {
                id
                name
                color
              }
            }
            url
            createdAt
            updatedAt
            completedAt
            dueDate
            children {
              nodes {
                id
              }
            }
            parent {
              id
              identifier
              title
            }
          }
        }
      }
    `;

    const input: Record<string, any> = {
      title,
      teamId: team,
    };

    if (description) input.description = description;
    if (options?.priority !== undefined) input.priority = options.priority;
    if (options?.estimate !== undefined) input.estimate = options.estimate;
    if (options?.assigneeId) input.assigneeId = options.assigneeId;
    if (options?.stateId) input.stateId = options.stateId;
    if (options?.projectId) input.projectId = options.projectId;
    if (options?.cycleId) input.cycleId = options.cycleId;
    if (options?.labelIds) input.labelIds = options.labelIds;
    if (options?.dueDate) input.dueDate = options.dueDate;
    if (options?.parentId) input.parentId = options.parentId;

    try {
      const data = await this.request<{ issueCreate: { success: boolean; issue: any } }>(
        mutation,
        { input }
      );

      if (!data.issueCreate.success) {
        throw new Error('Failed to create issue');
      }

      const issue = data.issueCreate.issue;
      return {
        ...issue,
        labels: issue.labels.nodes,
        subIssues: issue.children.nodes.map((child: any) => child.id),
      };
    } catch (error) {
      throw new Error(`Failed to create issue: ${error}`);
    }
  }

  async getIssue(issueId: string): Promise<LinearIssue> {
    const query = `
      query GetIssue($id: String!) {
        issue(id: $id) {
          id
          identifier
          title
          description
          priority
          estimate
          state {
            id
            name
            type
          }
          assignee {
            id
            name
            email
          }
          creator {
            id
            name
            email
          }
          team {
            id
            name
            key
          }
          project {
            id
            name
          }
          cycle {
            id
            name
            number
          }
          labels {
            nodes {
              id
              name
              color
            }
          }
          url
          createdAt
          updatedAt
          completedAt
          dueDate
          children {
            nodes {
              id
            }
          }
          parent {
            id
            identifier
            title
          }
        }
      }
    `;

    try {
      const data = await this.request<{ issue: any }>(query, { id: issueId });
      return {
        ...data.issue,
        labels: data.issue.labels.nodes,
        subIssues: data.issue.children.nodes.map((child: any) => child.id),
      };
    } catch (error) {
      throw new Error(`Failed to get issue: ${error}`);
    }
  }

  async listIssues(
    teamId?: string,
    filters?: {
      assigneeId?: string;
      stateType?: 'backlog' | 'unstarted' | 'started' | 'completed' | 'cancelled';
      projectId?: string;
      cycleId?: string;
      priority?: number;
      first?: number;
    }
  ): Promise<LinearIssue[]> {
    const team = teamId || this.defaultTeamId;

    let filterConditions = '';
    const variables: Record<string, any> = {};

    if (team) {
      filterConditions += 'team: { id: { eq: $teamId } }';
      variables.teamId = team;
    }

    if (filters?.assigneeId) {
      if (filterConditions) filterConditions += ', ';
      filterConditions += 'assignee: { id: { eq: $assigneeId } }';
      variables.assigneeId = filters.assigneeId;
    }

    if (filters?.stateType) {
      if (filterConditions) filterConditions += ', ';
      filterConditions += 'state: { type: { eq: $stateType } }';
      variables.stateType = filters.stateType;
    }

    if (filters?.projectId) {
      if (filterConditions) filterConditions += ', ';
      filterConditions += 'project: { id: { eq: $projectId } }';
      variables.projectId = filters.projectId;
    }

    if (filters?.cycleId) {
      if (filterConditions) filterConditions += ', ';
      filterConditions += 'cycle: { id: { eq: $cycleId } }';
      variables.cycleId = filters.cycleId;
    }

    if (filters?.priority !== undefined) {
      if (filterConditions) filterConditions += ', ';
      filterConditions += 'priority: { eq: $priority }';
      variables.priority = filters.priority;
    }

    const query = `
      query ListIssues${Object.keys(variables).map(key => `$${key}: String`).join(', ')} {
        issues(
          filter: { ${filterConditions} }
          first: ${filters?.first || 50}
          orderBy: updatedAt
        ) {
          nodes {
            id
            identifier
            title
            description
            priority
            estimate
            state {
              id
              name
              type
            }
            assignee {
              id
              name
              email
            }
            creator {
              id
              name
              email
            }
            team {
              id
              name
              key
            }
            project {
              id
              name
            }
            cycle {
              id
              name
              number
            }
            labels {
              nodes {
                id
                name
                color
              }
            }
            url
            createdAt
            updatedAt
            completedAt
            dueDate
            children {
              nodes {
                id
              }
            }
            parent {
              id
              identifier
              title
            }
          }
        }
      }
    `;

    try {
      const data = await this.request<{ issues: { nodes: any[] } }>(query, variables);
      return data.issues.nodes.map(issue => ({
        ...issue,
        labels: issue.labels.nodes,
        subIssues: issue.children.nodes.map((child: any) => child.id),
      }));
    } catch (error) {
      throw new Error(`Failed to list issues: ${error}`);
    }
  }

  async updateIssue(
    issueId: string,
    updates: {
      title?: string;
      description?: string;
      priority?: number;
      estimate?: number;
      assigneeId?: string;
      stateId?: string;
      projectId?: string;
      cycleId?: string;
      labelIds?: string[];
      dueDate?: string;
    }
  ): Promise<LinearIssue> {
    const mutation = `
      mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $input) {
          success
          issue {
            id
            identifier
            title
            description
            priority
            estimate
            state {
              id
              name
              type
            }
            assignee {
              id
              name
              email
            }
            creator {
              id
              name
              email
            }
            team {
              id
              name
              key
            }
            project {
              id
              name
            }
            cycle {
              id
              name
              number
            }
            labels {
              nodes {
                id
                name
                color
              }
            }
            url
            createdAt
            updatedAt
            completedAt
            dueDate
            children {
              nodes {
                id
              }
            }
            parent {
              id
              identifier
              title
            }
          }
        }
      }
    `;

    try {
      const data = await this.request<{ issueUpdate: { success: boolean; issue: any } }>(
        mutation,
        { id: issueId, input: updates }
      );

      if (!data.issueUpdate.success) {
        throw new Error('Failed to update issue');
      }

      const issue = data.issueUpdate.issue;
      return {
        ...issue,
        labels: issue.labels.nodes,
        subIssues: issue.children.nodes.map((child: any) => child.id),
      };
    } catch (error) {
      throw new Error(`Failed to update issue: ${error}`);
    }
  }

  // Comments Management
  async addComment(issueId: string, body: string): Promise<LinearComment> {
    return this.createComment(issueId, body);
  }

  async createComment(issueId: string, body: string): Promise<LinearComment> {
    const mutation = `
      mutation CreateComment($input: CommentCreateInput!) {
        commentCreate(input: $input) {
          success
          comment {
            id
            body
            user {
              id
              name
              email
            }
            issue {
              id
              identifier
              title
            }
            createdAt
            updatedAt
          }
        }
      }
    `;

    try {
      const data = await this.request<{ commentCreate: { success: boolean; comment: any } }>(
        mutation,
        { input: { issueId, body } }
      );

      if (!data.commentCreate.success) {
        throw new Error('Failed to create comment');
      }

      return data.commentCreate.comment;
    } catch (error) {
      throw new Error(`Failed to create comment: ${error}`);
    }
  }

  async listComments(issueId: string): Promise<LinearComment[]> {
    const query = `
      query ListComments($issueId: String!) {
        issue(id: $issueId) {
          comments {
            nodes {
              id
              body
              user {
                id
                name
                email
              }
              issue {
                id
                identifier
                title
              }
              createdAt
              updatedAt
            }
          }
        }
      }
    `;

    try {
      const data = await this.request<{ issue: { comments: { nodes: any[] } } }>(
        query,
        { issueId }
      );
      return data.issue.comments.nodes;
    } catch (error) {
      throw new Error(`Failed to list comments: ${error}`);
    }
  }

  // Project Management
  async createProject(
    name: string,
    description?: string,
    teamIds?: string[],
    options?: {
      state?: 'backlog' | 'started' | 'paused' | 'completed' | 'cancelled';
      startDate?: string;
      targetDate?: string;
      leadId?: string;
    }
  ): Promise<LinearProject> {
    const mutation = `
      mutation CreateProject($input: ProjectCreateInput!) {
        projectCreate(input: $input) {
          success
          project {
            id
            name
            description
            state
            progress
            startDate
            targetDate
            lead {
              id
              name
              email
            }
            teams {
              nodes {
                id
                name
                key
              }
            }
            url
            createdAt
            updatedAt
          }
        }
      }
    `;

    const input: Record<string, any> = { name };

    if (description) input.description = description;
    if (teamIds) input.teamIds = teamIds;
    if (options?.state) input.state = options.state;
    if (options?.startDate) input.startDate = options.startDate;
    if (options?.targetDate) input.targetDate = options.targetDate;
    if (options?.leadId) input.leadId = options.leadId;

    try {
      const data = await this.request<{ projectCreate: { success: boolean; project: any } }>(
        mutation,
        { input }
      );

      if (!data.projectCreate.success) {
        throw new Error('Failed to create project');
      }

      const project = data.projectCreate.project;
      return {
        ...project,
        teams: project.teams.nodes,
      };
    } catch (error) {
      throw new Error(`Failed to create project: ${error}`);
    }
  }

  async listProjects(teamId?: string): Promise<LinearProject[]> {
    const team = teamId || this.defaultTeamId;

    let filterConditions = '';
    const variables: Record<string, any> = {};

    if (team) {
      filterConditions = 'teams: { some: { id: { eq: $teamId } } }';
      variables.teamId = team;
    }

    const query = `
      query ListProjects${team ? '($teamId: String!)' : ''} {
        projects(${team ? `filter: { ${filterConditions} }` : ''}) {
          nodes {
            id
            name
            description
            state
            progress
            startDate
            targetDate
            lead {
              id
              name
              email
            }
            teams {
              nodes {
                id
                name
                key
              }
            }
            url
            createdAt
            updatedAt
          }
        }
      }
    `;

    try {
      const data = await this.request<{ projects: { nodes: any[] } }>(query, variables);
      return data.projects.nodes.map(project => ({
        ...project,
        teams: project.teams.nodes,
      }));
    } catch (error) {
      throw new Error(`Failed to list projects: ${error}`);
    }
  }

  // Cycle Management
  async getCurrentCycle(teamId?: string): Promise<LinearCycle | null> {
    const team = teamId || this.defaultTeamId;
    if (!team) {
      throw new Error('Team ID must be provided');
    }

    const query = `
      query GetCurrentCycle($teamId: String!) {
        team(id: $teamId) {
          activeCycle {
            id
            number
            name
            description
            startsAt
            endsAt
            completedAt
            progress
            team {
              id
              name
              key
            }
            issues {
              nodes {
                id
              }
            }
          }
        }
      }
    `;

    try {
      const data = await this.request<{ team: { activeCycle: any } }>(query, { teamId: team });

      if (!data.team.activeCycle) {
        return null;
      }

      const cycle = data.team.activeCycle;
      return {
        ...cycle,
        issues: cycle.issues.nodes.map((issue: any) => issue.id),
      };
    } catch (error) {
      throw new Error(`Failed to get current cycle: ${error}`);
    }
  }

  // Multi-Agent System Support
  async createMultiAgentTask(
    parentIssueId: string,
    taskDescription: string,
    subtasks: Array<{
      title: string;
      description?: string;
      agentRole: string;
      priority?: number;
      estimate?: number;
    }>,
    context?: Record<string, any>
  ): Promise<MultiAgentTask> {
    try {
      // Create sub-issues for each agent
      const childAgents = [];

      for (const subtask of subtasks) {
        const subIssue = await this.createIssue(
          `[${subtask.agentRole}] ${subtask.title}`,
          subtask.description,
          undefined,
          {
            parentId: parentIssueId,
            priority: subtask.priority || 3,
            estimate: subtask.estimate,
          }
        );

        childAgents.push({
          id: subIssue.id,
          role: subtask.agentRole,
          assignedSubtask: subtask.title,
          status: 'pending' as const,
        });

        // Add context as a comment
        if (context) {
          await this.createComment(
            subIssue.id,
            `**Agent Context:**\n\`\`\`json\n${JSON.stringify(context, null, 2)}\n\`\`\``
          );
        }
      }

      // Update parent issue with task coordination info
      await this.createComment(
        parentIssueId,
        `**Multi-Agent Task Coordination**\n\n` +
        `Task: ${taskDescription}\n\n` +
        `**Child Agents:**\n` +
        childAgents.map(agent => `- ${agent.role}: ${agent.assignedSubtask} (${agent.id})`).join('\n')
      );

      return {
        parentIssueId,
        taskDescription,
        context: context || {},
        childAgents,
      };
    } catch (error) {
      throw new Error(`Failed to create multi-agent task: ${error}`);
    }
  }

  async updateAgentTaskStatus(
    agentIssueId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'failed',
    statusMessage?: string
  ): Promise<void> {
    try {
      // Update issue state based on status
      let stateType: 'backlog' | 'unstarted' | 'started' | 'completed' | 'cancelled';

      switch (status) {
        case 'pending':
          stateType = 'backlog';
          break;
        case 'in_progress':
          stateType = 'started';
          break;
        case 'completed':
          stateType = 'completed';
          break;
        case 'failed':
          stateType = 'cancelled';
          break;
      }

      // Get team states to find the appropriate state ID
      const issue = await this.getIssue(agentIssueId);
      const team = await this.getTeam(issue.team.id);
      const targetState = team.states.find(state => state.type === stateType);

      if (targetState) {
        await this.updateIssue(agentIssueId, { stateId: targetState.id });
      }

      // Add status update comment
      if (statusMessage) {
        await this.createComment(
          agentIssueId,
          `**Agent Status Update**: ${status.toUpperCase()}\n\n${statusMessage}`
        );
      }
    } catch (error) {
      throw new Error(`Failed to update agent task status: ${error}`);
    }
  }

  // Progress Tracking
  async trackProgress(issueId: string, codeChangeUrl?: string): Promise<void> {
    try {
      let progressMessage = '**Development Progress Update**\n\n';

      if (codeChangeUrl) {
        progressMessage += `Code changes: ${codeChangeUrl}\n`;
      }

      progressMessage += `Updated at: ${new Date().toISOString()}`;

      await this.createComment(issueId, progressMessage);
    } catch (error) {
      throw new Error(`Failed to track progress: ${error}`);
    }
  }

  async linkCodeChanges(issueId: string, changes: Array<{
    type: 'commit' | 'pr' | 'branch';
    url: string;
    description?: string;
  }>): Promise<void> {
    try {
      let linkMessage = '**Code Changes Linked**\n\n';

      changes.forEach(change => {
        linkMessage += `- **${change.type.toUpperCase()}**: [${change.description || change.url}](${change.url})\n`;
      });

      await this.createComment(issueId, linkMessage);
    } catch (error) {
      throw new Error(`Failed to link code changes: ${error}`);
    }
  }
}

// Factory function to create Linear integration instance
export function createLinearIntegration(
  apiKey?: string,
  teamId?: string,
  workspaceId?: string
): LinearIntegration {
  const linearApiKey = apiKey || process.env.LINEAR_API_KEY;

  if (!linearApiKey) {
    throw new Error('Linear API key is required. Set LINEAR_API_KEY environment variable or pass apiKey parameter.');
  }

  return new LinearIntegration({
    apiKey: linearApiKey,
    teamId: teamId || process.env.LINEAR_TEAM_ID,
    workspaceId: workspaceId || process.env.LINEAR_WORKSPACE_ID,
  });
}

export default LinearIntegration;