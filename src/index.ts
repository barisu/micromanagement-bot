import { GoogleOAuth2 } from './lib/GoogleOAuth2';
import SlackClient from './lib/SlackBot';
import { GoogleTasksToDoService } from './adapter/GoogleTasksToDoService';
import { ToDoService } from './domain/service/ToDoService';
import { GoogleServiceAccountAuth } from './lib/GoogleServiceAccountAuth';
import { SayFn } from '@slack/bolt';
import { GenericMessageEvent } from '@slack/types';

import { ToDoCheck } from './cron/ToDoCheck';
import { SlackMessageService } from './adapter/SlackMessageService';
import { OpenAIAdvisorService } from './adapter/OpenAIAdvisorService';
import { RecentTodosSummaryReportUseCase } from './usecase/RecentTodosSummaryReportUseCase';

import {APIGatewayEvent, Context, ProxyCallback,EventBridgeEvent} from 'aws-lambda';

const slackClient = new SlackClient();

const isTest = process.env.NODE_ENV === 'test';
const auth = isTest ? GoogleServiceAccountAuth.getAuthClient() : GoogleOAuth2.getAuthClient();

if (process.env.TASK_LIST_ID == null)
    throw Error('タスクリストIDが指定されていません。');

const todoService: ToDoService = new GoogleTasksToDoService(auth, process.env.TASK_LIST_ID);
const slackMessageService = new SlackMessageService(slackClient, todoService);
const openAIAdvisorService = new OpenAIAdvisorService();
const recentTodosSummaryReportUseCase = new RecentTodosSummaryReportUseCase(
    todoService,
    openAIAdvisorService
);

// slackClient.getReceiver().router.get('/auth/google', async (req: Request, res: Response) => {
//     const url = GoogleOAuth2.generateAuthUrl(SCOPE_URLS);
//     res.redirect(url);
// });

// slackClient.getReceiver().router.get('/auth/callback', async (req: Request, res: Response) => {
//     const code = req.query.code as string;
//     const { accessToken, refreshToken } = await GoogleOAuth2.getToken(code);
//     res.send(`Access token: ${accessToken}, Refresh token: ${refreshToken}`);
// });

// slackClient.getReceiver().router.get('/todolist', async (req: Request, res: Response) => {
//     const taskLists = await getTaskLists(GoogleOAuth2.getAuthClient());
//     res.json(taskLists.map(taskList => {
//         return {
//             taskListTitle: taskList.title,
//             taskListId: taskList.id
//         }
//     }));
// });

// 定期実行処理
// new ToDoCheck(todoService, slackMessageService,recentTodosSummaryReportUseCase);

// slackClient.start()の前に以下のコードを追加
slackClient.getBoltApp().event('app_mention', async ({ event, say }: {event: GenericMessageEvent, say: SayFn }) => {
    const targetUserId = process.env.SLACK_USER_ID; // 特定のユーザーのSlack ID
    if (targetUserId == null){
        console.error('ユーザーIDが指定されていません。');
        return;
    }
    const triggerPhrase = 'タスク状況'; // トリガーとなる特定の文字列
    const hello = 'こんにちは'; // トリガーとなる特定の文字列
    
    if (event.user === targetUserId && event.text?.includes(triggerPhrase)) {
        const analysis = await recentTodosSummaryReportUseCase.execute();

        await say({
            text: analysis || 'なんかエラーが発生したみたいです',
            thread_ts: event.thread_ts || event.ts
        });
    }
    else if (event.user === targetUserId && event.text?.includes(hello)) {
        await say({
            text: 'こんにちは！',
            thread_ts: event.thread_ts || event.ts
        });
    }
});

interface CustomBridgeEvent {
    eventType: string;
}

// Handle the Lambda function event
export const handler = async (event: APIGatewayEvent | CustomBridgeEvent, context: Context, callback: ProxyCallback) => {
    if ('eventType' in event && event.eventType === 'dailyReport') {
        const analysis = await recentTodosSummaryReportUseCase.execute();
        await slackMessageService.notify(analysis || 'なんかエラーが発生したみたいです');
    }
    const handler = await slackClient.getReceiver().start();
    return handler(event, context, callback);
}
