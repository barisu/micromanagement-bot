import { NotifyService } from "../domain/service/NotifyService";
import SlackClient from "../lib/SlackBot";

export class SlackMessageService implements NotifyService {
    private client: SlackClient;

    constructor(client: SlackClient) {
        this.client = client;
    }

    async notify(message: string): Promise<void> {
        await this.client.postMessage(process.env.SLACK_CHANNEL_ID || "", message);
    }
}
