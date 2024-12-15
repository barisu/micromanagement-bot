const { App } = require("@slack/bolt");

class Server {
    private app: any;

    constructor() {
        this.app = new App({
            token: process.env.SLACK_BOT_TOKEN,
            signingSecret: process.env.SLACK_SIGNING_SECRET
        });
    }

    async postMessage(channel: string, text: string) {
        try {
            await this.app.client.chat.postMessage({
                channel: channel,
                text: text
            });
            console.log(`Message posted to ${channel}`);
        } catch (error) {
            console.error(`Error posting message: ${error}`);
        }
    }

    async start() {
        await this.app.start(3000);
        console.log('⚡️ Bolt app is running!');
    }
}

export default Server;
