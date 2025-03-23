import { APIGatewayEvent, Context, ProxyCallback } from 'aws-lambda';
import { resolveApplicationDependencies } from './di/container.ts';

// アプリケーションの依存関係を解決
const { lambdaController } = resolveApplicationDependencies();

// Lambda関数のハンドラー
export const handler = (event: APIGatewayEvent | any, context: Context, callback: ProxyCallback) => {
    return lambdaController.handleEvent(event, context, callback);
};
