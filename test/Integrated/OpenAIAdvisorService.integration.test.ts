import { OpenAIAdvisorService,LLMModel } from '../../src/adapter/OpenAIAdvisorService';
import { ToDo } from '../../src/domain/entity/ToDo';

describe('OpenAIAdvisorService Integration Tests', () => {
    let advisor: OpenAIAdvisorService;
    let mockTodos: ToDo[];

    beforeEach(() => {
        advisor = new OpenAIAdvisorService(LLMModel.GPT4omini);
        mockTodos = [
            {
                id: '1',
                userId: 'user1',
                title: 'プロジェクトAの設計',
                description: '新規プロジェクトの設計書作成',
                status: 'completed',
                dueDate: new Date('2024-02-01'),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: '2',
                userId: 'user1',
                title: 'クライアントミーティング',
                description: '進捗報告会',
                status: 'pending',
                dueDate: new Date('2024-02-15'),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: '3',
                userId: 'user1',
                title: 'バグ修正',
                description: '重要度高',
                status: 'pending',
                dueDate: new Date('2024-01-01'), // 期限切れ
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
    });

    it('should analyze todo progress', async () => {
        const analysis = await advisor.analyzeTodoProgress(mockTodos);
        console.log(analysis);
        expect(analysis).toBeTruthy();
        expect(typeof analysis).toBe('string');
    });

    it('should suggest improvements for overdue tasks', async () => {
        const suggestions = await advisor.suggestImprovements(mockTodos);
        console.log(suggestions);
        expect(suggestions).toBeTruthy();
        expect(typeof suggestions).toBe('string');
    });

    it('should provide priority suggestions', async () => {
        const priorities = await advisor.getPrioritySuggestions(mockTodos);
        console.log(priorities);
        expect(priorities).toBeTruthy();
        expect(typeof priorities).toBe('string');
    });

    it('should handle empty todo list', async () => {
        const analysis = await advisor.analyzeTodoProgress([]);
        console.log(analysis);
        expect(analysis).toBeTruthy();
        expect(typeof analysis).toBe('string');
    });

    it('should handle todos without due dates', async () => {
        const todosWithoutDates = mockTodos.map(todo => ({ ...todo, dueDate: undefined }));
        const suggestions = await advisor.getPrioritySuggestions(todosWithoutDates);
        console.log(suggestions);
        expect(suggestions).toBeTruthy();
        expect(typeof suggestions).toBe('string');
    });
});
