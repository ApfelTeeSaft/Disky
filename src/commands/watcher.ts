import { Client, EmbedBuilder, TextChannel, ChatInputCommandInteraction } from 'discord.js';
import { BskyAgent } from '@atproto/api';
import { AppwriteService } from '../services/appwrite';
import fs from 'fs';
import path from 'path';

const WATCHED_PROFILES_FILE = path.resolve('./watchedProfiles.json');
const roleId = '1305987062847242280'; // TODO: implement into watchbluesky command

let watchedProfiles: { [handle: string]: string[] } = {};

async function loadWatchedProfiles(): Promise<void> {
    if (!fs.existsSync(WATCHED_PROFILES_FILE)) {
        fs.writeFileSync(WATCHED_PROFILES_FILE, JSON.stringify({}));
    }
    const data = fs.readFileSync(WATCHED_PROFILES_FILE, 'utf-8');
    watchedProfiles = JSON.parse(data);
}

async function saveWatchedProfiles(): Promise<void> {
    fs.writeFileSync(WATCHED_PROFILES_FILE, JSON.stringify(watchedProfiles, null, 2));
}

async function processFeedItem(
    client: Client,
    post: any,
    handle: string,
    channels: string[]
) {
    if (!post?.record?.text || !post.uri) return;

    const postLink = `https://bsky.app/profile/${handle}/post/${post.uri.split('/').pop()}`;
    const embed = new EmbedBuilder()
        .setAuthor({ name: handle })
        .setDescription(post.record.text)
        .setColor('Blue')
        .setFooter({ text: `New post from ${handle}` })
        .setTimestamp(new Date(post.record.createdAt));

    for (const channelId of channels) {
        const channel = client.channels.cache.get(channelId) as TextChannel;
        if (channel) {
            await channel.send({
                content: `<@&${roleId}> ${postLink}`,
                embeds: [embed],
            });
        }
    }
}

async function checkFeeds(client: Client, appwriteService: AppwriteService) {
    for (const handle in watchedProfiles) {
        const channels = watchedProfiles[handle];
        const agent = new BskyAgent({ service: 'https://bsky.social' });

        const bearer = await appwriteService.getUserBearer(handle);
        if (!bearer) continue;

        await agent.resumeSession({
            accessJwt: bearer,
            refreshJwt: '',
            handle,
            did: '',
            active: true,
        });

        const response = await agent.getAuthorFeed({ actor: handle });
        for (const post of response.data.feed || []) {
            await processFeedItem(client, post, handle, channels);
        }
    }
}

export async function startWatcher(client: Client) {
    await loadWatchedProfiles();
    const appwriteService = new AppwriteService();
    setInterval(async () => {
        await checkFeeds(client, appwriteService);
    }, 120000);
}

export async function handleWatchCommand(interaction: ChatInputCommandInteraction, handle: string) {
    const channelId = interaction.channelId;
    const appwriteService = new AppwriteService();

    await interaction.deferReply({ ephemeral: true });

    try {
        let bearer = await appwriteService.getUserBearer(interaction.user.id);

        if (!bearer) {
            const userDoc = await appwriteService.getUserDocument(interaction.user.id);

            if (!userDoc) {
                await interaction.editReply(
                    `You need to log in using \`/login\` before you can watch a profile.`
                );
                return;
            }

            const { handle: savedHandle, appPassword } = userDoc;

            const agent = new BskyAgent({ service: 'https://bsky.social' });
            await agent.login({ identifier: savedHandle, password: appPassword });
            bearer = agent.session?.accessJwt ?? null;

            if (!bearer) {
                await interaction.editReply(
                    `Failed to authenticate with Bluesky. Please check your credentials and try again using \`/login\`.`
                );
                return;
            }

            await appwriteService.setUserBearer(interaction.user.id, bearer, savedHandle, appPassword);
        }

        if (!watchedProfiles[handle]) {
            watchedProfiles[handle] = [];
        }

        if (!watchedProfiles[handle].includes(channelId)) {
            watchedProfiles[handle].push(channelId);
            await saveWatchedProfiles();
            await interaction.editReply(`Now watching posts from ${handle} in this channel.`);
        } else {
            await interaction.editReply(`Already watching posts from ${handle} in this channel.`);
        }
    } catch (error) {
        console.error(`Error in handleWatchCommand:`, error);
        await interaction.editReply(`An error occurred while processing your request.`);
    }
}

export async function handleUnwatchCommand(interaction: any, handle: string) {
    const channelId = interaction.channelId;
    await interaction.deferReply({ ephemeral: true });

    if (watchedProfiles[handle]) {
        watchedProfiles[handle] = watchedProfiles[handle].filter((id) => id !== channelId);
        if (watchedProfiles[handle].length === 0) {
            delete watchedProfiles[handle];
        }
        await saveWatchedProfiles();
        await interaction.editReply(`Stopped watching posts from ${handle} in this channel.`);
    } else {
        await interaction.editReply(`No active watch for ${handle} in this channel.`);
    }
}