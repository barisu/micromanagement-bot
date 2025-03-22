import { App, SayFn, SlackEventMiddlewareArgs } from '@slack/bolt';
import { RecentTodosSummaryReportUseCase } from "../src/usecase/RecentTodosSummaryReportUseCase";
import { SlackMessageServiceImpl } from "../src/adapter/SlackMessageServiceImpl";

export class SlackController {
    private recentTodosSummaryReportUseCase: RecentTodosSummaryReportUseCase;
    private slackMessageService: SlackMessageServiceImpl;
    private targetUserId: string;

    constructor(
        recentTodosSummaryReportUseCase: RecentTodosSummaryReportUseCase,
        slackMessageService: SlackMessageServiceImpl,
        targetUserId: string
    ) {
        this.recentTodosSummaryReportUseCase = recentTodosSummaryReportUseCase;
        this.slackMessageService = slackMessageService;
        this.targetUserId = targetUserId;
        
        if (!this.targetUserId) {
            console.error('ユーザーIDが指定されていません。');
        }
    }

    /**
     * Slackアプリにイベントリスナーを登録する
     */
    public registerEventListeners(app: App): void {
        app.event('app_mention', this.handleAppMention.bind(this));
    }

    /**
     * app_mentionイベントのハンドラー
     */
    private async handleAppMention({ event, say }: SlackEventMiddlewareArgs<'app_mention'> & { say: SayFn }): Promise<void> {
        if (!this.targetUserId || event.user !== this.targetUserId) {
            return;
        }

        const text = event.text || '';
        
        if (text.includes('タスク状況')) {
            await this.handleTaskStatusRequest(say, event);
        } else if (text.includes('こんにちは')) {
            await this.handleGreeting(say, event);
        }
    }

    /**
     * タスク状況リクエストの処理
     */
    private async handleTaskStatusRequest(say: SayFn, event: SlackEventMiddlewareArgs<'app_mention'>['event']): Promise<void> {
        const analysis = await this.recentTodosSummaryReportUseCase.execute();
        await say({
            text: analysis || 'なんかエラーが発生したみたいです',
            thread_ts: event.thread_ts || event.ts
        });
    }

    /**
     * 挨拶の処理
     */
    private async handleGreeting(say: SayFn, event: SlackEventMiddlewareArgs<'app_mention'>['event']): Promise<void> {
        await say({
            text: 'こんにちは！',
            thread_ts: event.thread_ts || event.ts
        });
    }

    /**
     * 日次レポートの処理
     */
    public async handleDailyReport(): Promise<void> {
        const analysis = await this.recentTodosSummaryReportUseCase.execute();
        await this.slackMessageService.notify(analysis || 'なんかエラーが発生したみたいです');
    }
}
