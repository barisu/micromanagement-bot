import { ToDo } from "../domain/entity/ToDo";
import { NotifyService } from "../domain/service/NotifyService";
import { ToDoService } from "../domain/service/ToDoService";
import SlackClient from "../lib/SlackBot";
import { inject } from 'typed-inject';

import { injectable } from 'typed-inject';

@injectable()
export class SlackMessageService implements NotifyService {
    private client: SlackClient;
    private  todoService: ToDoService;

    constructor(client: SlackClient, @inject(ToDoService) todoService: ToDoService) {
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
