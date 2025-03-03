import { google, tasks_v1, Auth } from "googleapis";
import { ToDoService } from "../domain/service/ToDoService";
import { ToDo } from "../domain/entity/ToDo";

import { injectable } from 'typed-inject';

@injectable()
export class GoogleTasksToDoService implements ToDoService {
    private taskListId: string;
    private tasks: tasks_v1.Tasks;

    constructor(auth: Auth.OAuth2Client | Auth.GoogleAuth, taskListId: string) {
        this.tasks = google.tasks({ version: "v1", auth: auth });

        if (!process.env.TASK_LIST_ID) throw new Error("TASK_LIST_ID is not set.");
        this.taskListId = taskListId;
    }

    // タスクを作成する
    async createToDo(todo: Partial<Omit<ToDo, "id" | "createdAt" | "updatedAt">>): Promise<ToDo> {
        const task = await this.tasks.tasks.insert({
            tasklist: this.taskListId,
            requestBody: {
                title: todo.title,
                notes: todo.description,
                due: todo.dueDate?.toISOString(),
            },
        });

        return {
            id: task.data.id || "",
            userId: "", // Google Tasks ではユーザー情報が不要
            title: todo.title || "",
            description: todo.description,
            status: "pending",
            dueDate: todo.dueDate,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }

    // ID でタスクを取得する
    async getToDoById(id: string): Promise<ToDo | null> {
        const task = await this.tasks.tasks.get({
            tasklist: this.taskListId,
            task: id,
        });

        if (!task.data) return null;
        if (task.data.deleted) return null;

        return {
            id: task.data.id || "",
            userId: "",
            title: task.data.title || "",
            description: task.data.notes || "",
            status: task.data.status === "completed" ? "completed" : "pending",
            dueDate: task.data.due ? new Date(task.data.due) : undefined,
            createdAt: new Date(task.data.updated || ""),
            updatedAt: new Date(task.data.updated || ""),
        };
    }

    // ユーザー ID に紐づくタスクを取得する
    async getToDos(): Promise<ToDo[]> {
        try {
            const tasksList = await this.tasks.tasks.list({
                tasklist: this.taskListId
            });

            return (
                tasksList.data.items?.map(task => ({
                    id: task.id || "",
                    userId: "",
                    title: task.title || "",
                    description: task.notes || "",
                    status: task.status === "completed" ? "completed" : "pending",
                    dueDate: task.due ? new Date(task.due) : undefined,
                    createdAt: new Date(task.updated || ""),
                    updatedAt: new Date(task.updated || ""),
                })) || []
            );
        }
        catch (error) {
            console.error(error);
            return [];
        }
    }

    // タスクを更新する
    async updateToDo(id: string, updates: Partial<Omit<ToDo, "id" | "userId" | "createdAt">>): Promise<ToDo | null> {
        const task = await this.tasks.tasks.get({
            tasklist: this.taskListId,
            task: id,
        });

        if (!task.data) return null;

        const updatedTask = await this.tasks.tasks.update({
            tasklist: this.taskListId,
            task: id,
            requestBody: {
                ...task.data,
                title: updates.title || task.data.title,
                notes: updates.description || task.data.notes,
                due: updates.dueDate?.toISOString() || task.data.due,
            },
        });

        return {
            id: updatedTask.data.id || "",
            userId: "",
            title: updatedTask.data.title || "",
            description: updatedTask.data.notes || "",
            status: updatedTask.data.status === "completed" ? "completed" : "pending",
            dueDate: updatedTask.data.due ? new Date(updatedTask.data.due) : undefined,
            createdAt: new Date(updatedTask.data.updated || ""),
            updatedAt: new Date(updatedTask.data.updated || ""),
        };
    }

    // タスクを削除する
    async deleteToDo(id: string): Promise<boolean> {
        try {
            const response = await this.tasks.tasks.delete({
                tasklist: this.taskListId,
                task: id,
            });
            const isDeleted = response.status === 204;
            return isDeleted;
        } catch {
            return false;
        }
    }

    // タスクを完了済みにマークする
    async markAsCompleted(id: string): Promise<ToDo | null> {
        const task = await this.tasks.tasks.get({
            tasklist: this.taskListId,
            task: id,
        });

        if (!task.data) return null;

        const updatedTask = await this.tasks.tasks.update({
            tasklist: this.taskListId,
            task: id,
            requestBody: {
                ...task.data,
                status: "completed",
            },
        });

        return {
            id: updatedTask.data.id || "",
            userId: "",
            title: updatedTask.data.title || "",
            description: updatedTask.data.notes || "",
            status: "completed",
            dueDate: updatedTask.data.due ? new Date(updatedTask.data.due) : undefined,
            createdAt: new Date(updatedTask.data.updated || ""),
            updatedAt: new Date(updatedTask.data.updated || ""),
        };
    }

    async getDeadlineApproachingTodos(): Promise<(ToDo & Required<Pick<ToDo, 'dueDate'>>)[]> {
        const tasks = await this.getToDos();
        const now = new Date();
        const deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1日後
        console.log(deadline);

       return tasks.filter(task => task.dueDate && task.dueDate < deadline)
            .map(task => ({ ...task, dueDate: task.dueDate! }));
    }

    formatToDo(todo: ToDo): string {
        const formattedDate = todo.dueDate ? todo.dueDate.toLocaleDateString() : "No due date";
        return `ID: ${todo.id}\nTitle: ${todo.title}\nDescription: ${todo.description}\nDue Date: ${formattedDate}\nStatus: ${todo.status}\nCreated At: ${todo.createdAt.toLocaleString()}\nUpdated At: ${todo.updatedAt.toLocaleString()}\n`;
    }

    async getRecentWeekTodos(): Promise<ToDo[]> {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7日前
        console.log(oneWeekAgo);
        
        const response = await this.tasks.tasks.list({
            tasklist: this.taskListId,
            dueMin: oneWeekAgo.toISOString(),
            dueMax: now.toISOString(),
        });

        if (!response.data.items) return [];

        return response.data.items.map(task => ({
            id: task.id || "",
            userId: "",
            title: task.title || "",
            description: task.notes || "",
            status: task.status === "completed" ? "completed" : "pending",
            dueDate: task.due ? new Date(task.due) : undefined,
            createdAt: new Date(task.updated || ""),
            updatedAt: new Date(task.updated || ""),
        }));
    }
}
