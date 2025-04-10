import { ToDo } from "../domain/entity/ToDo.ts";
import { NotifyService } from "../domain/service/NotifyService.ts";
import { ToDoService } from "../domain/service/ToDoService.ts";
import SlackClient from "../lib/SlackBot.ts";

export class SlackMessageServiceImpl implements NotifyService {
    private client: SlackClient;
    private todoService: ToDoService;

    public static inject = ['slackClient', 'todoService'] as const;

    constructor(client: SlackClient, todoService: ToDoService) {
        this.client = client;
        this.todoService = todoService;
    }

    async notify(message: string): Promise<void> {
        if (!process.env.SLACK_CHANNEL) {
            throw new Error("SLACK_CHANNEL is not set");
        }
        await this.client.postMessage(process.env.SLACK_CHANNEL, message);
    }

    async notifyTodos(todos: ToDo[]): Promise<void> {
        const message = todos.map((todo) => {
            return this.todoService.formatToDo(todo);
        }).join("\n");
        await this.notify(message);
    }
}
