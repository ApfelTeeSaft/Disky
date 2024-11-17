// unused, got implemented into index.ts

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
        name: 'analyticsgraph',
        description: 'Get a graph of follower history for a Bluesky profile',
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