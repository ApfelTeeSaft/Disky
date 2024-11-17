import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { BskyAgent } from '@atproto/api';
import sqlite3 from 'sqlite3';
import { open, Database as SqliteDatabase } from 'sqlite';
import fs from 'fs';
import path from 'path';

const WATCHED_PROFILES_FILE = path.resolve('./watchedProfiles.json');
const roleId = '1305987062847242280'; // role id from cutiecord

let db: SqliteDatabase<sqlite3.Database, sqlite3.Statement>;

async function initDatabase() {
    db = await open({
        filename: './posts.db',
        driver: sqlite3.Database,
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS announced_posts (
            uri TEXT PRIMARY KEY,
            handle TEXT NOT NULL,
            createdAt TEXT NOT NULL
        )
    `);
}

async function isPostAnnounced(uri: string): Promise<boolean> {
    const result = await db.get('SELECT 1 FROM announced_posts WHERE uri = ?', uri);
    return !!result;
}

async function markPostAsAnnounced(uri: string, handle: string, createdAt: string) {
    await db.run(
        'INSERT INTO announced_posts (uri, handle, createdAt) VALUES (?, ?, ?)',
        uri,
        handle,
        createdAt
    );
}

async function getWatchedProfiles(): Promise<Record<string, string[]>> {
    if (!fs.existsSync(WATCHED_PROFILES_FILE)) {
        fs.writeFileSync(WATCHED_PROFILES_FILE, JSON.stringify({}));
    }

    const data = fs.readFileSync(WATCHED_PROFILES_FILE, 'utf-8');
    return JSON.parse(data);
}

async function saveWatchedProfiles(watchedProfiles: Record<string, string[]>) {
    fs.writeFileSync(WATCHED_PROFILES_FILE, JSON.stringify(watchedProfiles, null, 2));
}

async function processFeedItem(post: any, client: Client, handle: string, channels: string[]) {
    try {
        if (!post || !post.record || !post.author || !post.record.text || !post.uri) {
            console.warn(`Invalid feed item structure for handle: ${handle}`);
            return;
        }

        const postUri = post.uri;

        if (await isPostAnnounced(postUri)) {
            console.log(`Skipping already announced post for handle: ${handle}`);
            return;
        }

        const postLink = `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split('/').pop()}`;

        const embed = new EmbedBuilder()
            .setAuthor({
                name: post.author.displayName || post.author.handle,
                iconURL: post.author.avatar || undefined,
            })
            .setDescription(post.record.text)
            .setTimestamp(new Date(post.record.createdAt))
            .setFooter({ text: `From ${handle}` })
            .setColor('#1DA1F2');

        for (const channelId of channels) {
            const channel = client.channels.cache.get(channelId) as TextChannel;
            if (!channel) {
                console.warn(`Channel with ID ${channelId} not found.`);
                continue;
            }
            await channel.send({
                content: `<@&${roleId}> ${postLink}`,
                embeds: [embed],
            });
        }

        await markPostAsAnnounced(postUri, handle, post.record.createdAt);
    } catch (error) {
        console.error(`Error processing feed item for handle: ${handle}`, error);
    }
}

async function checkFeeds(client: Client, agent: BskyAgent) {
    console.log('Running scheduled check for watched profiles...');
    const watchedProfiles = await getWatchedProfiles();

    for (const handle of Object.keys(watchedProfiles)) {
        const channels = watchedProfiles[handle];
        console.log(`Checking feed for handle: ${handle}`);

        try {
            const response = await agent.getAuthorFeed({ actor: handle });

            if (!response.data.feed || response.data.feed.length === 0) {
                console.log(`No posts found for handle: ${handle}`);
                continue;
            }

            for (const feedItem of response.data.feed.reverse()) {
                await processFeedItem(feedItem.post, client, handle, channels);
            }
        } catch (error) {
            console.error(`Error fetching feed for handle: ${handle}`, error);
        }
    }
}

export async function startWatcher(client: Client, agent: BskyAgent) {
    await initDatabase();
    console.log('Database initialized.');

    console.log('Running initial check for watched profiles...');
    await checkFeeds(client, agent);

    setInterval(async () => {
        await checkFeeds(client, agent);
    }, 120000); // Check every 2 minutes
}

export async function handleWatchCommand(interaction: any, handle: string) {
    const watchedProfiles = await getWatchedProfiles();

    if (!watchedProfiles[handle]) {
        watchedProfiles[handle] = [];
    }

    const channelId = interaction.channelId;

    if (!watchedProfiles[handle].includes(channelId)) {
        watchedProfiles[handle].push(channelId);
        await saveWatchedProfiles(watchedProfiles);
        await interaction.reply(`Now watching posts from \`${handle}\` in this channel.`);
    } else {
        await interaction.reply(`Already watching posts from \`${handle}\` in this channel.`);
    }
}

export async function handleUnwatchCommand(interaction: any, handle: string) {
    const watchedProfiles = await getWatchedProfiles();

    if (watchedProfiles[handle]) {
        const channelId = interaction.channelId;

        watchedProfiles[handle] = watchedProfiles[handle].filter((id) => id !== channelId);

        if (watchedProfiles[handle].length === 0) {
            delete watchedProfiles[handle];
        }

        await saveWatchedProfiles(watchedProfiles);
        await interaction.reply(`Stopped watching posts from \`${handle}\` in this channel.`);
    } else {
        await interaction.reply(`No active watch for \`${handle}\` in this channel.`);
    }
}