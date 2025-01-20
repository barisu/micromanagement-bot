import { ToDoService } from "../domain/service/ToDoService";
import { NotifyService } from "../domain/service/NotifyService";
import { AIAdvisorService } from "../domain/service/AIAdvisorService";

export class ToDoCheck {

    constructor(
        private todoService: ToDoService,
        private notifyService: NotifyService,
        private advisorService: AIAdvisorService
    ) {
        this.startDailyCheck();
    }

    private startDailyCheck(): void {
        const scheduleNextCheck = () => {
            const now = new Date();
            const nextCheck = new Date(now);
            nextCheck.setHours(11, 0, 0, 0); // UTC 11:00 = JST 20:00

            if (now.getHours() >= 11) { // UTC 11時以降の場合は翌日にスケジュール
                nextCheck.setDate(nextCheck.getDate() + 1);
            }

            const timeUntilNextCheck = nextCheck.getTime() - now.getTime();

            setTimeout(async () => {
                await this.checkDeadlines();
                await this.recentTodosSummaryReport();
                scheduleNextCheck();
            }, timeUntilNextCheck);
        };

        scheduleNextCheck();
    }

    private async checkDeadlines(): Promise<void> {
        try {
            const approachingTodos = await this.todoService.getDeadlineApproachingTodos();
            
            if (approachingTodos.length > 0) {
               
                await this.notifyService.notify("You have tasks due within 24 hours:");
                await this.notifyService.notifyTodos(approachingTodos);
            }
        } catch (error) {
            console.error('Failed to check deadlines:', error);
        }
    }

    private async recentTodosSummaryReport(): Promise<void> {
        try {
            const recentTodos = await this.todoService.getRecentWeekTodos();
            const analysis = await this.advisorService.analyzeTodoProgress(recentTodos);
            await this.notifyService.notify(analysis);
        } catch (error) {
            console.error('Failed to generate recent todos summary report:', error);
        }
    }
}
