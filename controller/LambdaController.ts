// AwsEvent と AwsCallback の型定義
// slack boltからハードコピーしたもの
type AwsEventStringParameters = Record<string, string | undefined>;
type AwsEventMultiValueStringParameters = Record<string, string[] | undefined>;

interface AwsEventV1 {
    body: string | null;
    headers: AwsEventStringParameters;
    isBase64Encoded: boolean;
    pathParameters: AwsEventStringParameters | null;
    queryStringParameters: AwsEventStringParameters | null;
    requestContext: any;
    stageVariables: AwsEventStringParameters | null;
    httpMethod: string;
    multiValueHeaders: AwsEventMultiValueStringParameters;
    multiValueQueryStringParameters: AwsEventMultiValueStringParameters;
    path: string;
    resource: string;
}

interface AwsEventV2 {
    body?: string;
    headers: AwsEventStringParameters;
    isBase64Encoded: boolean;
    pathParameters?: AwsEventStringParameters;
    queryStringParameters?: AwsEventStringParameters;
    requestContext: any;
    stageVariables?: AwsEventStringParameters;
    cookies?: string[];
    rawPath: string;
    rawQueryString: string;
    routeKey: string;
    version: string;
}

type AwsEvent = AwsEventV1 | AwsEventV2;
type AwsCallback = (error?: Error | string | null, result?: any) => void;
import { SlackController } from './SlackController.ts';
import SlackClient from '../src/lib/SlackBot.ts';

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
