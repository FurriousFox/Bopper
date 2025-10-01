import { Message, ChatInputCommandInteraction, SlashCommandBuilder, InteractionContextType, ApplicationIntegrationType, GuildMember, MessageFlags } from 'discord.js';
import { invite_ephemeral } from "../add.ts";
import { getRep } from '../rep.ts';

export default {
    match: /^rep( <@(\d+)>)?$/,
    command: 'rep <user>',
    examples: ['rep', 'rep @Bopper'],
    description: 'check rep balance',
    slash: new SlashCommandBuilder().setName("rep").setDescription('Check rep balance').addUserOption(option => option.setRequired(false).setName("user").setDescription("User to check balance for")).addBooleanOption(option => option.setRequired(false).setName("ephemeral").setDescription("Send reponse as ephemeral message")).setContexts([InteractionContextType.Guild]),
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

        const user = interaction.options.getMember("user");
        if (user instanceof GuildMember) {
            await interaction.reply({ content: `${user} has ${getRep(interaction.guildId!, user.id).toString()} rep points`, allowedMentions: {}, flags: ephemeral ? MessageFlags.Ephemeral : undefined });
        } else {
            await interaction.reply({ content: `you have ${getRep(interaction.guildId!, interaction.user.id)} rep points`, allowedMentions: {}, flags: ephemeral ? MessageFlags.Ephemeral : undefined });
        }
    }
};