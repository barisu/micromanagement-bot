
import { ToDoService } from "../domain/service/ToDoService";
import { AIAdvisorService } from "../domain/service/AIAdvisorService";

export class RecentTodosSummaryReportUseCase {
    constructor(
        private todoService: ToDoService,
        private advisorService: AIAdvisorService
    ) {}

    async execute(): Promise<string> {
        try {
            const recentTodos = await this.todoService.getDeadlineApproachingTodos();
            const analysis = await this.advisorService.analyzeTodoProgress(recentTodos);
            return analysis;
        } catch (error) {
            console.error('Failed to generate recent todos summary report:', error);
            throw error;
        }
    }
}
