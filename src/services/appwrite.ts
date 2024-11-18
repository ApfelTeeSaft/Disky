import { Client, Databases } from 'node-appwrite';

export class AppwriteService {
    private client: Client;
    private database: Databases;

    constructor() {
        this.client = new Client();
        this.database = new Databases(this.client);

        this.client
            .setEndpoint(process.env.APPWRITE_ENDPOINT!)
            .setProject(process.env.APPWRITE_PROJECT_ID!)
            .setKey(process.env.APPWRITE_API_KEY!);
    }

    async getUserDocument(userId: string): Promise<{ handle: string; appPassword: string } | null> {
        try {
            const document = await this.database.getDocument(
                process.env.APPWRITE_DATABASE_ID!,
                process.env.APPWRITE_COLLECTION_ID!,
                userId
            );
    
            const handle = document.handle || null;
            const appPassword = document.appPassword || null;
    
            if (!handle || !appPassword) {
                return null;
            }
    
            return { handle, appPassword };
        } catch (error) {
            console.error(`Failed to get user document for ${userId}:`, error);
            return null;
        }
    }    

    async setUserBearer(userId: string, bearer: string, handle: string, appPassword: string): Promise<void> {
        try {
            await this.database.createDocument(
                process.env.APPWRITE_DATABASE_ID!,
                process.env.APPWRITE_COLLECTION_ID!,
                userId,
                { bearer, handle, appPassword }
            );
        } catch (error) {
            console.error('Failed to set user bearer:', error);
        }
    }    

    async getUserBearer(userId: string): Promise<string | null> {
        try {
            const document = await this.database.getDocument(
                process.env.APPWRITE_DATABASE_ID!,
                process.env.APPWRITE_COLLECTION_ID!,
                userId
            );
            return document.bearer;
        } catch {
            return null;
        }
    }
}