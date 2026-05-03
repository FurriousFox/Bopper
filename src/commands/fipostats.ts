import { Message, SlashCommandBuilder, InteractionContextType, ChatInputCommandInteraction, MessageFlags, ApplicationIntegrationType } from 'discord.js';
import { invite_ephemeral } from "../invite.ts";

export default {
    match: /^fipostats$/,
    command: 'fipostats',
    examples: [],
    description: 'show leaderboard for fipo points',
    slash: new SlashCommandBuilder().setName("fipostats").setDescription('Show leaderboard for fipo points').addBooleanOption(option => option.setRequired(false).setName("ephemeral").setDescription("Send reponse as ephemeral message")).setContexts([InteractionContextType.Guild]),
    async handler(message: Message | ChatInputCommandInteraction): Promise<void> {
        const prefix = message instanceof ChatInputCommandInteraction ? '/' : database.read({
            guildId: message.guildId!,
            property: "prefix",
        }) ?? ".";
        const ephemeral = message instanceof ChatInputCommandInteraction ? !!message.options.getBoolean("ephemeral") : false;

        const members = message.guild!.members.cache;
        const fipos = database.readAll({
            like: `${message.guildId}A`,
            property: "fipos",
        });
        const leaderboard = `## Fipo stats\n${fipos
            .sort((a, b) => (+b.value) - (+a.value))
            .map(e => [e.key.split("--")[1], e.value])
            .filter(e => e[0].startsWith("matrix:") || e[0].startsWith("webhook:") || members.get(e[0])?.user?.bot === false)
            .map(e => {
                if (e[0].startsWith("matrix:")) {
                    const fullId = `@${e[0].replace(/^matrix:/, "")}`;
                    const shortHandle = database.read({ guildId: message.guildId!, userId: fullId, property: "matrix_links_rev" });
                    return `${shortHandle ?? fullId}: ${e[1]}`;
                }
                if (e[0].startsWith("webhook:")) return `${e[0].replace(/^webhook:/, "")}: ${e[1]}`;
                return `<@${e[0]}>: ${e[1]}`;
            })
            .join("\n")}\n\n-# you gain 1 fipo point when being the first user of the day to use the fipo command\n-# determined by when the message is received by discord (see ${prefix}ping for more info)`;

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
