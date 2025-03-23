import { ToDoService } from "../domain/service/ToDoService.ts";
import { NotifyService } from "../domain/service/NotifyService.ts";

export class NotifyUpcomingDeadlineUseCase {
  constructor(
    private todoService: ToDoService,
    private notifier: NotifyService 
  ) {}

  async execute(): Promise<void> {
    const upcomingTodos = await this.todoService.getDeadlineApproachingTodos();

    if (upcomingTodos.length > 0) {
      const message = `以下のタスクの締切が近づいています:\n${upcomingTodos
        .map(todo => `- ${todo.title} (締切: ${todo.dueDate.toLocaleString()})`)
        .join('\n')}`;
      await this.notifier.notify(message);
    }
  }
}
