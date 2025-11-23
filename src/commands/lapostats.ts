import { Message, SlashCommandBuilder, InteractionContextType, ChatInputCommandInteraction, MessageFlags, ApplicationIntegrationType } from 'discord.js';
import { invite_ephemeral } from "../invite.ts";

export default {
    match: /^lapostats$/,
    command: 'lapostats',
    examples: [],
    description: 'show leaderboard for lapo points',
    slash: new SlashCommandBuilder().setName("lapostats").setDescription('Show leaderboard for lapo points').addBooleanOption(option => option.setRequired(false).setName("ephemeral").setDescription("Send reponse as ephemeral message")).setContexts([InteractionContextType.Guild]),
    async handler(message: Message | ChatInputCommandInteraction): Promise<void> {
        const prefix = message instanceof ChatInputCommandInteraction ? '/' : database.read({
            guildId: message.guildId!,
            property: "prefix",
        }) ?? ".";
        const ephemeral = message instanceof ChatInputCommandInteraction ? !!message.options.getBoolean("ephemeral") : false;

        const members = message.guild!.members.cache;
        const lapos = database.readAll({
            like: `${message.guildId}A`,
            property: "lapos",
        });
        const leaderboard = `## Lapo stats\n${lapos.sort((a, b) => (+b.value) - (+a.value)).map(e => [e.key.split("--")[1], e.value]).filter(e => members.get(e[0])?.user?.bot === false).map(e => `<@${e[0]}>: ${e[1]}`).join("\n")}\n\n-# you gain 1 lapo point when being the last user of the day to use the lapo command\n-# determined by when the message is received by discord (see ${prefix}ping for more info)`;

        if (!(message instanceof ChatInputCommandInteraction)) {
            const reply = await message.reply({ content: leaderboard, allowedMentions: {} });
            database.write({
                guildId: message.guildId!,
                channelId: message.channelId,
                userId: message.author.id,
                messageId: message.id,
                property: "handled",
                value: [2, reply.id].join("-")
            });
        } else {
            await message.reply({ content: leaderboard, allowedMentions: {}, flags: ephemeral ? MessageFlags.Ephemeral : undefined });
        }
    },
    interactionHandler(interaction: ChatInputCommandInteraction) {
        if (!interaction.authorizingIntegrationOwners[ApplicationIntegrationType.GuildInstall]) {
            invite_ephemeral(interaction);
            return;
        }

        this.handler(interaction);
    }
};