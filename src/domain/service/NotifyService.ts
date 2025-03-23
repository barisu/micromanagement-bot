import { ToDo } from "../entity/ToDo.ts";
export interface NotifyService {
    notify(message: string): Promise<void>;
    notifyTodos(todos: ToDo[]): Promise<void>;
}
