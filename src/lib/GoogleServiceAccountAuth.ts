import { google,Auth } from "googleapis";
import { SCOPE_URLS } from "../constants";

export class GoogleServiceAccountAuth {
    private static authClient: Auth.GoogleAuth;

    constructor() {}

    static init() {
        this.authClient = new google.auth.GoogleAuth({
            keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            scopes: SCOPE_URLS,
        });
    }

    static getAuthClient() {
        if (!this.authClient) {
            this.init();
        }
        return this.authClient;
    }
}