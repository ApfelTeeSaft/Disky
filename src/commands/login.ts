import { ChatInputCommandInteraction } from 'discord.js';
import { AppwriteService } from '../services/appwrite';
import { BskyAgent } from '@atproto/api';

export async function handleLoginCommand(interaction: ChatInputCommandInteraction) {
    const handle = interaction.options.getString('handle', true);
    const appPassword = interaction.options.getString('app-password', true);

    await interaction.deferReply({ ephemeral: true });

    const agent = new BskyAgent({ service: 'https://bsky.social' });

    try {
        console.log(`Attempting login for handle: ${handle}`);

        const loginPayload = { identifier: handle, password: appPassword };

        await agent.login(loginPayload);

        const bearerToken = agent.session?.accessJwt;
        if (!bearerToken) {
            throw new Error('Failed to retrieve bearer token.');
        }

        const appwriteService = new AppwriteService();
        await appwriteService.setUserBearer(interaction.user.id, bearerToken, handle, appPassword);

        await interaction.editReply({
            content: `Successfully logged into Bluesky as **${handle}**!`,
        });
    } catch (error) {
        console.error('Login failed:', error);

        await interaction.editReply({
            content: `Login failed. Please check your handle or app password and try again.`,
        });
    }
}