import { Message, SnowflakeUtil, ChatInputCommandInteraction, SlashCommandBuilder, InteractionContextType, ApplicationIntegrationType, ChannelType } from 'discord.js';
import { invite_ephemeral } from "../invite.ts";
import { fipoTimeout } from "../fipo.ts";

export default {
    match: /^fipo$/,
    command: 'fipo',
    examples: [],
    description: 'do the fipo!',
    slash: new SlashCommandBuilder().setName("fipo").setDescription('do the fipo!').setContexts([InteractionContextType.Guild]),
    async handler(message: Message): Promise<void> {
        const date = `${new Date(message.editedTimestamp ?? SnowflakeUtil.timestampFrom(message.id)).getDate()}D${new Date(message.editedTimestamp ?? SnowflakeUtil.timestampFrom(message.id)).getFullYear()}D${new Date(message.editedTimestamp ?? SnowflakeUtil.timestampFrom(message.id)).getMonth()}` + 'G' + (message.guildId ?? "unknown");
        if (message.channel.type === ChannelType.PrivateThread) {
            message.react('❌');
        } else {
            const bridgeSender = (message as Message & { bridgeSender?: string }).bridgeSender;
            const isWebhook = !!message.webhookId;
            const fallbackWebhookSender = message.author.username ? `webhook:${message.author.username}` : undefined;
            const authorId = isWebhook
                ? (bridgeSender ? `matrix:${bridgeSender}` : (fallbackWebhookSender ?? message.author.id))
                : message.author.id;

            fipoTimeout(date);
            database.write({
                guildId: message.guildId!,
                channelId: message.channelId,
                userId: authorId,
                messageId: message.id,
                property: `fipo${date}`,
                value: `${+(new Date(message.editedTimestamp ?? SnowflakeUtil.timestampFrom(message.id)))}`
            });

            if (message.webhookId) {
                try { await message.react('✅'); } catch { /* ignore */ }
            }
        }

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

        const date = `${new Date(SnowflakeUtil.timestampFrom(interaction.id)).getDate()}D${new Date(SnowflakeUtil.timestampFrom(interaction.id)).getFullYear()}D${new Date(SnowflakeUtil.timestampFrom(interaction.id)).getMonth()}` + 'G' + (interaction.guildId ?? "unknown");

        const reply_fetch = await (await interaction.reply("‎")).fetch();
        if (reply_fetch.channel.type === ChannelType.PrivateThread) {
            reply_fetch.react('❌');
            return;
        }

        fipoTimeout(date);
        database.write({
            guildId: interaction.guildId!,
            channelId: interaction.channelId,
            userId: interaction.user.id,
            messageId: reply_fetch.id,
            property: `fipo${date}`,
            value: `${+(new Date(SnowflakeUtil.timestampFrom(interaction.id)))}`
        });

        database.write({
            guildId: interaction.guildId!,
            channelId: interaction.channelId,
            userId: interaction.user.id,
            messageId: reply_fetch.id,
            property: "handled",
            value: [3, `fipo${date}`].join("-")
        });
    }
};