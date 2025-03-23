import { createInjector } from 'typed-inject';
import { TOKENS } from '../../src/di/tokens.ts';
import { SlackMessageServiceImpl } from '../../src/adapter/SlackMessageServiceImpl.ts';
import { RecentTodosSummaryReportUseCase } from '../../src/usecase/RecentTodosSummaryReportUseCase.ts';
import { SlackController } from '../../controller/SlackController.ts';
import { LambdaController } from '../../controller/LambdaController.ts';
import { ToDoService } from '../../src/domain/service/ToDoService.ts';
import { NotifyService } from '../../src/domain/service/NotifyService.ts';
import { AIAdvisorService } from '../../src/domain/service/AIAdvisorService.ts';
import SlackClient from '../../src/lib/SlackBot.ts';
import { Auth } from 'googleapis';

/**
 * テスト用のモックを作成する
 */
export function createMocks() {
  // モックの作成
  const mockSlackClient = {} as SlackClient;
  const mockAuth = {} as Auth.OAuth2Client;
  const mockTaskListId = 'test-task-list-id';
  const mockTargetUserId = 'test-user-id';
  const mockTodoService = {} as ToDoService;
  const mockNotifyService = {} as NotifyService;
  const mockAIAdvisorService = {} as AIAdvisorService;

  return {
    mockSlackClient,
    mockAuth,
    mockTaskListId,
    mockTargetUserId,
    mockTodoService,
    mockNotifyService,
    mockAIAdvisorService
  };
}

/**
 * テスト用のDIコンテナを作成する
 */
export function createTestContainer() {
  const {
    mockSlackClient,
    mockAuth,
    mockTaskListId,
    mockTargetUserId,
    mockTodoService,
    mockNotifyService,
    mockAIAdvisorService
  } = createMocks();

  // DIコンテナの作成
  const injector = createInjector()
    .provideValue(TOKENS.slackClient, mockSlackClient)
    .provideValue(TOKENS.auth, mockAuth)
    .provideValue(TOKENS.taskListId, mockTaskListId)
    .provideValue(TOKENS.targetUserId, mockTargetUserId)
    .provideValue(TOKENS.todoService, mockTodoService)
    .provideValue(TOKENS.notifyService, mockNotifyService)
    .provideValue(TOKENS.aiAdvisorService, mockAIAdvisorService);

  return injector;
}

/**
 * テスト用の依存関係を解決する
 */
export function resolveTestDependencies() {
  const injector = createTestContainer();

  // RecentTodosSummaryReportUseCaseの解決
  const recentTodosSummaryReportUseCase = new RecentTodosSummaryReportUseCase(
    injector.resolve(TOKENS.todoService),
    injector.resolve(TOKENS.aiAdvisorService)
  );

  // SlackControllerの解決
  const slackController = new SlackController(
    recentTodosSummaryReportUseCase,
    injector.resolve(TOKENS.notifyService) as SlackMessageServiceImpl,
    injector.resolve(TOKENS.targetUserId)
  );

  // Lambdaコントローラーの初期化
  const lambdaController = new LambdaController(
    injector.resolve(TOKENS.slackClient),
    slackController
  );

  return {
    injector,
    recentTodosSummaryReportUseCase,
    slackController,
    lambdaController
  };
}
