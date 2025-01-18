import { ToDo } from "../entity/ToDo";

export interface ToDoService {
  /**
   * Create a new ToDo item.
   * @param todo Partial ToDo object containing the required fields for creation.
   * @returns The created ToDo item.
   */
  createToDo(todo: Partial<Omit<ToDo, "id" | "createdAt" | "updatedAt">>): Promise<ToDo>;

  /**
   * Retrieve a ToDo item by its ID.
   * @param id The unique ID of the ToDo item.
   * @returns The corresponding ToDo item, or null if not found.
   */
  getToDoById(id: string): Promise<ToDo | null>;

  /**
   * Retrieve all ToDo items.
   * @returns A list of ToDo items associated with the user.
   */
  getToDos(): Promise<ToDo[]>;

  /**
   * Update an existing ToDo item.
   * @param id The ID of the ToDo item to update.
   * @param updates Partial updates to apply to the ToDo item.
   * @returns The updated ToDo item, or null if the item was not found.
   */
  updateToDo(id: string, updates: Partial<Omit<ToDo, "id" | "userId" | "createdAt">>): Promise<ToDo | null>;

  /**
   * Delete a ToDo item by its ID.
   * @param id The unique ID of the ToDo item to delete.
   * @returns A boolean indicating whether the deletion was successful.
   */
  deleteToDo(id: string): Promise<boolean>;

  /**
   * Mark a ToDo item as completed.
   * @param id The unique ID of the ToDo item.
   * @returns The updated ToDo item, or null if not found.
   */
  markAsCompleted(id: string): Promise<ToDo | null>;

  /**
   * Retrieve ToDo items with deadlines approaching.
   * @returns A list of ToDo items with deadlines within the next 24 hours.
   */
  getDeadlineApproachingTodos(): Promise<(ToDo & Required<Pick<ToDo, 'dueDate'>>)[]>;

  /**
   * Format a ToDo item as a string for display.
   * @param todo The ToDo item to format.
   * @returns A formatted string representing the ToDo item.
   */
  formatToDo(todo: ToDo): string;

  /**
   * Retrive a list of ToDo items that are recent week.
   * @returns A list of ToDo items that are created in the recent week.
   */
  getRecentWeekTodos(): Promise<ToDo[]>;
}
