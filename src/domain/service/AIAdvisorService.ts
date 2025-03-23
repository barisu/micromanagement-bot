import { ToDo } from "../entity/ToDo.ts";

export interface AIAdvisorService {
    analyzeTodoProgress(todos: ToDo[]): Promise<string>;
    suggestImprovements(todos: ToDo[]): Promise<string>;
    getPrioritySuggestions(todos: ToDo[]): Promise<string>;
}
