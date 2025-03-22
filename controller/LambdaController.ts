import { APIGatewayEvent, Context, ProxyCallback } from 'aws-lambda';
import { SlackController } from './SlackController';
import SlackClient from '../src/lib/SlackBot';

interface CustomBridgeEvent {
    eventType: string;
}

export class LambdaController {
    private slackClient: SlackClient;
    private slackController: SlackController;

    constructor(slackClient: SlackClient, slackController: SlackController) {
        this.slackClient = slackClient;
        this.slackController = slackController;
    }

    /**
     * Lambda関数のハンドラー
     */
    public async handleEvent(
        event: APIGatewayEvent | CustomBridgeEvent, 
        context: Context, 
        callback: ProxyCallback
    ) {
        // EventBridgeからの定期実行イベントの処理
        if ('eventType' in event && event.eventType === 'dailyReport') {
            await this.slackController.handleDailyReport();
        }

        // Slackイベントの処理
        const handler = await this.slackClient.getReceiver().start();
        return handler(event, context, callback);
    }
}
