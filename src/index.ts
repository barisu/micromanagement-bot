import Server from './lib/SlackBot';

const server = new Server();

(async () => {
    await server.start();
    if (process.env.SLACK_CHANNEL == null)
        throw Error('チャンネル名が指定されていません。');
})()
