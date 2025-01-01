import { describe, it, beforeAll, afterAll, expect } from "vitest";
import { google, tasks_v1 } from "googleapis";
import { GoogleTasksToDoService } from "../../src/adapter/GoogleTasksToDoService";
import { ToDo } from "../../src/domain/entity/ToDo";
import { readFileSync } from "fs";
import { SCOPE_URLS } from "../../src/constants";

describe("GoogleTasksToDoService Integration Tests", () => {
  let service: GoogleTasksToDoService;
  let testTaskListId: string;
  let tasksApi: tasks_v1.Tasks;

  beforeAll(async () => {
    // 認証設定
    const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!keyFilePath) throw new Error("GOOGLE_APPLICATION_CREDENTIALS is not set.");

    const key = JSON.parse(readFileSync(keyFilePath, "utf8"));

    const auth = new google.auth.GoogleAuth({
      credentials: key,
      scopes: SCOPE_URLS,
    });

    tasksApi = google.tasks({ version: "v1", auth });

    // テスト用のタスクリストを作成
    const response = await tasksApi.tasklists.insert({
      requestBody: {
        title: "Test Task List",
      },
    });

    testTaskListId = response.data.id!;
    const taskListId = testTaskListId;

    // サービスインスタンスを初期化
    service = new GoogleTasksToDoService(auth,taskListId);
  });

  afterAll(async () => {
    // テスト用タスクリストの削除
    if (tasksApi && testTaskListId) {
      await tasksApi.tasklists.delete({ tasklist: testTaskListId });
    }
  });

  it("should create a new task", async () => {
    const newTask: Partial<Omit<ToDo, "id" | "createdAt" | "updatedAt">> = {
      title: "Test Task",
      description: "This is a test task description",
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1日後
    };

    const createdTask = await service.createToDo(newTask);

    expect(createdTask).toHaveProperty("id");
    expect(createdTask.title).toBe(newTask.title);
    expect(createdTask.description).toBe(newTask.description);
  });

  it("should list tasks", async () => {
    const tasks = await service.getToDos();

    expect(tasks).toBeInstanceOf(Array);
    expect(tasks.length).toBeGreaterThan(0);
  });

  it("should update a task", async () => {
    // タスクを新規作成
    const newTask = await service.createToDo({
      title: "Task to Update",
      description: "Original Description",
    });

    const updatedTask = await service.updateToDo(newTask.id, {
      title: "Updated Task Title",
      description: "Updated Description",
    });

    expect(updatedTask).not.toBeNull();
    expect(updatedTask?.title).toBe("Updated Task Title");
    expect(updatedTask?.description).toBe("Updated Description");
  });

  it("should mark a task as completed", async () => {
    const task = await service.createToDo({
      title: "Task to Complete",
    });

    const completedTask = await service.markAsCompleted(task.id);

    expect(completedTask).not.toBeNull();
    expect(completedTask?.status).toBe("completed");
  });

  it("should delete a task", async () => {
    const task = await service.createToDo({
      title: "Task to Delete",
    });

    const result = await service.deleteToDo(task.id);

    expect(result).toBe(true);

    const deletedTask = await service.getToDoById(task.id);
    expect(deletedTask).toBeNull();
  });
});
