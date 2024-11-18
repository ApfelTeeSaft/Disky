import { BskyAgent } from '@atproto/api';
import { AppwriteService } from '../services/appwrite';

const appwriteService = new AppwriteService();

export async function getBlueskyAgent(userId: string): Promise<BskyAgent | null> {
    const bearer = await appwriteService.getUserBearer(userId);
    if (!bearer) {
        console.warn(`Bearer token not found for user ${userId}`);
        return null;
    }

    const agent = new BskyAgent({ service: 'https://bsky.social' });
    try {
        await agent.resumeSession({
            accessJwt: bearer,
            refreshJwt: '',
            handle: '',
            did: '',
            active: true,
        });
        return agent;
    } catch (error) {
        console.error(`Bearer validation failed for user ${userId}:`, error);
        return null;
    }
}