import { Message, SlashCommandBuilder, InteractionContextType, ChatInputCommandInteraction, MessageFlags, ApplicationIntegrationType } from 'discord.js';
import { invite_ephemeral } from "../invite.ts";

export default {
    match: /^streakstats$/,
    command: 'streakstats',
    examples: [],
    description: 'show leaderboard for streaks',
    slash: new SlashCommandBuilder().setName("streak").setDescription('Show leaderboard for streaks').addSubcommand(command => command.setName("stats").setDescription('Show leaderboard for streaks').addBooleanOption(option => option.setRequired(false).setName("ephemeral").setDescription("Send reponse as ephemeral message"))).setContexts([InteractionContextType.Guild]),
    async handler(message: Message | ChatInputCommandInteraction): Promise<void> {
        const ephemeral = message instanceof ChatInputCommandInteraction ? !!message.options.getBoolean("ephemeral") : false;

        const members = await message.guild!.members.fetch();

        const streaks = database.readAll({
            like: `${message.guildId}A`,
            property: "streak",
        }).map(e => [e.key.split("--")[1], e.value.split("-").map(e => {
            const a = new Date(+e);
            a.setHours(0, 0, 0, 0);
            return +a;
        })]).filter(e => ((+new Date()) - +e[1][1]) < 48 * 3600 * 1000).map(e => {
            const b = Math.round((+e[1][1] - +e[1][0]) / (1000 * 24 * 3600)) + 1;
            return [e[0], b];
        });

        const leaderboard = `## Streak stats\n${streaks.sort((a, b) => (+b[1]) - (+a[1])).filter(e => members.get(e[0] as string)?.user?.bot === false).map(e => `<@${e[0]}>: ${e[1]} ${e[1] == 1 ? 'day' : 'days'}`).join("\n")}\n\n-# maintain your streak by sending a message every day`;
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