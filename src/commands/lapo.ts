import { Message, SnowflakeUtil, ChatInputCommandInteraction, SlashCommandBuilder, InteractionContextType, ApplicationIntegrationType } from 'discord.js';
import { invite_ephemeral } from "../add.ts";

export default {
    match: /^lapo$/,
    command: 'lapo',
    examples: [],
    description: '**la**st **po**st of the day',
    slash: new SlashCommandBuilder().setName("lapo").setDescription('last post of the day').setContexts([InteractionContextType.Guild]),
    handler(message: Message): void {
        const date = `${new Date(message.editedTimestamp ?? SnowflakeUtil.timestampFrom(message.id)).getDate()}D${new Date(message.editedTimestamp ?? SnowflakeUtil.timestampFrom(message.id)).getFullYear()}D${new Date(message.editedTimestamp ?? SnowflakeUtil.timestampFrom(message.id)).getMonth()}`;
        database.write({
            guildId: message.guildId!,
            channelId: message.channelId,
            userId: message.author.id,
            messageId: message.id,
            property: `lapo${date}`,
            value: `${+(new Date(message.editedTimestamp ?? SnowflakeUtil.timestampFrom(message.id)))}`
        });

        message.react('✅');

        database.write({
            guildId: message.guildId!,
            channelId: message.channelId,
            userId: message.author.id,
            messageId: message.id,
            property: "handled",
            value: [3, `lapo${date}`].join("-")
        });
    },
    async interactionHandler(interaction: ChatInputCommandInteraction) {
        if (!interaction.authorizingIntegrationOwners[ApplicationIntegrationType.GuildInstall]) {
            invite_ephemeral(interaction);
            return;
        }

        const reply_fetch = await (await interaction.reply("‎")).fetch();

        const date = `${new Date(SnowflakeUtil.timestampFrom(interaction.id)).getDate()}D${new Date(SnowflakeUtil.timestampFrom(interaction.id)).getFullYear()}D${new Date(SnowflakeUtil.timestampFrom(interaction.id)).getMonth()}`;
        await reply_fetch.react('✅');
        database.write({
            guildId: interaction.guildId!,
            channelId: interaction.channelId,
            userId: interaction.user.id,
            messageId: reply_fetch.id,
            property: `lapo${date}`,
            value: `${+(new Date(SnowflakeUtil.timestampFrom(interaction.id)))}`
        });

        database.write({
            guildId: interaction.guildId!,
            channelId: interaction.channelId,
            userId: interaction.user.id,
            messageId: reply_fetch.id,
            property: "handled",
            value: [3, `lapo${date}`].join("-")
        });
    }
};