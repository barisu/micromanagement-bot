export interface NotifyService {
    notify(message: string): Promise<void>;
}