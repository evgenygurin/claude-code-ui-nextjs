/**
 * AgentOrchestrator - Система управления агентами для выполнения задач
 *
 * Умно назначает агентов на задачи, следит за их работой,
 * обеспечивает контроль качества и координацию между агентами
 */

import { Task } from './task-decomposer';
import { createCodeGenIntegrations } from '@/lib/integrations';

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  skills: string[];
  status: 'idle' | 'working' | 'blocked' | 'error' | 'offline';
  currentTask?: string;
  capabilities: {
    maxConcurrentTasks: number;
    estimatedSpeed: number; // tasks per hour
    qualityScore: number; // 0-100
    specializations: string[];
  };
  performance: {
    tasksCompleted: number;
    averageQuality: number;
    averageTime: number;
    errorRate: number;
    lastActive: Date;
  };
  constraints: {
    workingHours?: { start: number; end: number };
    maxTaskComplexity: Task['complexity'];
    requiredSupervision: boolean;
  };
}

export type AgentType =
  | 'frontend-developer'
  | 'backend-developer'
  | 'fullstack-developer'
  | 'database-specialist'
  | 'devops-engineer'
  | 'qa-tester'
  | 'ui-ux-designer'
  | 'api-specialist'
  | 'security-specialist'
  | 'code-reviewer'
  | 'project-manager'
  | 'documentation-writer';

export interface AgentAssignment {
  taskId: string;
  agentId: string;
  assignedAt: Date;
  priority: number;
  expectedCompletion: Date;
  supervisionLevel: 'none' | 'light' | 'moderate' | 'heavy';
  checkpoints: {
    time: Date;
    description: string;
    requiredApproval: boolean;
  }[];
}

export interface WorkflowExecution {
  id: string;
  mainTaskId: string;
  status: 'planning' | 'executing' | 'reviewing' | 'completed' | 'failed' | 'paused';
  assignments: AgentAssignment[];
  timeline: {
    started: Date;
    estimatedCompletion: Date;
    actualCompletion?: Date;
  };
  qualityGates: {
    id: string;
    description: string;
    status: 'pending' | 'passed' | 'failed';
    checkedBy?: string;
    checkedAt?: Date;
    notes?: string;
  }[];
  metrics: {
    progressPercent: number;
    qualityScore: number;
    onSchedule: boolean;
    resourceUtilization: number;
  };
}

export class AgentOrchestrator {
  private agents: Map<string, Agent> = new Map();
  private activeWorkflows: Map<string, WorkflowExecution> = new Map();
  private integrations = createCodeGenIntegrations();

  constructor() {
    this.initializeDefaultAgents();
  }

  /**
   * Основной метод - создает workflow для выполнения задачи
   */
  async orchestrateTask(
    mainTask: Task,
    subtasks: Task[],
    options?: {
      urgency?: 'low' | 'medium' | 'high' | 'critical';
      qualityRequirement?: 'standard' | 'high' | 'critical';
      timeConstraint?: Date;
      supervisorAgent?: string;
    }
  ): Promise<WorkflowExecution> {

    // 1. Создание workflow
    const workflow = await this.createWorkflow(mainTask, subtasks, options);

    // 2. Анализ и назначение агентов
    const assignments = await this.analyzeAndAssignAgents(subtasks, options);

    // 3. Создание качественных ворот
    const qualityGates = await this.createQualityGates(mainTask, subtasks, options);

    // 4. Запуск выполнения
    workflow.assignments = assignments;
    workflow.qualityGates = qualityGates;
    workflow.status = 'executing';

    this.activeWorkflows.set(workflow.id, workflow);

    // 5. Запуск мониторинга
    this.startWorkflowMonitoring(workflow.id);

    // 6. Создание задач в Linear для отслеживания
    await this.createLinearWorkflow(workflow);

    // 7. Уведомление агентов о назначении
    await this.notifyAgentsOfAssignment(assignments);

    return workflow;
  }

  /**
   * Анализ навыков и назначение оптимальных агентов
   */
  private async analyzeAndAssignAgents(
    subtasks: Task[],
    options?: any
  ): Promise<AgentAssignment[]> {

    const assignments: AgentAssignment[] = [];

    for (const task of subtasks) {
      // Найти лучшего агента для задачи
      const optimalAgent = await this.findOptimalAgent(task, options);

      if (!optimalAgent) {
        // Если нет подходящего агента - создать или подождать
        const fallbackAgent = await this.handleNoAgentAvailable(task);
        if (!fallbackAgent) {
          throw new Error(`Не удалось найти агента для задачи: ${task.title}`);
        }
      }

      const agent = optimalAgent || await this.findOptimalAgent(task, options);
      if (!agent) continue;

      // Создание назначения
      const assignment: AgentAssignment = {
        taskId: task.id,
        agentId: agent.id,
        assignedAt: new Date(),
        priority: this.calculateTaskPriority(task, options),
        expectedCompletion: this.calculateExpectedCompletion(task, agent),
        supervisionLevel: this.determineSupervisionLevel(task, agent, options),
        checkpoints: this.createTaskCheckpoints(task, agent)
      };

      assignments.push(assignment);

      // Обновление статуса агента
      agent.status = 'working';
      agent.currentTask = task.id;
      this.agents.set(agent.id, agent);
    }

    return assignments;
  }

  /**
   * Поиск оптимального агента для задачи
   */
  private async findOptimalAgent(
    task: Task,
    options?: any
  ): Promise<Agent | null> {

    const availableAgents = Array.from(this.agents.values())
      .filter(agent => agent.status === 'idle' ||
        (agent.status === 'working' &&
         agent.capabilities.maxConcurrentTasks > 1));

    if (availableAgents.length === 0) {
      return null;
    }

    // Критерии оценки агентов
    const scoredAgents = availableAgents.map(agent => ({
      agent,
      score: this.calculateAgentScore(agent, task, options)
    }));

    // Сортировка по убыванию скора
    scoredAgents.sort((a, b) => b.score - a.score);

    const bestAgent = scoredAgents[0]?.agent;

    // Проверка минимального порога пригодности
    if (!scoredAgents[0] || scoredAgents[0].score < 0.3) {
      return null; // Агент не подходит для задачи
    }

    return bestAgent || null;
  }

  /**
   * Расчет скора агента для задачи
   */
  private calculateAgentScore(
    agent: Agent,
    task: Task,
    options?: any
  ): number {

    let score = 0;

    // 1. Соответствие навыков (40% веса)
    const skillMatch = this.calculateSkillMatch(agent.skills, task.requiredSkills);
    score += skillMatch * 0.4;

    // 2. Производительность агента (30% веса)
    const performanceScore = agent.performance.averageQuality / 100;
    score += performanceScore * 0.3;

    // 3. Доступность (20% веса)
    const availabilityScore = agent.status === 'idle' ? 1.0 :
      agent.capabilities.maxConcurrentTasks > 1 ? 0.6 : 0.1;
    score += availabilityScore * 0.2;

    // 4. Специализация (10% веса)
    const specializationMatch = this.calculateSpecializationMatch(
      agent.capabilities.specializations,
      task.requiredSkills
    );
    score += specializationMatch * 0.1;

    // Штрафы за ограничения
    if (task.complexity === 'critical' && agent.constraints.maxTaskComplexity !== 'critical') {
      score *= 0.5;
    }

    if (task.priority === 'urgent' && agent.performance.errorRate > 0.1) {
      score *= 0.7;
    }

    // Бонусы за соответствие типу задачи
    const typeBonus = this.calculateTypeBonus(agent.type, task);
    score += typeBonus;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Создание качественных ворот для workflow
   */
  private async createQualityGates(
    mainTask: Task,
    subtasks: Task[],
    options?: any
  ): Promise<WorkflowExecution['qualityGates']> {

    const gates: WorkflowExecution['qualityGates'] = [];

    // Стандартные ворота для каждой подзадачи
    subtasks.forEach((task, index) => {
      gates.push({
        id: `task-${task.id}-completion`,
        description: `Завершение задачи: ${task.title}`,
        status: 'pending'
      });

      gates.push({
        id: `task-${task.id}-quality`,
        description: `Проверка качества: ${task.title}`,
        status: 'pending'
      });
    });

    // Промежуточные ворота для сложных задач
    if (mainTask.complexity === 'complex' || mainTask.complexity === 'critical') {
      gates.push({
        id: 'mid-project-review',
        description: 'Промежуточный ревью проекта',
        status: 'pending'
      });
    }

    // Финальные ворота
    gates.push({
      id: 'integration-testing',
      description: 'Интеграционное тестирование',
      status: 'pending'
    });

    gates.push({
      id: 'final-code-review',
      description: 'Финальный код-ревью',
      status: 'pending'
    });

    gates.push({
      id: 'deployment-readiness',
      description: 'Готовность к деплою',
      status: 'pending'
    });

    // Дополнительные ворота для критических задач
    if (options?.qualityRequirement === 'critical') {
      gates.push({
        id: 'security-audit',
        description: 'Аудит безопасности',
        status: 'pending'
      });

      gates.push({
        id: 'performance-testing',
        description: 'Нагрузочное тестирование',
        status: 'pending'
      });
    }

    return gates;
  }

  /**
   * Мониторинг выполнения workflow
   */
  private startWorkflowMonitoring(workflowId: string): void {
    const interval = setInterval(async () => {
      try {
        await this.checkWorkflowProgress(workflowId);
      } catch (error) {
        console.error(`Ошибка мониторинга workflow ${workflowId}:`, error);

        // Уведомление об ошибке через Sentry
        try {
          const { captureException } = await import('@sentry/nextjs');
          captureException(error as Error, {
            tags: { workflowId, component: 'orchestrator' }
          });
        } catch (sentryError) {
          console.warn('Failed to capture exception with Sentry:', sentryError);
        }
      }
    }, 30000); // Проверка каждые 30 секунд

    // Остановка мониторинга через 24 часа или при завершении
    setTimeout(() => {
      clearInterval(interval);
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Проверка прогресса workflow
   */
  private async checkWorkflowProgress(workflowId: string): Promise<void> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) return;

    // Проверка статуса задач
    for (const assignment of workflow.assignments) {
      const agent = this.agents.get(assignment.agentId);
      if (!agent) continue;

      // Проверка не застрял ли агент
      if (agent.status === 'working' &&
          Date.now() - assignment.assignedAt.getTime() > 4 * 60 * 60 * 1000) { // 4 часа

        await this.handleStuckAgent(assignment, workflow);
      }

      // Проверка checkpoints
      await this.checkTaskCheckpoints(assignment, workflow);
    }

    // Обновление метрик
    await this.updateWorkflowMetrics(workflow);

    // Проверка качественных ворот
    await this.processQualityGates(workflow);

    // Обновление в Linear
    await this.updateLinearProgress(workflow);
  }

  /**
   * Обработка заблокированного агента
   */
  private async handleStuckAgent(
    assignment: AgentAssignment,
    workflow: WorkflowExecution
  ): Promise<void> {

    const agent = this.agents.get(assignment.agentId);
    if (!agent) return;

    console.warn(`Агент ${agent.name} застрял на задаче ${assignment.taskId}`);

    // Попытка переназначения
    const task = await this.getTaskById(assignment.taskId);
    if (!task) return;

    // Поиск замещающего агента
    const replacementAgent = await this.findOptimalAgent(task, {
      excludeAgents: [agent.id]
    });

    if (replacementAgent) {
      // Переназначение задачи
      assignment.agentId = replacementAgent.id;
      assignment.assignedAt = new Date();

      // Обновление статусов
      agent.status = 'blocked';
      agent.currentTask = undefined;
      replacementAgent.status = 'working';
      replacementAgent.currentTask = task.id;

      console.log(`Задача ${task.title} переназначена с ${agent.name} на ${replacementAgent.name}`);

      // Уведомление в Linear
      const linear = this.integrations.getLinear();
      if (linear) {
        await linear.addComment(assignment.taskId,
          `🔄 Задача переназначена с агента ${agent.name} на ${replacementAgent.name} из-за тайм-аута`
        );
      }
    } else {
      // Эскалация проблемы
      await this.escalateStuckTask(assignment, workflow);
    }
  }

  /**
   * Инициализация агентов по умолчанию
   */
  private initializeDefaultAgents(): void {
    const defaultAgents: Partial<Agent>[] = [
      {
        name: 'Frontend Dev Pro',
        type: 'frontend-developer',
        skills: ['react', 'typescript', 'tailwind', 'nextjs', 'ui-ux'],
        capabilities: {
          maxConcurrentTasks: 2,
          estimatedSpeed: 1.2,
          qualityScore: 85,
          specializations: ['react', 'responsive-design', 'components']
        }
      },
      {
        name: 'Backend Expert',
        type: 'backend-developer',
        skills: ['nodejs', 'typescript', 'api', 'database', 'authentication'],
        capabilities: {
          maxConcurrentTasks: 3,
          estimatedSpeed: 1.0,
          qualityScore: 90,
          specializations: ['rest-api', 'graphql', 'microservices']
        }
      },
      {
        name: 'Full Stack Ninja',
        type: 'fullstack-developer',
        skills: ['react', 'nodejs', 'typescript', 'database', 'devops'],
        capabilities: {
          maxConcurrentTasks: 2,
          estimatedSpeed: 0.8,
          qualityScore: 82,
          specializations: ['end-to-end', 'integration']
        }
      },
      {
        name: 'Database Guru',
        type: 'database-specialist',
        skills: ['postgresql', 'prisma', 'migrations', 'optimization'],
        capabilities: {
          maxConcurrentTasks: 4,
          estimatedSpeed: 1.5,
          qualityScore: 95,
          specializations: ['schema-design', 'performance-tuning']
        }
      },
      {
        name: 'QA Master',
        type: 'qa-tester',
        skills: ['testing', 'jest', 'cypress', 'e2e', 'automation'],
        capabilities: {
          maxConcurrentTasks: 5,
          estimatedSpeed: 2.0,
          qualityScore: 88,
          specializations: ['test-automation', 'quality-assurance']
        }
      },
      {
        name: 'DevOps Wizard',
        type: 'devops-engineer',
        skills: ['docker', 'ci-cd', 'deployment', 'monitoring', 'infrastructure'],
        capabilities: {
          maxConcurrentTasks: 3,
          estimatedSpeed: 1.1,
          qualityScore: 87,
          specializations: ['containerization', 'automation']
        }
      }
    ];

    defaultAgents.forEach((agentData, index) => {
      const agent: Agent = {
        id: `agent_${index + 1}`,
        name: agentData.name!,
        type: agentData.type!,
        skills: agentData.skills!,
        status: 'idle',
        capabilities: agentData.capabilities!,
        performance: {
          tasksCompleted: Math.floor(Math.random() * 50) + 10,
          averageQuality: agentData.capabilities!.qualityScore,
          averageTime: Math.random() * 2 + 1,
          errorRate: Math.random() * 0.1,
          lastActive: new Date()
        },
        constraints: {
          maxTaskComplexity: agentData.type === 'qa-tester' ? 'medium' : 'critical',
          requiredSupervision: agentData.capabilities!.qualityScore < 85
        }
      };

      this.agents.set(agent.id, agent);
    });
  }

  // Вспомогательные методы
  private calculateSkillMatch(agentSkills: string[], taskSkills: string[]): number {
    const matchingSkills = agentSkills.filter(skill =>
      taskSkills.some(taskSkill => taskSkill.includes(skill) || skill.includes(taskSkill))
    );
    return taskSkills.length > 0 ? matchingSkills.length / taskSkills.length : 0;
  }

  private calculateSpecializationMatch(specializations: string[], taskSkills: string[]): number {
    const matches = specializations.filter(spec =>
      taskSkills.some(skill => skill.includes(spec) || spec.includes(skill))
    );
    return taskSkills.length > 0 ? matches.length / taskSkills.length : 0;
  }

  private calculateTypeBonus(agentType: AgentType, task: Task): number {
    const typeMapping: Record<string, AgentType[]> = {
      'frontend': ['frontend-developer', 'fullstack-developer', 'ui-ux-designer'],
      'backend': ['backend-developer', 'fullstack-developer', 'api-specialist'],
      'database': ['database-specialist', 'backend-developer'],
      'testing': ['qa-tester'],
      'ui-ux': ['ui-ux-designer', 'frontend-developer'],
      'api': ['api-specialist', 'backend-developer'],
      'devops': ['devops-engineer']
    };

    for (const [category, types] of Object.entries(typeMapping)) {
      if (task.requiredSkills.some(skill => skill.includes(category))) {
        if (types.includes(agentType)) {
          return 0.1;
        }
      }
    }

    return 0;
  }

  private async createWorkflow(mainTask: Task, subtasks: Task[], options?: any): Promise<WorkflowExecution> {
    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      id: workflowId,
      mainTaskId: mainTask.id,
      status: 'planning',
      assignments: [],
      timeline: {
        started: new Date(),
        estimatedCompletion: new Date(Date.now() + mainTask.estimatedHours * 60 * 60 * 1000)
      },
      qualityGates: [],
      metrics: {
        progressPercent: 0,
        qualityScore: 0,
        onSchedule: true,
        resourceUtilization: 0
      }
    };
  }

  private calculateTaskPriority(task: Task, options?: any): number {
    let priority = 1;

    switch (task.priority) {
      case 'urgent': priority = 4; break;
      case 'high': priority = 3; break;
      case 'medium': priority = 2; break;
      case 'low': priority = 1; break;
    }

    if (options?.urgency === 'critical') priority += 2;
    if (task.complexity === 'critical') priority += 1;

    return priority;
  }

  private calculateExpectedCompletion(task: Task, agent: Agent): Date {
    const adjustedHours = task.estimatedHours / agent.capabilities.estimatedSpeed;
    return new Date(Date.now() + adjustedHours * 60 * 60 * 1000);
  }

  private determineSupervisionLevel(task: Task, agent: Agent, options?: any): AgentAssignment['supervisionLevel'] {
    if (options?.qualityRequirement === 'critical') return 'heavy';
    if (task.complexity === 'critical') return 'moderate';
    if (agent.constraints.requiredSupervision) return 'moderate';
    if (agent.performance.errorRate > 0.1) return 'light';
    return 'none';
  }

  private createTaskCheckpoints(task: Task, agent: Agent): AgentAssignment['checkpoints'] {
    const checkpoints: AgentAssignment['checkpoints'] = [];
    const taskDuration = task.estimatedHours * 60 * 60 * 1000; // в миллисекундах

    // Добавление checkpoint'ов в зависимости от длительности
    if (taskDuration > 4 * 60 * 60 * 1000) { // > 4 часов
      checkpoints.push({
        time: new Date(Date.now() + taskDuration * 0.25),
        description: '25% прогресса - промежуточная проверка',
        requiredApproval: task.complexity === 'critical'
      });

      checkpoints.push({
        time: new Date(Date.now() + taskDuration * 0.75),
        description: '75% прогресса - предфинальная проверка',
        requiredApproval: task.complexity !== 'simple'
      });
    }

    checkpoints.push({
      time: new Date(Date.now() + taskDuration),
      description: 'Завершение задачи - финальная проверка',
      requiredApproval: true
    });

    return checkpoints;
  }

  // Методы-заглушки для полноты интерфейса
  private async handleNoAgentAvailable(task: Task): Promise<Agent | null> {
    // TODO: Логика создания нового агента или постановки в очередь
    console.warn(`Нет доступных агентов для задачи: ${task.title}`);
    return null;
  }

  private async getTaskById(taskId: string): Promise<Task | null> {
    // TODO: Получение задачи по ID из хранилища
    return null;
  }

  private async checkTaskCheckpoints(assignment: AgentAssignment, workflow: WorkflowExecution): Promise<void> {
    // TODO: Проверка checkpoint'ов задачи
  }

  private async updateWorkflowMetrics(workflow: WorkflowExecution): Promise<void> {
    // TODO: Обновление метрик workflow
  }

  private async processQualityGates(workflow: WorkflowExecution): Promise<void> {
    // TODO: Обработка качественных ворот
  }

  private async createLinearWorkflow(workflow: WorkflowExecution): Promise<void> {
    // TODO: Создание workflow в Linear
  }

  private async updateLinearProgress(workflow: WorkflowExecution): Promise<void> {
    // TODO: Обновление прогресса в Linear
  }

  private async notifyAgentsOfAssignment(assignments: AgentAssignment[]): Promise<void> {
    // TODO: Уведомление агентов о назначении
  }

  private async escalateStuckTask(assignment: AgentAssignment, workflow: WorkflowExecution): Promise<void> {
    // TODO: Эскалация заблокированной задачи
  }

  // Публичные методы для управления
  public getActiveWorkflows(): WorkflowExecution[] {
    return Array.from(this.activeWorkflows.values());
  }

  public getAgentStatus(): Agent[] {
    return Array.from(this.agents.values());
  }

  public async pauseWorkflow(workflowId: string): Promise<void> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow) {
      workflow.status = 'paused';
    }
  }

  public async resumeWorkflow(workflowId: string): Promise<void> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow) {
      workflow.status = 'executing';
    }
  }
}

export default AgentOrchestrator;