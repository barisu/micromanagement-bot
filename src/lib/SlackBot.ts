const { App, AwsLambdaReceiver } = require("@slack/bolt");
import { Context } from '@slack/bolt';

class SlackClient {
    private boltApp: typeof App;
    private awsLambdaReceiver: typeof AwsLambdaReceiver;

    constructor() {
        this.awsLambdaReceiver = new AwsLambdaReceiver({
            signingSecret: process.env.SLACK_SIGNING_SECRET,
        });

        this.boltApp = new App({
            token: process.env.SLACK_BOT_TOKEN,
            signingSecret: process.env.SLACK_SIGNING_SECRET,
            receiver: this.awsLambdaReceiver
        });

        this.boltApp.use(async ({context, next}: { context: Context, next: () => Promise<void> }) => {
            // Ignore Retry Requests
            if (context.retryNum){
                return;
            }

            await next();
        });
    }

    async postMessage(channel: string, text: string) {
        try {
            await this.boltApp.client.chat.postMessage({
                channel: channel,
                text: text
            });
            console.log(`Message posted to ${channel}`);
        } catch (error) {
            console.error(`Error posting message: ${error}`);
        }
    }

    async start() {
        await this.boltApp.start(3000);
        console.log('⚡️ Bolt app is running!');
    }

    async stop() {
        await this.boltApp.stop();
        console.log('⚡️ Bolt app is stopped!');
    }

    getBoltApp() {
        return this.boltApp;
    }

    getReceiver() {
        return this.awsLambdaReceiver;
    }
}

export default SlackClient;
