import { google, Auth } from 'googleapis';

export class GoogleOAuth2 {
    private static oauth2Client: Auth.OAuth2Client;

    constructor() {}

    /**
     * OAuth2 クライアントを初期化する
     */
    private static init(): void {
        if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.REDIRECT_URI) {
            throw new Error('OAuth2 client configuration is missing.');
        }
        const clientId = process.env.CLIENT_ID;
        const clientSecret = process.env.CLIENT_SECRET;
        const redirectUri = process.env.REDIRECT_URI;

        if (!this.oauth2Client)
            this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    }

    /**
     * 認証用URLを生成する
     * @param scopes スコープの配列
     * @returns 認証用URL
     */
    static generateAuthUrl(scopes: string[]): string {
        if (!this.oauth2Client) {
            this.init();
        }
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline', // リフレッシュトークンを取得する場合
            scope: scopes,
        });
    }

    /**
     * 認可コードを使用してアクセストークンを取得する
     * @param code 認可コード
     * @returns アクセストークンとリフレッシュトークン
     */
    static async getToken(code: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }> {
        if (!this.oauth2Client) {
            this.init();
        }
        const { tokens } = await this.oauth2Client.getToken(code);
        if (!tokens.access_token || !tokens.refresh_token) {
            throw new Error('Failed to retrieve tokens.');
        }

        this.oauth2Client.setCredentials(tokens);

        return {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
        };
    }

    /**
     * リフレッシュトークンを使用してアクセストークンを更新する
     * @param refreshToken リフレッシュトークン
     * @returns 新しいアクセストークン
     */
    static async refreshAccessToken(refreshToken: string): Promise<string> {
        if (!this.oauth2Client) {
            this.init();
        }
        this.oauth2Client.setCredentials({ refresh_token: refreshToken });
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        if (!credentials.access_token) {
            throw new Error('Failed to refresh access token.');
        }

        return credentials.access_token;
    }

    public static getAuthClient(): Auth.OAuth2Client {
        if (!this.oauth2Client) {
            this.init();
        }
        return this.oauth2Client;
    }
}
