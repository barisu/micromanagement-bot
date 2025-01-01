import { GoogleOAuth2 } from './lib/GoogleOAuth2';
import SlackClient from './lib/SlackBot';
import { GoogleTasksToDoService } from './adapter/GoogleTasksToDoService';
import { ToDoService } from './domain/service/ToDoService';
import { GoogleServiceAccountAuth } from './lib/GoogleServiceAccountAuth';
import { SCOPE_URLS } from './constants';
import { getTaskLists } from './getTaskList';

import { Request, Response } from 'express';

const slackClient = new SlackClient();

const isTest = process.env.NODE_ENV === 'test';
const auth = isTest ? GoogleOAuth2.getAuthClient() : GoogleServiceAccountAuth.getAuthClient();

if (process.env.TASK_LIST_ID == null)
    throw Error('タスクリストIDが指定されていません。');
export const todoService: ToDoService = new GoogleTasksToDoService(auth, process.env.TASK_LIST_ID);

slackClient.getReceiver().router.get('/auth/google', async (req: Request, res: Response) => {
    const url = GoogleOAuth2.generateAuthUrl(SCOPE_URLS);
    res.redirect(url);
});

slackClient.getReceiver().router.get('/auth/callback', async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const { accessToken, refreshToken } = await GoogleOAuth2.getToken(code);
    res.send(`Access token: ${accessToken}, Refresh token: ${refreshToken}`);
});

// slackClient.getReceiver().router.get('/todolist', async (req: Request, res: Response) => {
//     const taskLists = await getTaskLists(GoogleOAuth2.getAuthClient());
//     res.json(taskLists.map(taskList => {
//         return {
//             taskListTitle: taskList.title,
//             taskListId: taskList.id
//         }
//     }));
// });

(async () => {
    await slackClient.start();
    if (process.env.SLACK_CHANNEL == null)
        throw Error('チャンネル名が指定されていません。');
})();
