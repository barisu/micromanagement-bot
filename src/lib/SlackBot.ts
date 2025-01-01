const { App, ExpressReceiver } = require("@slack/bolt");

class SlackClient {
    private boltApp: typeof App;
    private receiver: typeof ExpressReceiver;

    constructor() {
        this.receiver = new ExpressReceiver({
            signingSecret: process.env.SLACK_SIGNING_SECRET,
            processBeforeResponse: true,
        });
        this.boltApp = new App({
            token: process.env.SLACK_BOT_TOKEN,
            signingSecret: process.env.SLACK_SIGNING_SECRET,
            receiver: this.receiver
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
        return this.receiver;
    }
}

export default SlackClient;
