import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RecentTodosSummaryReportUseCase } from '../../../src/usecase/RecentTodosSummaryReportUseCase.ts';
import { ToDoService } from '../../../src/domain/service/ToDoService.ts';
import { AIAdvisorService } from '../../../src/domain/service/AIAdvisorService.ts';
import { ToDo } from '../../../src/domain/entity/ToDo.ts';

describe('RecentTodosSummaryReportUseCase Tests', () => {
    let useCase: RecentTodosSummaryReportUseCase;
    let mockTodoService: ToDoService;
    let mockAdvisorService: AIAdvisorService;
    let mockTodos: (ToDo & Required<Pick<ToDo, 'dueDate'>>)[];

    beforeEach(() => {
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
            }
        ];

        // vitestのvi.fnを使用してモック関数を作成
        mockTodoService = {
            getDeadlineApproachingTodos: vi.fn()
        } as any;

        mockAdvisorService = {
            analyzeTodoProgress: vi.fn()
        } as any;

        useCase = new RecentTodosSummaryReportUseCase(
            mockTodoService,
            mockAdvisorService
        );
    });

    it('正常にTODOのサマリーレポートを生成できること', async () => {
        const mockAnalysis = 'Analysis of your todos: 2 tasks pending';
        
        vi.mocked(mockTodoService.getDeadlineApproachingTodos).mockResolvedValue(mockTodos);
        vi.mocked(mockAdvisorService.analyzeTodoProgress).mockResolvedValue(mockAnalysis);

        await useCase.execute();

        expect(mockTodoService.getDeadlineApproachingTodos).toHaveBeenCalled();
        expect(mockAdvisorService.analyzeTodoProgress).toHaveBeenCalledWith(mockTodos);
    });

    it('空のTODOリストを正常に処理できること', async () => {
        const mockAnalysis = 'No upcoming tasks found';
        
        vi.mocked(mockTodoService.getDeadlineApproachingTodos).mockResolvedValue([]);
        vi.mocked(mockAdvisorService.analyzeTodoProgress).mockResolvedValue(mockAnalysis);

        await useCase.execute();

        expect(mockTodoService.getDeadlineApproachingTodos).toHaveBeenCalled();
        expect(mockAdvisorService.analyzeTodoProgress).toHaveBeenCalledWith([]);
    });

    it('TodoServiceがエラーを投げた場合、適切にエラーハンドリングされること', async () => {
        const error = new Error('Failed to fetch todos');
        vi.mocked(mockTodoService.getDeadlineApproachingTodos).mockRejectedValue(error);

        await expect(useCase.execute()).rejects.toThrow('Failed to fetch todos');
    });

    it('AdvisorServiceがエラーを投げた場合、適切にエラーハンドリングされること', async () => {
        const error = new Error('Failed to analyze todos');
        vi.mocked(mockTodoService.getDeadlineApproachingTodos).mockResolvedValue(mockTodos);
        vi.mocked(mockAdvisorService.analyzeTodoProgress).mockRejectedValue(error);

        await expect(useCase.execute()).rejects.toThrow('Failed to analyze todos');
    });

});
