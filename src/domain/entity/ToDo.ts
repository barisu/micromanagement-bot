// Entity for a ToDo item
export interface ToDo {
  id: string; // Unique identifier for the task
  userId: string; // Slack user ID to associate the task with a user
  title: string; // Brief description of the task
  description?: string; // Detailed description of the task
  status: "pending" | "in_progress" | "completed"; // Current status of the task
  dueDate?: Date; // Optional due date for the task
  createdAt: Date; // Timestamp for when the task was created
  updatedAt: Date; // Timestamp for the last update
  priority?: "low" | "medium" | "high"; // Priority level of the task
  tags?: string[]; // Optional tags for categorizing tasks
}
