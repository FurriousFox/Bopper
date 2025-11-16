import { Message, ChatInputCommandInteraction, SlashCommandBuilder, InteractionContextType, ApplicationIntegrationType, GuildMember, MessageFlags } from 'discord.js';
import { invite_ephemeral } from "../invite.ts";
import { getRep, updateRep } from '../rep.ts';

export default {
    match: /^rep( <@(\d+)>)?$/,
    command: 'rep <user>',
    examples: ['rep', 'rep @Bopper'],
    description: 'check rep balance',
    slash: new SlashCommandBuilder().setName("rep").setDescription('Check rep balance or gift rep points').addSubcommand(command => command.setName("bal").setDescription('Check rep balance').addUserOption(option => option.setRequired(false).setName("user").setDescription("User to check balance for")).addBooleanOption(option => option.setRequired(false).setName("ephemeral").setDescription("Send reponse as ephemeral message"))).addSubcommand(command => command.setName("stats").setDescription('Show leaderboard for rep points').addBooleanOption(option => option.setRequired(false).setName("ephemeral").setDescription("Send reponse as ephemeral message"))).addSubcommand(command => command.setName("give").setDescription('Give someone (part of) your rep points').addUserOption(option => option.setRequired(true).setName("user").setDescription("User to give rep points")).addIntegerOption(option => option.setRequired(true).setName("amount").setDescription("Amount of rep points to give").setMinValue(0))).setContexts([InteractionContextType.Guild]),
    async handler(message: Message, match: RegExpMatchArray): Promise<void> {
        let reply;
        if (match[2]) {
            reply = await message.reply({ content: `${match[1]} has ${getRep(message.guildId!, match[2]).toString()} rep points`, allowedMentions: {} });
        } else reply = await message.reply({ content: `you have ${getRep(message.guildId!, message.author.id)} rep points`, allowedMentions: {} });

        database.write({
            guildId: message.guildId!,
            channelId: message.channelId,
            userId: message.author.id,
            messageId: message.id,
            property: "handled",
            value: [2, reply.id].join("-")
        });
    },
    async interactionHandler(interaction: ChatInputCommandInteraction) {
        const ephemeral = !!interaction.options.getBoolean("ephemeral");

        if (!interaction.authorizingIntegrationOwners[ApplicationIntegrationType.GuildInstall]) {
            invite_ephemeral(interaction);
            return;
        }

        if (interaction.options.getSubcommand(true) === "bal") {
            const user = interaction.options.getMember("user");
            if (user instanceof GuildMember) {
                await interaction.reply({ content: `${user} has ${getRep(interaction.guildId!, user.id).toString()} rep points`, allowedMentions: {}, flags: ephemeral ? MessageFlags.Ephemeral : undefined });
            } else {
                await interaction.reply({ content: `you have ${getRep(interaction.guildId!, interaction.user.id)} rep points`, allowedMentions: {}, flags: ephemeral ? MessageFlags.Ephemeral : undefined });
            }
        } else if (interaction.options.getSubcommand(true) === "give") {
            const user = interaction.options.getMember("user");
            const amount = interaction.options.getInteger("amount", true).toString();
            let lowrep: number;
            if (user instanceof GuildMember) {
                if ((lowrep = getRep(interaction.guildId!, interaction.user.id)) < parseInt(amount)) {
                    interaction.reply({ content: `You only have ${lowrep} rep points!`, allowedMentions: {} });
                } else {
                    updateRep(interaction.guildId!, interaction.user.id, -parseInt(amount));
                    updateRep(interaction.guildId!, user.id, parseInt(amount));
                    interaction.reply({ content: `Gifted ${amount} rep ${amount === "1" ? "point" : "points"} to <@${user.id}>!`, allowedMentions: { users: [user.id] } });
                }
            } else {
                interaction.reply({ content: `Can't give rep points to users outside of this discord server!`, allowedMentions: { users: [] } });
            }
        } else if (interaction.options.getSubcommand(true) === "stats") {
            const members = await interaction.guild!.members.fetch();

            const reps = database.readAll({
                like: `${interaction.guildId}A`,
                property: "rep",
            });
            const leaderboard = `## Rep stats\n${reps.sort((a, b) => (+b.value) - (+a.value)).map(e => [e.key.split("--")[1], e.value]).filter(e => members.get(e[0])?.user?.bot === false).map(e => `<@${e[0]}>: ${e[1]}`).join("\n")}\n\n-# you gain 1 rep point per message\n-# rep points can be gifted using the rep give command`;

            await interaction.reply({ content: leaderboard, allowedMentions: {}, flags: ephemeral ? MessageFlags.Ephemeral : undefined });
        }
    }
};