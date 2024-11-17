// deprecated, bluesky does not offer history of followers to certain dates
import { ChatInputCommandInteraction } from 'discord.js';
import { BskyAgent } from '@atproto/api';
import { createCanvas } from 'canvas';
import fs from 'fs/promises';
import path from 'path';

export async function handleAnalyticsGraphCommand(
    interaction: ChatInputCommandInteraction,
    handle: string,
    agent: BskyAgent
) {
    await interaction.deferReply();

    try {
        const profile = await agent.getProfile({ actor: handle });

        const createdAtStr = profile.data.createdAt || new Date().toISOString();
        const createdAt = new Date(createdAtStr);
        const now = new Date();

        const months: string[] = [];
        for (
            let date = new Date(createdAt);
            date <= now;
            date.setMonth(date.getMonth() + 1)
        ) {
            months.push(date.toLocaleString('default', { month: 'short' }));
        }

        // random ahh code
        const totalFollowers = profile.data.followersCount || 0;
        const followerCounts = Array(months.length).fill(0);
        if (totalFollowers > 0) {
            const growthStep = totalFollowers / (followerCounts.length - 1);
            for (let i = 1; i < followerCounts.length; i++) {
                followerCounts[i] = Math.round(growthStep * i);
            }
        }

        const width = 800;
        const height = 400;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#f0f4fc';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(
            `Follower Trend for ${profile.data.displayName || 'Unknown'} (@${profile.data.handle || 'Unknown'})`,
            20,
            30
        );

        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        const gridPadding = 50;
        for (let i = gridPadding; i <= width - gridPadding; i += (width - 2 * gridPadding) / (months.length - 1)) {
            ctx.beginPath();
            ctx.moveTo(i, gridPadding);
            ctx.lineTo(i, height - gridPadding);
            ctx.stroke();
        }
        for (let i = height - gridPadding; i >= gridPadding; i -= (height - 2 * gridPadding) / 10) {
            ctx.beginPath();
            ctx.moveTo(gridPadding, i);
            ctx.lineTo(width - gridPadding, i);
            ctx.stroke();
        }

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gridPadding, gridPadding);
        ctx.lineTo(gridPadding, height - gridPadding);
        ctx.lineTo(width - gridPadding, height - gridPadding);
        ctx.stroke();

        ctx.fillStyle = '#000';
        ctx.font = '14px Arial';
        months.forEach((month, index) => {
            const x =
                gridPadding +
                index * ((width - 2 * gridPadding) / (months.length - 1));
            ctx.fillText(month, x - ctx.measureText(month).width / 2, height - 20);
        });

        const maxFollowers = Math.max(...followerCounts);
        const yStep = Math.ceil(maxFollowers / 10);
        for (let i = 0; i <= 10; i++) {
            const y = height - gridPadding - i * ((height - 2 * gridPadding) / 10);
            ctx.fillText(`${i * yStep}`, 10, y + 5);
        }

        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        followerCounts.forEach((count, index) => {
            const x =
                gridPadding +
                index * ((width - 2 * gridPadding) / (months.length - 1));
            const y =
                height -
                gridPadding -
                (count / (10 * yStep)) * (height - 2 * gridPadding);

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        const buffer = canvas.toBuffer('image/png');
        const filePath = path.join(__dirname, 'analyticsgraph.png');
        await fs.writeFile(filePath, buffer);

        await interaction.editReply({
            content: `Follower analytics for ${profile.data.displayName || 'Unknown'} (@${profile.data.handle || 'Unknown'}):`,
            files: [filePath],
        });

        await fs.unlink(filePath);
    } catch (error) {
        console.error('Error generating analytics graph:', error);
        await interaction.editReply('Failed to generate analytics graph. Please try again.');
    }
}