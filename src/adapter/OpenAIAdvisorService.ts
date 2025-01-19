import OpenAI from 'openai';
import { AIAdvisorService } from '../domain/service/AIAdvisorService';
import { ToDo } from '../domain/entity/ToDo';

export enum LLMModel {
    GPT35Turbo = 'gpt-3.5-turbo',
    GPT4omini = 'gpt-4o-mini',
    GPT4o = 'gpt-4o',
}

export class OpenAIAdvisorService implements AIAdvisorService {
    private openai: OpenAI;
    private model: LLMModel;
    private readonly systemPrompt = "あなたはタスク管理アプリのアドバイザーです。やり取りは基本的に日本語で行います。基本的には優しく、しかし時には厳しく、しかし常に建設的なアドバイスを提供します。";

    constructor(model: LLMModel = LLMModel.GPT4o) {
        this.openai = new OpenAI();
        this.model = model;
    }

    async analyzeTodoProgress(todos: ToDo[]): Promise<string> {
        const completedTodos = todos.filter(todo => todo.status === 'completed');
        const completionRate = (completedTodos.length / todos.length) * 100;

        const prompt = `
            タスクの完了率は${completionRate}%です。
            完了タスク数: ${completedTodos.length}
            未完了タスク数: ${todos.length - completedTodos.length}
            
            これらの情報を元に、タスクの進捗状況を分析し、建設的なアドバイスを提供してください。
        `;

        const completion = await this.openai.chat.completions.create({
            model: this.model,
            messages: [
                { role: "system", content: this.systemPrompt },
                { role: "user", content: prompt },
            ],
        });
        return completion.choices[0].message.content || "分析を実行できませんでした。";
    }

    async suggestImprovements(todos: ToDo[]): Promise<string> {
        const overdueTodos = todos.filter(todo =>
            todo.dueDate && todo.dueDate < new Date() && todo.status !== 'completed'
        );

        const prompt = `
            以下の未完了の期限切れタスクについて、改善案を提案してください：
            ${overdueTodos.map(todo => `- ${todo.title}`).join('\n')}
        `;

        const completion = await this.openai.chat.completions.create({
            model: this.model,
            messages: [
                { role: "system", content: this.systemPrompt },
                { role: "user", content: prompt },
            ],
        });

        return completion.choices[0].message.content || "提案を生成できませんでした。";
    }

    async getPrioritySuggestions(todos: ToDo[]): Promise<string> {
        const pendingTodos = todos.filter(todo => todo.status !== 'completed');

        const prompt = `
            以下の未完了タスクの優先順位付けを提案してください：
            ${pendingTodos.map(todo =>
            `- ${todo.title} (期限: ${todo.dueDate?.toLocaleDateString()})`
        ).join('\n')}
        `;

        const completion = await this.openai.chat.completions.create({
            model: this.model,
            messages: [
                { role: "system", content: this.systemPrompt },
                { role: "user", content: prompt },
            ],
        });

        return completion.choices[0].message.content || "優先順位の提案を生成できませんでした。";
    }
}