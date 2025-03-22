import { createInjector } from 'typed-inject';
import { TOKENS, Services } from './tokens';
import { GoogleOAuth2 } from '../lib/GoogleOAuth2';
import { GoogleServiceAccountAuth } from '../lib/GoogleServiceAccountAuth';
import SlackClient from '../lib/SlackBot';
import { GoogleTaskTodoRepositoryImpl } from '../adapter/GoogleTaskTodoRepositoryImpl';
import { SlackMessageServiceImpl } from '../adapter/SlackMessageServiceImpl';
import { OpenAIAdvisorServiceImpl } from '../adapter/OpenAIAdvisorServiceImpl';
import { RecentTodosSummaryReportUseCase } from '../usecase/RecentTodosSummaryReportUseCase';
import { SlackController } from '../../controller/SlackController';
import { LambdaController } from '../../controller/LambdaController';

/**
 * DIコンテナを作成する
 */
export function createContainer() {
  // 環境変数の検証
  if (process.env.TASK_LIST_ID == null) {
    throw Error('タスクリストIDが指定されていません。');
  }

  const targetUserId = process.env.SLACK_USER_ID;
  if (!targetUserId) {
    console.error('ユーザーIDが指定されていません。');
  }

  // 基本的な依存関係の初期化
  const slackClient = new SlackClient();
  const isTest = process.env.NODE_ENV === 'test';
  const auth = isTest ? GoogleServiceAccountAuth.getAuthClient() : GoogleOAuth2.getAuthClient();

  // DIコンテナの作成
  const injector = createInjector()
    .provideValue(TOKENS.slackClient, slackClient)
    .provideValue(TOKENS.auth, auth)
    .provideValue(TOKENS.taskListId, process.env.TASK_LIST_ID)
    .provideValue(TOKENS.targetUserId, targetUserId || '')
    .provideClass(TOKENS.todoService, GoogleTaskTodoRepositoryImpl)
    .provideClass(TOKENS.aiAdvisorService, OpenAIAdvisorServiceImpl)
    .provideClass(TOKENS.notifyService, SlackMessageServiceImpl);

  return injector;
}

/**
 * アプリケーションの依存関係を解決する
 */
export function resolveApplicationDependencies() {
  const injector = createContainer();

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

  // Slackイベントリスナーの登録
  const slackClient = injector.resolve(TOKENS.slackClient);
  slackController.registerEventListeners(slackClient.getBoltApp());

  // Lambdaコントローラーの初期化
  const lambdaController = new LambdaController(slackClient, slackController);

  return {
    slackController,
    lambdaController
  };
}
