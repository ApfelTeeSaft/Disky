import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { handleAnalyticsCommand } from './commands/analytics';
import { handleWatchCommand, handleUnwatchCommand, startWatcher } from './commands/watcher';
import { handleLoginCommand } from './commands/login';

dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN!;
const CLIENT_ID = process.env.CLIENT_ID!;

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
        name: 'login',
        description: 'Authenticate with Bluesky',
        options: [
            {
                name: 'handle',
                type: 3,
                description: 'Your Bluesky handle',
                required: true,
            },
            {
                name: 'app-password',
                type: 3,
                description: 'Your Bluesky app password',
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

client.once('ready', async () => {
    console.log(`Logged in as ${client.user?.tag}!`);
    await registerCommands();
    startWatcher(client);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options } = interaction;

    try {
        if (commandName === 'login') {
            await handleLoginCommand(interaction);
        } else if (commandName === 'analytics') {
            const handle = options.getString('handle', true);
            await handleAnalyticsCommand(interaction, handle);
        } else if (commandName === 'watchbluesky') {
            const handle = options.getString('handle', true);
            await handleWatchCommand(interaction, handle);
        } else if (commandName === 'unwatchbluesky') {
            const handle = options.getString('handle', true);
            await handleUnwatchCommand(interaction, handle);
        }
    } catch (error) {
        console.error(`Error handling command ${commandName}:`, error);
        await interaction.reply({ content: 'An error occurred while processing your command.', ephemeral: true });
    }
});

client.login(TOKEN);