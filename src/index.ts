import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { BskyAgent } from '@atproto/api';
import { handleAnalyticsCommand } from './commands/analytics';
import { handleWatchCommand, handleUnwatchCommand, startWatcher } from './commands/watcher';

dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN!;
const CLIENT_ID = process.env.CLIENT_ID!;
const agent = new BskyAgent({ service: 'https://bsky.social' });

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    {
        name: 'analytics',
        description: 'Get analytics for a Bluesky profile',
        options: [
            {
                name: 'handle',
                type: 3,
                description: 'The Bluesky handle to analyze',
                required: true,
            },
        ],
    },
    {
        name: 'watchbluesky',
        description: 'Start watching a Bluesky profile for new posts',
        options: [
            {
                name: 'handle',
                type: 3,
                description: 'The Bluesky handle to watch',
                required: true,
            },
        ],
    },
    {
        name: 'unwatchbluesky',
        description: 'Stop watching a Bluesky profile for new posts',
        options: [
            {
                name: 'handle',
                type: 3,
                description: 'The Bluesky handle to unwatch',
                required: true,
            },
        ],
    },
];

async function registerCommands() {
    const rest = new REST({ version: '10' }).setToken(TOKEN);

    try {
        console.log('Registering application commands...');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('Application commands registered successfully.');
    } catch (error) {
        console.error('Error registering application commands:', error);
    }
}

async function authenticateBluesky() {
    const identifier = process.env.BLUESKY_IDENTIFIER!;
    const password = process.env.BLUESKY_PASSWORD!;

    if (!identifier || !password) {
        console.error('Bluesky credentials are not properly configured in the environment variables.');
        process.exit(1);
    }

    try {
        await agent.login({ identifier, password });
        console.log('Successfully authenticated with Bluesky!');
    } catch (error) {
        console.error('Failed to authenticate with Bluesky:', error);
        process.exit(1);
    }
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user?.tag}!`);
    await registerCommands();
    await authenticateBluesky();
    startWatcher(client, agent);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'analytics') {
        const handle = options.getString('handle', true);
        await handleAnalyticsCommand(interaction, handle, agent);
    }

    if (commandName === 'watchbluesky') {
        const handle = options.getString('handle', true);
        try {
            await handleWatchCommand(interaction, handle);
        } catch (error) {
            console.error('Error handling watchbluesky command:', error);
            await interaction.reply('Failed to watch Bluesky handle. Please try again later.');
        }
    }

    if (commandName === 'unwatchbluesky') {
        const handle = options.getString('handle', true);
        try {
            await handleUnwatchCommand(interaction, handle);
        } catch (error) {
            console.error('Error handling unwatchbluesky command:', error);
            await interaction.reply('Failed to unwatch Bluesky handle. Please try again later.');
        }
    }
});

client.login(TOKEN);