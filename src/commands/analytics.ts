import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getBlueskyAgent } from '../helpers/bluesky';

export async function handleAnalyticsCommand(
    interaction: ChatInputCommandInteraction,
    handle: string
) {
    const startTime = Date.now();
    await interaction.deferReply({ ephemeral: true });

    const agent = await getBlueskyAgent(interaction.user.id);

    if (!agent) {
        await interaction.editReply({
            content: 'You need to log in using `/login` before using this command.',
        });
        return;
    }

    try {
        const profile = await agent.getProfile({ actor: handle });

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle(`${profile.data.displayName} (${profile.data.handle})`)
            .setDescription(profile.data.description || 'No description available.')
            .addFields(
                { name: 'Followers', value: `${profile.data.followersCount}`, inline: true },
                { name: 'Follows', value: `${profile.data.followsCount}`, inline: true },
                { name: 'Posts', value: `${profile.data.postsCount}`, inline: true }
            )
            .setThumbnail(profile.data.avatar || null)
            .setImage(profile.data.banner || null)
            .setFooter({
                text: `Action took ${Date.now() - startTime}ms | Made with <3 by ApfelTeeSaft`,
            });

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        await interaction.editReply('Failed to fetch analytics. Please check the handle and try again.');
    }
}