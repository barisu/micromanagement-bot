import type { AwsEvent, AwsCallback } from '@slack/bolt/dist/receivers/AwsLambdaReceiver';
import { SlackController } from './SlackController';
import SlackClient from '../src/lib/SlackBot';

interface CustomBridgeEvent {
    eventType: string;
}

export class LambdaController {
    private slackClient: SlackClient;
    private slackController: SlackController;

    public static inject = ['slackClient', 'slackController'] as const;

    constructor(slackClient: SlackClient, slackController: SlackController) {
        this.slackClient = slackClient;
        this.slackController = slackController;
    }

    /**
     * Lambda関数のハンドラー
     */
    public async handleEvent(
        event: AwsEvent | CustomBridgeEvent,
        context: any,
        callback: AwsCallback
    ) {
        // EventBridgeからの定期実行イベントの処理
        if ('eventType' in event && event.eventType === 'dailyReport') {
            await this.slackController.handleDailyReport();
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Daily report processed successfully' })
            };
        }

        // Slackイベントの処理
        const handler = await this.slackClient.getReceiver().start();
        return handler(event as AwsEvent, context, callback);
    }
}
