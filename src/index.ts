import { GoogleOAuth2 } from './lib/GoogleOAuth2';
import SlackClient from './lib/SlackBot';
import { GoogleTaskTodoRepositoryImpl } from './adapter/GoogleTaskTodoRepositoryImpl';
import { ToDoService } from './domain/service/ToDoService';
import { GoogleServiceAccountAuth } from './lib/GoogleServiceAccountAuth';
import { SlackMessageServiceImpl } from './adapter/SlackMessageServiceImpl';
import { OpenAIAdvisorServiceImpl } from './adapter/OpenAIAdvisorServiceImpl';
import { RecentTodosSummaryReportUseCase } from './usecase/RecentTodosSummaryReportUseCase';
import { SlackController } from '../controller/SlackController';
import { LambdaController } from '../controller/LambdaController';
import { APIGatewayEvent, Context, ProxyCallback } from 'aws-lambda';

// 依存関係の初期化
const slackClient = new SlackClient();
const isTest = process.env.NODE_ENV === 'test';
const auth = isTest ? GoogleServiceAccountAuth.getAuthClient() : GoogleOAuth2.getAuthClient();

if (process.env.TASK_LIST_ID == null) {
    throw Error('タスクリストIDが指定されていません。');
}

// サービスの初期化
const todoService: ToDoService = new GoogleTaskTodoRepositoryImpl(auth, process.env.TASK_LIST_ID);
const slackMessageService = new SlackMessageServiceImpl(slackClient, todoService);
const openAIAdvisorService = new OpenAIAdvisorServiceImpl();
const recentTodosSummaryReportUseCase = new RecentTodosSummaryReportUseCase(
    todoService,
    openAIAdvisorService
);

// コントローラーの初期化
const targetUserId = process.env.SLACK_USER_ID;
if (!targetUserId) {
    console.error('ユーザーIDが指定されていません。');
}

const slackController = new SlackController(
    recentTodosSummaryReportUseCase,
    slackMessageService,
    targetUserId || ''
);

// Slackイベントリスナーの登録
slackController.registerEventListeners(slackClient.getBoltApp());

// Lambdaコントローラーの初期化
const lambdaController = new LambdaController(slackClient, slackController);

// Lambda関数のハンドラー
export const handler = (event: APIGatewayEvent | any, context: Context, callback: ProxyCallback) => {
    return lambdaController.handleEvent(event, context, callback);
};
