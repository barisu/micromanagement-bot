import { ToDoService } from '../domain/service/ToDoService';
import { NotifyService } from '../domain/service/NotifyService';
import { AIAdvisorService } from '../domain/service/AIAdvisorService';
import { Auth } from 'googleapis';
import SlackClient from '../lib/SlackBot';

// サービスの型定義
export interface Services {
  todoService: ToDoService;
  notifyService: NotifyService;
  aiAdvisorService: AIAdvisorService;
  slackClient: SlackClient;
  auth: Auth.OAuth2Client | Auth.GoogleAuth;
  taskListId: string;
  targetUserId: string;
}

// トークンの定義
export const TOKENS = {
  todoService: 'todoService' as const,
  notifyService: 'notifyService' as const,
  aiAdvisorService: 'aiAdvisorService' as const,
  slackClient: 'slackClient' as const,
  auth: 'auth' as const,
  taskListId: 'taskListId' as const,
  targetUserId: 'targetUserId' as const
} as const;

// 型の定義
export type TokenType<K extends keyof Services> = Services[K];
