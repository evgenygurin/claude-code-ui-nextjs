/**
 * TaskDecomposer - Система разбивки сложных задач на подзадачи
 *
 * Анализирует входящую задачу, критически оценивает её сложность,
 * разбивает на логические подзадачи с четкими критериями выполнения
 */

import { createCodeGenIntegrations } from '@/lib/integrations';

export interface Task {
  id: string;
  title: string;
  description: string;
  complexity: 'simple' | 'medium' | 'complex' | 'critical';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedHours: number;
  dependencies: string[];
  requiredSkills: string[];
  acceptanceCriteria: string[];
  riskFactors: string[];
  parentTaskId?: string;
  subtasks: Task[];
  status: 'pending' | 'in_progress' | 'review' | 'completed' | 'failed' | 'blocked';
  assignedAgent?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    originalRequest: string;
    decompositionReason: string;
    qualityGates: string[];
    rollbackPlan: string;
  };
}

export interface DecompositionResult {
  mainTask: Task;
  subtasks: Task[];
  recommendedApproach: string;
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
    mitigationStrategies: string[];
  };
  estimatedTimeline: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
  resourceRequirements: {
    agentTypes: string[];
    externalDependencies: string[];
    criticalPath: string[];
  };
}

export class TaskDecomposer {
  private integrations = createCodeGenIntegrations();

  /**
   * Основной метод разбивки задач
   * Анализирует сложность и разбивает на управляемые подзадачи
   */
  async decomposeTask(
    originalRequest: string,
    context?: {
      projectType?: string;
      existingCodebase?: string;
      constraints?: string[];
      timeline?: string;
    }
  ): Promise<DecompositionResult> {

    // 1. Анализ сложности задачи
    const complexityAnalysis = await this.analyzeComplexity(originalRequest, context);

    // 2. Критическая оценка задачи
    const critique = await this.criticalAnalysis(originalRequest, complexityAnalysis);

    // 3. Разбивка на логические подзадачи
    const subtasks = await this.breakdownIntoSubtasks(originalRequest, complexityAnalysis, critique);

    // 4. Создание главной задачи
    const mainTask = await this.createMainTask(originalRequest, subtasks, complexityAnalysis);

    // 5. Оценка рисков и планирование
    const riskAssessment = await this.assessRisks(mainTask, subtasks);
    const timeline = this.estimateTimeline(subtasks);
    const resources = this.identifyResourceRequirements(subtasks);

    // 6. Создание подзадач в Linear для отслеживания
    await this.createLinearTasks(mainTask, subtasks);

    return {
      mainTask,
      subtasks,
      recommendedApproach: critique.recommendedApproach,
      riskAssessment,
      estimatedTimeline: timeline,
      resourceRequirements: resources
    };
  }

  /**
   * Анализ сложности входящей задачи
   */
  private async analyzeComplexity(
    request: string,
    context?: any
  ): Promise<{
    complexity: Task['complexity'];
    reasoning: string;
    keyFactors: string[];
    estimatedHours: number;
  }> {

    // Ключевые индикаторы сложности
    const complexityIndicators = {
      simple: [
        'простая функция', 'добавить кнопку', 'изменить текст',
        'css стили', 'конфигурация', 'документация'
      ],
      medium: [
        'api интеграция', 'база данных', 'аутентификация',
        'тестирование', 'рефакторинг', 'новый компонент'
      ],
      complex: [
        'архитектура', 'микросервисы', 'производительность',
        'безопасность', 'масштабирование', 'мульти-платформа'
      ],
      critical: [
        'миграция данных', 'legacy система', 'real-time',
        'высокая нагрузка', 'финансовые операции', 'AI/ML'
      ]
    };

    // Анализ текста запроса
    const requestLower = request.toLowerCase();
    let complexity: Task['complexity'] = 'simple';
    let score = 0;
    const foundFactors: string[] = [];

    // Подсчет сложности на основе ключевых слов
    Object.entries(complexityIndicators).forEach(([level, indicators]) => {
      const matches = indicators.filter(indicator =>
        requestLower.includes(indicator)
      );
      if (matches.length > 0) {
        foundFactors.push(...matches);
        const levelScore = level === 'simple' ? 1 :
                          level === 'medium' ? 2 :
                          level === 'complex' ? 3 : 4;
        score = Math.max(score, levelScore);
      }
    });

    // Дополнительные факторы сложности
    if (requestLower.includes('интеграция') && requestLower.includes('несколько')) score += 1;
    if (requestLower.includes('автоматически') || requestLower.includes('агент')) score += 1;
    if (requestLower.includes('мониторинг') || requestLower.includes('ошибки')) score += 1;
    if (context?.constraints && context.constraints.length > 3) score += 1;

    // Определение финальной сложности
    if (score <= 1) complexity = 'simple';
    else if (score <= 2) complexity = 'medium';
    else if (score <= 3) complexity = 'complex';
    else complexity = 'critical';

    // Оценка времени
    const timeEstimates = {
      simple: 2,
      medium: 8,
      complex: 24,
      critical: 80
    };

    return {
      complexity,
      reasoning: `Задача классифицирована как ${complexity} на основе факторов: ${foundFactors.join(', ')}`,
      keyFactors: foundFactors,
      estimatedHours: timeEstimates[complexity]
    };
  }

  /**
   * Критический анализ задачи
   */
  private async criticalAnalysis(
    request: string,
    complexityAnalysis: any
  ): Promise<{
    isValid: boolean;
    concerns: string[];
    recommendations: string[];
    recommendedApproach: string;
    qualityGates: string[];
  }> {

    const concerns: string[] = [];
    const recommendations: string[] = [];
    const qualityGates: string[] = [];

    // Проверка на потенциальные проблемы
    if (complexityAnalysis.complexity === 'critical') {
      concerns.push('Задача критической сложности - требует особого внимания');
      recommendations.push('Разбить на максимально мелкие подзадачи');
      recommendations.push('Добавить дополнительные контрольные точки');
      qualityGates.push('Код-ревью каждой подзадачи');
      qualityGates.push('Интеграционное тестирование на каждом этапе');
    }

    if (request.includes('автоматически') || request.includes('агент')) {
      concerns.push('Автоматизация требует особого контроля качества');
      recommendations.push('Добавить откат к ручному режиму');
      recommendations.push('Реализовать подробное логирование');
      qualityGates.push('Тестирование в изолированной среде');
    }

    if (request.includes('интеграция')) {
      concerns.push('Интеграции могут вызвать каскадные ошибки');
      recommendations.push('Тестировать интеграции по одной');
      recommendations.push('Подготовить план отката');
      qualityGates.push('Проверка всех API endpoints');
    }

    // Рекомендуемый подход
    let recommendedApproach = '';
    switch (complexityAnalysis.complexity) {
      case 'simple':
        recommendedApproach = 'Прямая реализация с базовым тестированием';
        break;
      case 'medium':
        recommendedApproach = 'Поэтапная реализация с промежуточными проверками';
        break;
      case 'complex':
        recommendedApproach = 'Итеративная разработка с частыми ревью и тестированием';
        break;
      case 'critical':
        recommendedApproach = 'Микро-итерации с максимальным контролем качества и планом отката';
        break;
    }

    // Обязательные качественные ворота
    qualityGates.push('TypeScript type checking');
    qualityGates.push('ESLint без ошибок');
    qualityGates.push('Юнит-тесты с 80%+ покрытием');

    return {
      isValid: concerns.length < 5, // Если слишком много проблем - задача невалидна
      concerns,
      recommendations,
      recommendedApproach,
      qualityGates
    };
  }

  /**
   * Разбивка на подзадачи
   */
  private async breakdownIntoSubtasks(
    request: string,
    complexityAnalysis: any,
    critique: any
  ): Promise<Task[]> {

    const subtasks: Task[] = [];
    const baseTaskId = this.generateTaskId();

    // Стандартные этапы для любой задачи
    const standardPhases = [
      {
        title: 'Анализ и планирование',
        description: 'Детальный анализ требований и создание технического плана',
        skills: ['analysis', 'planning'],
        priority: 'high' as const,
        hours: Math.max(1, Math.floor(complexityAnalysis.estimatedHours * 0.15))
      },
      {
        title: 'Настройка окружения',
        description: 'Подготовка среды разработки и инструментов',
        skills: ['devops', 'configuration'],
        priority: 'medium' as const,
        hours: Math.max(1, Math.floor(complexityAnalysis.estimatedHours * 0.1))
      }
    ];

    // Специфичные этапы в зависимости от типа задачи
    let specificPhases: any[] = [];

    if (request.includes('API') || request.includes('интеграция')) {
      specificPhases.push({
        title: 'Изучение API документации',
        description: 'Анализ API endpoints и создание схемы интеграции',
        skills: ['api', 'integration'],
        priority: 'high',
        hours: Math.floor(complexityAnalysis.estimatedHours * 0.2)
      });
    }

    if (request.includes('UI') || request.includes('интерфейс') || request.includes('компонент')) {
      specificPhases.push({
        title: 'Дизайн интерфейса',
        description: 'Создание макетов и пользовательского интерфейса',
        skills: ['frontend', 'ui-ux'],
        priority: 'medium',
        hours: Math.floor(complexityAnalysis.estimatedHours * 0.25)
      });
    }

    if (request.includes('база данных') || request.includes('данные')) {
      specificPhases.push({
        title: 'Схема базы данных',
        description: 'Проектирование и создание структуры данных',
        skills: ['database', 'backend'],
        priority: 'high',
        hours: Math.floor(complexityAnalysis.estimatedHours * 0.2)
      });
    }

    // Основная реализация
    specificPhases.push({
      title: 'Основная реализация',
      description: 'Реализация основной логики согласно требованиям',
      skills: ['development', 'programming'],
      priority: 'high',
      hours: Math.floor(complexityAnalysis.estimatedHours * 0.4)
    });

    // Финальные этапы
    const finalPhases = [
      {
        title: 'Тестирование',
        description: 'Создание и выполнение тестов, проверка качества',
        skills: ['testing', 'qa'],
        priority: 'high' as const,
        hours: Math.max(2, Math.floor(complexityAnalysis.estimatedHours * 0.25))
      },
      {
        title: 'Документация и деплой',
        description: 'Создание документации и развертывание решения',
        skills: ['documentation', 'deployment'],
        priority: 'medium' as const,
        hours: Math.max(1, Math.floor(complexityAnalysis.estimatedHours * 0.15))
      }
    ];

    // Объединение всех этапов
    const allPhases = [...standardPhases, ...specificPhases, ...finalPhases];

    // Создание задач
    allPhases.forEach((phase, index) => {
      const taskId = `${baseTaskId}-${index + 1}`;
      const task: Task = {
        id: taskId,
        title: phase.title,
        description: phase.description,
        complexity: index < 2 ? 'simple' : complexityAnalysis.complexity,
        priority: phase.priority,
        estimatedHours: phase.hours,
        dependencies: index > 0 ? [`${baseTaskId}-${index}`] : [],
        requiredSkills: phase.skills,
        acceptanceCriteria: this.generateAcceptanceCriteria(phase.title, phase.description),
        riskFactors: this.identifyRiskFactors(phase.title),
        subtasks: [],
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          originalRequest: request,
          decompositionReason: `Автоматически выделено как этап ${phase.title}`,
          qualityGates: critique.qualityGates,
          rollbackPlan: this.generateRollbackPlan(phase.title)
        }
      };

      subtasks.push(task);
    });

    return subtasks;
  }

  /**
   * Создание главной задачи
   */
  private async createMainTask(
    request: string,
    subtasks: Task[],
    complexityAnalysis: any
  ): Promise<Task> {

    const mainTaskId = this.generateTaskId();
    const totalHours = subtasks.reduce((sum, task) => sum + task.estimatedHours, 0);

    return {
      id: mainTaskId,
      title: this.extractTaskTitle(request),
      description: request,
      complexity: complexityAnalysis.complexity,
      priority: this.determinePriority(request, complexityAnalysis.complexity),
      estimatedHours: totalHours,
      dependencies: [],
      requiredSkills: [...new Set(subtasks.flatMap(t => t.requiredSkills))],
      acceptanceCriteria: this.generateMainTaskCriteria(request),
      riskFactors: complexityAnalysis.keyFactors,
      subtasks: subtasks,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        originalRequest: request,
        decompositionReason: 'Главная задача автоматически разбитая на подзадачи',
        qualityGates: ['Все подзадачи завершены', 'Интеграционные тесты пройдены'],
        rollbackPlan: 'Откат через Git и восстановление предыдущей версии'
      }
    };
  }

  /**
   * Оценка рисков
   */
  private async assessRisks(mainTask: Task, subtasks: Task[]): Promise<any> {
    const riskFactors: string[] = [];
    const mitigationStrategies: string[] = [];

    // Анализ рисков на основе сложности
    if (mainTask.complexity === 'critical') {
      riskFactors.push('Высокая сложность может привести к непредвиденным проблемам');
      mitigationStrategies.push('Частые контрольные точки и ревью');
    }

    // Анализ зависимостей
    const dependencyChains = this.analyzeDependencyChains(subtasks);
    if (dependencyChains.maxDepth > 3) {
      riskFactors.push('Длинные цепочки зависимостей могут блокировать прогресс');
      mitigationStrategies.push('Параллельная работа над независимыми задачами');
    }

    // Анализ навыков
    const requiredSkills = [...new Set(subtasks.flatMap(t => t.requiredSkills))];
    if (requiredSkills.length > 5) {
      riskFactors.push('Требуется слишком много разных навыков');
      mitigationStrategies.push('Назначение специализированных агентов');
    }

    const riskLevel = riskFactors.length <= 2 ? 'low' :
                     riskFactors.length <= 4 ? 'medium' : 'high';

    return {
      level: riskLevel,
      factors: riskFactors,
      mitigationStrategies
    };
  }

  /**
   * Создание задач в Linear для отслеживания
   */
  private async createLinearTasks(mainTask: Task, subtasks: Task[]): Promise<void> {
    try {
      const linear = this.integrations.getLinear();
      if (!linear) return;

      // Создание главной задачи
      const mainLinearTask = await linear.createIssue(
        `🎯 ${mainTask.title}`,
        this.formatTaskDescription(mainTask),
        undefined,
        {
          priority: this.mapPriorityToLinear(mainTask.priority),
        }
      );

      // Создание подзадач
      for (const subtask of subtasks) {
        await linear.createIssue(
          `📋 ${subtask.title}`,
          this.formatTaskDescription(subtask),
          mainLinearTask.id,
          {
            priority: this.mapPriorityToLinear(subtask.priority),
          }
        );
      }

    } catch (error) {
      console.warn('Failed to create Linear tasks:', error);
    }
  }

  // Вспомогательные методы
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractTaskTitle(request: string): string {
    // Извлечение краткого заголовка из запроса
    const sentences = request.split('.').filter(s => s.trim().length > 0);
    const firstSentence = sentences[0]?.trim() || request;
    return firstSentence.length > 60 ? firstSentence.substr(0, 60) + '...' : firstSentence;
  }

  private determinePriority(request: string, complexity: Task['complexity']): Task['priority'] {
    const urgentKeywords = ['срочно', 'критично', 'немедленно', 'прямо сейчас'];
    const highKeywords = ['важно', 'приоритет', 'быстро'];

    const requestLower = request.toLowerCase();

    if (urgentKeywords.some(keyword => requestLower.includes(keyword))) {
      return 'urgent';
    }

    if (complexity === 'critical' || highKeywords.some(keyword => requestLower.includes(keyword))) {
      return 'high';
    }

    return complexity === 'simple' ? 'low' : 'medium';
  }

  private generateAcceptanceCriteria(title: string, description: string): string[] {
    // Базовые критерии в зависимости от типа задачи
    const criteria: string[] = [];

    if (title.includes('Анализ')) {
      criteria.push('Создан детальный технический план');
      criteria.push('Выявлены все зависимости и риски');
    }

    if (title.includes('реализация') || title.includes('Основная')) {
      criteria.push('Код написан согласно техническому плану');
      criteria.push('Пройдены все статические проверки (TypeScript, ESLint)');
      criteria.push('Добавлены необходимые типы и интерфейсы');
    }

    if (title.includes('Тестирование')) {
      criteria.push('Покрытие тестами не менее 80%');
      criteria.push('Все тесты проходят успешно');
      criteria.push('Проведено интеграционное тестирование');
    }

    // Универсальные критерии
    criteria.push('Код соответствует стандартам проекта');
    criteria.push('Добавлена соответствующая документация');

    return criteria;
  }

  private identifyRiskFactors(title: string): string[] {
    const risks: string[] = [];

    if (title.includes('интеграция') || title.includes('API')) {
      risks.push('Внешние API могут быть недоступны');
      risks.push('Изменения в API могут сломать функциональность');
    }

    if (title.includes('база данных')) {
      risks.push('Миграция данных может занять больше времени');
      risks.push('Проблемы с производительностью запросов');
    }

    if (title.includes('автоматически') || title.includes('агент')) {
      risks.push('Автоматизация может работать неправильно');
      risks.push('Сложность отладки автоматических процессов');
    }

    return risks;
  }

  private generateRollbackPlan(title: string): string {
    if (title.includes('база данных')) {
      return 'Восстановление из бэкапа базы данных + откат миграций';
    }

    if (title.includes('интеграция')) {
      return 'Отключение интеграции + возврат к предыдущей версии API';
    }

    return 'Git revert + перезапуск сервисов';
  }

  private generateMainTaskCriteria(request: string): string[] {
    return [
      'Все подзадачи завершены успешно',
      'Система работает согласно первоначальным требованиям',
      'Пройдены все тесты и проверки качества',
      'Создана документация по использованию',
      'Проведен финальный код-ревью'
    ];
  }

  private estimateTimeline(subtasks: Task[]): any {
    const totalHours = subtasks.reduce((sum, task) => sum + task.estimatedHours, 0);

    return {
      optimistic: Math.floor(totalHours * 0.8),
      realistic: totalHours,
      pessimistic: Math.floor(totalHours * 1.5)
    };
  }

  private identifyResourceRequirements(subtasks: Task[]): any {
    const skills = [...new Set(subtasks.flatMap(t => t.requiredSkills))];

    const agentTypes = skills.map(skill => {
      switch (skill) {
        case 'frontend': return 'Frontend Developer Agent';
        case 'backend': return 'Backend Developer Agent';
        case 'database': return 'Database Specialist Agent';
        case 'testing': return 'QA Testing Agent';
        case 'devops': return 'DevOps Agent';
        case 'api': return 'API Integration Agent';
        case 'ui-ux': return 'UI/UX Designer Agent';
        default: return 'General Developer Agent';
      }
    });

    return {
      agentTypes: [...new Set(agentTypes)],
      externalDependencies: this.extractExternalDependencies(subtasks),
      criticalPath: this.findCriticalPath(subtasks)
    };
  }

  private extractExternalDependencies(subtasks: Task[]): string[] {
    const dependencies: string[] = [];

    subtasks.forEach(task => {
      if (task.requiredSkills.includes('api')) {
        dependencies.push('External API access');
      }
      if (task.requiredSkills.includes('database')) {
        dependencies.push('Database access');
      }
      if (task.description.includes('третьих сторон')) {
        dependencies.push('Third-party services');
      }
    });

    return [...new Set(dependencies)];
  }

  private findCriticalPath(subtasks: Task[]): string[] {
    // Упрощенный поиск критического пути через зависимости
    const tasksWithDeps = subtasks.filter(task => task.dependencies.length > 0);
    return tasksWithDeps.map(task => task.title);
  }

  private analyzeDependencyChains(subtasks: Task[]): { maxDepth: number; chains: string[][] } {
    const chains: string[][] = [];
    let maxDepth = 0;

    // Упрощенный анализ - в реальности нужен более сложный алгоритм
    subtasks.forEach(task => {
      const chainLength = task.dependencies.length;
      maxDepth = Math.max(maxDepth, chainLength);
    });

    return { maxDepth, chains };
  }

  private formatTaskDescription(task: Task): string {
    return `${task.description}\n\n**Критерии приемки:**\n${task.acceptanceCriteria.map(c => `- ${c}`).join('\n')}\n\n**Оценка времени:** ${task.estimatedHours}ч\n\n**Навыки:** ${task.requiredSkills.join(', ')}`;
  }

  private mapPriorityToLinear(priority: Task['priority']): number {
    switch (priority) {
      case 'urgent': return 1;
      case 'high': return 2;
      case 'medium': return 3;
      case 'low': return 4;
      default: return 3;
    }
  }
}

export default TaskDecomposer;