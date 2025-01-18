import { ToDoService } from "../domain/service/ToDoService";
import { NotifyService } from "../domain/service/NotifyService";

export class ToDoCheck {

    constructor(
        private todoService: ToDoService,
        private notifyService: NotifyService
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
                await this.checkDeadlines()
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
}
