import { google, tasks_v1 } from "googleapis";
import { ToDoService } from "./ToDoService";
import { ToDo } from "../entity/ToDo";
import { GoogleOAuth2 } from "../../lib/GoogleOAuth2";
import { GoogleServiceAccountAuth } from "../../lib/GoogleServiceAccountAuth";
import { SCOPE_URLS } from "../../constants";

export class GoogleTasksToDoService implements ToDoService {
    private auth: any;
    private taskListId: string;
    private tasks: tasks_v1.Tasks;

    constructor(taskListId: string) {

        if (process.env.NODE_ENV !== "test") {
            this.auth = GoogleOAuth2.getAuthClient();
            const url = GoogleOAuth2.generateAuthUrl(SCOPE_URLS);
            console.log(`Please visit this URL to authorize this application: ${url}`);
            this.tasks = google.tasks({ version: "v1", auth: this.auth });

            if (!process.env.TASK_LIST_ID) throw new Error("TASK_LIST_ID is not set.");
            this.taskListId = taskListId;
        } else {
            this.auth = GoogleServiceAccountAuth.getAuthClient();
            this.tasks = google.tasks({ version: "v1", auth: this.auth });

            if (!process.env.TASK_LIST_ID) throw new Error("TASK_LIST_ID is not set.");
            this.taskListId = taskListId;
        }
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
}

