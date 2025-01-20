import OpenAI from 'openai';
import { AIAdvisorService } from '../domain/service/AIAdvisorService';
import { ToDo } from '../domain/entity/ToDo';
import { todo } from 'node:test';

export enum LLMModel {
    GPT35Turbo = 'gpt-3.5-turbo',
    GPT4omini = 'gpt-4o-mini',
    GPT4o = 'gpt-4o',
}

export class OpenAIAdvisorService implements AIAdvisorService {
    private openai: OpenAI;
    private model: LLMModel;
    private readonly systemPrompt = "あなたはタスク管理アプリのアドバイザーです。やり取りは基本的に日本語で行います。あなたは常に建設的ですが、軽薄な話し方をします。またカジュアルに人を罵倒します。敬語は使いません。";

    constructor(model: LLMModel = LLMModel.GPT4o) {
        this.openai = new OpenAI();
        this.model = model;
    }

    async analyzeTodoProgress(todos: ToDo[]): Promise<string> {
        const todoSummary: string[] = todos.map(todo => JSON.stringify(todo));
        const prompt = `タスクの状況は以下の通りです：\n${todoSummary.join('\n')}。タスクの状況を分析して、大げさ感想を述べてください。`;

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
        ).map(todo => JSON.stringify(todo));

        const prompt = `
            以下の未完了の期限切れタスクについて、改善点を提案してください：
            ${overdueTodos.join('\n')}
            ただし、提示する改善案は具体的で実行可能なものにしてください。例えば、今日の20時から30分間、バグ修正に取り組む、など。\n
            達成が困難な場合には、リスケジュールを提案してください。
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